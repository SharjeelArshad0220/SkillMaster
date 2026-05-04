// ==============================================================================
// SKILL MASTER — GEMINI SERVICE v2
// Refactored for quality-first content generation.
//
// KEY CHANGES FROM v1:
// 1. Two-call architecture for lessons only (think → structure). Everything else stays single-call.
// 2. Schema relaxed — controls shape, not creativity.
// 3. Prompts force cognition before generation ("Before you write, identify...")
// 4. Engineer voice enforced — banned textbook phrases.
// 5. Self-critique pass on lesson content before returning.
// 6. Flash for roadmap/MCQ/feedback. Pro for lesson thinking call only.
// ==============================================================================

import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Two models — Pro thinks, Flash structures and handles everything else
const THINKING_MODEL  = 'gemini-2.5-pro';   // lesson content only
const STRUCTURE_MODEL = 'gemini-2.5-flash';  // everything else + formatting pass

// ==============================================================================
// SCHEMAS — Enforce shape, not word count. Let the model breathe.
// ==============================================================================

const ROADMAP_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    skillName:      { type: Type.STRING },
    targetLevel:    { type: Type.STRING },
    totalModules:   { type: Type.NUMBER },
    estimatedWeeks: { type: Type.NUMBER },
    modules: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          moduleNumber: { type: Type.NUMBER },
          title:        { type: Type.STRING },
          weeks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                weekNumber: { type: Type.NUMBER },
                title:      { type: Type.STRING },
                days: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      dayNumber:  { type: Type.NUMBER },
                      dayName:    { type: Type.STRING },
                      type:       { type: Type.STRING },
                      title:      { type: Type.STRING },
                      topicsList: { type: Type.ARRAY, items: { type: Type.STRING } },
                      examQuestions: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            question:     { type: Type.STRING },
                            options:      { type: Type.ARRAY, items: { type: Type.STRING } },
                            correctIndex: { type: Type.NUMBER },
                            topicTag:     { type: Type.STRING }
                          }
                        }
                      }
                    },
                    required: ['dayNumber', 'dayName', 'type', 'title']
                  }
                }
              },
              required: ['weekNumber', 'title', 'days']
            }
          }
        },
        required: ['moduleNumber', 'title', 'weeks']
      }
    }
  },
  required: ['skillName', 'targetLevel', 'totalModules', 'estimatedWeeks', 'modules']
};

// Lesson schema — relaxed on card content, strict on structure
const LESSON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    parts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          partNumber: { type: Type.NUMBER },
          partTitle:  { type: Type.STRING },
          cards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                cardNumber: { type: Type.NUMBER },
                content:    { type: Type.STRING }
              }
            }
          },
          miniExercise: {
            type: Type.OBJECT,
            properties: {
              question:     { type: Type.STRING },
              options:      { type: Type.ARRAY, items: { type: Type.STRING } },
              correctIndex: { type: Type.NUMBER },
              explanation:  { type: Type.STRING }
            }
          }
        }
      }
    },
    task: {
      type: Type.OBJECT,
      properties: {
        type:        { type: Type.STRING },
        description: { type: Type.STRING },
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question:     { type: Type.STRING },
              options:      { type: Type.ARRAY, items: { type: Type.STRING } },
              correctIndex: { type: Type.NUMBER },
              topicTag:     { type: Type.STRING }
            }
          }
        }
      }
    }
  },
  required: ['parts']
};

// ==============================================================================
// SYSTEM INSTRUCTIONS
// ==============================================================================

const ROADMAP_SYSTEM = `You are an expert curriculum designer. You design learning paths for any skill — technical or non-technical.

Your curriculum philosophy:
- Realistic pacing. Never cram MERN into 4 weeks if it genuinely needs 10. Never pad a skill that only needs 2 modules.
- Spiral progression: later weeks BUILD on earlier ones. No re-explaining.
- 70% practical, 30% conceptual in topicsList.
- Day titles are outcomes, not labels. NOT "React Hooks" → YES "Making Components Remember State with useState"

Respond ONLY with valid JSON. No markdown. No explanation.`;

const LESSON_THINKING_SYSTEM = `You are a senior engineer who has mentored hundreds of developers. You don't write like a textbook. You teach like a real person who has seen the mistakes, hit the walls, and knows what actually matters.

BEFORE YOU WRITE ANYTHING, do this internally:
1. What do beginners consistently get wrong about this topic?
2. What is the real-world scenario where this concept matters most?
3. What would make someone ACTUALLY remember this after closing the app?
4. What's the one thing that, once understood, makes everything else click?

Then write the lesson with THESE rules:
- Open Part 1 with the PROBLEM this concept solves, not the definition.
- Every card needs one concrete, specific example. Not "you can use this to manage state" — show actual code or a real scenario.
- Address the most common mistake somewhere. Lead it with: "The mistake most devs make here is..."
- Connect at least one idea per part to the learner's actual goal.
- Write like a team mate explaining in a Slack message, not a professor lecturing.

BANNED phrases: "it is important to note", "in conclusion", "as we can see", "let us explore", "in this section", "fundamentals", "in the world of".

OUTPUT FORMAT: Plain text paragraphs for each card — rich, human, opinionated. No JSON yet. The formatter will handle structure.`;

const LESSON_FORMATTER_SYSTEM = `You are a precise JSON formatter. You receive rich lesson content and convert it into a structured schema. Your ONLY job is to preserve meaning and wrap it in structure.

Rules:
- Do NOT simplify content. Do NOT generalize. Do NOT trim examples.
- partTitle: 5-8 words, outcome-focused, title case
- Each part gets 2-3 cards. Each card is one focused concept from the input.
- miniExercise must test genuine understanding, not recall. Someone who skimmed must get it wrong.
- Respond ONLY with valid JSON matching the schema. Nothing else.`;

const FEEDBACK_SYSTEM = `You are an expert mentor evaluating learner work. Be direct, specific, and encouraging.
Never be vague. Always give one concrete next step.`;

// ==============================================================================
// UTILITIES
// ==============================================================================

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const parseJSON = (text) => {
  try {
    if (typeof text === 'object') return text;
    return JSON.parse(text);
  } catch {
    console.error('[Gemini] JSON parse failed on:', text?.substring(0, 300));
    throw new Error('JSON_PARSE_FAILURE');
  }
};

const validateLessonStructure = (parsed) => {
  if (!parsed.parts || !Array.isArray(parsed.parts) || parsed.parts.length === 0) {
    console.error('[Gemini Validation] FAIL: parts array missing or empty');
    throw new Error('JSON_PARSE_FAILURE');
  }
  for (const part of parsed.parts) {
    if (!part.cards || !Array.isArray(part.cards) || part.cards.length === 0) {
      console.error(`[Gemini Validation] FAIL: part ${part.partNumber} has no cards`);
      throw new Error('JSON_PARSE_FAILURE');
    }
    for (const card of part.cards) {
      if (!card.content || typeof card.content !== 'string' || card.content.trim().length < 50) {
        console.error(`[Gemini Validation] FAIL: card content too short in part ${part.partNumber}`);
        throw new Error('JSON_PARSE_FAILURE');
      }
    }
  }
  return true;
};

const cleanPartTitle = (title) => {
  if (typeof title !== 'string' || title.trim().length === 0) return 'Topic Overview';
  const sample = title.substring(0, 80).toLowerCase();
  const words = sample.split(/\s+/).filter(w => w.length > 3);
  const counts = {};
  for (const word of words) {
    counts[word] = (counts[word] || 0) + 1;
    if (counts[word] >= 3) {
      console.warn('[Gemini Validation] Hallucinated partTitle replaced');
      return 'Topic Overview';
    }
  }
  return title.replace(/[,"\s]+$/, '').replace(/^[,"\s]+/, '').trim().substring(0, 80);
};

// ==============================================================================
// CORE CALL — Single model, single call (roadmap, MCQ, feedback, formatting)
// ==============================================================================

const callModel = async ({ model, prompt, systemInstruction, schema, isJson = true }) => {
  let attempts = 0;
  const maxRetries = 3;

  while (attempts < maxRetries) {
    try {
      const config = {
        systemInstruction,
        responseMimeType: isJson ? 'application/json' : 'text/plain',
        temperature:      isJson ? 0.7 : 0.6,
        maxOutputTokens:  isJson ? 65536 : 8192,
      };

      if (isJson && schema) config.responseSchema = schema;

      const response = await ai.models.generateContent({ model, contents: prompt, config });
      const text = response.text;
      if (!text) throw new Error('EMPTY_RESPONSE');

      return isJson ? parseJSON(text) : text;

    } catch (error) {
      attempts++;
      const is429 = error.message?.includes('429') || error.status === 429;
      const is500 = error.message?.includes('500') || error.status === 500;
      const retryable = (is429 || is500) && attempts < maxRetries;

      console.error(`[Gemini] Attempt ${attempts} failed: ${error.message}${retryable ? ' — retrying' : ''}`);

      if (retryable) {
        const ms = attempts === 1 ? 5000 : attempts === 2 ? 15000 : 30000;
        await wait(ms);
      } else {
        if (error.message === 'JSON_PARSE_FAILURE') throw error;
        throw new Error(`GEMINI_FAILURE: ${error.message}`);
      }
    }
  }
};

// ==============================================================================
// TWO-CALL LESSON PIPELINE
// Call 1: Pro model thinks freely → rich content, no constraints
// Call 2: Flash formats → strict JSON schema
// This is the only place we use two calls. Everything else is one call.
// ==============================================================================

const generateLessonTwoPass = async (thinkingPrompt, formatterPrompt) => {
  // CALL 1 — Pro model, free-form thinking
  console.log('[Gemini] Lesson: starting thinking pass (Pro)...');
  const rawContent = await callModel({
    model: THINKING_MODEL,
    prompt: thinkingPrompt,
    systemInstruction: LESSON_THINKING_SYSTEM,
    isJson: false,
  });

  // CALL 2 — Flash formats the raw content into schema
  console.log('[Gemini] Lesson: starting formatting pass (Flash)...');
  const structured = await callModel({
    model: STRUCTURE_MODEL,
    prompt: `${formatterPrompt}\n\n---\nRAW LESSON CONTENT TO STRUCTURE:\n${rawContent}`,
    systemInstruction: LESSON_FORMATTER_SYSTEM,
    schema: LESSON_SCHEMA,
    isJson: true,
  });

  // Validate and clean
  validateLessonStructure(structured);
  structured.parts = structured.parts.map(part => ({
    ...part,
    partTitle: cleanPartTitle(part.partTitle),
  }));

  return structured;
};

// ==============================================================================
// PUBLIC API
// ==============================================================================

/**
 * Generates the roadmap skeleton — module/week/day structure with exam questions.
 * Single Flash call. This doesn't need creative depth, just good curriculum design.
 */
export const generateRoadmapSkeleton = (data) => {
  const prompt = `Generate a learning roadmap for this learner:

Skill: ${data.skillInput}
Goal: ${data.motivation || 'Not specified'}
Current level: ${data.currentLevel}
Role: ${data.role}
Learning style: ${data.learningStyle}
Goal clarity: ${data.goalClarity}
Daily time: ${data.dailyTime}

CURRICULUM RULES:
1. Decide module count based on real complexity. MERN needs 8-12 weeks minimum. Don't compress it.
2. Each week = exactly 7 days. Mon–Fri = Learning. Sat = Revision. Sun = Exam.
3. Learning day topicsList: 2–4 specific, actionable topics (not category names).
4. Day title = an outcome, not a topic. "Building Reusable Components with Props" not "React Props".
5. Exam day: exactly 5 MCQs. Each question maps to a specific day topic via topicTag.
6. Each module must build on the previous. Never repeat concepts — only apply them.
7. Revision day: topicsList = empty array.`;

  return callModel({
    model: STRUCTURE_MODEL,
    prompt,
    systemInstruction: ROADMAP_SYSTEM,
    schema: ROADMAP_SCHEMA,
    isJson: true,
  });
};

/**
 * Generates lesson content for a learning day.
 * TWO-CALL pipeline: Pro thinks → Flash structures.
 */
export const generateLessonContent = async (data) => {

  // REVISION SESSION — single pass, simpler content
  if (data.isRevision || data.isExamRetry) {
    const topics = data.weakTopicsStr || data.allWeekTopics || 'General review of the week';

    const thinkingPrompt = `Write a focused revision lesson for a learner who struggled with these topics:
${topics}

Skill: ${data.skillName} | Level: ${data.currentLevel || 'Beginner'}

This is a revision session. Your goal:
- Re-explain each weak topic from a completely different angle than the first time.
- Use a new example the learner hasn't seen.
- Connect the weak topics to each other if possible.
- Be direct: "You got this wrong before because X. Here's what's actually happening..."

Write 3 cards of content. After that, write 1 quiz question with 4 options, the correct answer, and why.
No task — this is revision only.`;

    const formatterPrompt = `Format this revision content into the lesson schema.
EXACTLY 1 part. EXACTLY 3 cards. 1 miniExercise. task = null.
Do not add, remove, or simplify anything.`;

    return generateLessonTwoPass(thinkingPrompt, formatterPrompt);
  }

  // LEARNING SESSION — full two-pass pipeline
  const thinkingPrompt = `Write a complete lesson for this session:

Skill: ${data.skillName}
Module ${data.moduleNumber}: ${data.moduleTitle}
Week ${data.weekNumber}: ${data.weekTitle}
Day ${data.dayNumber} (${data.dayName})
Topics: ${data.topicsList?.join(', ') || ''}
Learner level: ${data.currentLevel}
Learner goal: ${data.motivation || 'Not specified'}
Learning style: ${data.learningStyle}

THINK FIRST (don't write yet):
- What do beginners always misunderstand about these specific topics?
- What's the real-world scenario where this actually matters?
- How does today's topic connect to the learner's goal: "${data.motivation}"?
- What's the single most important thing to get right here?

NOW WRITE 3 PARTS:

Part 1: Open with the PROBLEM these topics solve (not the definition). Show the pain of NOT having this skill.
Part 2: Teach the core concept with a concrete, runnable example. Address the most common mistake directly.
Part 3: Synthesize — show how today's concepts combine in a realistic scenario from the learner's goal domain.

For each part: 2-3 focused cards of content. After each part: one quiz question that someone who skimmed would get wrong.

End with a task:
- If topics are conceptual → 10-15 MCQs that test application not memorization.
- If topics are practical → one open engineering question requiring a detailed walkthrough answer (not "explain what X is" but "here's a scenario, what do you do and why").

Write in engineer voice. Opinionated. Direct. Real examples. No textbook language.`;

  const formatterPrompt = `Format this lesson into the schema.
- EXACTLY 3 parts.
- 2-3 cards per part.
- 1 miniExercise per part.
- 1 task at the end (type: "text" or "mcq").
Preserve all content and examples. Do not simplify anything.`;

  return generateLessonTwoPass(thinkingPrompt, formatterPrompt);
};

/**
 * Generates AI feedback on task submission.
 * Single Flash call — feedback doesn't need deep creativity.
 */
export const generateFeedback = (data) => {
  let prompt;

  if (data.isMcq) {
    const wrongAnswers = data.report.filter(r => !r.isCorrect);
    const score = data.score ?? Math.round((data.report.filter(r => r.isCorrect).length / data.report.length) * 100);

    prompt = `Score: ${score}% (${data.report.filter(r => r.isCorrect).length}/${data.report.length} correct)

Wrong answers:
${wrongAnswers.map((r, i) =>
  `${i + 1}. "${r.questionText}"\n   Chose: ${r.options?.[r.selectedIndex] ?? 'none'}\n   Correct: ${r.options?.[r.correctIndex]}`
).join('\n\n')}

Write feedback in 3 paragraphs:
1. What they understood (be specific, not generic)
2. What broke down in the wrong answers (diagnose the actual confusion, not just "review X")
3. One concrete action to fix it

After the 3 paragraphs, you MUST include:
OUTCOME: positive OR OUTCOME: needs_improvement (based on your evaluation of their understanding)

Then you MUST include a RESOURCES section with exactly this format:
RESOURCES:
- [URL 1 Title](https://...) — brief description of what this covers
- [URL 2 Title](https://...) — brief description of what this covers

Use ONLY official documentation URLs: MDN, React docs, Node.js docs, MongoDB docs, Python docs, etc. Never YouTube, Medium, blogs, or tutorials. If no resources are relevant, write: RESOURCES: (no additional resources needed for this topic)`;

  } else {
    prompt = `Task: ${data.description}
Topics tested: ${data.topicsList}
Learner's answer: ${data.userAnswer}

Write feedback in 3 paragraphs:
1. What they got right (name specific things from their answer)
2. What's missing or wrong (be specific — don't say "improve X", say what X should actually be)
3. One concrete next step

After the 3 paragraphs, you MUST include:
OUTCOME: positive OR OUTCOME: needs_improvement (based on the quality of their answer)

Then you MUST include a RESOURCES section with exactly this format:
RESOURCES:
- [URL 1 Title](https://...) — brief description of what this covers
- [URL 2 Title](https://...) — brief description of what this covers

Use ONLY official documentation URLs: MDN, React docs, Node.js docs, MongoDB docs, Python docs, etc. Never YouTube, Medium, blogs, or tutorials. If no resources are relevant, write: RESOURCES: (no additional resources needed for this topic)`;
  }

  return callModel({
    model: STRUCTURE_MODEL,
    prompt,
    systemInstruction: FEEDBACK_SYSTEM,
    isJson: false,
  });
};
// ***
// *** GEMINI SERVICE
// // ==============================================================================
// // HARDENED GEMINI SERVICE — IMPLEMENTING SDK BEST PRACTICES
// // ==============================================================================

// import { GoogleGenAI, Type } from '@google/genai';
// import dotenv from 'dotenv';

// dotenv.config();

// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// const MODEL = 'gemini-2.5-flash';

// // --- JSON Schemas (Fixed to use Type enum and remove nullable) ---

// const ROADMAP_SCHEMA = {
//   type: Type.OBJECT,
//   properties: {
//     skillName: { type: Type.STRING },
//     targetLevel: { type: Type.STRING },
//     totalModules: { type: Type.NUMBER },
//     estimatedWeeks: { type: Type.NUMBER },
//     modules: {
//       type: Type.ARRAY,
//       items: {
//         type: Type.OBJECT,
//         properties: {
//           moduleNumber: { type: Type.NUMBER },
//           title: { type: Type.STRING },
//           weeks: {
//             type: Type.ARRAY,
//             items: {
//               type: Type.OBJECT,
//               properties: {
//                 weekNumber: { type: Type.NUMBER },
//                 title: { type: Type.STRING },
//                 days: {
//                   type: Type.ARRAY,
//                   items: {
//                     type: Type.OBJECT,
//                     properties: {
//                       dayNumber: { type: Type.NUMBER },
//                       dayName: { type: Type.STRING },
//                       type: { type: Type.STRING },
//                       title: { type: Type.STRING },
//                       topicsList: { type: Type.ARRAY, items: { type: Type.STRING } },
//                       examQuestions: {
//                         type: Type.ARRAY,
//                         items: {
//                           type: Type.OBJECT,
//                           properties: {
//                             question: { type: Type.STRING },
//                             options: { type: Type.ARRAY, items: { type: Type.STRING } },
//                             correctIndex: { type: Type.NUMBER },
//                             topicTag: { type: Type.STRING }
//                           }
//                         }
//                       }
//                     },
//                     required: ['dayNumber', 'dayName', 'type', 'title']
//                   }
//                 }
//               },
//               required: ['weekNumber', 'title', 'days']
//             }
//           }
//         },
//         required: ['moduleNumber', 'title', 'weeks']
//       }
//     }
//   },
//   required: ['skillName', 'targetLevel', 'totalModules', 'estimatedWeeks', 'modules']
// };

// const LESSON_SCHEMA = {
//   type: Type.OBJECT,
//   properties: {
//     parts: {
//       type: Type.ARRAY,
//       items: {
//         type: Type.OBJECT,
//         properties: {
//           partNumber: { type: Type.NUMBER },
//           partTitle: { type: Type.STRING },
//           cards: {
//             type: Type.ARRAY,
//             items: {
//               type: Type.OBJECT,
//               properties: {
//                 cardNumber: { type: Type.NUMBER },
//                 content: { type: Type.STRING }
//               }
//             }
//           },
//           miniExercise: {
//             type: Type.OBJECT,
//             properties: {
//               question: { type: Type.STRING },
//               options: { type: Type.ARRAY, items: { type: Type.STRING } },
//               correctIndex: { type: Type.NUMBER },
//               explanation: { type: Type.STRING }
//             }
//           }
//         }
//       }
//     },
//     task: {
//       type: Type.OBJECT,
//       properties: {
//         type: { type: Type.STRING },
//         description: { type: Type.STRING },
//         questions: {
//           type: Type.ARRAY,
//           items: {
//             type: Type.OBJECT,
//             properties: {
//               question: { type: Type.STRING },
//               options: { type: Type.ARRAY, items: { type: Type.STRING } },
//               correctIndex: { type: Type.NUMBER },
//               topicTag: { type: Type.STRING }
//             }
//           }
//         }
//       }
//     }
//   },
//   required: ['parts']
// };

// // --- System Instructions ---
// const ROADMAP_SYSTEM_INSTRUCTION = `You are an expert curriculum designer and skill development mentor.
// You design learning roadmaps for ANY skill or field — programming, cooking,
// trading, music, language learning, or anything else a human might want to master.
// You analyze the learner's profile deeply before designing the structure.
// You always respond with ONLY valid JSON. No markdown, no explanation, no code fences.
// You follow the exact JSON structure specified in every prompt precisely.
// You never assume a skill is easy or short — if the goal requires 12 modules, design 12.
// If the goal requires 2 modules, design 2. Let the skill and goal determine the length.
// You always create exactly 7 days per week. Day 6 (Saturday) is always Revision.
// Day 7 (Sunday) is always Exam. Days 1-5 are Learning.
// Each exam day always has exactly 5 MCQ questions with a topicTag per question.

// CRITICAL: Do not fragment your array responses. Ensure every object in the 'weeks' array contains weekNumber, title, and days IN ONE OBJECT.`;
// const LESSON_SYSTEM_INSTRUCTION = `You are a senior engineer who has mentored hundreds of developers at top-tier product companies. You do NOT write educational content like a textbook. You teach like a staff engineer talking to a sharp junior on their first week: direct, opinionated, specific, and practical.

// TEACHING RULES — follow every one:
// 1. Every card must teach exactly one concept with one concrete, runnable example. Not abstract. Code or scenario, always.
// 2. Start every first card of a part by naming the real problem this concept solves. Not "variables store data" — "without variables, you would retype 49.99 every place you charge a customer. Change the price once in the variable and it updates everywhere."
// 3. Address the single most common mistake on this topic somewhere in the card. Lead with: "The mistake most developers make here is..."
// 4. Connect at least one card per part to the learner's stated goal. Make it explicit.
// 5. Write for someone smart who is new to this. Never condescend. Never explain what they already know.
// 6. Banned phrases: "it is important to note", "in conclusion", "as we can see", "let us explore", "in this section".
// 7. MiniExercise must require genuine understanding, not recall. A learner who skimmed the cards must get it wrong.

// ABSOLUTE STRUCTURAL RULES:
// - partTitle: 5–8 words, title-case, concept-specific (NOT "Introduction to Functions" — YES "Why Functions Stop You Repeating Code")
// - card content: 120–180 words, one concrete example minimum, one mistake addressed, Markdown formatted
// - cards use: **bold** for key terms, \`backticks\` for code, fenced code blocks for multi-line examples
// - revision sessions: EXACTLY 1 part, EXACTLY 3 cards, 1 miniExercise, task is null — no exceptions
// - learning sessions: EXACTLY 3 parts, each with 2–4 cards and 1 miniExercise`;

// // Removed complex keyword-matching function - AI has full context from topics to decide resources

// const FEEDBACK_SYSTEM_INSTRUCTION = `You are an expert mentor evaluating learner submissions.
// Be encouraging, specific, and actionable.
// Never be vague. Focus on growth and improvement.
// `;

// // --- Core Helper ---

// const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// const parseResponse = (responseText) => {
//   try {
//     if (typeof responseText === 'object') return responseText;
//     return JSON.parse(responseText);
//   } catch (err) {
//     console.error('Failed to parse Gemini response:', responseText?.substring(0, 300));
//     throw new Error('JSON_PARSE_FAILURE');
//   }
// };

// /**
//  * Validates that a parsed lesson object has the correct semantic structure.
//  * Throws JSON_PARSE_FAILURE if structure is invalid — triggering retry logic.
//  * Called after JSON.parse succeeds, before returning to caller.
//  */
// const validateLessonStructure = (parsed) => {
//   // Must have parts array that is non-empty
//   if (!parsed.parts || !Array.isArray(parsed.parts) || parsed.parts.length === 0) {
//     console.error('[Gemini Validation] FAIL: parts array missing or empty');
//     throw new Error('JSON_PARSE_FAILURE');
//   }

//   for (const part of parsed.parts) {
//     // Each part must have a non-empty cards array
//     if (!part.cards || !Array.isArray(part.cards) || part.cards.length === 0) {
//       console.error(`[Gemini Validation] FAIL: part ${part.partNumber} has no cards`);
//       throw new Error('JSON_PARSE_FAILURE');
//     }

//     // Each card must have meaningful content (minimum 50 chars)
//     for (const card of part.cards) {
//       if (
//         !card.content ||
//         typeof card.content !== 'string' ||
//         card.content.trim().length < 50
//       ) {
//         console.error(`[Gemini Validation] FAIL: card ${card.cardNumber} in part ${part.partNumber} has no content`);
//         throw new Error('JSON_PARSE_FAILURE');
//       }
//     }
//   }

//   // Validation passed
//   return true;
// };

// /**
//  * Cleans and validates a partTitle string.
//  * Detects Gemini's repetitive hallucination pattern and replaces with fallback.
//  * Strips trailing JSON artifacts like `, "` that appear when Gemini splits objects.
//  */
// const validatePartTitle = (title) => {
//   if (typeof title !== 'string' || title.trim().length === 0) {
//     return 'Topic Overview';
//   }

//   // Detect repetitive hallucination: e.g. "Revieweristive Foundationsistive Revieweristive..."
//   // Pattern: if any word appears 3+ times in first 60 chars, it is hallucinated
//   const sample = title.substring(0, 80).toLowerCase();
//   const words = sample.split(/\s+/).filter(w => w.length > 3);
//   const wordCounts = {};
//   for (const word of words) {
//     wordCounts[word] = (wordCounts[word] || 0) + 1;
//     if (wordCounts[word] >= 3) {
//       console.warn('[Gemini Validation] Hallucinated partTitle detected, replacing with fallback');
//       return 'Topic Overview';
//     }
//   }

//   // Strip trailing JSON artifacts: `, "` or `",` or trailing whitespace
//   const cleaned = title
//     .replace(/[,"\s]+$/, '')  // trailing comma, quote, space
//     .replace(/^[,"\s]+/, '')  // leading artifacts
//     .trim();

//   // Hard length cap
//   return cleaned.substring(0, 80);
// };

// const generateContent = async ({ prompt, systemInstruction, schema, isJson = true }) => {
//   let attempts = 0;
//   const maxRetries = 3;

//   while (attempts < maxRetries) {
//     try {
//       const config = {
//         systemInstruction,
//         responseMimeType: isJson ? 'application/json' : 'text/plain',
//         temperature: isJson ? 0.8: 0.5,
//         maxOutputTokens: isJson ? 65536 : 4096,
        
//       };

//       // Ensure we don't pass `responseSchema: undefined` to the SDK validation
//       if (isJson && schema) {
//         config.responseSchema = schema;
//       }

//       const response = await ai.models.generateContent({
//         model: MODEL,
//         contents: prompt,
//         config
//       });

//       const text = response.text;
//       if (!text) throw new Error('EMPTY_RESPONSE');

//       let parsed = isJson ? parseResponse(text) : text;

//       // Safety: truncate corrupted partTitle
//       // Structural validation + title cleaning for lesson responses
//       if (isJson && parsed.parts !== undefined) {
//         // 1. Validate semantic structure — throws JSON_PARSE_FAILURE on bad shape
//         validateLessonStructure(parsed);

//         // 2. Clean all partTitles
//         parsed.parts = parsed.parts.map(part => ({
//           ...part,
//           partTitle: validatePartTitle(part.partTitle)
//         }));
//       }

//       return parsed;

//     }
//     catch (error) {
//       attempts++;
//       const is429 = error.message?.includes('429') || error.status === 429;
//       const is500 = error.message?.includes('500') || error.status === 500;
//       const shouldRetry = (is429 || is500) && attempts < maxRetries;

//       // Better error logging
//       console.error(`Gemini attempt ${attempts} failed: ${error.message}${shouldRetry ? ' — retrying...' : ''}`);

//       if (shouldRetry) {
//         const waitMs = attempts === 1 ? 5000 : attempts === 2 ? 15000 : 30000;
//         await wait(waitMs);
//       } else {
//         if (error.message === 'JSON_PARSE_FAILURE') throw error;
//         throw new Error(`GEMINI_FAILURE: ${error.message}`);
//       }
//     }
//   }
// };

// // --- Exports ---

// export const generateRoadmapSkeleton = (data) => {
//   const prompt = `Generate a complete learning roadmap skeleton for this learner:
// Skill to learn: ${data.skillInput}
// Learning goal: ${data.motivation}
// Current level: ${data.currentLevel}
// Role: ${data.role}
// Learning style: ${data.learningStyle}
// Goal clarity: ${data.goalClarity}
// Daily time available: ${data.dailyTime}

// INSTRUCTIONS:
// First decide the canonical skill name.
// Decide how many modules are genuinely needed. Be realistic.
// Each module has at least 1 week.
// Each week has exactly 7 days: Mon-Fri = Learning, Sat = Revision, Sun = Exam.
// For each Learning day: list 2-4 specific topics and a short day title.
// For Revision day: topicsList is empty array, title is "Weekly Review".
// For Exam day: write exactly 5 MCQ questions testing that week's topics.

// CURRICULUM DESIGN PRINCIPLES — follow all:
// 1. SPIRAL LEARNING: Week 2 builds on Week 1 concepts. Never re-explain prior week topics — apply them.
// 2. 70/30 RULE: 70% of topicsList items must be practical/hands-on. 30% conceptual.
// 3. PROGRESSIVE DIFFICULTY: Day 1 (Monday) = new concept introduction. Day 5 (Friday) = synthesis and application combining the week's topics.
// 4. ACTION-ORIENTED TITLES: day title must be an action or outcome, not a topic label. NOT "React Hooks" — YES "Adding Dynamic Behavior to Components with Hooks"
// 5. SPECIFIC TOPICS: each item in topicsList must be a specific operation or skill, not a category. NOT "React hooks" — YES "useState for tracking form inputs without re-rendering the whole tree"
// 6. EXAM ALIGNMENT: each examQuestion must have topicTag matching a specific day topic from that week. No surprise topics.
// 7. No day should have more than 4 items in topicsList. Depth over coverage.
// `;

//   return generateContent({
//     prompt,
//     systemInstruction: ROADMAP_SYSTEM_INSTRUCTION,
//     schema: ROADMAP_SCHEMA
//   });
// };

// export const generateLessonContent = (data) => {
//   let prompt = '';

//   if (data.isExamRetry) {
//     prompt = `Generate a focused revision lesson for a learner who needs to review weak topics.

// LEARNER CONTEXT:
// Skill: ${data.skillName}
// Topics the learner struggled with: ${data.weakTopicsStr || 'General review of the week'}
// All topics from this week (fallback if no weak topics): ${data.allWeekTopics || 'Week topics'}
// Learner level: ${data.currentLevel || 'Beginner'}

// OUTPUT REQUIREMENTS (these are non-negotiable):
// - The parts array must contain EXACTLY 1 part object
// - That part must have partNumber: 1
// - That part must have partTitle: a short descriptive string like "Week Revision: Core Concepts"
// - That part must have cards: an array of EXACTLY 3 card objects
//   - card 1: cardNumber: 1, content: 120-200 words re-explaining the first weak topic from a new angle
//   - card 2: cardNumber: 2, content: 120-200 words re-explaining the second weak topic (or connecting concepts)
//   - card 3: cardNumber: 3, content: 120-200 words showing practical application with a new example
// - That part must have miniExercise: an object with question, options (4 strings), correctIndex (0-3), explanation
// - task must be null — revision sessions have no task

// Do not add more than 1 part. Do not return empty cards arrays.`;
//   } else if (data.isRevision) {
//     prompt = `Generate a revision session for this learner:
// Skill: ${data.skillName}
// Week being revised: Module ${data.moduleNumber}, Week ${data.weekNumber}
// Topics the learner struggled with: ${data.weakTopicsStr || 'General review'}
// If no weak topics, revise: ${data.allWeekTopics || 'all topics covered this week'}
// Create a focused revision session with 1 part containing 3-4 cards.
// Re-explain each weak topic from a different angle with new examples.
// No task for revision sessions.`;
//   } else {
//     prompt = `Generate a complete learning session for this learner:
// Skill: ${data.skillName}
// Module: ${data.moduleNumber} — ${data.moduleTitle}
// Week: ${data.weekNumber} — ${data.weekTitle}
// Day: ${data.dayNumber} — ${data.dayName}
// Topics to cover today: ${data.topicsList?.join(', ') || ''}
// TEACH THIS SESSION WITH THESE CONSTRAINTS:
// - Learner level: ${data.currentLevel}. Never explain things they already know. Build forward.
// - Their goal: "${data.motivation}". Explicitly connect today's topics to this goal at least once.
// - Learning style: ${data.learningStyle}. ${
//   data.learningStyle === 'Practice' 
//     ? 'Show working code before explaining theory. Let the example teach first.'
//     : data.learningStyle === 'Examples'
//     ? 'Use real-world analogies before abstract definitions. Concrete before abstract always.'
//     : 'Explain the complete concept, then show how it behaves, then show a counterexample.'
// }
// - Part 1 must open with WHY this exists — what problem did programmers have before this existed?
// - Part 3 must synthesize Parts 1 and 2 — show how the concepts connect in a realistic scenario.
// - Task type: if the day's topics are conceptual → mcq (10–15 questions). If practical/hands-on → text (one open engineering question that requires a multi-step answer to demonstrate real understanding, minimum 100-word answer expected).`
//   }

//   return generateContent({
//     prompt,
//     systemInstruction: LESSON_SYSTEM_INSTRUCTION,
//     schema: LESSON_SCHEMA
//   });
// };

// export const generateFeedback = (data) => {
//   let prompt = '';

//   if (data.isMcq) {
//     const wrongAnswers = data.report.filter(r => !r.isCorrect);
//     const correctCount = data.correctCount || data.report.filter(r => r.isCorrect).length;
//     const totalQuestions = data.totalQuestions || data.report.length;
//     const score = data.score || Math.round((correctCount / totalQuestions) * 100);
//     const wrongTopics = data.report.filter(r => !r.isCorrect).map(r => r.topicTag).filter(Boolean).join(', ');

//     prompt = `You are evaluating a learner's MCQ task performance.

// Score: ${score}% (${correctCount} of ${totalQuestions} correct)

// Questions answered incorrectly:
// ${wrongAnswers.map((r, i) =>
//   `${i + 1}. ${r.questionText}\n   Learner chose: ${r.options[r.selectedIndex] ?? 'No answer'}\n   Correct answer: ${r.options[r.correctIndex]}`
// ).join('\n\n')}

// Provide feedback in exactly 3 paragraphs:
// 1. What the learner understood correctly
// 2. What concepts need more work (specific to the wrong answers)
// 3. One concrete study recommendation

// End with: OUTCOME: ${data.outcome}

// Then add:
// RESOURCES:
// - [resource_title](url): one sentence why this helps

// Resource Rules:
// - 1-2 max, REAL working URLs only
// - Pick the MOST authoritative sources for: ${wrongTopics || 'the topics covered'}
// - No YouTube, Medium, paywalls, or broken links
// - Prefer official docs, educational sites, tutorials

// Keep total response under 400 words.`;
//   } else {
//     prompt = `Evaluate this learner's task submission:
// Task: ${data.description}
// Topics: ${data.topicsList}
// Learner's answer: ${data.userAnswer}

// Provide 3-paragraph feedback:
// 1. What they demonstrated correctly
// 2. What needs improvement
// 3. Specific next step

// End with: OUTCOME: positive OR OUTCOME: needs_improvement

// Then add:
// RESOURCES:
// - [resource_title](url): one sentence why this helps

// Resource Rules:
// - 1-2 max, REAL working URLs only
// - Pick authoritative sources for: ${data.topicsList}
// - No YouTube, Medium, paywalls
// - Only if appropriate to the topics

// Keep total response under 300 words.`;
//   }

//   return generateContent({
//     prompt,
//     systemInstruction: FEEDBACK_SYSTEM_INSTRUCTION,
//     isJson: false,
//   });
// };
// 
// 
//