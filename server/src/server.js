const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');

const app = express();

// ─── Middleware ───
app.use(cors(config.cors));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Request logging (dev only) ───
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ─── Routes ───
app.use('/api', routes);

// ─── 404 Handler ───
app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// ─── Global Error Handler ───
app.use((err, req, res, _next) => {
  console.error('[Server Error]', err.message);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ error: err.message });
  }

  if (err.message && err.message.includes('Unsupported audio format')) {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal server error.' });
});

// ─── Start ───
app.listen(config.port, () => {
  console.log(`\n🎙️  AccordVoice API running on http://localhost:${config.port}`);
  console.log(`   Health: http://localhost:${config.port}/api/health`);
  console.log(`   Environment: ${config.nodeEnv}\n`);
});

module.exports = app;
