/*==============================================================================
SKILL MASTER — AI SERVICEY:SKILL MASTER — AI SERVICE (OpenRouter / FREE MODELS)
- qwen/qwen-2.5-7b-instruct:free  → roadmap + lessons (best free structure control)
- meta-llama/llama-3.1-8b-instruct:free → feedback

WHY:
- Better JSON fidelity than DeepSeek chat
- Less domain drift (Data Science !== HTML)
- Free tier compatible
==============================================================================*/

import dotenv from 'dotenv';
dotenv.config();

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';

// ✅ BEST FREE COMBO
const QUALITY_MODEL = 'qwen/qwen-2.5-7b-instruct:free';
const FAST_MODEL    = 'meta-llama/llama-3.1-8b-instruct:free';

// ==============================================================================
// UTILITIES
// ==============================================================================

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const parseJSON = (text) => {
  try {
    if (typeof text === 'object') return text;
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(cleaned);
  } catch {
    console.error('[AI] JSON parse failed:', text?.substring(0, 300));
    throw new Error('JSON_PARSE_FAILURE');
  }
};

const validateLessonStructure = (parsed) => {
  if (!parsed.parts || !Array.isArray(parsed.parts)) {
    throw new Error('JSON_PARSE_FAILURE');
  }
  for (const part of parsed.parts) {
    if (!Array.isArray(part.cards) || part.cards.length === 0) {
      throw new Error('JSON_PARSE_FAILURE');
    }
    for (const card of part.cards) {
      if (!card.content || card.content.length < 50) {
        throw new Error('JSON_PARSE_FAILURE');
      }
    }
  }
  return true;
};

const cleanPartTitle = (title) => {
  if (!title || typeof title !== 'string') return 'Topic Overview';
  const words = title.toLowerCase().split(/\s+/);
  const counts = {};
  for (const w of words) {
    counts[w] = (counts[w] || 0) + 1;
    if (counts[w] >= 3) return 'Topic Overview';
  }
  return title.replace(/[,"\s]+$/, '').substring(0, 80).trim();
};

// ==============================================================================
// CORE MODEL CALL
// ==============================================================================

const callModel = async ({ model, systemPrompt, userPrompt, isJson = true, maxTokens = 4096 }) => {
  let attempts = 0;
  const maxRetries = 3;

  while (attempts < maxRetries) {
    try {
      const body = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: isJson ? 0.6 : 0.5,
        max_tokens: maxTokens,
      };

      if (isJson) body.response_format = { type: 'json_object' };

      const response = await fetch(OPENROUTER_BASE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://skillmaster.ai',
          'X-Title': 'Skill Master',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const t = await response.text();
        const err = new Error(`${response.status} ${t}`);
        err.status = response.status;
        throw err;
      }

      const json = await response.json();
      const text = json.choices?.[0]?.message?.content;
      if (!text) throw new Error('EMPTY_RESPONSE');

      return isJson ? parseJSON(text) : text;

    } catch (err) {
      attempts++;
      const status = err.status || 0;
      const fatal = status === 400 || status === 413 || err.message === 'JSON_PARSE_FAILURE';
      const retryable = [429, 500, 503].includes(status) && attempts < maxRetries;

      console.error(`[AI] Attempt ${attempts} failed:`, err.message);

      if (fatal) throw err;
      if (retryable) await wait(attempts * 5000);
      else throw err;
    }
  }
};

// ==============================================================================
// PUBLIC API
// ==============================================================================

export const generateRoadmapSkeleton = (data) => {
  const systemPrompt = `
You are an expert curriculum designer.

STRICT RULES:
- Each week = exactly 7 days (5 learning, 1 revision, 1 exam)
- Exam day: EXACTLY 5 MCQs
- Learning topics must be concrete actions, not categories
- correctIndex is 0-3 integer
- Return ONLY valid JSON

DOMAIN CONSTRAINT (NON-NEGOTIABLE):
- The skill "${data.skillInput}" must stay in its professional domain.
- For Data Science use ONLY: statistics, probability, python, pandas,
  numpy, data analysis, visualization, machine learning, SQL for data.
- DO NOT introduce HTML, CSS, JavaScript, Web Development unless explicitly requested.
- Teaching another domain is a FAILURE.

SELF-CHECK BEFORE FINAL OUTPUT:
- If totalModules = N, modules array MUST have exactly N objects.
- If mismatch occurs, regenerate internally.

JSON STRUCTURE:
{"skillName":"string","targetLevel":"string","totalModules":0,"estimatedWeeks":0,"modules":[{"moduleNumber":1,"title":"string","weeks":[{"weekNumber":1,"title":"string","days":[{"dayNumber":1,"dayName":"Monday","type":"Learning","title":"string","topicsList":["string"]},{"dayNumber":6,"dayName":"Saturday","type":"Revision","title":"string","topicsList":[]},{"dayNumber":7,"dayName":"Sunday","type":"Exam","title":"string","topicsList":[],"examQuestions":[{"question":"string","options":["string","string","string","string"],"correctIndex":0,"topicTag":"string"}]}]}]}]}
`;

  const userPrompt = `
Generate a learning roadmap.

Skill: ${data.skillInput}
Goal: ${data.motivation || 'Not specified'}
Level: ${data.currentLevel}
Role: ${data.role}
Style: ${data.learningStyle}
Daily time: ${data.dailyTime}

IMPORTANT:
do not create generic roadmaps. Be specific and generate realistic, practical roadmaps. Follow the 7-day week pattern strictly. Every Sunday needs exactly 5 exam questions. 
`;

  return callModel({
    model: QUALITY_MODEL,
    systemPrompt,
    userPrompt,
    isJson: true,
    maxTokens: 6000,
  });
};

export const generateLessonContent = async (data) => {

  if (data.isRevision || data.isExamRetry) {
    const systemPrompt = `
You are a senior engineer running a revision session.
Return ONLY valid JSON.

{"parts":[{"partNumber":1,"partTitle":"string","cards":[{"cardNumber":1,"content":"string"},{"cardNumber":2,"content":"string"},{"cardNumber":3,"content":"string"}]}],"task":null}
`;

    const result = await callModel({
      model: QUALITY_MODEL,
      systemPrompt,
      userPrompt: `Revise weak topics: ${data.weakTopicsStr}`,
      isJson: true,
      maxTokens: 3000,
    });

    validateLessonStructure(result);
    result.parts = result.parts.map(p => ({ ...p, partTitle: cleanPartTitle(p.partTitle) }));
    return result;
  }

  const systemPrompt = `
You are a senior engineer mentor.

CONTENT GUARDRAILS:
- Stay strictly within "${data.skillName}" domain.
- Do NOT introduce other skills.
- For Data Science, focus on data, datasets, analysis, models.
- Teaching HTML or web topics is a FAILURE.

Return ONLY valid JSON.
`;

  const userPrompt = `
Skill: ${data.skillName}
Topics: ${data.topicsList?.join(', ')}

Part 1: Start with the real problem.
Part 3: Synthesize in real-world Data Science scenario.
`;

  const result = await callModel({
    model: QUALITY_MODEL,
    systemPrompt,
    userPrompt,
    isJson: true,
    maxTokens: 4000,
  });

  validateLessonStructure(result);
  result.parts = result.parts.map(p => ({ ...p, partTitle: cleanPartTitle(p.partTitle) }));
  return result;
};

export const generateFeedback = (data) => {
  const systemPrompt = `
You are an expert mentor.
Write clearly. OUTCOME line is mandatory.
`;

  const userPrompt = data.isMcq
    ? `Score: ${data.score}%`
    : `Task: ${data.description}\nAnswer: ${data.userAnswer}`;

  return callModel({
    model: FAST_MODEL,
    systemPrompt,
    userPrompt,
    isJson: false,
    maxTokens: 1024,
  });
};


// /*==============================================================================
// SKILL MASTER — AI SERVICE v2 (OpenRouter / DeepSeek V3)
// Drop-in replacement for gemini.service.js

// PROVIDER: OpenRouter (https://openrouter.ai)
// MODELS:
//   - deepseek/deepseek-chat       → roadmap generation + lesson content
//   - meta-llama/llama-3.1-8b-instruct:free → feedback (free, no credits needed)

// WHY OPENROUTER:
//   - Single API key, 50+ models, OpenAI-compatible
//   - No TPM (tokens-per-minute) nonsense — rate limits are per-request
//   - DeepSeek V3 = GPT-4o level intelligence, generous free credits
//   - Pakistan signup works, no billing restrictions
//   - If one model fails, swap model string — zero other code changes

// EXPORTS (identical signatures to gemini.service.js — zero controller changes):
//   generateRoadmapSkeleton(data) → roadmapJson
//   generateLessonContent(data)   → { parts, task }
//   generateFeedback(data)        → string (with OUTCOME: and RESOURCES: sections)

// REQUIRED ENV VAR:
//   OPENROUTER_API_KEY — get from https://openrouter.ai/keys

// IMPORT PATHS TO UPDATE (only these 2 files):
//   server/src/controllers/session.controller.js  → from '../services/ai.service.js'
//   server/src/controllers/roadmap.controller.js  → from '../services/ai.service.js'
// ==============================================================================*/

// import dotenv from 'dotenv';
// dotenv.config();

// const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';
// const QUALITY_MODEL   = 'deepseek/deepseek-chat';                        // roadmap + lessons
// const FAST_MODEL      = 'meta-llama/llama-3.1-8b-instruct:free';         // feedback

// // ==============================================================================
// // UTILITIES
// // ==============================================================================

// const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// /**
//  * Parses JSON from model response text.
//  * Strips markdown code fences (``` json ... ```) if present.
//  * @throws {Error} JSON_PARSE_FAILURE — triggers retry in session controller
//  */
// const parseJSON = (text) => {
//   try {
//     if (typeof text === 'object') return text;
//     const cleaned = text
//       .replace(/^```json\s*/i, '')
//       .replace(/^```\s*/i, '')
//       .replace(/\s*```$/i, '')
//       .trim();
//     return JSON.parse(cleaned);
//   } catch {
//     console.error('[AI Service] JSON parse failed on:', text?.substring(0, 300));
//     throw new Error('JSON_PARSE_FAILURE');
//   }
// };

// /**
//  * Validates lesson structure before saving to MongoDB.
//  * @throws {Error} JSON_PARSE_FAILURE on invalid structure
//  */
// const validateLessonStructure = (parsed) => {
//   if (!parsed.parts || !Array.isArray(parsed.parts) || parsed.parts.length === 0) {
//     console.error('[AI Validation] FAIL: parts array missing or empty');
//     throw new Error('JSON_PARSE_FAILURE');
//   }
//   for (const part of parsed.parts) {
//     if (!part.cards || !Array.isArray(part.cards) || part.cards.length === 0) {
//       console.error(`[AI Validation] FAIL: part ${part.partNumber} has no cards`);
//       throw new Error('JSON_PARSE_FAILURE');
//     }
//     for (const card of part.cards) {
//       if (!card.content || typeof card.content !== 'string' || card.content.trim().length < 50) {
//         console.error(`[AI Validation] FAIL: card content too short in part ${part.partNumber}`);
//         throw new Error('JSON_PARSE_FAILURE');
//       }
//     }
//   }
//   return true;
// };

// /**
//  * Cleans partTitle — detects hallucination (word repeated 3+ times) and strips artifacts.
//  */
// const cleanPartTitle = (title) => {
//   if (typeof title !== 'string' || title.trim().length === 0) return 'Topic Overview';
//   const sample = title.substring(0, 80).toLowerCase();
//   const words = sample.split(/\s+/).filter(w => w.length > 3);
//   const counts = {};
//   for (const word of words) {
//     counts[word] = (counts[word] || 0) + 1;
//     if (counts[word] >= 3) {
//       console.warn('[AI Validation] Hallucinated partTitle replaced');
//       return 'Topic Overview';
//     }
//   }
//   return title.replace(/[,"\s]+$/, '').replace(/^[,"\s]+/, '').trim().substring(0, 80);
// };

// // ==============================================================================
// // CORE CALL — All AI requests go through here
// // ==============================================================================

// /**
//  * Makes a single OpenRouter API request with retry and exponential backoff.
//  * Uses native fetch (Node 18+) — no SDK dependency needed.
//  * Retries on 429 (rate limit), 500, 503. Fails fast on 400/413.
//  *
//  * @param {string} model        - OpenRouter model string
//  * @param {string} systemPrompt - System instruction
//  * @param {string} userPrompt   - Task prompt
//  * @param {boolean} isJson      - Whether to request JSON output
//  * @param {number} maxTokens    - Max output tokens
//  * @returns {Promise<object|string>} Parsed JSON or raw text
//  * @throws {Error} GEMINI_FAILURE | JSON_PARSE_FAILURE
//  */
// const callModel = async ({ model, systemPrompt, userPrompt, isJson = true, maxTokens = 4096 }) => {
//   let attempts = 0;
//   const maxRetries = 3;

//   while (attempts < maxRetries) {
//     try {
//       const body = {
//         model,
//         messages: [
//           { role: 'system', content: systemPrompt },
//           { role: 'user',   content: userPrompt   },
//         ],
//         temperature: isJson ? 0.7 : 0.6,
//         max_tokens:  maxTokens,
//       };

//       if (isJson) {
//         body.response_format = { type: 'json_object' };
//       }

//       const response = await fetch(OPENROUTER_BASE, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
//           'Content-Type':  'application/json',
//           'HTTP-Referer':  'https://skillmaster.ai',
//           'X-Title':       'Skill Master',
//         },
//         body: JSON.stringify(body),
//       });

//       if (!response.ok) {
//         const errText = await response.text();
//         console.error(`[AI Service] HTTP ${response.status}:`, errText?.substring(0, 200));
//         const err = new Error(`${response.status} ${errText}`);
//         err.status = response.status;
//         throw err;
//       }

//       const data = await response.json();
//       const text = data.choices?.[0]?.message?.content;

//       if (!text) throw new Error('EMPTY_RESPONSE');

//       return isJson ? parseJSON(text) : text;

//     } catch (error) {
//       attempts++;
//       const status = error.status || 0;
//       const is429 = status === 429 || error.message?.includes('429');
//       const is500 = status === 500 || error.message?.includes('500');
//       const is503 = status === 503 || error.message?.includes('503');
//       const isFatal = status === 400 || status === 413 || error.message === 'JSON_PARSE_FAILURE';
//       const retryable = (is429 || is500 || is503) && attempts < maxRetries;

//       console.error(
//         `[AI Service] Attempt ${attempts} failed: ${error.message?.substring(0, 150)}` +
//         (retryable ? ` — retrying in ${attempts === 1 ? 5 : attempts === 2 ? 15 : 30}s` : '')
//       );

//       if (isFatal) {
//         if (error.message === 'JSON_PARSE_FAILURE') throw error;
//         throw new Error(`GEMINI_FAILURE: ${error.message}`);
//       }

//       if (retryable) {
//         const ms = attempts === 1 ? 5000 : attempts === 2 ? 15000 : 30000;
//         await wait(ms);
//       } else {
//         throw new Error(`GEMINI_FAILURE: ${error.message}`);
//       }
//     }
//   }
// };

// // ==============================================================================
// // PUBLIC API — identical signatures to gemini.service.js
// // ==============================================================================

// /**
//  * Generates the full roadmap skeleton — modules, weeks, days, exam questions.
//  *
//  * @param {object} data
//  * @param {string} data.skillInput
//  * @param {string} data.motivation
//  * @param {string} data.currentLevel
//  * @param {string} data.role
//  * @param {string} data.learningStyle
//  * @param {string} data.goalClarity
//  * @param {string} data.dailyTime
//  * @returns {Promise<object>} roadmapJson
//  */
// export const generateRoadmapSkeleton = (data) => {
//   const systemPrompt = `You are an expert curriculum designer. Design practical, realistic learning roadmaps.

// STRICT RULES:
// - Each week = EXACTLY 7 days: dayNumber 1-5 = Learning, dayNumber 6 = Revision, dayNumber 7 = Exam
// - Learning days: topicsList = 2-4 specific actionable topics (NOT category names)
// - Revision day: topicsList = [], no examQuestions field
// - Exam day: topicsList = [], EXACTLY 5 MCQ questions in examQuestions
// - Day titles are OUTCOMES not labels: "Making Components Reusable with Props" not "React Props"
// - Realistic pacing — let skill complexity set module count
// - correctIndex = integer 0-3
// - Return ONLY valid JSON. No markdown. No text outside JSON.

// JSON STRUCTURE:
// {"skillName":"string","targetLevel":"string","totalModules":0,"estimatedWeeks":0,"modules":[{"moduleNumber":1,"title":"string","weeks":[{"weekNumber":1,"title":"string","days":[{"dayNumber":1,"dayName":"Monday","type":"Learning","title":"string","topicsList":["string"]},{"dayNumber":6,"dayName":"Saturday","type":"Revision","title":"string","topicsList":[]},{"dayNumber":7,"dayName":"Sunday","type":"Exam","title":"string","topicsList":[],"examQuestions":[{"question":"string","options":["string","string","string","string"],"correctIndex":0,"topicTag":"string"}]}]}]}]}`;

//   const userPrompt = `Generate a learning roadmap:
// Skill: ${data.skillInput}
// Goal: ${data.motivation || 'Not specified'}
// Level: ${data.currentLevel} | Role: ${data.role}
// Style: ${data.learningStyle} | Clarity: ${data.goalClarity}
// Daily time: ${data.dailyTime}

// Follow the 7-day week pattern strictly. Every Sunday needs exactly 5 exam questions.`;

//   return callModel({
//     model:       QUALITY_MODEL,
//     systemPrompt,
//     userPrompt,
//     isJson:      true,
//     maxTokens:   6000,
//   });
// };

// /**
//  * Generates lesson content for a learning or revision day.
//  *
//  * @param {object} data
//  * @returns {Promise<object>} { parts, task }
//  */
// export const generateLessonContent = async (data) => {

//   // ---- REVISION / EXAM RETRY ----
//   if (data.isRevision || data.isExamRetry) {
//     const topics = data.weakTopicsStr || data.allWeekTopics || 'General review of the week';

//     const systemPrompt = `You are a senior engineer running a targeted revision session.
// Re-explain weak topics from a completely different angle with fresh examples.
// Return ONLY valid JSON. No markdown. No text outside JSON.

// REQUIRED STRUCTURE:
// {"parts":[{"partNumber":1,"partTitle":"string (5-8 words)","cards":[{"cardNumber":1,"content":"string (min 80 words)"},{"cardNumber":2,"content":"string (min 80 words)"},{"cardNumber":3,"content":"string (min 80 words)"}],"miniExercise":{"question":"string","options":["string","string","string","string"],"correctIndex":0,"explanation":"string"}}],"task":null}

// RULES: EXACTLY 1 part. EXACTLY 3 cards. task MUST be null.`;

//     const userPrompt = `Write a revision session.
// Weak topics: ${topics}
// Skill: ${data.skillName} | Level: ${data.currentLevel || 'Beginner'}
// Re-explain from a new angle. Start each card with what the learner likely misunderstood.`;

//     const result = await callModel({
//       model:       QUALITY_MODEL,
//       systemPrompt,
//       userPrompt,
//       isJson:      true,
//       maxTokens:   3000,
//     });

//     validateLessonStructure(result);
//     result.parts = result.parts.map(p => ({ ...p, partTitle: cleanPartTitle(p.partTitle) }));
//     return result;
//   }

//   // ---- LEARNING SESSION ----
//   const systemPrompt = `You are a senior engineer mentoring a developer. Direct, practical, not a textbook.
// Return ONLY valid JSON. No markdown. No text outside JSON.

// REQUIRED STRUCTURE:
// {"parts":[{"partNumber":1,"partTitle":"string (5-8 words, outcome-focused)","cards":[{"cardNumber":1,"content":"string (min 100 words — open with the PROBLEM this concept solves, concrete example)"},{"cardNumber":2,"content":"string (min 100 words — The mistake most devs make here is...)"}],"miniExercise":{"question":"string","options":["string","string","string","string"],"correctIndex":0,"explanation":"string"}},{"partNumber":2,"partTitle":"string","cards":[{"cardNumber":1,"content":"string (min 100 words)"},{"cardNumber":2,"content":"string (min 100 words)"}],"miniExercise":{"question":"string","options":["string","string","string","string"],"correctIndex":0,"explanation":"string"}},{"partNumber":3,"partTitle":"string","cards":[{"cardNumber":1,"content":"string (min 100 words — synthesize Parts 1+2 in realistic scenario)"},{"cardNumber":2,"content":"string (min 100 words)"}],"miniExercise":{"question":"string","options":["string","string","string","string"],"correctIndex":0,"explanation":"string"}}],"task":{"type":"text","description":"string (one open engineering question)","questions":[]}}

// For conceptual topics use: "task":{"type":"mcq","description":"string","questions":[{"question":"string","options":["string","string","string","string"],"correctIndex":0,"topicTag":"string"}]}

// RULES: EXACTLY 3 parts. Part 1 opens with the PROBLEM not definition. Part 3 synthesizes.
// BANNED: "it is important to note", "in conclusion", "as we can see", "let us explore"`;

//   const userPrompt = `Write a full learning session:
// Skill: ${data.skillName} | Module ${data.moduleNumber}: ${data.moduleTitle}
// Week ${data.weekNumber}: ${data.weekTitle} | Day ${data.dayNumber} (${data.dayName})
// Topics: ${data.topicsList?.join(', ') || ''}
// Level: ${data.currentLevel} | Goal: ${data.motivation || 'Not specified'} | Style: ${data.learningStyle}

// Part 1: Open with the real PROBLEM these topics solve — not the definition.
// Part 3: Synthesize Parts 1+2 in a realistic scenario connected to: "${data.motivation}"`;

//   const result = await callModel({
//     model:       QUALITY_MODEL,
//     systemPrompt,
//     userPrompt,
//     isJson:      true,
//     maxTokens:   4000,
//   });

//   validateLessonStructure(result);
//   result.parts = result.parts.map(p => ({ ...p, partTitle: cleanPartTitle(p.partTitle) }));
//   return result;
// };

// /**
//  * Generates AI feedback on task submission.
//  *
//  * @param {object} data
//  * @returns {Promise<string>} Feedback text with OUTCOME: and RESOURCES: sections
//  */
// export const generateFeedback = (data) => {
//   let userPrompt;

//   if (data.isMcq) {
//     const wrongAnswers = data.report.filter(r => !r.isCorrect);
//     const correctCount = data.report.filter(r => r.isCorrect).length;
//     const score = data.score ?? Math.round((correctCount / data.report.length) * 100);

//     userPrompt = `Score: ${score}% (${correctCount}/${data.report.length} correct)

// Wrong answers:
// ${wrongAnswers.map((r, i) =>
//     `${i + 1}. "${r.questionText}"\n   Chose: ${r.options?.[r.selectedIndex] ?? 'none'}\n   Correct: ${r.options?.[r.correctIndex]}`
//   ).join('\n\n')}

// Write exactly 3 paragraphs: (1) what they understood, (2) what broke down, (3) one concrete fix.

// OUTCOME: positive OR OUTCOME: needs_improvement

// RESOURCES:
// - [Title](https://url) — why this helps (official docs only)
// If none needed: RESOURCES: (no additional resources needed)`;

//   } else {
//     userPrompt = `Task: ${data.description}
// Topics: ${data.topicsList}
// Answer: ${data.userAnswer}

// Write exactly 3 paragraphs: (1) what they got right, (2) what is missing or wrong, (3) one concrete next step.

// OUTCOME: positive OR OUTCOME: needs_improvement

// RESOURCES:
// - [Title](https://url) — why this helps (official docs only)
// If none needed: RESOURCES: (no additional resources needed)`;
//   }

//   const systemPrompt = `You are an expert mentor evaluating learner work. Be direct, specific, encouraging. The OUTCOME line is mandatory.`;

//   return callModel({
//     model:       FAST_MODEL,
//     systemPrompt,
//     userPrompt,
//     isJson:      false,
//     maxTokens:   1024,
//   });
// };
// /*==============================================================================
// SKILL MASTER — AI SERVICE v2 (Groq / Llama 3)
// Drop-in replacement for gemini.service.js

// PROVIDER: Groq (https://console.groq.com)
// MODELS:
//   - llama-3.1-8b-instant    → roadmap generation (20,000 TPM free tier)
//   - llama-3.3-70b-versatile → lesson content (12,000 TPM — output capped at 4096)
//   - llama-3.1-8b-instant    → feedback (20,000 TPM, speed priority)

// WHY THESE LIMITS:
//   Groq TPM = input tokens + max_tokens (not just output).
//   Previous version set max_tokens: 32768 which alone exceeded the 12k TPM limit.
//   Fix: cap lesson output at 4096, roadmap at 8192 (uses 8b model with 20k limit).

// EXPORTS (identical signatures to gemini.service.js — zero controller changes):
//   generateRoadmapSkeleton(data) → roadmapJson
//   generateLessonContent(data)   → { parts, task }
//   generateFeedback(data)        → string (with OUTCOME: and RESOURCES: sections)

// REQUIRED ENV VAR:
//   GROQ_API_KEY — get from https://console.groq.com/keys

// IMPORT PATHS TO UPDATE:
//   server/src/controllers/session.controller.js  → from '../services/ai.service.js'
//   server/src/controllers/roadmap.controller.js  → from '../services/ai.service.js'
// ==============================================================================
// */
// import Groq from 'groq-sdk';
// import dotenv from 'dotenv';

// dotenv.config();

// const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// const ROADMAP_MODEL  = 'llama-3.1-8b-instant';    // 20k TPM — large JSON output safe
// const LESSON_MODEL   = 'llama-3.3-70b-versatile';  // 12k TPM — capped at 4096 output
// const FEEDBACK_MODEL = 'llama-3.1-8b-instant';     // 20k TPM — text feedback, 1024 output

// // ==============================================================================
// // UTILITIES
// // ==============================================================================

// /** Simple async delay for retry backoff */
// const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// /**
//  * Parses JSON from model response text.
//  * Strips markdown code fences (common with smaller models).
//  * @param {string} text - Raw model output
//  * @returns {object} Parsed JSON object
//  * @throws {Error} JSON_PARSE_FAILURE — triggers retry logic in session controller
//  */
// const parseJSON = (text) => {
//   try {
//     if (typeof text === 'object') return text;
//     const cleaned = text
//       .replace(/^```json\s*/i, '')
//       .replace(/^```\s*/i, '')
//       .replace(/\s*```$/i, '')
//       .trim();
//     return JSON.parse(cleaned);
//   } catch {
//     console.error('[AI Service] JSON parse failed on:', text?.substring(0, 300));
//     throw new Error('JSON_PARSE_FAILURE');
//   }
// };

// /**
//  * Validates that a parsed lesson object has correct semantic structure.
//  * Called after JSON.parse, before saving to MongoDB via guardSessionContent.
//  * @param {object} parsed - Parsed lesson JSON
//  * @throws {Error} JSON_PARSE_FAILURE on invalid structure
//  */
// const validateLessonStructure = (parsed) => {
//   if (!parsed.parts || !Array.isArray(parsed.parts) || parsed.parts.length === 0) {
//     console.error('[AI Validation] FAIL: parts array missing or empty');
//     throw new Error('JSON_PARSE_FAILURE');
//   }
//   for (const part of parsed.parts) {
//     if (!part.cards || !Array.isArray(part.cards) || part.cards.length === 0) {
//       console.error(`[AI Validation] FAIL: part ${part.partNumber} has no cards`);
//       throw new Error('JSON_PARSE_FAILURE');
//     }
//     for (const card of part.cards) {
//       if (!card.content || typeof card.content !== 'string' || card.content.trim().length < 50) {
//         console.error(`[AI Validation] FAIL: card content too short in part ${part.partNumber}`);
//         throw new Error('JSON_PARSE_FAILURE');
//       }
//     }
//   }
//   return true;
// };

// /**
//  * Cleans a partTitle string.
//  * Detects repetitive hallucination pattern (word repeated 3+ times in 80 chars).
//  * Strips trailing JSON artifacts from partial outputs.
//  * @param {string} title - Raw partTitle from model
//  * @returns {string} Clean partTitle, max 80 chars
//  */
// const cleanPartTitle = (title) => {
//   if (typeof title !== 'string' || title.trim().length === 0) return 'Topic Overview';
//   const sample = title.substring(0, 80).toLowerCase();
//   const words = sample.split(/\s+/).filter(w => w.length > 3);
//   const counts = {};
//   for (const word of words) {
//     counts[word] = (counts[word] || 0) + 1;
//     if (counts[word] >= 3) {
//       console.warn('[AI Validation] Hallucinated partTitle replaced with fallback');
//       return 'Topic Overview';
//     }
//   }
//   return title.replace(/[,"\s]+$/, '').replace(/^[,"\s]+/, '').trim().substring(0, 80);
// };

// // ==============================================================================
// // CORE CALL
// // ==============================================================================

// /**
//  * Makes a single Groq API request with retry and exponential backoff.
//  * Retries on 429 (rate limit), 500 (server error), 503 (overloaded).
//  * Fails fast on 413 (request too large — retrying won't help).
//  *
//  * TOKEN BUDGET NOTE:
//  *   Groq TPM = input tokens + max_tokens.
//  *   Always pass maxTokens explicitly — never use a global default.
//  *   llama-3.3-70b free tier: 12,000 TPM → keep maxTokens at 4096 max.
//  *   llama-3.1-8b free tier: 20,000 TPM → maxTokens up to 8192 is safe.
//  *
//  * @param {string} model - Groq model identifier
//  * @param {string} systemPrompt - System instruction (keep under 500 tokens)
//  * @param {string} userPrompt - Task prompt
//  * @param {boolean} isJson - Whether to enforce JSON response mode
//  * @param {number} maxTokens - Max output tokens (set per call, not globally)
//  * @returns {Promise<object|string>} Parsed JSON or raw text
//  * @throws {Error} GEMINI_FAILURE | JSON_PARSE_FAILURE
//  */
// const callModel = async ({ model, systemPrompt, userPrompt, isJson = true, maxTokens = 4096 }) => {
//   let attempts = 0;
//   const maxRetries = 3;

//   while (attempts < maxRetries) {
//     try {
//       const config = {
//         model,
//         messages: [
//           { role: 'system', content: systemPrompt },
//           { role: 'user',   content: userPrompt   },
//         ],
//         temperature: isJson ? 0.7 : 0.6,
//         max_tokens:  maxTokens,
//       };

//       if (isJson) {
//         config.response_format = { type: 'json_object' };
//       }

//       const completion = await groq.chat.completions.create(config);
//       const text = completion.choices[0]?.message?.content;

//       if (!text) throw new Error('EMPTY_RESPONSE');

//       return isJson ? parseJSON(text) : text;

//     } catch (error) {
//       attempts++;

//       const is429 = error.message?.includes('429') || error.status === 429;
//       const is413 = error.message?.includes('413') || error.status === 413;
//       const is500 = error.message?.includes('500') || error.status === 500;
//       const is503 = error.message?.includes('503') || error.status === 503;
//       const retryable = (is429 || is500 || is503) && attempts < maxRetries;

//       console.error(
//         `[AI Service] Attempt ${attempts} failed: ${error.message?.substring(0, 120)}` +
//         (retryable ? ` — retrying in ${attempts === 1 ? 5 : attempts === 2 ? 15 : 30}s` : '')
//       );

//       if (is413) throw new Error(`GEMINI_FAILURE: ${error.message}`); // fail fast
//       if (retryable) {
//         const ms = attempts === 1 ? 5000 : attempts === 2 ? 15000 : 30000;
//         await wait(ms);
//       } else {
//         if (error.message === 'JSON_PARSE_FAILURE') throw error;
//         throw new Error(`GEMINI_FAILURE: ${error.message}`);
//       }
//     }
//   }
// };

// // ==============================================================================
// // PUBLIC API — identical signatures to gemini.service.js
// // ==============================================================================

// /**
//  * Generates the full roadmap skeleton — modules, weeks, days, exam questions.
//  * Uses ROADMAP_MODEL (8b, 20k TPM) with 8192 output tokens for large roadmap JSON.
//  *
//  * @param {object} data - Learner profile from setup form
//  * @param {string} data.skillInput - Skill to learn
//  * @param {string} [data.motivation] - Learning goal / motivation
//  * @param {string} data.currentLevel - Beginner | Intermediate | Advanced
//  * @param {string} data.role - Student | Job Seeker | Other
//  * @param {string} data.learningStyle - Reading | Examples | Practice
//  * @param {string} data.goalClarity - Clear | General | Exploring
//  * @param {string} data.dailyTime - Daily time commitment string
//  * @returns {Promise<object>} roadmapJson — modules → weeks → days → examQuestions
//  */
// export const generateRoadmapSkeleton = (data) => {
//   const systemPrompt = `You are an expert curriculum designer. Design practical, realistic learning roadmaps.

// STRICT RULES:
// - Each week = EXACTLY 7 days: dayNumber 1-5 = Learning, dayNumber 6 = Revision, dayNumber 7 = Exam
// - Learning days: topicsList = 2-4 specific actionable topics (NOT category names like "React Hooks")
// - Revision day: topicsList = [], no examQuestions field
// - Exam day: topicsList = [], EXACTLY 5 MCQ questions in examQuestions
// - Day titles are OUTCOMES: "Making Components Reusable with Props" not "React Props"
// - Realistic pacing — let skill complexity set module count, do not compress
// - correctIndex = integer 0-3 (index into options array)
// - Return ONLY valid JSON. No markdown. No text outside JSON.

// REQUIRED JSON STRUCTURE:
// {"skillName": "string","targetLevel": "string","totalModules": number,"estimatedWeeks": number,"modules": [{"moduleNumber": number,"title": "string","weeks": [{"weekNumber": number,"title": "string","days": [{"dayNumber": number,"dayName": "string","type": "Learning","title": "string","topicsList": ["string"],"examQuestions": [{"question":"string","options":["string","string","string","string"],"correctIndex":0,"topicTag":"string"}]}]}]}]}`;
//   const userPrompt = `Generate a learning roadmap for this learner:Skill: ${data.skillInput}Goal: ${data.motivation || 'Not specified'}Level: ${data.currentLevel} | Role: ${data.role}Style: ${data.learningStyle} | Goal clarity: ${data.goalClarity}Daily time: ${data.dailyTime} . Follow the 7-day pattern strictly. Every Sunday needs exactly 5 exam questions with correctIndex values.`;
//   return callModel({
//     model: ROADMAP_MODEL,
//     systemPrompt,
//     userPrompt,
//     isJson: true,
//     maxTokens: 6000, // large roadmap JSON output
//   });
// };

// /**
//  * Generates lesson content for a learning or revision day.
//  * Uses LESSON_MODEL (70b) with maxTokens 4096 — stays under 12k TPM limit.
//  * Validates and cleans structure before returning to controller.
//  *
//  * Handles three session types:
//  *   - isRevision: Saturday revision (1 part, 3 cards, no task)
//  *   - isExamRetry: Post-exam-fail revision (same shape as isRevision)
//  *   - Default: Full learning session (3 parts, 2-3 cards each, 1 task)
//  *
//  * @param {object} data - Session generation context
//  * @param {boolean} [data.isRevision] - Saturday revision session flag
//  * @param {boolean} [data.isExamRetry] - Post-exam retry revision flag
//  * @param {string} data.skillName - Name of the skill being learned
//  * @param {number} [data.moduleNumber] - Current module number
//  * @param {string} [data.moduleTitle] - Module title (mod.title from roadmapJson)
//  * @param {number} [data.weekNumber] - Current week number
//  * @param {string} [data.weekTitle] - Week title (week.title from roadmapJson)
//  * @param {number} [data.dayNumber] - Day number 1-7
//  * @param {string} [data.dayName] - Day name e.g. "Monday"
//  * @param {string[]} [data.topicsList] - Topics to cover today
//  * @param {string} [data.currentLevel] - Learner level
//  * @param {string} [data.motivation] - Learner goal for contextualisation
//  * @param {string} [data.learningStyle] - Reading | Examples | Practice
//  * @param {string} [data.weakTopicsStr] - Comma-separated weak topics (revision)
//  * @param {string} [data.allWeekTopics] - Fallback week topics (revision)
//  * @returns {Promise<object>} { parts: [...], task: {...} | null }
//  */
// export const generateLessonContent = async (data) => {

//   // ---- REVISION / EXAM RETRY SESSION ----
//   if (data.isRevision || data.isExamRetry) {
//     const topics = data.weakTopicsStr || data.allWeekTopics || 'General review of the week';

//     const systemPrompt = `You are a senior engineer running a targeted revision session.
// Re-explain weak topics from a completely different angle with fresh examples.
// Return ONLY valid JSON. No markdown fences. No text outside JSON.

// REQUIRED STRUCTURE (EXACT — do not deviate):
// {"parts": [{"partNumber": 1,"partTitle": "string (5-8 words, title case)","cards": [{"cardNumber": 1, "content": "string (min 80 words — first weak topic, new angle, fresh example)"},{"cardNumber": 2, "content": "string (min 80 words — second topic or connecting concept)"},{"cardNumber": 3, "content": "string (min 80 words — practical application tying topics together)"}],"miniExercise": {"question": "string (tests genuine understanding)","options": ["string","string","string","string"],"correctIndex": 0,"explanation": "string"}}],"task": null}
// ABSOLUTE RULES: EXACTLY 1 part. EXACTLY 3 cards. task MUST be null. No extra fields.`;
//     const userPrompt = `Write a revision session. Weak topics: ${topics} Skill: ${data.skillName} | Level: ${data.currentLevel || 'Beginner'} Use a completely different angle than the original lesson. Start each card with what the learner likely misunderstood.`;

//     const result = await callModel({
//       model: LESSON_MODEL,
//       systemPrompt,
//       userPrompt,
//       isJson: true,
//       maxTokens: 4096,
//     });

//     validateLessonStructure(result);
//     result.parts = result.parts.map(part => ({
//       ...part,
//       partTitle: cleanPartTitle(part.partTitle),
//     }));
//     return result;
//   }

//   // ---- LEARNING SESSION ----
//   const systemPrompt = `You are a senior engineer mentoring a developer. Direct, opinionated, practical — not a textbook.
// Return ONLY valid JSON. No markdown fences. No text outside JSON.

// REQUIRED STRUCTURE (EXACT — do not deviate):
// {"parts": [{"partNumber": 1,"partTitle": "string (5-8 words, outcome-focused, title case)","cards": [{"cardNumber": 1, "content": "string (min 100 words — open with the PROBLEM this concept solves, then concrete example)"},{"cardNumber": 2, "content": "string (min 100 words — most common mistake, start with: The mistake most devs make here is...)"}],"miniExercise": {"question":"string","options":["string","string","string","string"],"correctIndex":0,"explanation":"string"}},{"partNumber": 2,"partTitle": "string","cards": [{"cardNumber": 1, "content": "string (min 100 words)"},{"cardNumber": 2, "content": "string (min 100 words)"}],"miniExercise": {"question":"string","options":["string","string","string","string"],"correctIndex":0,"explanation":"string"}},{"partNumber": 3,"partTitle": "string","cards": [{"cardNumber": 1, "content": "string (min 100 words — synthesize Parts 1 and 2 in realistic scenario from learner goal)"},{"cardNumber": 2, "content": "string (min 100 words)"}],"miniExercise": {"question":"string","options":["string","string","string","string"],"correctIndex":0,"explanation":"string"} }],
//   "task": {"type": "text","description": "string (one open engineering question requiring 100+ word detailed answer)","questions": []}}
// For conceptual/theory-heavy topics, replace task with:
// {"type":"mcq","description":"string","questions":[{"question":"string","options":["string","string","string","string"],"correctIndex":0,"topicTag":"string"}]}
// RULES:
// - EXACTLY 3 parts. Part 1 opens with the PROBLEM not the definition. Part 3 synthesizes.
// - Text task for practical/hands-on topics. MCQ for conceptual topics.
// - BANNED phrases: "it is important to note", "in conclusion", "as we can see", "let us explore"`;

//   const userPrompt = `Write a full learning session: Skill: ${data.skillName} Module ${data.moduleNumber}: ${data.moduleTitle} Week ${data.weekNumber}: ${data.weekTitle} Day ${data.dayNumber} (${data.dayName}) Topics: ${data.topicsList?.join(', ') || ''} Level: ${data.currentLevel} | Goal: ${data.motivation || 'Not specified'} | Style: ${data.learningStyle}
// Part 1: Open with the real PROBLEM these topics solve — not the definition.
// Part 3: Synthesize Parts 1+2 in a realistic scenario connected to: "${data.motivation}"`;
//   const result = await callModel({
//     model: LESSON_MODEL,
//     systemPrompt,
//     userPrompt,
//     isJson: true,
//     maxTokens: 4096,
//   });

//   validateLessonStructure(result);
//   result.parts = result.parts.map(part => ({
//     ...part,
//     partTitle: cleanPartTitle(part.partTitle),
//   }));
//   return result;
// };

// /**
//  * Generates AI feedback on task submission — text answer or MCQ.
//  * Uses FEEDBACK_MODEL (8b, 20k TPM) with 1024 output — fast text generation.
//  * Returns raw text string. Session controller parses OUTCOME: and RESOURCES: via regex.
//  *
//  * @param {object} data - Submission context
//  * @param {boolean} [data.isMcq] - True for MCQ task feedback
//  * @param {string} [data.description] - Task description (text tasks only)
//  * @param {string} [data.userAnswer] - Learner's text answer (text tasks only)
//  * @param {string} [data.topicsList] - Topics being tested
//  * @param {object[]} [data.report] - MCQ answer report: [{questionText, options, selectedIndex, correctIndex, isCorrect, topicTag}]
//  * @param {number} [data.score] - MCQ percentage score (optional, computed if missing)
//  * @returns {Promise<string>} Feedback text ending with OUTCOME: positive|needs_improvement and RESOURCES: section
//  */
// export const generateFeedback = (data) => {
//   let userPrompt;

//   if (data.isMcq) {
//     const wrongAnswers = data.report.filter(r => !r.isCorrect);
//     const correctCount = data.report.filter(r => r.isCorrect).length;
//     const score = data.score ?? Math.round((correctCount / data.report.length) * 100);

//     userPrompt = `Score: ${score}% (${correctCount}/${data.report.length} correct)

// Wrong answers:
// ${wrongAnswers.map((r, i) =>
//     `${i + 1}. "${r.questionText}"\n   Chose: ${r.options?.[r.selectedIndex] ?? 'none'}\n   Correct: ${r.options?.[r.correctIndex]}`
//   ).join('\n\n')}

// Write exactly 3 paragraphs "two-three liners ": (1) what they understood, (2) what broke down — diagnose actual confusion not just topic names, (3) one concrete fix.

// Then on a new line:
// OUTCOME: positive OR OUTCOME: needs_improvement

// Then:
// RESOURCES:
// - [Title](https://url) — one sentence why this helps (official docs only: MDN, React, Node.js, MongoDB, Python)
// If none needed: RESOURCES: (no additional resources needed)`;

//   } else {
//     userPrompt = `Task: ${data.description}
// Topics: ${data.topicsList}
// Learner answer: ${data.userAnswer}

// Write exactly 3 paragraphs: (1) what they got right — specific, (2) what's missing or wrong — specific, not vague, (3) one concrete next step.

// Then on a new line:
// OUTCOME: positive OR OUTCOME: needs_improvement

// Then:
// RESOURCES:
// - [Title](https://url) — one sentence why this helps (official docs only)
// If none needed: RESOURCES: (no additional resources needed)`;
//   }

//   const systemPrompt = `You are an expert mentor evaluating learner work. Be direct, specific, and encouraging. The OUTCOME line is mandatory — never omit it.`;

//   return callModel({
//     model: FEEDBACK_MODEL,
//     systemPrompt,
//     userPrompt,
//     isJson: false,
//     maxTokens: 1024,
//   });
// };
