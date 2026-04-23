import mongoose from 'mongoose';

const completedDaySchema = new mongoose.Schema({
  dayId: { type: String, required: true },
  type: { type: String, enum: ['Learning', 'Revision', 'Exam'], required: true },
  status: { type: String, enum: ['completed', 'failed'], required: true },
  completedAt: { type: Date, required: true }
}, { _id: false });

const examAttemptSchema = new mongoose.Schema({
  dayId: { type: String, required: true },
  attemptNumber: { type: Number, required: true },
  score: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  weakTopics: { type: [String], default: [] },
  attemptedAt: { type: Date, required: true }
}, { _id: false });

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap', required: true },
  currentModule: { type: Number, required: true },
  currentWeek: { type: Number, required: true },
  currentDay: { type: String, required: true },
  weeklyWeakTopics: { type: mongoose.Schema.Types.Mixed, default: {} },
  allWeakTopics: { type: [String], default: [] },
  completedDays: { type: [completedDaySchema], default: [] },
  examAttempts: { type: [examAttemptSchema], default: [] }
}, { timestamps: true });

progressSchema.index({ userId: 1, roadmapId: 1 });

export default mongoose.model('Progress', progressSchema);
