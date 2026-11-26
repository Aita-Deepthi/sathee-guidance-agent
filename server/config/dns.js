// Use reliable public DNS resolvers for MongoDB Atlas SRV lookups.
// This module must be loaded before any MongoDB connection is initialized.
const dns = require('node:dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);

