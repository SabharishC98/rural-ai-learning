const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const MODEL_ID = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS configuration for production
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Check Gemini API Key on startup
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const isGeminiConfigured = GEMINI_API_KEY && !GEMINI_API_KEY.includes('REPLACE');


// In-memory storage (for demo - use database in production)
let users = [];
let progress = {};
let p2pSessions = [];
let availableTeachers = [
  {
    id: 101,
    name: 'Ravi Kumar',
    subjects: ['Mathematics', 'Physics'],
    rating: 4.8,
    sessionsGiven: 45,
    pointsPerSession: 10,
    availability: ['Mon 6PM', 'Wed 7PM', 'Fri 5PM'],
    avatar: '👨‍🏫'
  },
  {
    id: 102,
    name: 'Priya Singh',
    subjects: ['English', 'Hindi'],
    rating: 4.9,
    sessionsGiven: 38,
    pointsPerSession: 10,
    availability: ['Tue 6PM', 'Thu 7PM', 'Sat 4PM'],
    avatar: '👩‍🏫'
  },
  {
    id: 103,
    name: 'Amit Patel',
    subjects: ['Science', 'Computer'],
    rating: 4.7,
    sessionsGiven: 32,
    pointsPerSession: 10,
    availability: ['Mon 7PM', 'Wed 6PM', 'Sat 5PM'],
    avatar: '👨‍🏫'
  }
];

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    message: 'Rural AI Learning API is running'
  });
});

// User Authentication
app.post('/api/auth/register', (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }

    const user = {
      id: Date.now(),
      name: name.trim(),
      joinDate: new Date().toISOString()
    };
    
    users.push(user);
    
    progress[user.id] = {
      level: 1,
      points: 100,
      xp: 0,
      streak: 0,
      badges: [],
      completedLessons: [],
      totalPoints: 0,
      sessionsTeached: 0,
      sessionsAttended: 0
    };
    
    console.log(`✅ User registered: ${user.name} (ID: ${user.id})`);
    
    res.json({ 
      success: true,
      user, 
      progress: progress[user.id] 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get user progress
app.get('/api/users/:id/progress', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const userProgress = progress[userId];
    
    if (!userProgress) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, progress: userProgress });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

// Complete lesson
app.post('/api/progress/complete-lesson', (req, res) => {
  try {
    const { userId, lessonId, xp } = req.body;
    
    if (!progress[userId]) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userProgress = progress[userId];
    userProgress.xp += xp;
    userProgress.level = Math.floor(userProgress.xp / 100) + 1;
    userProgress.totalPoints += xp;
    
    if (!userProgress.completedLessons.includes(lessonId)) {
      userProgress.completedLessons.push(lessonId);
    }
    
    console.log(`📚 Lesson completed: User ${userId}, Lesson ${lessonId}, +${xp} XP`);
    
    res.json({ success: true, progress: userProgress });
  } catch (error) {
    console.error('Complete lesson error:', error);
    res.status(500).json({ error: 'Failed to complete lesson' });
  }
});

// Get available teachers
app.get('/api/teachers', (req, res) => {
  try {
    res.json({ 
      success: true,
      teachers: availableTeachers 
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ error: 'Failed to get teachers' });
  }
});

// Book P2P session
app.post('/api/sessions/book', (req, res) => {
  try {
    const { studentId, teacherId, topic, slot, studentName } = req.body;
    
    if (!progress[studentId]) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    if (progress[studentId].points < 10) {
      return res.status(400).json({ 
        error: 'Insufficient points. You need 10 points. Teach a class to earn more!' 
      });
    }
    
    const teacher = availableTeachers.find(t => t.id === teacherId);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    const session = {
      id: Date.now(),
      studentId,
      teacherId,
      teacherName: teacher.name,
      studentName: studentName || 'Student',
      topic,
      slot,
      status: 'scheduled',
      scheduledAt: new Date().toISOString()
    };
    
    p2pSessions.push(session);
    
    // Deduct points
    progress[studentId].points -= 10;
    progress[studentId].sessionsAttended = (progress[studentId].sessionsAttended || 0) + 1;
    
    console.log(`📅 Session booked: ${teacher.name} teaching ${studentName} - Topic: ${topic}`);
    
    res.json({ 
      success: true,
      session, 
      progress: progress[studentId],
      message: 'Session booked successfully! 10 points deducted.'
    });
  } catch (error) {
    console.error('Book session error:', error);
    res.status(500).json({ error: 'Failed to book session' });
  }
});

// Get user sessions
app.get('/api/sessions/:userId', (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const userSessions = p2pSessions.filter(
      s => s.studentId === userId || s.teacherId === userId
    );
    
    res.json({ 
      success: true,
      sessions: userSessions 
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

// Complete P2P session
app.post('/api/sessions/:id/complete', (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const { duration, teacherId } = req.body;
    
    const sessionIndex = p2pSessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    p2pSessions[sessionIndex].status = 'completed';
    p2pSessions[sessionIndex].duration = duration;
    p2pSessions[sessionIndex].completedAt = new Date().toISOString();
    
    // Award points to teacher
    if (progress[teacherId]) {
      progress[teacherId].points += 15;
      progress[teacherId].sessionsTeached = (progress[teacherId].sessionsTeached || 0) + 1;
      
      // Update teacher stats
      const teacherIndex = availableTeachers.findIndex(t => t.id === teacherId);
      if (teacherIndex !== -1) {
        availableTeachers[teacherIndex].sessionsGiven += 1;
      }
      
      console.log(`✅ Session completed: Teacher ${teacherId} earned 15 points`);
    }
    
    res.json({ 
      success: true,
      session: p2pSessions[sessionIndex], 
      progress: progress[teacherId],
      message: 'Session completed! Teacher earned 15 points.'
    });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

// Register as teacher
app.post('/api/teachers/register', (req, res) => {
  try {
    const { userId, name, subjects } = req.body;
    
    const existingTeacher = availableTeachers.find(t => t.id === userId);
    if (existingTeacher) {
      return res.status(400).json({ 
        error: 'You are already registered as a teacher' 
      });
    }
    
    const newTeacher = {
      id: userId,
      name,
      subjects: subjects || ['General Topics'],
      rating: 0,
      sessionsGiven: 0,
      pointsPerSession: 10,
      availability: ['Mon-Fri 6PM-8PM'],
      avatar: '🎓'
    };
    
    availableTeachers.push(newTeacher);
    
    console.log(`👨‍🏫 New teacher registered: ${name}`);
    
    res.json({ 
      success: true,
      teacher: newTeacher,
      message: 'You are now a teacher! Students can book sessions with you.'
    });
  } catch (error) {
    console.error('Register teacher error:', error);
    res.status(500).json({ error: 'Failed to register as teacher' });
  }
});

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
  try {
    const board = Object.keys(progress).map(userId => {
      const user = users.find(u => u.id == userId);
      return {
        userId: parseInt(userId),
        name: user?.name || 'Unknown',
        points: progress[userId].points,
        level: progress[userId].level,
        sessionsTeached: progress[userId].sessionsTeached || 0,
        avatar: '🎓'
      };
    }).sort((a, b) => b.points - a.points);
    
    res.json({ 
      success: true,
      leaderboard: board 
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// AI - Explain concept
// AI - Explain concept (robust)
app.post('/api/ai/explain', async (req, res) => {
  try {
    // defensive: avoid destructuring error if no body
    const body = req.body || {};
    const topic = body.topic && body.topic.trim();

    console.log('🔔 /api/ai/explain called - headers:', req.headers);
    console.log('🔔 /api/ai/explain body:', req.body);

    if (!topic) {
      return res.status(400).json({
        error: 'Missing or empty "topic" in request body. Example: { "topic": "photosynthesis" }'
      });
    }

    if (!isGeminiConfigured) {
      console.log('⚠️ Gemini API key not configured');
      return res.status(200).json({
        text: `${topic} is an important concept. Please configure your Gemini API key in backend/.env to get detailed AI-powered explanations.`,
        cached: true
      });
    }

    console.log(`🤖 AI explaining: ${topic}`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${GEMINI_API_KEY}`;

const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{
      parts: [{
        text: `Explain ${topic} in simple terms for rural students with limited resources. Use daily-life examples. Keep it under 150 words.`
      }]
    }]
  })
});
    

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', response.status, errorText);
      return res.status(502).json({
        error: 'AI provider error',
        details: errorText,
        cached: true,
        text: `Could not fetch AI response for "${topic}".`
      });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('Gemini returned unexpected structure:', data);
      return res.status(502).json({
        error: 'Invalid AI response format',
        cached: true
      });
    }

    console.log(`✅ AI response received (${text.length} chars)`);
    res.json({ text, cached: false });

  } catch (error) {
    console.error('❌ AI explain error:', error);
    res.status(500).json({
      text: "I'm having trouble connecting to the AI service right now. Please check your Gemini API configuration and network.",
      cached: true,
      error: error.message || String(error)
    });
  }
});

// ... (keep rest of the code) ...

// Start server with better logging


// AI - Generate quiz
app.post('/api/ai/quiz', async (req, res) => {
  try {
    const { topic, difficulty } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey.includes('REPLACE')) {
      return res.json({
        questions: [
          {
            question: `What is the basic concept of ${topic}?`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correct: 0
          },
          {
            question: `How is ${topic} used in daily life?`,
            options: ['Use case 1', 'Use case 2', 'Use case 3', 'Use case 4'],
            correct: 1
          },
          {
            question: `What is an example of ${topic}?`,
            options: ['Example A', 'Example B', 'Example C', 'Example D'],
            correct: 2
          }
        ],
        cached: true
      });
    }
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Create 3 ${difficulty} multiple choice questions about ${topic} for rural students. Format each question EXACTLY as: Question text here|Option A text|Option B text|Option C text|Option D text|0 (where 0-3 is the correct answer index). Put each question on a new line. Make questions simple and practical.`
            }]
          }]
        })
      }
    );
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    const lines = text.split('\n').filter(l => l.includes('|') && l.split('|').length >= 6);
    
    const questions = lines.slice(0, 3).map(line => {
      const parts = line.split('|').map(p => p.trim());
      return {
        question: parts[0],
        options: [parts[1], parts[2], parts[3], parts[4]],
        correct: parseInt(parts[5]) || 0
      };
    });
    
    if (questions.length === 0) {
      throw new Error('No valid questions generated');
    }
    
    console.log(`🎯 Quiz generated: ${topic} (${questions.length} questions)`);
    
    res.json({ 
      questions: questions, 
      cached: false 
    });
  } catch (error) {
    console.error('AI quiz error:', error.message);
    res.json({
      questions: [
        {
          question: `What is ${topic}?`,
          options: ['Definition A', 'Definition B', 'Definition C', 'Definition D'],
          correct: 0
        },
        {
          question: `Where is ${topic} used?`,
          options: ['Place 1', 'Place 2', 'Place 3', 'Place 4'],
          correct: 1
        },
        {
          question: `Why is ${topic} important?`,
          options: ['Reason A', 'Reason B', 'Reason C', 'Reason D'],
          correct: 2
        }
      ],
      cached: true
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 RURAL AI LEARNING PLATFORM - BACKEND SERVER');
  console.log('='.repeat(60));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎓 P2P Video Teaching: ACTIVE`);
  console.log(`💰 Points System: Teach (+15 pts) | Learn (-10 pts)`);
  
  if (isGeminiConfigured) {
    console.log(`🤖 AI Powered: ✅ ENABLED (Key: ${GEMINI_API_KEY.substring(0, 10)}...)`);
  } else {
    console.log(`🤖 AI Powered: ⚠️ OFFLINE MODE - Configure GEMINI_API_KEY in .env`);
    console.log(`📝 Get free key: https://aistudio.google.com/app/apikey`);
  }
  
  console.log('='.repeat(60) + '\n');
});

module.exports = app;