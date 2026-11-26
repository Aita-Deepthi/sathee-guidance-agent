// Central error handler: turns thrown errors into clean JSON responses.
const env = require('../config/env');

function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong';

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    message = 'This email is already registered.';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON in request body';
  }

  if (status >= 500) console.error(err);
  res.status(status).json({
    message: status >= 500 && env.NODE_ENV === 'production' ? 'Internal server error' : message,
  });
}

module.exports = { notFound, errorHandler };
