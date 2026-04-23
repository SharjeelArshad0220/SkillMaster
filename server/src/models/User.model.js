import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  firstName: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: { type: String, required: true, select: false },
  profile: {
    role: { type: String, enum: ['Student', 'Job Seeker', 'Other'] },
    currentLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
    learningStyle: { type: String, enum: ['Reading', 'Examples', 'Practice'] },
    goalClarity: { type: String, enum: ['Clear', 'General', 'Exploring'] }
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
