const AppError = require('../utils/AppError');
const { getProfileOrFail } = require('./profileController');
const youtube = require('../services/youtube');
const { OFFICIAL_PORTALS, youtubeSearchUrl } = require('../data/resources');
const { EXAMS } = require('../utils/constants');
const DailyTask = require('../models/DailyTask');

// GET /api/resources?exam=&subject=&chapter=
async function getResources(req, res) {
  const profile = await getProfileOrFail(req.user._id);
  const exam = EXAMS.includes(req.query.exam) ? req.query.exam : profile.exam;
  const { subject, chapter } = req.query;
  if (!subject || !chapter) throw new AppError('Please choose a subject and a chapter', 400);

  const saved = profile.savedVideos.filter((v) => v.subject === subject && v.chapter === chapter);
  let videos = [];
  let source = 'curated';
  let notice = null;
  try {
    videos = await youtube.searchVideos(`${chapter} ${subject} ${exam} lecture`);
    source = 'youtube-api';
  } catch (err) {
    notice = err.reason;
  }

  res.json({
    exam, subject, chapter, source, notice,
    videos,           // live YouTube API results (embeddable), empty without a key
    savedVideos: saved, // videos this student pinned to the chapter
    searchUrl: youtubeSearchUrl(exam, subject, chapter),
    portals: OFFICIAL_PORTALS,
  });
}

// GET /api/resources/recommendations?taskId=
// The task is resolved server-side so recommendations always use the student's
// own scheduled subject, chapter, and topic.
async function getTopicRecommendations(req, res) {
  const taskId = String(req.query.taskId || '').trim();
  if (!taskId || taskId.length > 100) throw new AppError('A scheduled learning task is required', 400);
  const [profile, task] = await Promise.all([
    getProfileOrFail(req.user._id),
    DailyTask.findOne({ _id: taskId, user: req.user._id }).select('subject chapter topic').lean(),
  ]);
  if (!task) throw new AppError('Learning task not found', 404);
  if (!task.subject || task.subject === 'Mixed' || !task.chapter) {
    return res.json({ exam: profile.exam, subject: task.subject, chapter: task.chapter, topic: task.topic || '', videos: [], notice: 'This task does not have a specific chapter for video recommendations.' });
  }

  const topic = String(task.topic || '').trim().slice(0, 160);
  const chapter = String(task.chapter).trim().slice(0, 160);
  const query = `${topic ? `${topic} ` : ''}${chapter} ${task.subject} ${profile.exam} lecture explanation`;
  let videos = [];
  let notice = null;
  try {
    videos = await youtube.searchVideos(query, 5);
  } catch (err) {
    notice = err.reason || 'Video recommendations are temporarily unavailable.';
  }
  res.json({ exam: profile.exam, subject: task.subject, chapter, topic, query, videos, notice });
}

// POST /api/resources/saved  { subject, chapter, url, title }
async function saveVideo(req, res) {
  const { subject, chapter, url, title } = req.body;
  if (!subject || !chapter) throw new AppError('Subject and chapter are required', 400);
  const videoId = youtube.parseVideoId(url);
  if (!videoId) throw new AppError('Please paste a valid YouTube video link', 400);
  const profile = await getProfileOrFail(req.user._id);
  if (profile.savedVideos.some((v) => v.videoId === videoId && v.chapter === chapter)) {
    throw new AppError('This video is already pinned to this chapter', 409);
  }
  profile.savedVideos.push({ subject, chapter, videoId, title: String(title || 'My saved video').slice(0, 150) });
  await profile.save();
  res.status(201).json({ savedVideos: profile.savedVideos.filter((v) => v.chapter === chapter && v.subject === subject) });
}

// DELETE /api/resources/saved/:id
async function deleteVideo(req, res) {
  const profile = await getProfileOrFail(req.user._id);
  const before = profile.savedVideos.length;
  profile.savedVideos = profile.savedVideos.filter((v) => String(v._id) !== req.params.id);
  if (profile.savedVideos.length === before) throw new AppError('Saved video not found', 404);
  await profile.save();
  res.json({ message: 'Removed' });
}

module.exports = { getResources, getTopicRecommendations, saveVideo, deleteVideo };
