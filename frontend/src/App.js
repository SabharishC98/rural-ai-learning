import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, Trophy, Star, BookOpen, Brain, Zap, Target, Award, Download, CheckCircle, Clock, TrendingUp, Users, MessageSquare, Sparkles, Sun, Moon, Video, VideoOff, Mic, MicOff, PhoneOff, Calendar, Plus, Search, Send } from 'lucide-react';

// Offline-first storage
const OfflineStorage = {
  save: (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Storage error:', e);
      return false;
    }
  },
  get: (key) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Retrieval error:', e);
      return null;
    }
  }
};

// API Service
const API_URL = process.env.REACT_APP_API_URL || 'https://rural-ai-learning.onrender.com/api';
const APIService = {
  async explainConcept(topic) {
    try {
      const response = await fetch(`${API_URL}/ai/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      });
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return {
        text: "Offline mode: Using cached content. Connect to internet for AI-powered responses.",
        cached: true
      };
    }
  },

  async generateQuiz(topic, difficulty) {
    try {
      const response = await fetch(`${API_URL}/ai/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty })
      });
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return {
        questions: [{
          question: `What is ${topic}?`,
          options: ['Definition A', 'Definition B', 'Definition C', 'Definition D'],
          correct: 0
        }],
        cached: true
      };
    }
  },

  async registerUser(name) {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      return await response.json();
    } catch (error) {
      console.error('Registration Error:', error);
      return null;
    }
  },

  async getTeachers() {
    try {
      const response = await fetch(`${API_URL}/teachers`);
      return await response.json();
    } catch (error) {
      console.error('Get Teachers Error:', error);
      return { teachers: [] };
    }
  },

  async bookSession(sessionData) {
    try {
      const response = await fetch(`${API_URL}/sessions/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
      return await response.json();
    } catch (error) {
      console.error('Book Session Error:', error);
      return null;
    }
  },

  async completeSession(sessionId, data) {
    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('Complete Session Error:', error);
      return null;
    }
  },

  async becomeTeacher(teacherData) {
    try {
      const response = await fetch(`${API_URL}/teachers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherData)
      });
      return await response.json();
    } catch (error) {
      console.error('Become Teacher Error:', error);
      return null;
    }
  },

  async getLeaderboard() {
    try {
      const response = await fetch(`${API_URL}/leaderboard`);
      return await response.json();
    } catch (error) {
      console.error('Leaderboard Error:', error);
      return { leaderboard: [] };
    }
  }
};

// Video Conference Component
const VideoConference = ({ session, currentUser, onEndCall, onCompleteSession }) => {
  const [localStream, setLocalStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sessionDuration, setSessionDuration] = useState(0);
  const localVideoRef = useRef(null);

  useEffect(() => {
    initializeMedia();
    const timer = setInterval(() => {
      setSessionDuration(d => d + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Media access error:', error);
      alert('Please allow camera and microphone access for video calls');
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setAudioEnabled(!audioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    onEndCall();
  };

  const completeSession = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    onCompleteSession(session, sessionDuration);
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      setChatMessages([...chatMessages, {
        user: currentUser.name,
        message: newMessage,
        time: new Date().toLocaleTimeString()
      }]);
      setNewMessage('');
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isTeacher = session.teacherId === currentUser.id;

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col z-50">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">{session.topic}</h2>
          <p className="text-gray-400 text-sm">
            {isTeacher ? `Teaching ${session.studentName}` : `Learning from ${session.teacherName}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-red-600 text-white rounded-full font-medium">
            {formatDuration(sessionDuration)}
          </div>
          <div className="px-4 py-2 bg-green-600 text-white rounded-full font-medium">
            {isTeacher ? '+15 Points' : '-10 Points'}
          </div>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 flex gap-4 p-4">
        {/* Main Video Area */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          {/* Local Video */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 px-3 py-1 rounded">
              You ({isTeacher ? 'Teacher' : 'Student'})
            </div>
            {!videoEnabled && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <VideoOff className="w-16 h-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Remote Video (Simulated) */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-5xl font-bold">
                  {isTeacher ? session.studentName[0] : session.teacherName[0]}
                </span>
              </div>
              <p className="text-white font-medium">
                {isTeacher ? session.studentName : session.teacherName}
              </p>
            </div>
            <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 px-3 py-1 rounded">
              {isTeacher ? session.studentName : session.teacherName}
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="w-80 bg-gray-800 rounded-lg flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-white font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Session Chat
            </h3>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {chatMessages.map((msg, i) => (
              <div key={i} className="bg-gray-700 p-3 rounded-lg">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-white font-medium text-sm">{msg.user}</span>
                  <span className="text-gray-400 text-xs">{msg.time}</span>
                </div>
                <p className="text-gray-200 text-sm">{msg.message}</p>
              </div>
            ))}
            {chatMessages.length === 0 && (
              <p className="text-gray-400 text-center text-sm">No messages yet</p>
            )}
          </div>

          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 text-white p-2 rounded-lg outline-none text-sm"
              />
              <button
                onClick={sendMessage}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-gray-800 flex justify-center gap-4">
        <button
          onClick={toggleAudio}
          className={`p-4 rounded-full ${
            audioEnabled ? 'bg-gray-700' : 'bg-red-600'
          } text-white hover:opacity-80 transition`}
          title={audioEnabled ? 'Mute' : 'Unmute'}
        >
          {audioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full ${
            videoEnabled ? 'bg-gray-700' : 'bg-red-600'
          } text-white hover:opacity-80 transition`}
          title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {videoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </button>

        {isTeacher && (
          <button
            onClick={completeSession}
            className="px-6 py-4 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition flex items-center gap-2"
          >
            <CheckCircle className="w-6 h-6" />
            Complete & Earn 15 Points
          </button>
        )}

        <button
          onClick={endCall}
          className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition"
          title="End call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

// Main Component
const RuralAILearningPlatform = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [userProgress, setUserProgress] = useState({
    level: 1,
    points: 100,
    xp: 0,
    streak: 0,
    badges: [],
    completedLessons: [],
    totalPoints: 0,
    sessionsTeached: 0,
    sessionsAttended: 0
  });
  const [quizMode, setQuizMode] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  
  // P2P States
  const [p2pSessions, setP2pSessions] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [activeVideoCall, setActiveVideoCall] = useState(null);
  const [bookingModal, setBookingModal] = useState(null);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');

  const courses = [
    {
      id: 1,
      title: 'Basic Mathematics',
      icon: '➕',
      difficulty: 'Easy',
      xpReward: 50,
      lessons: [
        { id: 1, title: 'Addition & Subtraction', duration: '10 min', xp: 10 },
        { id: 2, title: 'Multiplication Tables', duration: '15 min', xp: 15 },
        { id: 3, title: 'Division Basics', duration: '12 min', xp: 12 }
      ]
    },
    {
      id: 2,
      title: 'English Grammar',
      icon: '📝',
      difficulty: 'Easy',
      xpReward: 60,
      lessons: [
        { id: 4, title: 'Parts of Speech', duration: '10 min', xp: 10 },
        { id: 5, title: 'Sentence Formation', duration: '12 min', xp: 12 },
        { id: 6, title: 'Tenses', duration: '15 min', xp: 15 }
      ]
    },
    {
      id: 3,
      title: 'Science Basics',
      icon: '🔬',
      difficulty: 'Medium',
      xpReward: 75,
      lessons: [
        { id: 7, title: 'Water Cycle', duration: '10 min', xp: 12 },
        { id: 8, title: 'Plant Life', duration: '12 min', xp: 14 },
        { id: 9, title: 'Simple Machines', duration: '15 min', xp: 16 }
      ]
    },
    {
      id: 4,
      title: 'Computer Basics',
      icon: '💻',
      difficulty: 'Medium',
      xpReward: 80,
      lessons: [
        { id: 10, title: 'Using a Computer', duration: '12 min', xp: 15 },
        { id: 11, title: 'Internet Safety', duration: '10 min', xp: 12 },
        { id: 12, title: 'Basic Typing', duration: '15 min', xp: 18 }
      ]
    }
  ];

  const badges = [
    { id: 1, name: 'First Steps', icon: '🎯', requirement: 'Complete first lesson', xpNeeded: 10 },
    { id: 2, name: 'Quick Learner', icon: '⚡', requirement: 'Complete 5 lessons', xpNeeded: 50 },
    { id: 3, name: 'Teaching Master', icon: '👨‍🏫', requirement: 'Teach 5 sessions', sessionsNeeded: 5 },
    { id: 4, name: 'Points Collector', icon: '💰', requirement: 'Earn 500 points', pointsNeeded: 500 },
    { id: 5, name: 'Community Helper', icon: '🤝', requirement: 'Help 10 students', studentsHelped: 10 }
  ];

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    loadUserData();
    loadTeachers();
    loadLeaderboard();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadUserData = () => {
    const savedUser = OfflineStorage.get('currentUser');
    const savedProgress = OfflineStorage.get('userProgress');
    const savedSessions = OfflineStorage.get('p2pSessions');
    
    if (savedUser) {
      setCurrentUser(savedUser);
      setUserProgress(savedProgress || {
        level: 1,
        points: 100,
        xp: 0,
        streak: 0,
        badges: [],
        completedLessons: [],
        totalPoints: 0,
        sessionsTeached: 0,
        sessionsAttended: 0
      });
      setP2pSessions(savedSessions || []);
    }
  };

  const loadTeachers = async () => {
    const cached = OfflineStorage.get('availableTeachers');
    if (cached) {
      setAvailableTeachers(cached);
    }

    if (isOnline) {
      const result = await APIService.getTeachers();
      if (result && result.teachers) {
        setAvailableTeachers(result.teachers);
        OfflineStorage.save('availableTeachers', result.teachers);
      }
    }
  };

  const loadLeaderboard = async () => {
    const cached = OfflineStorage.get('leaderboard');
    if (cached) {
      setLeaderboard(cached);
    }

    if (isOnline) {
      const result = await APIService.getLeaderboard();
      if (result && result.leaderboard) {
        setLeaderboard(result.leaderboard);
        OfflineStorage.save('leaderboard', result.leaderboard);
      }
    }
  };

  const handleLogin = async (name) => {
    if (isOnline) {
      const result = await APIService.registerUser(name);
      if (result && result.success) {
        setCurrentUser(result.user);
        setUserProgress(result.progress);
        OfflineStorage.save('currentUser', result.user);
        OfflineStorage.save('userProgress', result.progress);
        return;
      }
    }

    // Offline fallback
    const user = {
      id: Date.now(),
      name,
      joinDate: new Date().toISOString()
    };
    
    const progress = {
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

    setCurrentUser(user);
    setUserProgress(progress);
    OfflineStorage.save('currentUser', user);
    OfflineStorage.save('userProgress', progress);
  };

  const completeLesson = (lesson) => {
    const newXp = userProgress.xp + lesson.xp;
    const newLevel = Math.floor(newXp / 100) + 1;
    const newProgress = {
      ...userProgress,
      xp: newXp,
      level: newLevel,
      totalPoints: userProgress.totalPoints + lesson.xp,
      completedLessons: [...userProgress.completedLessons, lesson.id]
    };

    // Check for new badges
    const newBadges = [...userProgress.badges];
    badges.forEach(badge => {
      if (!newBadges.includes(badge.id)) {
        if (badge.xpNeeded && newXp >= badge.xpNeeded) {
          newBadges.push(badge.id);
        }
      }
    });
    newProgress.badges = newBadges;

    setUserProgress(newProgress);
    OfflineStorage.save('userProgress', newProgress);
  };

  const bookP2PSession = async (teacher, slot) => {
    if (userProgress.points < teacher.pointsPerSession) {
      alert(`Insufficient points! You need ${teacher.pointsPerSession} points. Teach a class to earn more points.`);
      return;
    }

    const sessionData = {
      studentId: currentUser.id,
      teacherId: teacher.id,
      topic: teacher.subjects[0],
      slot,
      studentName: currentUser.name
    };

    if (isOnline) {
      const result = await APIService.bookSession(sessionData);
      if (result && result.success) {
        const updatedSessions = [...p2pSessions, result.session];
        setP2pSessions(updatedSessions);
        setUserProgress(result.progress);
        OfflineStorage.save('p2pSessions', updatedSessions);
        OfflineStorage.save('userProgress', result.progress);
        setBookingModal(null);
        alert(result.message);
        return;
      }
    }

    // Offline fallback
    const session = {
      id: Date.now(),
      ...sessionData,
      teacherName: teacher.name,
      status: 'scheduled',
      scheduledAt: new Date().toISOString()
    };

    const updatedSessions = [...p2pSessions, session];
    setP2pSessions(updatedSessions);

    const newProgress = {
      ...userProgress,
      points: userProgress.points - teacher.pointsPerSession,
      sessionsAttended: (userProgress.sessionsAttended || 0) + 1
    };
    setUserProgress(newProgress);

    OfflineStorage.save('p2pSessions', updatedSessions);
    OfflineStorage.save('userProgress', newProgress);
    setBookingModal(null);
    alert(`Session booked! ${teacher.pointsPerSession} points deducted.`);
  };

  const startVideoCall = (session) => {
    setActiveVideoCall(session);
  };

  const endVideoCall = () => {
    setActiveVideoCall(null);
  };

  const completeVideoSession = async (session, duration) => {
    const isTeacher = session.teacherId === currentUser.id;

    if (isOnline && isTeacher) {
      const result = await APIService.completeSession(session.id, {
        duration,
        teacherId: currentUser.id
      });
      
      if (result && result.success) {
        const updatedSessions = p2pSessions.map(s =>
          s.id === session.id ? { ...s, status: 'completed', duration } : s
        );
        setP2pSessions(updatedSessions);
        setUserProgress(result.progress);
        OfflineStorage.save('p2pSessions', updatedSessions);
        OfflineStorage.save('userProgress', result.progress);
        setActiveVideoCall(null);
        alert(result.message);
        await loadLeaderboard();
        return;
      }
    }

    // Offline fallback
    const pointsChange = isTeacher ? 15 : 0;
    
    const updatedSessions = p2pSessions.map(s =>
      s.id === session.id ? { ...s, status: 'completed', duration } : s
    );
    setP2pSessions(updatedSessions);
    OfflineStorage.save('p2pSessions', updatedSessions);

    if (isTeacher) {
      const newProgress = {
        ...userProgress,
        points: userProgress.points + pointsChange,
        sessionsTeached: (userProgress.sessionsTeached || 0) + 1
      };

      // Check for teaching badges
      const newBadges = [...userProgress.badges];
      badges.forEach(badge => {
        if (!newBadges.includes(badge.id)) {
          if (badge.sessionsNeeded && newProgress.sessionsTeached >= badge.sessionsNeeded) {
            newBadges.push(badge.id);
          }
          if (badge.pointsNeeded && newProgress.points >= badge.pointsNeeded) {
            newBadges.push(badge.id);
          }
        }
      });
      newProgress.badges = newBadges;

      setUserProgress(newProgress);
      OfflineStorage.save('userProgress', newProgress);

      // Update leaderboard
      const updatedLeaderboard = [...leaderboard];
      const userIndex = updatedLeaderboard.findIndex(u => u.name === currentUser.name);
      if (userIndex >= 0) {
        updatedLeaderboard[userIndex].points = newProgress.points;
        updatedLeaderboard[userIndex].sessionsTeached = newProgress.sessionsTeached;
      } else {
        updatedLeaderboard.push({
          name: currentUser.name,
          points: newProgress.points,
          level: newProgress.level,
          sessionsTeached: newProgress.sessionsTeached,
          avatar: '🎓'
        });
      }
      updatedLeaderboard.sort((a, b) => b.points - a.points);
      setLeaderboard(updatedLeaderboard);
      OfflineStorage.save('leaderboard', updatedLeaderboard);

      alert(`Session completed! You earned ${pointsChange} points!`);
    } else {
      alert('Session completed! Thank you for learning.');
    }

    setActiveVideoCall(null);
  };

  const becomeTeacher = async () => {
    const teacherData = {
      userId: currentUser.id,
      name: currentUser.name,
      subjects: ['General Topics']
    };

    if (isOnline) {
      const result = await APIService.becomeTeacher(teacherData);
      if (result && result.success) {
        const updatedTeachers = [...availableTeachers, result.teacher];
        setAvailableTeachers(updatedTeachers);
        OfflineStorage.save('availableTeachers', updatedTeachers);
        alert(result.message);
        return;
      }
    }

    // Offline fallback
    const newTeacher = {
      id: currentUser.id,
      name: currentUser.name,
      subjects: ['General Topics'],
      rating: 0,
      sessionsGiven: 0,
      pointsPerSession: 10,
      availability: ['Mon-Fri 6PM-8PM'],
      avatar: '🎓'
    };

    const updatedTeachers = [...availableTeachers, newTeacher];
    setAvailableTeachers(updatedTeachers);
    OfflineStorage.save('availableTeachers', updatedTeachers);
    alert('You are now registered as a teacher! Students can book sessions with you.');
  };

  const startQuiz = async (course) => {
    setLoading(true);
    const quiz = await APIService.generateQuiz(course.title, course.difficulty);
    setCurrentQuiz({ ...quiz, courseId: course.id });
    setQuizMode(true);
    setQuizScore(0);
    setLoading(false);
  };

  const submitQuizAnswer = (questionIndex, answerIndex) => {
    const question = currentQuiz.questions[questionIndex];
    if (answerIndex === question.correct) {
      setQuizScore(quizScore + 1);
    }
    
    if (questionIndex === currentQuiz.questions.length - 1) {
      const totalXp = quizScore * 10;
      const newProgress = {
        ...userProgress,
        xp: userProgress.xp + totalXp,
        totalPoints: userProgress.totalPoints + totalXp
      };
      setUserProgress(newProgress);
      OfflineStorage.save('userProgress', newProgress);
      
      setTimeout(() => {
        alert(`Quiz completed! You scored ${quizScore}/${currentQuiz.questions.length} and earned ${totalXp} XP!`);
        setQuizMode(false);
        setCurrentQuiz(null);
      }, 1000);
    }
  };

  const getAIExplanation = async (topic) => {
    setLoading(true);
    const explanation = await APIService.explainConcept(topic);
    setAiExplanation(explanation);
    setLoading(false);
  };

  // Active Video Call
  if (activeVideoCall) {
    return (
      <VideoConference
        session={activeVideoCall}
        currentUser={currentUser}
        onEndCall={endVideoCall}
        onCompleteSession={completeVideoSession}
      />
    );
  }

  // Auth Screen
  if (!currentUser) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-green-50 to-blue-50'} flex items-center justify-center p-4`}>
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl p-8 max-w-md w-full`}>
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mb-4">
              <Brain className="w-16 h-16 text-white" />
            </div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-2`}>
              Rural AI Learning
            </h1>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
              Learn & Teach via Video - Earn Points!
            </p>
            
            <div className="flex items-center justify-center gap-2 mb-6">
              {isOnline ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full">
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm font-medium">Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm font-medium">Offline Mode</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter your name"
              id="userName"
              className={`w-full p-4 border-2 rounded-xl ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'
              } focus:border-blue-500 outline-none`}
            />
            
            <button
              onClick={() => {
                const name = document.getElementById('userName').value;
                if (name.trim()) handleLogin(name.trim());
              }}
              className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition transform hover:scale-105"
            >
              Start Learning 🚀
            </button>
          </div>

          <div className={`mt-6 space-y-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Video P2P teaching - earn 15 pts/session</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Learn from experts - spend 10 pts/session</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Works offline with auto-sync</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>AI-powered personalized learning</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Mode
  if (quizMode && currentQuiz) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 to-pink-50'} p-4`}>
        <div className="max-w-2xl mx-auto">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-xl p-8 mt-8`}>
            {currentQuiz.cached && (
              <div className="mb-4 p-3 bg-orange-100 text-orange-800 rounded-lg text-sm flex items-center gap-2">
                <WifiOff className="w-4 h-4" />
                Offline Mode: Using cached questions
              </div>
            )}
            
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Quiz Challenge
              </h2>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full">
                <Trophy className="w-5 h-5" />
                <span className="font-bold">{quizScore} / {currentQuiz.questions.length}</span>
              </div>
            </div>

            {currentQuiz.questions.map((q, qIndex) => (
              <div key={qIndex} className="mb-8">
                <p className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {qIndex + 1}. {q.question}
                </p>
                <div className="space-y-3">
                  {q.options.map((option, oIndex) => (
                    <button
                      key={oIndex}
                      onClick={() => submitQuizAnswer(qIndex, oIndex)}
                      className={`w-full p-4 text-left rounded-xl border-2 transition ${
                        darkMode 
                          ? 'border-gray-600 hover:border-blue-500 text-white' 
                          : 'border-gray-200 hover:border-blue-500'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const cardClass = darkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = darkMode ? 'text-white' : 'text-gray-800';
  const secondaryTextClass = darkMode ? 'text-gray-300' : 'text-gray-600';

  const filteredTeachers = availableTeachers.filter(t =>
    t.id !== currentUser.id &&
    (t.name.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
    t.subjects.some(s => s.toLowerCase().includes(teacherSearchQuery.toLowerCase())))
  );

  return (
    <div className={`min-h-screen ${bgClass}`}>
      {/* Booking Modal */}
      {bookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${cardClass} rounded-2xl shadow-2xl p-8 max-w-md w-full`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${textClass}`}>Book Session</h2>
              <button onClick={() => setBookingModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl">
                ✕
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl">{bookingModal.avatar}</div>
                <div>
                  <h3 className={`font-bold text-lg ${textClass}`}>{bookingModal.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-yellow-600">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{bookingModal.rating} ({bookingModal.sessionsGiven} sessions)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className={`text-sm ${secondaryTextClass}`}>Subjects:</p>
                <div className="flex flex-wrap gap-2">
                  {bookingModal.subjects.map((subject, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-red-50 rounded-lg mb-4">
                <p className="text-red-800 font-medium">Cost: {bookingModal.pointsPerSession} Points</p>
                <p className="text-sm text-red-600 mt-1">Your balance: {userProgress.points} points</p>
              </div>

              <div>
                <p className={`text-sm ${secondaryTextClass} mb-2`}>Available Slots:</p>
                <div className="space-y-2">
                  {bookingModal.availability.map((slot, i) => (
                    <button
                      key={i}
                      onClick={() => bookP2PSession(bookingModal, slot)}
                      className="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setBookingModal(null)}
              className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`${cardClass} border-b shadow-sm sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${textClass}`}>Rural AI Learn</h1>
                <p className="text-xs text-gray-500">P2P Video Teaching Platform</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
              >
                {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
              </button>

              {isOnline ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  <Wifi className="w-4 h-4" />
                  Online
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                  <WifiOff className="w-4 h-4" />
                  Offline
                </div>
              )}

              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full font-bold">
                <Trophy className="w-5 h-5" />
                {userProgress.points} pts
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={`font-bold text-sm ${textClass}`}>{currentUser.name}</p>
                  <p className="text-xs text-gray-500">Level {userProgress.level}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  {currentUser.name[0]}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className={secondaryTextClass}>XP Progress</span>
              <span className="font-bold text-blue-600">{userProgress.xp % 100} / 100 XP</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-500"
                style={{ width: `${(userProgress.xp % 100)}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className={`${cardClass} border-b`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {['home', 'courses', 'p2p-teach', 'sessions', 'leaderboard', 'badges'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium transition whitespace-nowrap ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : secondaryTextClass
                }`}
              >
                {tab === 'home' && 'Home'}
                {tab === 'courses' && 'Courses'}
                {tab === 'p2p-teach' && '🎥 P2P Teaching'}
                {tab === 'sessions' && 'My Sessions'}
                {tab === 'leaderboard' && 'Leaderboard'}
                {tab === 'badges' && 'Badges'}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`${cardClass} p-6 rounded-2xl shadow-sm`}>
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="w-8 h-8 text-yellow-500" />
                  <h3 className={`font-semibold ${textClass}`}>Points</h3>
                </div>
                <p className={`text-3xl font-bold ${textClass}`}>{userProgress.points}</p>
                <p className={`text-sm ${secondaryTextClass}`}>Current balance</p>
              </div>

              <div className={`${cardClass} p-6 rounded-2xl shadow-sm`}>
                <div className="flex items-center gap-3 mb-2">
                  <Video className="w-8 h-8 text-blue-500" />
                  <h3 className={`font-semibold ${textClass}`}>Taught</h3>
                </div>
                <p className={`text-3xl font-bold ${textClass}`}>{userProgress.sessionsTeached || 0}</p>
                <p className={`text-sm ${secondaryTextClass}`}>+15 pts each</p>
              </div>

              <div className={`${cardClass} p-6 rounded-2xl shadow-sm`}>
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-8 h-8 text-green-500" />
                  <h3 className={`font-semibold ${textClass}`}>Attended</h3>
                </div>
                <p className={`text-3xl font-bold ${textClass}`}>{userProgress.sessionsAttended || 0}</p>
                <p className={`text-sm ${secondaryTextClass}`}>-10 pts each</p>
              </div>

              <div className={`${cardClass} p-6 rounded-2xl shadow-sm`}>
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-8 h-8 text-purple-500" />
                  <h3 className={`font-semibold ${textClass}`}>Badges</h3>
                </div>
                <p className={`text-3xl font-bold ${textClass}`}>{userProgress.badges.length}</p>
                <p className={`text-sm ${secondaryTextClass}`}>earned</p>
              </div>
            </div>

            <div className={`${cardClass} p-6 rounded-2xl shadow-sm`}>
              <h3 className={`text-xl font-bold ${textClass} mb-4 flex items-center gap-2`}>
                <Sparkles className="w-6 h-6 text-yellow-500" />
                AI Learning Assistant
              </h3>
              
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  id="aiTopic"
                  placeholder="Ask about any topic (e.g., 'photosynthesis')..."
                  className={`flex-1 p-3 border-2 rounded-xl ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'
                  } outline-none`}
                />
                <button
                  onClick={() => {
                    const topic = document.getElementById('aiTopic').value;
                    if (topic.trim()) getAIExplanation(topic);
                  }}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? '...' : 'Ask AI'}
                </button>
              </div>

              {aiExplanation && (
                <div className={`p-4 ${darkMode ? 'bg-gray-700' : 'bg-blue-50'} rounded-xl`}>
                  {aiExplanation.cached && (
                    <div className="mb-2 text-sm text-orange-600 flex items-center gap-1">
                      <WifiOff className="w-4 h-4" />
                      Offline response
                    </div>
                  )}
                  <p className={darkMode ? 'text-gray-200' : 'text-gray-800'}>{aiExplanation.text}</p>
                </div>
              )}
            </div>

            <div className={`${cardClass} p-6 rounded-2xl shadow-sm bg-gradient-to-r from-green-500 to-blue-600 text-white`}>
              <h3 className="text-xl font-bold mb-2">💡 How Point System Works</h3>
              <div className="space-y-2 text-sm">
                <p>✅ Start with 100 points</p>
                <p>✅ Teach a video session: <strong>+15 points</strong></p>
                <p>✅ Attend a video session: <strong>-10 points</strong></p>
                <p>✅ Low on points? Teach more classes to earn!</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className={`${cardClass} p-6 rounded-2xl shadow-sm`}>
              <h2 className={`text-2xl font-bold ${textClass} mb-2`}>Self-Paced Courses</h2>
              <p className={secondaryTextClass}>Learn independently and earn XP</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map(course => (
                <div key={course.id} className={`${cardClass} p-6 rounded-2xl shadow-sm hover:shadow-lg transition`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{course.icon}</div>
                      <div>
                        <h3 className={`text-xl font-bold ${textClass}`}>{course.title}</h3>
                        <span className={`text-sm px-3 py-1 rounded-full ${
                          course.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {course.difficulty}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-yellow-600">
                        <Star className="w-5 h-5 fill-current" />
                        <span className="font-bold">{course.xpReward} XP</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {course.lessons.map(lesson => (
                      <div key={lesson.id} className={`p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                          {userProgress.completedLessons.includes(lesson.id) ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                          )}
                          <span className={`text-sm ${textClass}`}>{lesson.title}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {lesson.duration}
                          </span>
                          <span className="text-xs text-blue-600 font-medium">+{lesson.xp} XP</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const randomLesson = course.lessons[Math.floor(Math.random() * course.lessons.length)];
                        completeLesson(randomLesson);
                        alert(`Lesson completed! You earned ${randomLesson.xp} XP!`);
                      }}
                      className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition"
                    >
                      Start Learning
                    </button>
                    <button
                      onClick={() => startQuiz(course)}
                      disabled={loading}
                      className="px-4 py-3 bg-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition disabled:opacity-50"
                    >
                      <Trophy className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'p2p-teach' && (
          <div className="space-y-6">
            <div className={`${cardClass} p-6 rounded-2xl shadow-sm`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className={`text-2xl font-bold ${textClass} mb-2 flex items-center gap-2`}>
                    <Video className="w-6 h-6 text-red-600" />
                    Peer-to-Peer Video Teaching
                  </h2>
                  <p className={secondaryTextClass}>Book 1-on-1 video sessions with teachers</p>
                </div>
                <button
                  onClick={becomeTeacher}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:shadow-lg transition flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Become a Teacher
                </button>
              </div>
            </div>

            <div className={`${cardClass} p-6 rounded-2xl shadow-sm`}>
              <div className="flex gap-3 mb-4">
                <Search className="w-5 h-5 text-gray-400 mt-3" />
                <input
                  type="text"
                  placeholder="Search teachers by name or subject..."
                  value={teacherSearchQuery}
                  onChange={(e) => setTeacherSearchQuery(e.target.value)}
                  className={`flex-1 p-3 border-2 rounded-xl ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'
                  } outline-none`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeachers.map(teacher => (
                <div key={teacher.id} className={`${cardClass} p-6 rounded-2xl shadow-sm hover:shadow-lg transition`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-5xl">{teacher.avatar}</div>
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg ${textClass}`}>{teacher.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-yellow-600">
                        <Star className="w-4 h-4 fill-current" />
                        <span>{teacher.rating} ({teacher.sessionsGiven} sessions)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className={`text-sm ${secondaryTextClass} mb-2`}>Teaches:</p>
                    <div className="flex flex-wrap gap-2">
                      {teacher.subjects.map((subject, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800 font-medium">
                      💰 Cost: {teacher.pointsPerSession} points per session
                    </p>
                  </div>

                  <button
                    onClick={() => setBookingModal(teacher)}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-5 h-5" />
                    Book Session
                  </button>
                </div>
              ))}
            </div>

            {filteredTeachers.length === 0 && (
              <div className={`${cardClass} p-12 rounded-2xl shadow-sm text-center`}>
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className={secondaryTextClass}>No teachers found. Try a different search or become a teacher!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <div className={`${cardClass} p-6 rounded-2xl shadow-sm`}>
              <h2 className={`text-2xl font-bold ${textClass} mb-2`}>My P2P Sessions</h2>
              <p className={secondaryTextClass}>Your scheduled and completed video sessions</p>
            </div>

            {p2pSessions.length === 0 ? (
              <div className={`${cardClass} p-12 rounded-2xl shadow-sm text-center`}>
                <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className={secondaryTextClass}>No sessions yet. Book a session or start teaching!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {p2pSessions.filter(s => s.studentId === currentUser.id || s.teacherId === currentUser.id).map(session => {
                  const isTeacher = session.teacherId === currentUser.id;
                  return (
                    <div key={session.id} className={`${cardClass} p-6 rounded-2xl shadow-sm`}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className={`font-bold text-lg ${textClass} mb-1`}>{session.topic}</h3>
                          <p className={`text-sm ${secondaryTextClass}`}>
                            {isTeacher ? `Student: ${session.studentName}` : `Teacher: ${session.teacherName}`}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          session.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {session.status}
                        </span>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {session.slot}
                        </p>
                        {session.status === 'completed' && session.duration && (
                          <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <Clock className="w-4 h-4" />
                            Duration: {Math.floor(session.duration / 60)} minutes
                          </p>
                        )}
                      </div>

                      {session.status === 'scheduled' && (
                        <button
                          onClick={() => startVideoCall(session)}
                          className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 rounded-xl font-medium hover:shadow-lg transition flex items-center justify-center gap-2"
                        >
                          <Video className="w-5 h-5" />
                          Join Video Call
                        </button>
                      )}

                      {session.status === 'completed' && (
                        <div className="p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-800 font-medium">
                            {isTeacher ? '✓ Earned +15 points' : '✓ Completed (-10 points)'}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <div className={`${cardClass} p-6 rounded-2xl shadow-sm`}>
              <h2 className={`text-2xl font-bold ${textClass} mb-2 flex items-center gap-2`}>
                <TrendingUp className="w-6 h-6 text-green-500" />
                Community Leaderboard
              </h2>
              <p className={secondaryTextClass}>Top teachers and learners</p>
            </div>

            <div className={`${cardClass} rounded-2xl shadow-sm overflow-hidden`}>
              {leaderboard.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className={secondaryTextClass}>No leaderboard data yet</p>
                </div>
              ) : (
                leaderboard.map((user, index) => (
                  <div
                    key={index}
                    className={`p-4 flex items-center justify-between border-b ${
                      darkMode ? 'border-gray-700' : 'border-gray-100'
                    } ${user.name === currentUser.name ? (darkMode ? 'bg-gray-700' : 'bg-blue-50') : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 flex items-center justify-center font-bold text-lg ${
                        index === 0 ? 'text-yellow-500' :
                        index === 1 ? 'text-gray-400' :
                        index === 2 ? 'text-orange-500' :
                        secondaryTextClass
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-xl">
                        {user.avatar}
                      </div>
                      <div>
                        <p className={`font-bold ${textClass}`}>{user.name}</p>
                        <p className="text-sm text-gray-500">Sessions taught: {user.sessionsTeached || 0}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${textClass}`}>{user.points} pts</p>
                      <p className="text-sm text-gray-500">Level {user.level}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="space-y-6">
            <div className={`${cardClass} p-6 rounded-2xl shadow-sm`}>
              <h2 className={`text-2xl font-bold ${textClass} mb-2`}>Achievement Badges</h2>
              <p className={secondaryTextClass}>Earn badges by completing challenges</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {badges.map(badge => {
                const earned = userProgress.badges.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`${cardClass} p-6 rounded-2xl shadow-sm ${
                      earned ? 'ring-2 ring-yellow-400' : 'opacity-60'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`text-6xl mb-3 ${earned ? '' : 'grayscale'}`}>
                        {badge.icon}
                      </div>
                      <h3 className={`text-xl font-bold ${textClass} mb-2`}>
                        {badge.name}
                      </h3>
                      <p className={`text-sm ${secondaryTextClass} mb-3`}>
                        {badge.requirement}
                      </p>
                      {earned ? (
                        <div className="inline-block px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                          ✓ Earned!
                        </div>
                      ) : (
                        <div className="inline-block px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm">
                          Locked
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition transform hover:scale-110"
        title={isOnline ? 'Download for offline use' : 'Downloaded content available'}
      >
        {isOnline ? <Download className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
      </button>
    </div>
  );
};

export default RuralAILearningPlatform;