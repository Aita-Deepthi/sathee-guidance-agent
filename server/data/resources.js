/*
 * Learning resources (fallback dataset).
 *
 * We deliberately do NOT hardcode individual YouTube video IDs, because we
 * cannot guarantee that unverified IDs exist or stay online. Instead:
 *   1. With YOUTUBE_API_KEY set, real videos are fetched live from the
 *      YouTube Data API v3 and embedded.
 *   2. Without a key, each chapter gets a YouTube *search* link (always valid)
 *      plus official free study portals below.
 *   3. Students can pin any YouTube video they trust to a chapter; pinned
 *      videos are embedded on the Resources page.
 */
const OFFICIAL_PORTALS = [
  {
    title: 'SATHEE — official free preparation portal (IIT Kanpur & Ministry of Education)',
    url: 'https://sathee.iitk.ac.in/',
    description: 'Free lectures, mock tests and study material for JEE, NEET and other exams.',
  },
  {
    title: 'NCERT Textbooks (official)',
    url: 'https://ncert.nic.in/textbook.php',
    description: 'Free NCERT Class 11 and 12 textbooks — the foundation for JEE and NEET.',
  },
];

function youtubeSearchUrl(exam, subject, chapter) {
  const q = `${chapter} ${subject} ${exam} lecture`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

module.exports = { OFFICIAL_PORTALS, youtubeSearchUrl };
