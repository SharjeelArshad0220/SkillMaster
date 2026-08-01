import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap', required: true },
  dayId: { type: String, required: true },
  type: { type: String, enum: ['Learning', 'Revision', 'Exam'], required: true },
  content: { type: mongoose.Schema.Types.Mixed, required: true },
  userSubmission: { type: mongoose.Schema.Types.Mixed, default: null },
  aiFeedback: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  generatedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null }
}, { timestamps: true });

// Enforce strict uniqueness per user, roadmap, and dayId to guarantee data integrity
sessionSchema.index({ userId: 1, roadmapId: 1, dayId: 1 }, { unique: true });

export default mongoose.model('Session', sessionSchema);
