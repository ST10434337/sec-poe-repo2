const pino = require('pino');

const targets = [
  // Always log to console too
  { target: 'pino/file', level: 'info', options: { destination: 1 } },
];

// Only ship to Loki when configured
if (process.env.LOKI_HOST) {
  targets.push({
    target: 'pino-loki',
    level: 'info',
    options: {
      host: process.env.LOKI_HOST,
      basicAuth: {
        username: process.env.LOKI_USER,
        password: process.env.LOKI_API_KEY,
      },
      labels: { app: 'hustlehub-api', env: process.env.NODE_ENV || 'development' },
      batching: true,
      interval: 5, // seconds
    },
  });
}

module.exports = pino(
  {
    name: 'hustlehub-api',
    level: process.env.LOG_LEVEL || 'info',
    redact: ['req.headers.authorization', 'req.headers.cookie'],
  },
  pino.transport({ targets })
);