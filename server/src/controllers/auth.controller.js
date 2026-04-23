import bcrypt from 'bcryptjs';
import User from '../models/User.model.js';
import Roadmap from '../models/Roadmap.model.js';
import { createToken } from '../utils/dayHelpers.js';

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    const emailLower = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: emailLower });
    
    if (existingUser) {
      return res.status(409).json({ error: "Email is already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const firstName = name.trim().split(' ')[0];

    const user = await User.create({
      name: name.trim(),
      firstName,
      email: emailLower,
      password: hashedPassword
    });

    const token = createToken(user._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        firstName: user.firstName,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const emailLower = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailLower }).select('+password');

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const roadmap = await Roadmap.findOne({ userId: user._id });
    const hasRoadmap = !!roadmap;

    const token = createToken(user._id);

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        firstName: user.firstName,
        email: user.email
      },
      hasRoadmap
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const roadmap = await Roadmap.findOne({ userId: user._id });
    const hasRoadmap = !!roadmap;

    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        firstName: user.firstName,
        email: user.email
      },
      hasRoadmap
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};
