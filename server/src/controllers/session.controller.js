import Roadmap from '../models/Roadmap.model.js';
import Session from '../models/Session.model.js';
import Progress from '../models/Progress.model.js';
import { generateLessonContent, generateFeedback } from '../services/gemini.service.js';
import { parseDayId, getDayFromRoadmap, calculateNextPosition, buildDayId } from '../utils/dayHelpers.js';
/*
**
 * Final guard before saving a session to the database.
 * If content fails this check, throw INVALID_SESSION_CONTENT.
 * This prevents permanently caching broken sessions in MongoDB.
 * 
 * @param {string} type - "Learning" | "Revision" | "Exam"
 * @param {object} content - The content object to validate
 */
const guardSessionContent = (type, content) => {
  if (type === 'Exam') {
    // Exam sessions only need examQuestions
    if (
      !content.examQuestions ||
      !Array.isArray(content.examQuestions) ||
      content.examQuestions.length === 0
    ) {
      console.error('[Session Guard] FAIL: Exam session has no examQuestions');
      throw new Error('INVALID_SESSION_CONTENT');
    }
    return;
  }

  // Learning and Revision must have parts with cards
  if (!content.parts || !Array.isArray(content.parts) || content.parts.length === 0) {
    console.error(`[Session Guard] FAIL: ${type} session has no parts`);
    throw new Error('INVALID_SESSION_CONTENT');
  }

  for (const part of content.parts) {
    if (
      !part.cards ||
      !Array.isArray(part.cards) ||
      part.cards.length === 0
    ) {
      console.error(`[Session Guard] FAIL: Part ${part.partNumber} has no cards`);
      throw new Error('INVALID_SESSION_CONTENT');
    }
  }
};

export const getSession = async (req, res) => {
  try {
    const { dayId } = req.params;
    const userId = req.userId;

    // 1. Validate dayId format
    if (!/^m\d+-w\d+-d\d+$/.test(dayId)) {
      return res.status(400).json({ error: "Invalid dayId format" });
    }

    // 2. parseDayId
    const { moduleNumber, weekNumber, dayNumber } = parseDayId(dayId);

    // 3. Get roadmap
    const roadmap = await Roadmap.findOne({ userId }).sort({ createdAt: -1 });
    if (!roadmap) {
      return res.status(404).json({ error: "Roadmap not found" });
    }

    // 4. Get dayData
    const dayData = getDayFromRoadmap(roadmap.roadmapJson, moduleNumber, weekNumber, dayNumber);
    if (!dayData) {
      return res.status(404).json({ error: "Day not found in roadmap" });
    }

    const { type } = dayData; // Learning, Revision, Exam

    // 6. Check sessions collection
    let session = await Session.findOne({ userId, dayId });
    if (session) {
      return res.status(200).json({ session });
    }

    // 8. Generate content
    let content;
    const { setupData } = roadmap;

    if (type === "Learning") {
      const mod = roadmap.roadmapJson.modules.find(m => m.moduleNumber === moduleNumber);
      let week = mod.weeks.find(w => w.weekNumber === weekNumber);
      if (!week && mod.weeks) week = mod.weeks[weekNumber - 1];
      content = await generateLessonContent({
        skillName: roadmap.skillName,
        moduleNumber,
        moduleTitle: mod.title,
        weekTitle: week.title,
        // moduleTitle: mod.moduleTitle,
        weekNumber,
        // weekTitle: week.weekTitle,
        dayNumber,
        dayName: dayData.dayName,
        topicsList: dayData.topicsList,
        currentLevel: setupData.currentLevel,
        motivation: setupData.motivation,
        learningStyle: setupData.learningStyle,
        dailyTime: setupData.dailyTime
      });
    }
    else if (type === "Revision") {
      const progress = await Progress.findOne({ userId, roadmapId: roadmap._id });
      // Get weak topics for this week
      const currentWeekKey = `m${moduleNumber}-w${weekNumber}`;
      // weeklyWeakTopics is stored as a plain JS object in MongoDB (Mongoose Mixed type)
      // Always use bracket notation [] — never Map.get() — for consistency
      const weeklyWeakTopics = progress.weeklyWeakTopics || {};
      const weakTopics = Array.isArray(weeklyWeakTopics[currentWeekKey])
        ? weeklyWeakTopics[currentWeekKey]
        : [];
      const weakTopicsStr = weakTopics.length ? weakTopics.join(', ') : '';
      const mod = roadmap.roadmapJson.modules.find(m => m.moduleNumber === moduleNumber);
      let week = mod.weeks.find(w => w.weekNumber === weekNumber);
      if (!week && mod.weeks) week = mod.weeks[weekNumber - 1];

      // Gather all topics from learning days of this week
      const allWeekTopics = week.days
        .filter(d => d.type === 'Learning')
        .flatMap(d => d.topicsList)
        .join(', ');

      content = await generateLessonContent({
        isRevision: true,
        skillName: roadmap.skillName,
        moduleNumber,
        weekNumber,
        weakTopicsStr,
        allWeekTopics,
        currentLevel: setupData.currentLevel
      });
    }
    else if (type === "Exam") {
      content = { examQuestions: dayData.examQuestions };
    }
    guardSessionContent(type, content);
    session = await Session.create({
      userId,
      roadmapId: roadmap._id,
      dayId,
      type,
      content,
      status: "pending"
    });

    return res.status(200).json({ session });
  } catch (error) {
    console.error("getSession error:", error);
    if (
      error.message === 'GEMINI_FAILURE' ||
      error.message === 'JSON_PARSE_FAILURE' ||
      error.message === 'INVALID_SESSION_CONTENT'
    ) {
      return res.status(500).json({ error: "Failed to generate session content. Please try again." });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};


export const submitTask = async (req, res) => {
  try {
    const { dayId } = req.params;
    const userId = req.userId;

    const session = await Session.findOne({ dayId, userId });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.type === "Exam") {
      return res.status(400).json({ error: "Use /exam endpoint for exams" });
    }

    const task = session.content?.task;
    if (!task) {
      return res.status(400).json({ error: "No task in this session" });
    }

    if (task.type === "text") {
      const { taskAnswer } = req.body;
      if (!taskAnswer || taskAnswer.length < 20) {
        return res.status(400).json({ error: "Task answer must be at least 20 characters" });
      }

      const roadmap = await Roadmap.findById(session.roadmapId);
      const { moduleNumber, weekNumber, dayNumber } = parseDayId(dayId);
      const dayData = getDayFromRoadmap(roadmap.roadmapJson, moduleNumber, weekNumber, dayNumber);

      const topicsList = dayData ? dayData.topicsList.join(', ') : '';

      let feedback = "Your submission has been received and recorded.";
      let outcome = "needs_improvement";

      try {
        const aiResponse = await generateFeedback({
          description: task.description,
          topicsList,
          userAnswer: taskAnswer
        });
        const outcomeMatch = aiResponse.match(/OUTCOME:\s*(positive|needs_improvement)/i);
        const outcome = outcomeMatch ? outcomeMatch[1].toLowerCase() : 'needs_improvement';
        const resourcesMatch = aiResponse.match(/RESOURCES:\n([\s\S]*?)$/im);
        const resources = resourcesMatch ? resourcesMatch[1].trim() : null;
        const feedback = aiResponse
          .replace(/OUTCOME:.*$/im, '')
          .replace(/RESOURCES:[\s\S]*$/im, '')
          .trim();
      }
      catch (feedbackErr) {
        console.error("Task feedback generation failed (non-fatal):", feedbackErr.message);
        feedback = "Your submission was received. The AI feedback service is temporarily busy, but you can continue as your work has been logged.";
        outcome = "positive"; // Don't penalize the user if AI fails
      }

      session.userSubmission = { taskAnswer };
      session.aiFeedback = feedback;
      session.status = "completed";
      session.completedAt = new Date();
      await session.save();

      return res.status(200).json({ feedback, outcome, resources });
    }
    else if (task.type === "mcq") {
      const { mcqAnswers } = req.body;
      if (!mcqAnswers || !Array.isArray(mcqAnswers)) {
        return res.status(400).json({ error: "mcqAnswers array is required" });
      }
      let correct = 0;
      const total = task.questions.length;
      const report = task.questions.map((q, idx) => {
        const selectedIndex = mcqAnswers[idx];
        const isCorrect = selectedIndex === q.correctIndex;
        if (isCorrect) correct++;
        return {
          questionText: q.question,
          options: q.options,
          selectedIndex,
          correctIndex: q.correctIndex,
          isCorrect,
          topicTag: q.topicTag
        };
      });

      const score = (correct / total) * 100;
      const passed = score >= 80;
      const outcome = passed ? "positive" : "needs_improvement";

      let feedback = passed ? "Excellent work! You've passed the task." : "You've completed the task. Review the topics and try again if needed.";
      let outcomeStr = outcome;

      try {
        const aiResponse = await generateFeedback({
          isMcq: true,
          score,
          report,
          outcome
        });
        feedback = aiResponse.replace(/OUTCOME:.*/im, '').trim();
      } catch (feedbackErr) {
        console.error("MCQ task feedback generation failed (non-fatal):", feedbackErr.message);
      }

      session.userSubmission = { mcqAnswers, report, score, passed, outcome: outcomeStr };
      session.aiFeedback = feedback;
      session.status = "completed";
      session.completedAt = new Date();
      await session.save();

      return res.status(200).json({ feedback, outcome: outcomeStr, score, passed });
    } else {
      return res.status(400).json({ error: "Unknown task type" });
    }

  } catch (error) {
    console.error("submitTask error:", error);
    if (error.message === 'GEMINI_FAILURE' || error.message === 'JSON_PARSE_FAILURE') {
      return res.status(500).json({ error: "Failed to generate feedback. Please try again." });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};


export const submitExam = async (req, res) => {
  try {
    const { dayId } = req.params;
    const userId = req.userId;

    const session = await Session.findOne({ dayId, userId });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: "answers array is required" });
    }

    const roadmap = await Roadmap.findById(session.roadmapId);

    let questions = session.content?.examQuestions;
    if (!questions) {
      const { moduleNumber, weekNumber, dayNumber } = parseDayId(dayId);
      const dayData = getDayFromRoadmap(roadmap.roadmapJson, moduleNumber, weekNumber, dayNumber);
      questions = dayData?.examQuestions || [];
    }

    if (!questions || questions.length === 0) {
      return res.status(400).json({ error: "No exam questions found for this session" });
    }

    let correct = 0;
    const total = questions.length;
    const weakTopicsSet = new Set();
    const report = questions.map((q, idx) => {
      // const selectedIndex = answers[idx];
      const answer = answers.find(a => a.questionIndex === idx);
      const selectedIndex = answer ? answer.selectedIndex : -1;
      const isCorrect = selectedIndex === q.correctIndex;
      if (isCorrect) correct++;
      else {
        if (q.topicTag) weakTopicsSet.add(q.topicTag);
      }
      return {
        questionText: q.question,
        options: q.options,
        selectedIndex,
        correctIndex: q.correctIndex,
        isCorrect,
        topicTag: q.topicTag
      };
    });

    const score = (correct / total) * 100;
    const passed = score >= 80;
    const weakTopics = Array.from(weakTopicsSet);

    const progress = await Progress.findOne({ userId, roadmapId: roadmap._id });
    if (!progress) {
      return res.status(404).json({ error: "Progress not found" });
    }

    // Update progress.examAttempts
    const attemptNumber = (progress.examAttempts?.filter(a => a.dayId === dayId)?.length || 0) + 1;

    if (!progress.examAttempts) progress.examAttempts = [];

    progress.examAttempts.push({
      dayId: session.dayId,
      attemptNumber,
      score,
      passed,
      weakTopics,
      attemptedAt: new Date()
    });

    const { moduleNumber, weekNumber } = parseDayId(dayId);
    const currentWeekKey = `m${moduleNumber}-w${weekNumber}`;

    if (!progress.weeklyWeakTopics) progress.weeklyWeakTopics = {};
    if (!progress.weeklyWeakTopics[currentWeekKey]) {
      progress.weeklyWeakTopics[currentWeekKey] = [];
    }
    const existing = progress.weeklyWeakTopics[currentWeekKey];
    const combined = Array.from(new Set([...existing, ...weakTopics]));
    progress.weeklyWeakTopics[currentWeekKey] = combined;
    progress.markModified('weeklyWeakTopics'); // Required for Mongoose Mixed type

    if (!progress.allWeakTopics) progress.allWeakTopics = [];
    const combinedAllWeakTopics = new Set([...progress.allWeakTopics, ...weakTopics]);
    progress.allWeakTopics = Array.from(combinedAllWeakTopics);

    let nextAction = "";
    let feedback = "";

    session.status = passed ? "completed" : "failed";
    session.userSubmission = { answers, report, score, passed, weakTopics };
    session.completedAt = new Date();

    if (passed) {
      // FIX: Removed automatic progress advancement here to prevent double-advancement bug (Test 13).
      // The frontend will now call POST /progress/advance separately upon pass.
      nextAction = "advance";
      feedback = "Outstanding! You've passed the exam and demonstrated mastery of this week's topics. You are ready to move forward.";

      try {
        const aiResponse = await generateFeedback({
          isExam: true,
          score,
          report,
          outcome: 'positive'
        });
        feedback = aiResponse.replace(/OUTCOME:.*/im, '').trim();
      } catch (feedbackErr) {
        console.error("Exam pass feedback generation failed (non-fatal):", feedbackErr.message);
      }
      session.aiFeedback = feedback;

    } else {
      progress.currentDay = "Saturday"; // Still fallback to Saturday for revision
      nextAction = "revision";
      feedback = "You scored below 80%. We've prepared a targeted revision session for you. Review the weak topics and try the exam again.";

      try {
        const aiResponse = await generateFeedback({
          isExam: true,
          score,
          weakTopics: weakTopics.join(', '),
          report,
          outcome: 'needs_improvement'
        });
        feedback = aiResponse.replace(/OUTCOME:.*/im, '').trim();
      } catch (feedbackErr) {
        console.error("Exam fail feedback generation failed (non-fatal):", feedbackErr.message);
      }
      session.aiFeedback = feedback;

      // Generate retry lesson (Non-fatal)
      try {
        const examAnswerSummary = report.filter(r => !r.isCorrect).map(r => `Question: ${r.questionText} - User answered: ${r.options[r.selectedIndex]}, Correct: ${r.options[r.correctIndex]}`).join('; ');

        const retryContent = await generateLessonContent({
          isExamRetry: true,
          skillName: roadmap.skillName,
          weakTopics: weakTopics.join(', '),
          examAnswerSummary,
          attemptNumber
        });
        const revisionDayId = buildDayId(moduleNumber, weekNumber, 6); // 6 is Saturday

        let revisionSession = await Session.findOne({ userId, dayId: revisionDayId });
        if (revisionSession) {
          revisionSession.content = retryContent;
          revisionSession.status = "pending";
          revisionSession.userSubmission = null;
          revisionSession.aiFeedback = "";
          revisionSession.type = "Revision";
          await revisionSession.save();
        } else {
          await Session.create({
            userId,
            roadmapId: roadmap._id,
            dayId: revisionDayId,
            type: "Revision",
            content: retryContent,
            status: "pending"
          });
        }
      } catch (retryLessonErr) {
        console.error("Retry lesson generation failed (non-fatal):", retryLessonErr.message);
        // If AI fails here, the user might see an empty or old revision session, 
        // but we've already set their day to Saturday. 
      }
    }

    await session.save();
    await progress.save();

    return res.status(200).json({ score, passed, feedback, weakTopics, nextAction });

  }
  catch (error) {
    console.error("submitExam error:", error);
    if (error.message === 'GEMINI_FAILURE' || error.message === 'JSON_PARSE_FAILURE') {
      return res.status(500).json({ error: "Failed to generate AI feedback/revision. Please try again." });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};
