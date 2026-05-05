// ==============================================================================
// SKILL MASTER — AI SERVICE (Groq / Llama 3)
// Drop-in replacement for gemini.service.js
//
// KEY CHANGES FROM gemini.service.js:
// 1. Provider: Google Gemini → Groq (Llama 3.3 70B + Llama 3.1 8B)
// 2. Architecture: Two-call pipeline → Single-call (Llama 3.3 70B handles both)
// 3. Schema enforcement: Gemini responseSchema → JSON mode + prompt-level schema
// 4. Error codes: Preserved — controllers catch same GEMINI_FAILURE / JSON_PARSE_FAILURE
// 5. Exports: Identical signatures — zero changes needed in controllers (except import path)
//
// MODELS:
// - QUALITY_MODEL (llama-3.3-70b-versatile): roadmap generation + lesson content
// - FAST_MODEL    (llama-3.1-8b-instant):    feedback (fast + cheap)
//
// ENV REQUIRED:
// - GROQ_API_KEY (get from https://console.groq.com/keys)
// ==============================================================================

import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const QUALITY_MODEL = 'llama-3.3-70b-versatile'; // roadmap + lesson (complex reasoning)
const FAST_MODEL    = 'llama-3.1-8b-instant';    // feedback (speed over depth)

// ==============================================================================
// UTILITIES
// ==============================================================================

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Parses JSON from model response text.
 * Strips markdown fences if model wraps output in ```json ... ```.
 * Throws JSON_PARSE_FAILURE on failure — triggers retry logic in controller.
 */
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
    console.error('[AI Service] JSON parse failed on:', text?.substring(0, 300));
    throw new Error('JSON_PARSE_FAILURE');
  }
};

/**
 * Validates that a parsed lesson object has the correct semantic structure.
 * Throws JSON_PARSE_FAILURE if structure is invalid — triggering retry logic.
 * Called after JSON.parse succeeds, before returning to caller.
 */
const validateLessonStructure = (parsed) => {
  if (!parsed.parts || !Array.isArray(parsed.parts) || parsed.parts.length === 0) {
    console.error('[AI Validation] FAIL: parts array missing or empty');
    throw new Error('JSON_PARSE_FAILURE');
  }
  for (const part of parsed.parts) {
    if (!part.cards || !Array.isArray(part.cards) || part.cards.length === 0) {
      console.error(`[AI Validation] FAIL: part ${part.partNumber} has no cards`);
      throw new Error('JSON_PARSE_FAILURE');
    }
    for (const card of part.cards) {
      if (!card.content || typeof card.content !== 'string' || card.content.trim().length < 50) {
        console.error(`[AI Validation] FAIL: card content too short in part ${part.partNumber}`);
        throw new Error('JSON_PARSE_FAILURE');
      }
    }
  }
  return true;
};

/**
 * Cleans and validates a partTitle string.
 * Detects Gemini/LLM hallucination pattern (repeated words) and replaces with fallback.
 * Strips trailing JSON artifacts.
 */
const cleanPartTitle = (title) => {
  if (typeof title !== 'string' || title.trim().length === 0) return 'Topic Overview';
  const sample = title.substring(0, 80).toLowerCase();
  const words = sample.split(/\s+/).filter(w => w.length > 3);
  const counts = {};
  for (const word of words) {
    counts[word] = (counts[word] || 0) + 1;
    if (counts[word] >= 3) {
      console.warn('[AI Validation] Hallucinated partTitle replaced');
      return 'Topic Overview';
    }
  }
  return title
    .replace(/[,"\s]+$/, '')
    .replace(/^[,"\s]+/, '')
    .trim()
    .substring(0, 80);
};

// ==============================================================================
// CORE CALL — All AI requests go through here
// ==============================================================================

/**
 * Makes a single request to Groq API with retry logic.
 * Retries on 429 (rate limit), 500 (server error), 503 (service unavailable).
 * Backoff: 5s → 15s → 30s
 *
 * @param {string} model - Groq model ID
 * @param {string} systemPrompt - System instruction for the model
 * @param {string} userPrompt - User message / task prompt
 * @param {boolean} isJson - Whether to enforce JSON response mode
 * @returns {object|string} - Parsed JSON object or raw text string
 */
const callModel = async ({ model, systemPrompt, userPrompt, isJson = true }) => {
  let attempts = 0;
  const maxRetries = 3;

  while (attempts < maxRetries) {
    try {
      const config = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   }
        ],
        temperature:  isJson ? 0.7 : 0.6,
        max_tokens:   isJson ? 32768 : 4096,
      };

      // JSON mode: forces model to return valid JSON object
      if (isJson) {
        config.response_format = { type: 'json_object' };
      }

      const completion = await groq.chat.completions.create(config);
      const text = completion.choices[0]?.message?.content;

      if (!text) throw new Error('EMPTY_RESPONSE');

      return isJson ? parseJSON(text) : text;

    } catch (error) {
      attempts++;

      const is429 = error.message?.includes('429') || error.status === 429;
      const is500 = error.message?.includes('500') || error.status === 500;
      const is503 = error.message?.includes('503') || error.status === 503;
      const retryable = (is429 || is500 || is503) && attempts < maxRetries;

      console.error(
        `[AI Service] Attempt ${attempts} failed: ${error.message}` +
        (retryable ? ` — retrying in ${attempts === 1 ? 5 : attempts === 2 ? 15 : 30}s` : '')
      );

      if (retryable) {
        const ms = attempts === 1 ? 5000 : attempts === 2 ? 15000 : 30000;
        await wait(ms);
      } else {
        // Preserve error codes that controllers already catch
        if (error.message === 'JSON_PARSE_FAILURE') throw error;
        throw new Error(`GEMINI_FAILURE: ${error.message}`);
      }
    }
  }
};

// ==============================================================================
// PUBLIC API — Same signatures as gemini.service.js
// ==============================================================================

/**
 * Generates the roadmap skeleton — module/week/day structure with exam questions.
 * Single call to QUALITY_MODEL. Schema is enforced via prompt + JSON mode.
 *
 * @param {object} data - { skillInput, motivation, currentLevel, role, learningStyle, goalClarity, dailyTime }
 * @returns {object} roadmapJson matching ROADMAP_SCHEMA structure
 */
export const generateRoadmapSkeleton = (data) => {
  const systemPrompt = `You are an expert curriculum designer. You design learning roadmaps for any skill — technical or non-technical.

Your curriculum philosophy:
- Realistic pacing. Never compress complex skills. If MERN needs 10 weeks, design 10 weeks.
- Spiral progression: later weeks BUILD on earlier ones. Never re-explain previous week topics — apply them.
- 70% practical, 30% conceptual in topicsList.
- Day titles are outcomes, not labels. NOT "React Hooks" → YES "Making Components Remember State with useState"

Return ONLY a valid JSON object matching this EXACT structure (no markdown, no explanation):

{
  "skillName": "string",
  "targetLevel": "string",
  "totalModules": number,
  "estimatedWeeks": number,
  "modules": [
    {
      "moduleNumber": number,
      "title": "string",
      "weeks": [
        {
          "weekNumber": number,
          "title": "string",
          "days": [
            {
              "dayNumber": number,
              "dayName": "Monday",
              "type": "Learning",
              "title": "string (outcome-focused, not a topic label)",
              "topicsList": ["string", "string"]
            },
            {
              "dayNumber": 6,
              "dayName": "Saturday",
              "type": "Revision",
              "title": "Weekly Review",
              "topicsList": []
            },
            {
              "dayNumber": 7,
              "dayName": "Sunday",
              "type": "Exam",
              "title": "Week X Assessment",
              "topicsList": [],
              "examQuestions": [
                {
                  "question": "string",
                  "options": ["string", "string", "string", "string"],
                  "correctIndex": 0,
                  "topicTag": "string"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

STRICT RULES:
- Each week has EXACTLY 7 days: dayNumber 1-5 = Learning, dayNumber 6 = Revision, dayNumber 7 = Exam
- Revision day: topicsList = empty array [], no examQuestions field
- Exam day: exactly 5 MCQ questions in examQuestions, topicsList = empty array []
- Learning days: topicsList = 2-4 specific actionable topics (NOT category names)
- correctIndex is an integer 0-3 (index into options array)
- Every day MUST have dayNumber, dayName, type, title fields
- Return pure JSON only. No markdown code fences. No explanation text.`;

  const userPrompt = `Generate a complete learning roadmap for this learner:

Skill to learn: ${data.skillInput}
Learning goal: ${data.motivation || 'Not specified'}
Current level: ${data.currentLevel}
Role: ${data.role}
Learning style: ${data.learningStyle}
Goal clarity: ${data.goalClarity}
Daily time available: ${data.dailyTime}

Design a realistic curriculum. Let the complexity of the skill determine the module count — do not compress.
Ensure every week follows the 7-day pattern exactly. Every Sunday must have exactly 5 exam questions.`;

  return callModel({
    model: QUALITY_MODEL,
    systemPrompt,
    userPrompt,
    isJson: true,
  });
};

/**
 * Generates lesson content for a learning or revision day.
 * Single-call pipeline using QUALITY_MODEL.
 * Validates and cleans structure before returning.
 *
 * @param {object} data - Session context (skillName, moduleNumber, topicsList, etc.)
 * @returns {object} Lesson content matching { parts, task } structure
 */
export const generateLessonContent = async (data) => {

  // ---- REVISION SESSION ----
  if (data.isRevision || data.isExamRetry) {
    const topics = data.weakTopicsStr || data.allWeekTopics || 'General review of the week';

    const systemPrompt = `You are a senior engineer running a targeted revision session. Your job is to re-explain weak topics from a completely different angle than the first time.

Return ONLY a valid JSON object in this EXACT structure:

{
  "parts": [
    {
      "partNumber": 1,
      "partTitle": "string (5-8 words, title case, e.g. 'Week Revision: Core Concepts')",
      "cards": [
        {
          "cardNumber": 1,
          "content": "string (120-200 words, re-explain first weak topic from a new angle, fresh concrete example, address WHY the learner got it wrong)"
        },
        {
          "cardNumber": 2,
          "content": "string (120-200 words, second weak topic or connecting concept)"
        },
        {
          "cardNumber": 3,
          "content": "string (120-200 words, practical application tying the weak topics together)"
        }
      ],
      "miniExercise": {
        "question": "string (tests genuine understanding — someone who skimmed must get it wrong)",
        "options": ["string", "string", "string", "string"],
        "correctIndex": 0,
        "explanation": "string"
      }
    }
  ],
  "task": null
}

ABSOLUTE RULES:
- parts array contains EXACTLY 1 item
- cards array contains EXACTLY 3 items
- task MUST be null (revision sessions have no task)
- Return pure JSON only. No markdown fences. No explanation.`;

    const userPrompt = `Write a focused revision session for these topics the learner struggled with:

Weak topics: ${topics}
Skill: ${data.skillName}
Level: ${data.currentLevel || 'Beginner'}

Re-explain each topic from a completely different angle with a fresh example they haven't seen.
Be direct: start with "You likely missed this because..." to name the actual confusion point.`;

    const result = await callModel({
      model: QUALITY_MODEL,
      systemPrompt,
      userPrompt,
      isJson: true,
    });

    validateLessonStructure(result);
    result.parts = result.parts.map(part => ({
      ...part,
      partTitle: cleanPartTitle(part.partTitle),
    }));
    return result;
  }

  // ---- LEARNING SESSION ----
  const systemPrompt = `You are a senior engineer mentoring a developer. You don't write like a textbook — you teach like a real person who has seen the mistakes, hit the walls, and knows what actually matters.

Return ONLY a valid JSON object in this EXACT structure:

{
  "parts": [
    {
      "partNumber": 1,
      "partTitle": "string (5-8 words, outcome-focused, title case)",
      "cards": [
        {
          "cardNumber": 1,
          "content": "string (120-200 words, open with the PROBLEM this concept solves, concrete example)"
        },
        {
          "cardNumber": 2,
          "content": "string (120-200 words, address the most common mistake: lead with 'The mistake most devs make here is...')"
        }
      ],
      "miniExercise": {
        "question": "string (someone who skimmed must get this wrong)",
        "options": ["string", "string", "string", "string"],
        "correctIndex": 0,
        "explanation": "string"
      }
    },
    {
      "partNumber": 2,
      "partTitle": "string",
      "cards": [
        { "cardNumber": 1, "content": "string (120-200 words)" },
        { "cardNumber": 2, "content": "string (120-200 words)" }
      ],
      "miniExercise": {
        "question": "string",
        "options": ["string", "string", "string", "string"],
        "correctIndex": 0,
        "explanation": "string"
      }
    },
    {
      "partNumber": 3,
      "partTitle": "string",
      "cards": [
        { "cardNumber": 1, "content": "string (120-200 words, synthesize Parts 1 and 2 in a realistic scenario)" },
        { "cardNumber": 2, "content": "string (120-200 words)" }
      ],
      "miniExercise": {
        "question": "string",
        "options": ["string", "string", "string", "string"],
        "correctIndex": 0,
        "explanation": "string"
      }
    }
  ],
  "task": {
    "type": "text",
    "description": "string (one open engineering question requiring 100+ word detailed answer demonstrating real understanding)",
    "questions": []
  }
}

If the topics are conceptual (theory-heavy), use this task format instead:
"task": {
  "type": "mcq",
  "description": "Test your understanding of today's topics",
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": 0,
      "topicTag": "string"
    }
  ]
}

ABSOLUTE RULES:
- EXACTLY 3 parts in parts array
- Each part: 2-3 cards, each card 120-200 words with ONE concrete example
- Part 1 MUST open with the PROBLEM the concept solves (not the definition)
- Part 3 MUST synthesize Parts 1 and 2 in a realistic scenario from the learner's goal domain
- Task type: "text" for practical/hands-on topics, "mcq" for conceptual topics (10-15 questions)
- BANNED phrases: "it is important to note", "in conclusion", "as we can see", "let us explore", "in this section"
- Return pure JSON only. No markdown fences. No explanation.`;

  const userPrompt = `Write a complete lesson session:

Skill: ${data.skillName}
Module ${data.moduleNumber}: ${data.moduleTitle}
Week ${data.weekNumber}: ${data.weekTitle}
Day ${data.dayNumber} (${data.dayName})
Topics to cover: ${data.topicsList?.join(', ') || ''}
Learner level: ${data.currentLevel}
Learner goal: ${data.motivation || 'Not specified'}
Learning style: ${data.learningStyle}

TEACHING REQUIREMENTS:
- Open Part 1 with the REAL PROBLEM these topics solve. Not the definition.
- Connect at least one idea per part explicitly to the learner's goal: "${data.motivation}"
- Address the most common beginner mistake somewhere — lead with "The mistake most devs make here is..."
- Part 3 synthesizes Parts 1 and 2 in a realistic scenario from the learner's goal domain
- Write in engineer voice: direct, opinionated, specific. No textbook language.`;

  const result = await callModel({
    model: QUALITY_MODEL,
    systemPrompt,
    userPrompt,
    isJson: true,
  });

  validateLessonStructure(result);
  result.parts = result.parts.map(part => ({
    ...part,
    partTitle: cleanPartTitle(part.partTitle),
  }));
  return result;
};

/**
 * Generates AI feedback on task submission (text or MCQ).
 * Single FAST_MODEL call — feedback doesn't need deep reasoning.
 *
 * @param {object} data - { isMcq?, description?, userAnswer?, topicsList?, report?, score? }
 * @returns {string} Raw feedback text with OUTCOME: and RESOURCES: sections
 */
export const generateFeedback = (data) => {
  let userPrompt;

  if (data.isMcq) {
    const wrongAnswers = data.report.filter(r => !r.isCorrect);
    const correctCount = data.report.filter(r => r.isCorrect).length;
    const score = data.score ?? Math.round((correctCount / data.report.length) * 100);

    userPrompt = `Score: ${score}% (${correctCount}/${data.report.length} correct)

Questions answered incorrectly:
${wrongAnswers.map((r, i) =>
  `${i + 1}. "${r.questionText}"\n   Learner chose: ${r.options?.[r.selectedIndex] ?? 'no answer'}\n   Correct: ${r.options?.[r.correctIndex]}`
).join('\n\n')}

Write feedback in exactly 3 paragraphs:
1. What they understood correctly (be specific, reference actual questions)
2. What broke down in the wrong answers (diagnose the actual confusion, not just "review topic X")
3. One concrete action to fix it (specific, not vague)

After the 3 paragraphs, you MUST include exactly:
OUTCOME: positive OR OUTCOME: needs_improvement

Then you MUST include:
RESOURCES:
- [Title](https://official-url) — one sentence why this helps (official docs only: MDN, React docs, Node.js docs, MongoDB docs, Python docs)

If no resources are relevant: RESOURCES: (no additional resources needed for this topic)`;

  } else {
    userPrompt = `Task: ${data.description}
Topics tested: ${data.topicsList}
Learner's answer: ${data.userAnswer}

Write feedback in exactly 3 paragraphs:
1. What they got right (name specific things from their answer)
2. What's missing or wrong (be specific — not "improve X", say what X should actually be)
3. One concrete next step

After the 3 paragraphs, you MUST include exactly:
OUTCOME: positive OR OUTCOME: needs_improvement

Then you MUST include:
RESOURCES:
- [Title](https://official-url) — one sentence why this helps (official docs only)

If no resources are relevant: RESOURCES: (no additional resources needed for this topic)`;
  }

  const systemPrompt = `You are an expert mentor evaluating learner work.
Be direct, specific, and encouraging. Never vague. Always give one concrete next step.
The OUTCOME line is mandatory — never omit it.`;

  return callModel({
    model: FAST_MODEL,
    systemPrompt,
    userPrompt,
    isJson: false,
  });
};
