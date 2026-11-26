/*
 * Seeds reference data only: syllabus + mock-test question bank.
 * (No fake student activity is ever seeded.)
 *
 *   npm run seed          -> replace syllabus and mock tests with the files in /data
 *   (server start)        -> seeds automatically if the collections are empty
 */
require('../config/dns');
const mongoose = require('mongoose');
const Syllabus = require('../models/Syllabus');
const MockTest = require('../models/MockTest');
const syllabusData = require('./syllabus');
const testData = require('./questions');

async function seedReferenceData({ force = false } = {}) {
  const [sCount, tCount] = await Promise.all([Syllabus.countDocuments(), MockTest.countDocuments()]);

  if (force || sCount === 0) {
    await Syllabus.deleteMany({});
    await Syllabus.insertMany(syllabusData);
    console.log(`Seeded syllabus: ${syllabusData.length} exam/subject entries`);
  }
  if (force || tCount === 0) {
    // Note: replacing tests keeps old TestResults but their test reference may dangle;
    // results also store testTitle so history still displays correctly.
    await MockTest.deleteMany({});
    await MockTest.insertMany(testData);
    console.log(`Seeded mock tests: ${testData.length} tests`);
  }
}

module.exports = { seedReferenceData };

// Run directly: node data/seed.js
if (require.main === module) {
  require('../config/env');
  const connectDB = require('../config/db');
  connectDB()
    .then(() => seedReferenceData({ force: true }))
    .then(() => mongoose.disconnect())
    .then(() => console.log('Seeding complete.'))
    .catch((err) => {
      console.error('Seeding failed:', err.message);
      process.exit(1);
    });
}
