/*
 * YouTube Data API v3 search (optional). Results are cached in memory for
 * 6 hours to protect the free daily quota (each search costs 100 units).
 */
const axios = require('axios');
const env = require('../config/env');

const cache = new Map();
const TTL_MS = 6 * 60 * 60 * 1000;

function isConfigured() {
  return Boolean(env.YOUTUBE_API_KEY);
}

async function searchVideos(query, maxResults = 6) {
  if (!isConfigured()) {
    const e = new Error('YOUTUBE_API_KEY not configured');
    e.reason = 'YouTube API key is not configured, showing curated links instead';
    throw e;
  }
  const key = `${query}|${maxResults}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.videos;

  try {
    const { data } = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        type: 'video',
        q: query,
        maxResults,
        videoEmbeddable: 'true',
        safeSearch: 'strict',
        regionCode: 'IN',
        key: env.YOUTUBE_API_KEY,
      },
      timeout: 10000,
    });
    const videos = (data.items || [])
      .filter((it) => it.id && it.id.videoId)
      .filter((it, index, items) => items.findIndex((candidate) => candidate.id.videoId === it.id.videoId) === index)
      .map((it) => ({
        videoId: it.id.videoId,
        title: it.snippet.title,
        channel: it.snippet.channelTitle,
        description: it.snippet.description || '',
        thumbnail: it.snippet.thumbnails && (it.snippet.thumbnails.medium || it.snippet.thumbnails.default || {}).url,
        url: `https://www.youtube.com/watch?v=${it.id.videoId}`,
      }));
    cache.set(key, { at: Date.now(), videos });
    return videos;
  } catch (err) {
    const status = err.response && err.response.status;
    const e = new Error('YouTube API request failed');
    e.reason = status === 403
      ? 'YouTube API quota exceeded or key not permitted — showing curated links instead'
      : 'YouTube API could not be reached — showing curated links instead';
    throw e;
  }
}

// Extract an 11-character video ID from common YouTube URL formats
function parseVideoId(input) {
  if (!input) return null;
  const s = String(input).trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

module.exports = { searchVideos, isConfigured, parseVideoId };
