/*==============================================================================
SKILL MASTER — AI SERVICE v4 (OpenAI — Mentor-Driven, Semantically-Sized)
Replaces ai.service.js v3. Same provider (OpenAI), same exports, same signatures.
Zero controller changes required — this is a prompt-quality and code-quality
rewrite, not a provider migration.

WHAT CHANGED FROM v3, AND WHY
------------------------------------------------------------------------------
1. MENTOR-DRIVEN GENERATION, NOT TEMPLATE-FILLING.
   Both the lesson pipeline and the roadmap generator now run the same
   reasoning discipline used in this codebase's engineering-mentor teaching
   process: analyze the real objective and the learner's actual stated goal,
   classify what KIND of content this is (concept / tool / architecture /
   debugging / workflow / judgment-call), and let that classification pick
   the teaching shape — instead of forcing every lesson through one fixed
   3-part / 2-3-card template regardless of what the topic actually needs.

2. SEMANTIC SIZING, NOT FIXED COUNTS.
   Previous versions hardcoded "EXACTLY 3 parts", "2-3 cards per part",
   "10-15 MCQs". None of that is enforced by the JSON Schema itself — arrays
   were always open-length — the rigidity was entirely in the PROMPT. That
   rigidity is removed here. Part count, card count, and end-of-lesson
   question count are now OUTPUTS of the mentor's reasoning about what a
   given topic actually requires, not INPUTS forced onto every topic. A
   simple mental model gets a short, tight part; a genuine multi-piece
   architecture gets more room. Light guardrails remain only to prevent
   degenerate output (a 20-part lesson, a single 4000-word card) — they are
   safety ceilings, not targets.

3. MARKDOWN-NATIVE CONTENT.
   The frontend now renders markdown (react-markdown + Tailwind Typography).
   Card content, task descriptions, and feedback text are written with
   markdown syntax (bold, inline code, fenced code blocks, bullet lists)
   where it genuinely aids clarity — code is no longer flattened into prose.

4. MASTERY ARCHITECTURE, NOT DECORATIVE QUIZZES.
   Every part's miniExercise must test judgment/reasoning against a
   realistic scenario, never bare recall of a definition. The end-of-lesson
   task is a genuine mastery task — a concrete, self-directed challenge that
   exercises the day's competency the way a real engineering situation
   would, never something answerable by pattern-matching wording back at
   the lesson text.

5. ROADMAP GENERATION UPGRADED TO gpt-4.1 (was gpt-4.1-mini in v3).
   Roadmap generation is a single call, but it happens exactly once per user
   and its output shapes every day of their entire journey — a bad roadmap
   is a bad product experience with no opportunity for the day-to-day
   generation quality to compensate. That leverage justifies the stronger
   model even without a second (formatting) pass. Two-pass is still NOT used
   for roadmaps: curriculum architecture is structural/evaluative reasoning,
   not prose craftsmanship, so the quality gain from splitting reasoning and
   formatting into separate calls is far smaller here than it is for
   lessons — the cost of a second call is not justified by the return.

6. ONE SHARED RETRY/BACKOFF CORE (withRetry). v3 duplicated the retry loop
   almost identically between the free-text call and the structured call.
   Both now wrap a single `withRetry()` helper — the only thing that differs
   between them is the OpenAI request shape and how the response is parsed.

EXPORTS (unchanged signatures — zero controller changes):
  generateRoadmapSkeleton(data) → roadmapJson
  generateLessonContent(data)   → { competencyGoal, parts, task }
  generateFeedback(data)        → string (OUTCOME: / RESOURCES: sections)

REQUIRED ENV VAR: OPENAI_API_KEY
==============================================================================*/

import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ==============================================================================
// CONFIG — every tunable constant lives here, not scattered through the file.
// ==============================================================================

const MODELS = {
  THINKING: 'gpt-4.1',        // lesson reasoning pass — free-form, no schema
  STRUCTURE: 'gpt-4.1-mini',  // lesson formatting pass — schema-locked repackaging
  ROADMAP: 'gpt-4.1',         // single combined call, strong model (see header note #5)
  FEEDBACK: 'gpt-4.1-mini'    // frequent, short-form, evaluative — mini is sufficient
};

const RETRY = {
  MAX_ATTEMPTS: 3,
  BACKOFF_MS: [5000, 15000, 30000] // attempt 1 / 2 / 3 wait times
};

const MAX_TOKENS = {
  LESSON_THINKING: 5000,   // raw reasoning + prose — content is semantically sized, not capped small
  LESSON_STRUCTURE: 9000,  // must comfortably fit a longer-than-average lesson without truncating
  ROADMAP: 9000,
  FEEDBACK: 1024
};

// ==============================================================================
// JSON SCHEMAS (OpenAI Structured Outputs, strict mode)
// Strict mode requires additionalProperties:false on every object and every
// property listed in "required" (use nullable types for conceptually-optional
// fields rather than omitting them). Arrays are intentionally left with no
// minItems/maxItems — length is semantic, decided by the model's reasoning,
// not enforced by the schema. Guardrails against degenerate output live in
// the prompt (soft ceilings) and in validateLessonStructure() (non-emptiness),
// never in artificial schema-level count limits.
// ==============================================================================

const LESSON_JSON_SCHEMA = {
  name: 'lesson_content',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      competencyGoal: {
        type: 'string',
        description: 'One sentence: "After this lesson, the learner should be able to ___." Forces the objective to be explicit and testable rather than implicit.'
      },
      parts: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            partNumber: { type: 'integer' },
            partTitle: { type: 'string' },
            cards: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  cardNumber: { type: 'integer' },
                  content: {
                    type: 'string',
                    description: 'Markdown-formatted teaching content: use **bold**, `inline code`, fenced ```code blocks``` with a language tag, and bullet lists where they aid clarity. Do not use # / ## headings inside a card.'
                  }
                },
                required: ['cardNumber', 'content']
              }
            },
            miniExercise: {
              type: 'object',
              additionalProperties: false,
              properties: {
                question: { type: 'string' },
                options: { type: 'array', items: { type: 'string' } },
                correctIndex: { type: 'integer' },
                explanation: { type: 'string' }
              },
              required: ['question', 'options', 'correctIndex', 'explanation']
            }
          },
          required: ['partNumber', 'partTitle', 'cards', 'miniExercise']
        }
      },
      task: {
        type: ['object', 'null'],
        additionalProperties: false,
        properties: {
          type: { type: 'string', enum: ['text', 'mcq'] },
          description: {
            type: 'string',
            description: 'Markdown-formatted. For "text" tasks this is the full mastery-task prompt (may include a fenced code block or scenario). For "mcq" tasks this is a short framing line.'
          },
          questions: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                question: { type: 'string' },
                options: { type: 'array', items: { type: 'string' } },
                correctIndex: { type: 'integer' },
                topicTag: { type: 'string' }
              },
              required: ['question', 'options', 'correctIndex', 'topicTag']
            }
          }
        },
        required: ['type', 'description', 'questions']
      }
    },
    required: ['competencyGoal', 'parts', 'task']
  }
};

const ROADMAP_JSON_SCHEMA = {
  name: 'roadmap_skeleton',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      skillName: { type: 'string' },
      targetLevel: { type: 'string' },
      totalModules: { type: 'integer' },
      estimatedWeeks: { type: 'integer' },
      modules: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            moduleNumber: { type: 'integer' },
            title: { type: 'string' },
            weeks: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  weekNumber: { type: 'integer' },
                  title: { type: 'string' },
                  days: {
                    type: 'array',
                    items: {
                      type: 'object',
                      additionalProperties: false,
                      properties: {
                        dayNumber: { type: 'integer' },
                        dayName: { type: 'string' },
                        type: { type: 'string', enum: ['Learning', 'Revision', 'Exam'] },
                        title: { type: 'string' },
                        topicsList: { type: 'array', items: { type: 'string' } },
                        examQuestions: {
                          type: 'array',
                          items: {
                            type: 'object',
                            additionalProperties: false,
                            properties: {
                              question: { type: 'string' },
                              options: { type: 'array', items: { type: 'string' } },
                              correctIndex: { type: 'integer' },
                              topicTag: { type: 'string' }
                            },
                            required: ['question', 'options', 'correctIndex', 'topicTag']
                          }
                        }
                      },
                      required: ['dayNumber', 'dayName', 'type', 'title', 'topicsList', 'examQuestions']
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
  }
};

// ==============================================================================
// SHARED MENTOR PRINCIPLES
// This is the actual engine. Both lesson generation and roadmap generation
// are instances of the same discipline: figure out what the learner really
// needs in order to reach THEIR stated goal, then let that determine shape
// and length — never the reverse. Extracted once, specialized per use-site,
// so the underlying philosophy can't drift out of sync between the two.
// ==============================================================================

const MENTOR_PRINCIPLES = `You are an engineering mentor. Your only success metric is whether the learner becomes measurably more capable of doing the real thing they are trying to do — not whether you covered a topic, and not whether you filled a template.

Before producing anything, reason through this internally (do not show this reasoning in your output):

1. OBJECTIVE — What specific capability must this deliverable produce? State it as "...should be able to ___" using a real verb: explain, debug, design, modify, evaluate, choose, build. Never settle for "understand" alone — it is not testable.

2. REAL TARGET, NOT GENERIC TOPIC — The learner has a stated goal. Teach toward THAT goal, using it as the lens for every example and every decision about depth, not toward a generic, one-size-fits-all treatment of the topic name. Someone building a production system and someone doing a weekend hobby project asking about the "same" topic need different lessons — different examples, different depth, different emphasis.

3. FAILURE MODES — Where do people genuinely get this wrong? Teach directly against that specific confusion, not a sanitized version that avoids it.

4. CLASSIFICATION — Is this fundamentally a Concept, a Tool, an Architecture/Tradeoff decision, a Debugging skill, or a Workflow/Process judgment call? Let this determine the shape:
   - Concept → mental model + analogy + the specific misconception it corrects
   - Tool → what it's for, how it's configured/operated, how you troubleshoot it when it breaks
   - Architecture/Decision → the competing constraints, why this tradeoff wins over the alternatives, what breaks if you choose wrong
   - Debugging → symptom → investigation approach → diagnosis → fix, strictly in that order
   - Workflow/Process → the sequence, the decision points, what a mistake looks like at each one

SEMANTIC SIZE — the number of parts, sections, or items you produce is an OUTPUT of the reasoning above, not a fixed input. Content that is genuinely one crisp idea deserves to be short. Content that is a real multi-piece system deserves more room. Asymmetric length between sections is correct when the underlying content is asymmetric — never pad a thin topic to look substantial, and never compress a dense one to hit a round number.

SIGNAL-TO-NOISE — before including any sentence, ask: does this directly serve the objective in step 1? If not, cut it. This applies especially to generic motivational filler, restated definitions, and background trivia that doesn't change what the learner can do afterward.

REAL-WORLD ACCURACY — teach current, production-grade practice. Never present a legacy pattern as the modern default. If historical context genuinely helps (explaining why a modern approach exists), label it explicitly as historical.

DO NOT DO THE LEARNER'S WORK FOR THEM — concrete examples and demonstrations that build understanding are necessary and correct. Do not write a finished solution to the exact exercise you are about to assign.`;

const LESSON_MASTERY_ADDENDUM = `MASTERY ARCHITECTURE (mandatory for every lesson):

- Each part's miniExercise must test judgment against a realistic scenario, never bare recall.
  Weak (recall): "What does useState do?"
  Strong (judgment): "A counter isn't updating when you click a button twice in the same event handler. What's actually happening, and how do you fix it?"

- The end-of-lesson task is a genuine MASTERY TASK: a concrete, self-directed challenge that exercises the day's competency the way a real engineering situation would. It must require a decision, not just execution, and must be completable using only what this lesson taught — never something answerable by pattern-matching wording back at the lesson text.

SIZING GUARDRAILS (safety ceilings, not targets — stay well under these for any topic that doesn't genuinely need them):
- Typically 2-5 parts. Do not exceed 7 regardless of topic — beyond that, the lesson stops being learnable in one sitting and should have been two days, not one lesson.
- Cards per part: however many distinct ideas that part actually contains — usually 1-4. Do not pad.
- If the task is type "mcq": however many distinct testable ideas the day's topics produced — usually 4-10. Do not pad to hit a round number, and do not exceed roughly 15 regardless.

FORMATTING: content and task description are markdown. Use **bold** for key terms, backtick-wrapped inline code for identifiers, fenced code blocks with a language tag for anything multi-line, and bullet lists for enumerable items. Do not use # / ## heading markup inside card content — the part title already serves that role.

BANNED PHRASES: "it is important to note", "in conclusion", "as we can see", "let us explore", "in this section", "fundamentals", "in the world of".`;

const LESSON_THINKING_SYSTEM = `${MENTOR_PRINCIPLES}

You are drafting the raw content for one day's lesson. Write in engineer voice — direct, opinionated, real examples, like a senior teammate explaining something in a Slack thread, not a textbook.

${LESSON_MASTERY_ADDENDUM}

OUTPUT FORMAT: Plain text, no JSON. Start with a single line: "COMPETENCY GOAL: <the one-sentence objective>". Then label each part clearly ("PART 1 — <working title>") and each card within it ("CARD 1:"), followed by a labelled "MINI EXERCISE" for that part. End with a labelled "TASK" section (omit entirely only if the prompt tells you this is a revision session). These labels are structural markers for the next processing step only — do not use JSON or markdown heading syntax for them.`;

const REVISION_THINKING_SYSTEM = `${MENTOR_PRINCIPLES}

You are drafting a targeted revision session for a learner who already sat through the original lesson once and got specific things wrong. Your job is not to re-teach everything — it is to fix the specific misunderstanding, from a genuinely different angle than the first pass, using a new example they haven't seen.

SIZING: Revision is deliberately more bounded than a full lesson — its purpose is efficient re-teaching, not full re-coverage. Normally this is ONE part. Only split into two parts if the weak topics are genuinely unrelated clusters that don't benefit from being taught together. Cards: roughly one focused card per distinct weak topic, typically 2-4 total, and never more than 6 — if there are more than 6 weak topics, group the closely related ones into a single card rather than listing every one separately.

Be direct about the correction: "You got this wrong before because X — here's what's actually happening." No task section — revision sessions end after the mini exercise.

FORMATTING: same markdown rules as a full lesson (bold, inline code, fenced code blocks, bullet lists; no heading markup).

OUTPUT FORMAT: Plain text. Start with "COMPETENCY GOAL: <one sentence>". Label part(s) and cards the same way a full lesson does. End with a labelled MINI EXERCISE per part. No TASK section.`;

const LESSON_FORMATTER_SYSTEM = `You are a precise structuring engine. You receive rich lesson content written by a mentor and repackage it into the required schema — nothing more.

Rules:
- Do NOT simplify, generalize, or trim any example, code snippet, or explanation. Preserve the author's voice, specifics, and markdown formatting exactly.
- Segment into parts and cards exactly where the source material's own labels ("PART 1", "CARD 1", etc.) break it — do not invent, merge, or split beyond what the source already delineates. The number of parts and cards is whatever the source contains; do not force it toward any particular count.
- Extract the "COMPETENCY GOAL:" line into the competencyGoal field verbatim (as one clean sentence, without the label itself).
- Extract each labelled "MINI EXERCISE" into that part's miniExercise object.
- If the source has a labelled "TASK" section, extract it into task (type "text" with an empty questions array, or type "mcq" with the questions array populated — infer which from the content). If the source has no TASK section at all, set task to null.
- Preserve all markdown syntax in content and description fields exactly as written — do not strip or alter it.
- Your only job is lossless repackaging into the schema. If you are ever unsure whether to add, remove, or simplify something: don't.`;

const ROADMAP_SYSTEM = `${MENTOR_PRINCIPLES}

You are designing a full multi-week curriculum, not a single lesson. The same discipline applies at this larger scale:

- The learner's stated goal (not the skill name alone) determines what the roadmap must actually cover, in what order, and at what depth. A roadmap for "MERN stack" aimed at a founder-level architect building a production AI product looks substantially different from one aimed at someone doing a weekend hobby project — different module emphasis, different depth per topic, different real-world framing throughout.

- SEMANTIC SIZING AT CURRICULUM SCALE — module count and week count are OUTPUTS of how much genuine complexity the stated goal requires, not a default you reach for. Do not compress a skill that legitimately needs 10-12 weeks into 4 just to look tidy, and do not pad a narrow skill into an artificially long roadmap. Let real complexity set the length.

- Within a Learning day, topicsList should contain however many specific, actionable topics that day's depth actually warrants — typically 2-4, driven by what's genuinely coverable in one sitting at this learner's stated pace, not a fixed count applied uniformly across every day regardless of topic density.

- Exam question count per week should reflect how many genuinely distinct, testable ideas that week actually covered — typically 4-8. A week that covered five substantially different topics needs more questions than a week that went deep on one thing; do not force every week to the same count.

- Day titles are outcomes, not category labels: "Making Components Reusable with Props" not "React Props".

- Later modules build on earlier ones — never re-teach a concept, only apply it in a new, higher-stakes context.

HARD STRUCTURAL CONSTRAINT (not semantic — this is fixed by how the product tracks progress and must never vary): every week has EXACTLY 7 days, always in this exact order: dayNumber 1-5 = Learning, dayNumber 6 = Revision, dayNumber 7 = Exam. Revision days have topicsList: [] and examQuestions: []. Exam days have topicsList: [] and their examQuestions populated per the semantic sizing rule above. correctIndex is always an integer 0-3.

Return ONLY valid JSON matching the schema. No markdown. No text outside the JSON.`;

const FEEDBACK_SYSTEM = `You are an expert mentor evaluating learner work. Be direct, specific, and useful — never generic praise, never vague criticism. Diagnose the actual gap in understanding, not just the surface mistake, and give exactly one concrete next step the learner can act on immediately. Markdown is fine for inline code or short emphasis, but keep it light — this is short-form feedback, not a lesson. The OUTCOME line is mandatory and must never be omitted.`;

// ==============================================================================
// UTILITIES
// ==============================================================================

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Validates non-emptiness and minimum substance — never enforces a specific count. */
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
      if (!card.content || typeof card.content !== 'string' || card.content.trim().length < 40) {
        console.error(`[AI Validation] FAIL: card content too short in part ${part.partNumber}`);
        throw new Error('JSON_PARSE_FAILURE');
      }
    }
  }
  if (!parsed.competencyGoal || typeof parsed.competencyGoal !== 'string' || parsed.competencyGoal.trim().length < 10) {
    console.error('[AI Validation] FAIL: competencyGoal missing or too short');
    throw new Error('JSON_PARSE_FAILURE');
  }
  return true;
};

const cleanPartTitle = (title) => {
  if (typeof title !== 'string' || title.trim().length === 0) return 'Topic Overview';
  const sample = title.substring(0, 80).toLowerCase();
  const words = sample.split(/\s+/).filter((w) => w.length > 3);
  const counts = {};
  for (const word of words) {
    counts[word] = (counts[word] || 0) + 1;
    if (counts[word] >= 3) {
      console.warn('[AI Validation] Hallucinated partTitle replaced');
      return 'Topic Overview';
    }
  }
  return title.replace(/[,"\s]+$/, '').replace(/^[,"\s]+/, '').trim().substring(0, 100);
};

// ==============================================================================
// CORE CALL — one retry/backoff policy, two thin request-shape wrappers.
// ==============================================================================

/**
 * Runs `fn` (a zero-arg async function performing one OpenAI request) with
 * exponential backoff on transient failures. `fn` must throw an error whose
 * `.status` is the HTTP status when available, and may throw the sentinel
 * messages `JSON_PARSE_FAILURE` / `TRUNCATED` to signal a retryable content
 * failure (as opposed to a genuine API error).
 */
const withRetry = async (fn, label) => {
  let attempts = 0;
  while (attempts < RETRY.MAX_ATTEMPTS) {
    try {
      return await fn();
    } catch (error) {
      attempts++;
      const status = error.status || 0;
      const isContentRetry = error.message === 'JSON_PARSE_FAILURE' || error.message === 'TRUNCATED';
      const isTransient = status === 429 || status === 500 || status === 503;
      const retryable = (isTransient || isContentRetry) && attempts < RETRY.MAX_ATTEMPTS;

      console.error(`[AI Service] ${label} attempt ${attempts} failed: ${error.message}${retryable ? ' — retrying' : ''}`);

      if (status === 400 && !isContentRetry) throw new Error(`GEMINI_FAILURE: ${error.message}`);
      if (!retryable) {
        if (isContentRetry) throw new Error('JSON_PARSE_FAILURE');
        throw new Error(`GEMINI_FAILURE: ${error.message}`);
      }
      await wait(RETRY.BACKOFF_MS[attempts - 1]);
    }
  }
};

/** Free-form text call — no schema. Used for the lesson thinking pass only. */
const callThinking = ({ model, systemPrompt, userPrompt, maxTokens }) =>
  withRetry(async () => {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: maxTokens
    });

    if (completion.choices?.[0]?.finish_reason === 'length') throw new Error('TRUNCATED');
    const text = completion.choices?.[0]?.message?.content;
    if (!text) throw new Error('EMPTY_RESPONSE');
    return text;
  }, 'thinking pass');

/** Schema-locked JSON call using OpenAI Structured Outputs (strict mode). */
const callStructured = ({ model, systemPrompt, userPrompt, jsonSchema, maxTokens }) =>
  withRetry(async () => {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.4,
      max_tokens: maxTokens,
      response_format: { type: 'json_schema', json_schema: jsonSchema }
    });

    if (completion.choices?.[0]?.finish_reason === 'length') throw new Error('TRUNCATED');
    const text = completion.choices?.[0]?.message?.content;
    if (!text) throw new Error('EMPTY_RESPONSE');
    return JSON.parse(text); // safe: Structured Outputs guarantees schema-valid JSON
  }, 'structured call');

// ==============================================================================
// TWO-CALL LESSON PIPELINE (learning days AND revision days both use this —
// only the system prompts and sizing guidance differ between them)
// ==============================================================================

const generateLessonTwoPass = async ({ thinkingSystem, thinkingPrompt, formatterPrompt }) => {
  console.log('[AI Service] Lesson: thinking pass (mentor reasoning)...');
  const rawContent = await callThinking({
    model: MODELS.THINKING,
    systemPrompt: thinkingSystem,
    userPrompt: thinkingPrompt,
    maxTokens: MAX_TOKENS.LESSON_THINKING
  });

  console.log('[AI Service] Lesson: formatting pass (schema-locked repackaging)...');
  const structured = await callStructured({
    model: MODELS.STRUCTURE,
    systemPrompt: LESSON_FORMATTER_SYSTEM,
    userPrompt: `${formatterPrompt}\n\n---\nRAW LESSON CONTENT TO STRUCTURE:\n${rawContent}`,
    jsonSchema: LESSON_JSON_SCHEMA,
    maxTokens: MAX_TOKENS.LESSON_STRUCTURE
  });

  validateLessonStructure(structured);
  structured.parts = structured.parts.map((part) => ({ ...part, partTitle: cleanPartTitle(part.partTitle) }));
  return structured;
};

// ==============================================================================
// PUBLIC API — identical signatures to v3
// ==============================================================================

/**
 * Generates the full roadmap skeleton. Single call (see header note #5 for
 * why this stays single-pass while lessons are two-pass), on the strong
 * model, schema-locked directly.
 */
export const generateRoadmapSkeleton = (data) => {
  const userPrompt = `Design a learning roadmap for this learner:
Skill: ${data.skillInput}
Their actual stated goal: ${data.motivation || 'Not specified'}
Current level: ${data.currentLevel} | Role: ${data.role}
Learning style: ${data.learningStyle} | Goal clarity: ${data.goalClarity}
Daily time available: ${data.dailyTime}

Design the module/week structure and topic depth around what THEIR stated goal actually requires — not a generic treatment of "${data.skillInput}". Follow the fixed 7-day week pattern exactly as specified in your instructions.`;

  return callStructured({
    model: MODELS.ROADMAP,
    systemPrompt: ROADMAP_SYSTEM,
    userPrompt,
    jsonSchema: ROADMAP_JSON_SCHEMA,
    maxTokens: MAX_TOKENS.ROADMAP
  });
};

/**
 * Generates lesson content for a learning day or a revision session, via the
 * two-pass mentor pipeline. Returns { competencyGoal, parts, task }.
 */
export const generateLessonContent = async (data) => {
  if (data.isRevision || data.isExamRetry) {
    const topics = data.weakTopicsStr || data.allWeekTopics || 'General review of the week';

    return generateLessonTwoPass({
      thinkingSystem: REVISION_THINKING_SYSTEM,
      thinkingPrompt: `Weak topics to address: ${topics}
Skill: ${data.skillName} | Learner level: ${data.currentLevel || 'Beginner'}

Re-explain each weak topic from a genuinely different angle than the original lesson likely used, with a new example. Connect related weak topics to each other where it helps; keep unrelated ones separate.`,
      formatterPrompt: `Format this revision content into the lesson schema. Segment exactly as the source labels it (typically 1 part, occasionally 2). task must be null. Preserve all markdown formatting.`
    });
  }

  return generateLessonTwoPass({
    thinkingSystem: LESSON_THINKING_SYSTEM,
    thinkingPrompt: `Skill: ${data.skillName}
Module ${data.moduleNumber}: ${data.moduleTitle}
Week ${data.weekNumber}: ${data.weekTitle}
Day ${data.dayNumber} (${data.dayName})
Topics: ${data.topicsList?.join(', ') || ''}
Learner level: ${data.currentLevel}
Learner's actual stated goal: ${data.motivation || 'Not specified'}
Learning style: ${data.learningStyle}

Reason through the objective, the failure modes, and the classification for these specific topics before writing. Structure the lesson (problem → core mechanism with a runnable example → synthesis toward the learner's stated goal) with however many parts and cards this content genuinely needs. End with a mastery task sized and typed (text vs mcq) appropriately for whether these topics are conceptual or practical.`,
    formatterPrompt: `Format this lesson into the schema. Segment exactly as the source labels it — do not force a particular part or card count. Extract the TASK section (or set task: null only if the source truly has none). Preserve all markdown formatting.`
  });
};

/**
 * Generates AI feedback on a task submission — text or MCQ. Single call,
 * unchanged mechanism from v3; system prompt sharpened for directness.
 */
export const generateFeedback = (data) => {
  let userPrompt;

  if (data.isMcq) {
    const wrongAnswers = data.report.filter((r) => !r.isCorrect);
    const correctCount = data.report.filter((r) => r.isCorrect).length;
    const score = data.score ?? Math.round((correctCount / data.report.length) * 100);

    userPrompt = `Score: ${score}% (${correctCount}/${data.report.length} correct)

Wrong answers:
${wrongAnswers.map((r, i) =>
      `${i + 1}. "${r.questionText}"\n   Chose: ${r.options?.[r.selectedIndex] ?? 'none'}\n   Correct: ${r.options?.[r.correctIndex]}`
    ).join('\n\n')}

Write exactly 3 paragraphs: (1) what they understood, (2) the actual confusion behind the wrong answers — not just the topic name, (3) one concrete fix.

OUTCOME: positive OR OUTCOME: needs_improvement

RESOURCES:
- [Title](https://url) — why this helps (official docs only)
If none needed: RESOURCES: (no additional resources needed)`;

  } else {
    userPrompt = `Task: ${data.description}
Topics: ${data.topicsList}
Learner's answer: ${data.userAnswer}

Write exactly 3 paragraphs: (1) what they got right, (2) what's missing or wrong, (3) one concrete next step.

OUTCOME: positive OR OUTCOME: needs_improvement

RESOURCES:
- [Title](https://url) — why this helps (official docs only)
If none needed: RESOURCES: (no additional resources needed)`;
  }

  return callThinking({
    model: MODELS.FEEDBACK,
    systemPrompt: FEEDBACK_SYSTEM,
    userPrompt,
    maxTokens: MAX_TOKENS.FEEDBACK
  });
};