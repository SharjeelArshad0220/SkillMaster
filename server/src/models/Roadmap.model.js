import mongoose from 'mongoose';

const roadmapSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skillName: { type: String, required: true },
  setupData: { type: mongoose.Schema.Types.Mixed, required: true },
  roadmapJson: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

roadmapSchema.index({ userId: 1 });

export default mongoose.model('Roadmap', roadmapSchema);
