import api from './axiosInstance';

/**
 * Fetches or generates session content for a given day.
 * GET /session/:dayId?roadmapId=X
 * @returns { session: { _id, dayId, type, content, status, ... } }
 */
export const getSession = async (dayId, roadmapId) => {
  const res = await api.get(`/session/${dayId}`, { params: { roadmapId } });
  return res.data;
};

/**
 * Submits a task answer and receives AI feedback.
 * POST /session/:dayId/submit
 *
 * For text tasks: type="text", taskAnswer="string", mcqAnswers=null
 * For mcq tasks:  type="mcq",  taskAnswer=null,     mcqAnswers=[{questionIndex, selectedIndex}]
 *
 * @returns { feedback, outcome, score?, passed? }
 */
export const submitTask = async (dayId, { roadmapId, type, taskAnswer, mcqAnswers }) => {
  const res = await api.post(`/session/${dayId}/submit`, { roadmapId, type, taskAnswer, mcqAnswers });
  return res.data;
};

/**
 * Submits exam answers and receives scored result.
 * POST /session/:dayId/exam
 *
 * answers format: [{ questionIndex: 0, selectedIndex: 2 }, ...]
 *
 * @returns { score, passed, feedback, weakTopics, nextAction }
 */
export const submitExam = async (dayId, { roadmapId, answers }) => {
  const res = await api.post(`/session/${dayId}/exam`, { roadmapId, answers });
  return res.data;
};
