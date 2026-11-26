// All API routes in one place so the structure is easy to read.
const express = require('express');
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/auth');
const auth = require('../controllers/authController');
const profile = require('../controllers/profileController');
const plan = require('../controllers/planController');
const progress = require('../controllers/progressController');
const chat = require('../controllers/chatController');
const resources = require('../controllers/resourceController');
const tests = require('../controllers/testController');
const analytics = require('../controllers/analyticsController');

const router = express.Router();

// Basic protection against password guessing and AI-quota abuse
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, message: { message: 'Too many attempts, please try again later.' } });
const chatLimiter = rateLimit({ windowMs: 60 * 1000, limit: 15, message: { message: 'You are sending messages too fast. Please wait a minute.' } });

router.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Authentication
router.post('/auth/register', authLimiter, auth.register);
router.post('/auth/login', authLimiter, auth.login);
router.get('/auth/me', protect, auth.me);

// Profile & syllabus
router.get('/profile', protect, profile.getProfile);
router.put('/profile', protect, profile.updateProfile);
router.put('/profile/password', protect, profile.changePassword);
router.post('/profile/chapters', protect, profile.setChapterCompletion);
router.get('/syllabus', protect, profile.getSyllabus);

// Dashboard & analytics
router.get('/dashboard', protect, analytics.getDashboard);
router.get('/analytics', protect, analytics.getAnalytics);

// AI Study Assistant
router.get('/chat/status', protect, chat.status);
router.get('/chat', protect, chat.listConversations);
router.post('/chat/send', protect, chatLimiter, chat.sendMessage);
router.get('/chat/:id', protect, chat.getConversation);
router.delete('/chat/:id', protect, chat.deleteConversation);

// Study plan
router.get('/plan', protect, plan.getPlan);
router.get('/plan/tasks', protect, plan.getPlanTasks);
router.post('/plan/generate', protect, plan.generatePlan);
router.post('/plan/rebalance', protect, plan.rebalancePlan);

// Daily progress
router.get('/progress/day', protect, progress.getDay);
router.get('/progress/summary', protect, progress.getSummary);
router.put('/progress/note', protect, progress.saveNote);
router.patch('/tasks/:id', protect, progress.updateTask);

// Learning resources
router.get('/resources', protect, resources.getResources);
router.get('/resources/recommendations', protect, resources.getTopicRecommendations);
router.post('/resources/saved', protect, resources.saveVideo);
router.delete('/resources/saved/:id', protect, resources.deleteVideo);

// Mock tests
router.get('/tests', protect, tests.listTests);
router.get('/tests/topics/options', protect, tests.topicOptions);
router.post('/tests/topics', protect, tests.createTopicTest);
router.get('/tests/results/me', protect, tests.myResults);
router.get('/tests/results/:id', protect, tests.getResult);
router.get('/tests/:id', protect, tests.getTest);
router.post('/tests/:id/submit', protect, tests.submitTest);

module.exports = router;
