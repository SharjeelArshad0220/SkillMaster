// ==============================================================================
// HARDENED GEMINI SERVICE — IMPLEMENTING SDK BEST PRACTICES
// ==============================================================================

import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL = 'gemini-2.5-flash';

// --- JSON Schemas (Fixed to use Type enum and remove nullable) ---

const ROADMAP_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    skillName: { type: Type.STRING },
    targetLevel: { type: Type.STRING },
    totalModules: { type: Type.NUMBER },
    estimatedWeeks: { type: Type.NUMBER },
    modules: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          moduleNumber: { type: Type.NUMBER },
          title: { type: Type.STRING },
          weeks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                weekNumber: { type: Type.NUMBER },
                title: { type: Type.STRING },
                days: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      dayNumber: { type: Type.NUMBER },
                      dayName: { type: Type.STRING },
                      type: { type: Type.STRING },
                      title: { type: Type.STRING },
                      topicsList: { type: Type.ARRAY, items: { type: Type.STRING } },
                      examQuestions: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            question: { type: Type.STRING },
                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                            correctIndex: { type: Type.NUMBER },
                            topicTag: { type: Type.STRING }
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

const LESSON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    parts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          partNumber: { type: Type.NUMBER },
          partTitle: { type: Type.STRING },
          cards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                cardNumber: { type: Type.NUMBER },
                content: { type: Type.STRING }
              }
            }
          },
          miniExercise: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctIndex: { type: Type.NUMBER },
              explanation: { type: Type.STRING }
            }
          }
        }
      }
    },
    task: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING },
        description: { type: Type.STRING },
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctIndex: { type: Type.NUMBER },
              topicTag: { type: Type.STRING }
            }
          }
        }
      }
    }
  },
  required: ['parts']
};

// --- System Instructions ---
const ROADMAP_SYSTEM_INSTRUCTION = `You are an expert curriculum designer and skill development mentor.
You design learning roadmaps for ANY skill or field — programming, cooking,
trading, music, language learning, or anything else a human might want to master.
You analyze the learner's profile deeply before designing the structure.
You always respond with ONLY valid JSON. No markdown, no explanation, no code fences.
You follow the exact JSON structure specified in every prompt precisely.
You never assume a skill is easy or short — if the goal requires 12 modules, design 12.
If the goal requires 2 modules, design 2. Let the skill and goal determine the length.
You always create exactly 7 days per week. Day 6 (Saturday) is always Revision.
Day 7 (Sunday) is always Exam. Days 1-5 are Learning.
Each exam day always has exactly 5 MCQ questions with a topicTag per question.

CRITICAL: Do not fragment your array responses. Ensure every object in the 'weeks' array contains weekNumber, title, and days IN ONE OBJECT.`;
const LESSON_SYSTEM_INSTRUCTION = `You are a senior engineer who has mentored hundreds of developers at top-tier product companies. You do NOT write educational content like a textbook. You teach like a staff engineer talking to a sharp junior on their first week: direct, opinionated, specific, and practical.

TEACHING RULES — follow every one:
1. Every card must teach exactly one concept with one concrete, runnable example. Not abstract. Code or scenario, always.
2. Start every first card of a part by naming the real problem this concept solves. Not "variables store data" — "without variables, you would retype 49.99 every place you charge a customer. Change the price once in the variable and it updates everywhere."
3. Address the single most common mistake on this topic somewhere in the card. Lead with: "The mistake most developers make here is..."
4. Connect at least one card per part to the learner's stated goal. Make it explicit.
5. Write for someone smart who is new to this. Never condescend. Never explain what they already know.
6. Banned phrases: "it is important to note", "in conclusion", "as we can see", "let us explore", "in this section".
7. MiniExercise must require genuine understanding, not recall. A learner who skimmed the cards must get it wrong.

ABSOLUTE STRUCTURAL RULES:
- partTitle: 5–8 words, title-case, concept-specific (NOT "Introduction to Functions" — YES "Why Functions Stop You Repeating Code")
- card content: 120–180 words, one concrete example minimum, one mistake addressed, Markdown formatted
- cards use: **bold** for key terms, \`backticks\` for code, fenced code blocks for multi-line examples
- revision sessions: EXACTLY 1 part, EXACTLY 3 cards, 1 miniExercise, task is null — no exceptions
- learning sessions: EXACTLY 3 parts, each with 2–4 cards and 1 miniExercise`;

const FEEDBACK_SYSTEM_INSTRUCTION = 
`Evaluate this learner's task submission based on the task description and topics provided.
Provide feedback in exactly 3 paragraphs:
1. What the learner demonstrated correctly
2. What is missing, unclear, or could be improved
3. One specific actionable next step
End with exactly one line: OUTCOME: positive OR OUTCOME: needs_improvement 
Keep response under 200 words. Be encouraging and specific. Never be vague.
After the OUTCOME line, add:
RESOURCES:
- [title](url): one sentence why worth reading
Rules: 2 resources max. Only from these domains: developer.mozilla.org, javascript.info, react.dev, nodejs.org/docs, mongoosejs.com/docs, expressjs.com. Real URLs only. No YouTube. No Medium. No paid courses.
`;

// --- Core Helper ---

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseResponse = (responseText) => {
  try {
    if (typeof responseText === 'object') return responseText;
    return JSON.parse(responseText);
  } catch (err) {
    console.error('Failed to parse Gemini response:', responseText?.substring(0, 300));
    throw new Error('JSON_PARSE_FAILURE');
  }
};

/**
 * Validates that a parsed lesson object has the correct semantic structure.
 * Throws JSON_PARSE_FAILURE if structure is invalid — triggering retry logic.
 * Called after JSON.parse succeeds, before returning to caller.
 */
const validateLessonStructure = (parsed) => {
  // Must have parts array that is non-empty
  if (!parsed.parts || !Array.isArray(parsed.parts) || parsed.parts.length === 0) {
    console.error('[Gemini Validation] FAIL: parts array missing or empty');
    throw new Error('JSON_PARSE_FAILURE');
  }

  for (const part of parsed.parts) {
    // Each part must have a non-empty cards array
    if (!part.cards || !Array.isArray(part.cards) || part.cards.length === 0) {
      console.error(`[Gemini Validation] FAIL: part ${part.partNumber} has no cards`);
      throw new Error('JSON_PARSE_FAILURE');
    }

    // Each card must have meaningful content (minimum 50 chars)
    for (const card of part.cards) {
      if (
        !card.content ||
        typeof card.content !== 'string' ||
        card.content.trim().length < 50
      ) {
        console.error(`[Gemini Validation] FAIL: card ${card.cardNumber} in part ${part.partNumber} has no content`);
        throw new Error('JSON_PARSE_FAILURE');
      }
    }
  }

  // Validation passed
  return true;
};

/**
 * Cleans and validates a partTitle string.
 * Detects Gemini's repetitive hallucination pattern and replaces with fallback.
 * Strips trailing JSON artifacts like `, "` that appear when Gemini splits objects.
 */
const validatePartTitle = (title) => {
  if (typeof title !== 'string' || title.trim().length === 0) {
    return 'Topic Overview';
  }

  // Detect repetitive hallucination: e.g. "Revieweristive Foundationsistive Revieweristive..."
  // Pattern: if any word appears 3+ times in first 60 chars, it is hallucinated
  const sample = title.substring(0, 80).toLowerCase();
  const words = sample.split(/\s+/).filter(w => w.length > 3);
  const wordCounts = {};
  for (const word of words) {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
    if (wordCounts[word] >= 3) {
      console.warn('[Gemini Validation] Hallucinated partTitle detected, replacing with fallback');
      return 'Topic Overview';
    }
  }

  // Strip trailing JSON artifacts: `, "` or `",` or trailing whitespace
  const cleaned = title
    .replace(/[,"\s]+$/, '')  // trailing comma, quote, space
    .replace(/^[,"\s]+/, '')  // leading artifacts
    .trim();

  // Hard length cap
  return cleaned.substring(0, 80);
};

const generateContent = async ({ prompt, systemInstruction, schema, isJson = true }) => {
  let attempts = 0;
  const maxRetries = 3;

  while (attempts < maxRetries) {
    try {
      const config = {
        systemInstruction,
        responseMimeType: isJson ? 'application/json' : 'text/plain',
        temperature: isJson ? 0.8: 0.5,
        maxOutputTokens: isJson ? 65536 : 4096,
        
      };

      // Ensure we don't pass `responseSchema: undefined` to the SDK validation
      if (isJson && schema) {
        config.responseSchema = schema;
      }

      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config
      });

      const text = response.text;
      if (!text) throw new Error('EMPTY_RESPONSE');

      let parsed = isJson ? parseResponse(text) : text;

      // Safety: truncate corrupted partTitle
      // Structural validation + title cleaning for lesson responses
      if (isJson && parsed.parts !== undefined) {
        // 1. Validate semantic structure — throws JSON_PARSE_FAILURE on bad shape
        validateLessonStructure(parsed);

        // 2. Clean all partTitles
        parsed.parts = parsed.parts.map(part => ({
          ...part,
          partTitle: validatePartTitle(part.partTitle)
        }));
      }

      return parsed;

    }
    catch (error) {
      attempts++;
      const is429 = error.message?.includes('429') || error.status === 429;
      const is500 = error.message?.includes('500') || error.status === 500;
      const shouldRetry = (is429 || is500) && attempts < maxRetries;

      // Better error logging
      console.error(`Gemini attempt ${attempts} failed: ${error.message}${shouldRetry ? ' — retrying...' : ''}`);

      if (shouldRetry) {
        const waitMs = attempts === 1 ? 5000 : attempts === 2 ? 15000 : 30000;
        await wait(waitMs);
      } else {
        if (error.message === 'JSON_PARSE_FAILURE') throw error;
        throw new Error(`GEMINI_FAILURE: ${error.message}`);
      }
    }
  }
};

// --- Exports ---

export const generateRoadmapSkeleton = (data) => {
  const prompt = `Generate a complete learning roadmap skeleton for this learner:
Skill to learn: ${data.skillInput}
Learning goal: ${data.motivation}
Current level: ${data.currentLevel}
Role: ${data.role}
Learning style: ${data.learningStyle}
Goal clarity: ${data.goalClarity}
Daily time available: ${data.dailyTime}

INSTRUCTIONS:
First decide the canonical skill name.
Decide how many modules are genuinely needed. Be realistic.
Each module has at least 1 week.
Each week has exactly 7 days: Mon-Fri = Learning, Sat = Revision, Sun = Exam.
For each Learning day: list 2-4 specific topics and a short day title.
For Revision day: topicsList is empty array, title is "Weekly Review".
For Exam day: write exactly 5 MCQ questions testing that week's topics.

CURRICULUM DESIGN PRINCIPLES — follow all:
1. SPIRAL LEARNING: Week 2 builds on Week 1 concepts. Never re-explain prior week topics — apply them.
2. 70/30 RULE: 70% of topicsList items must be practical/hands-on. 30% conceptual.
3. PROGRESSIVE DIFFICULTY: Day 1 (Monday) = new concept introduction. Day 5 (Friday) = synthesis and application combining the week's topics.
4. ACTION-ORIENTED TITLES: day title must be an action or outcome, not a topic label. NOT "React Hooks" — YES "Adding Dynamic Behavior to Components with Hooks"
5. SPECIFIC TOPICS: each item in topicsList must be a specific operation or skill, not a category. NOT "React hooks" — YES "useState for tracking form inputs without re-rendering the whole tree"
6. EXAM ALIGNMENT: each examQuestion must have topicTag matching a specific day topic from that week. No surprise topics.
7. No day should have more than 4 items in topicsList. Depth over coverage.
`;

  return generateContent({
    prompt,
    systemInstruction: ROADMAP_SYSTEM_INSTRUCTION,
    schema: ROADMAP_SCHEMA
  });
};

export const generateLessonContent = (data) => {
  let prompt = '';

  if (data.isExamRetry) {
    prompt = `Generate a focused revision lesson for a learner who needs to review weak topics.

LEARNER CONTEXT:
Skill: ${data.skillName}
Topics the learner struggled with: ${data.weakTopicsStr || 'General review of the week'}
All topics from this week (fallback if no weak topics): ${data.allWeekTopics || 'Week topics'}
Learner level: ${data.currentLevel || 'Beginner'}

OUTPUT REQUIREMENTS (these are non-negotiable):
- The parts array must contain EXACTLY 1 part object
- That part must have partNumber: 1
- That part must have partTitle: a short descriptive string like "Week Revision: Core Concepts"
- That part must have cards: an array of EXACTLY 3 card objects
  - card 1: cardNumber: 1, content: 120-200 words re-explaining the first weak topic from a new angle
  - card 2: cardNumber: 2, content: 120-200 words re-explaining the second weak topic (or connecting concepts)
  - card 3: cardNumber: 3, content: 120-200 words showing practical application with a new example
- That part must have miniExercise: an object with question, options (4 strings), correctIndex (0-3), explanation
- task must be null — revision sessions have no task

Do not add more than 1 part. Do not return empty cards arrays.`;
  } else if (data.isRevision) {
    prompt = `Generate a revision session for this learner:
Skill: ${data.skillName}
Week being revised: Module ${data.moduleNumber}, Week ${data.weekNumber}
Topics the learner struggled with: ${data.weakTopicsStr || 'General review'}
If no weak topics, revise: ${data.allWeekTopics || 'all topics covered this week'}
Create a focused revision session with 1 part containing 3-4 cards.
Re-explain each weak topic from a different angle with new examples.
No task for revision sessions.`;
  } else {
    prompt = `Generate a complete learning session for this learner:
Skill: ${data.skillName}
Module: ${data.moduleNumber} — ${data.moduleTitle}
Week: ${data.weekNumber} — ${data.weekTitle}
Day: ${data.dayNumber} — ${data.dayName}
Topics to cover today: ${data.topicsList?.join(', ') || ''}
TEACH THIS SESSION WITH THESE CONSTRAINTS:
- Learner level: ${data.currentLevel}. Never explain things they already know. Build forward.
- Their goal: "${data.motivation}". Explicitly connect today's topics to this goal at least once.
- Learning style: ${data.learningStyle}. ${
  data.learningStyle === 'Practice' 
    ? 'Show working code before explaining theory. Let the example teach first.'
    : data.learningStyle === 'Examples'
    ? 'Use real-world analogies before abstract definitions. Concrete before abstract always.'
    : 'Explain the complete concept, then show how it behaves, then show a counterexample.'
}
- Part 1 must open with WHY this exists — what problem did programmers have before this existed?
- Part 3 must synthesize Parts 1 and 2 — show how the concepts connect in a realistic scenario.
- Task type: if the day's topics are conceptual → mcq (10–15 questions). If practical/hands-on → text (one open engineering question that requires a multi-step answer to demonstrate real understanding, minimum 100-word answer expected).`
  }

  return generateContent({
    prompt,
    systemInstruction: LESSON_SYSTEM_INSTRUCTION,
    schema: LESSON_SCHEMA
  });
};

export const generateFeedback = (data) => {
  let prompt = '';

  if (data.isMcq) {
    const wrongAnswers = data.report.filter(r => !r.isCorrect);
    const correctCount = data.correctCount || data.report.filter(r => r.isCorrect).length;
    const totalQuestions = data.totalQuestions || data.report.length;
    const score = data.score || Math.round((correctCount / totalQuestions) * 100);

    prompt = `You are evaluating a learner's MCQ task performance.

Score: ${score}% (${correctCount} of ${totalQuestions} correct)

Questions answered incorrectly:
${wrongAnswers.map((r, i) =>
  `${i + 1}. ${r.questionText}\n   Learner chose: ${r.options[r.selectedIndex] ?? 'No answer'}\n   Correct answer: ${r.options[r.correctIndex]}`
).join('\n\n')}

Provide feedback in exactly 3 paragraphs:
1. What the learner understood correctly (based on their correct answers)
2. What concepts need more work (specific to the wrong answers above)
3. One concrete study recommendation for the weakest topic

End with exactly one line: OUTCOME: ${data.outcome}

Keep total response under 400 words. Be specific, not generic.`;
  } else {
    prompt = `Evaluate this learner's task submission:
Task description: ${data.description}
Topics this task covers: ${data.topicsList}
Learner's answer: ${data.userAnswer}

`;
  }

  return generateContent({
    prompt,
    systemInstruction: FEEDBACK_SYSTEM_INSTRUCTION,
    isJson: false,
  });
};