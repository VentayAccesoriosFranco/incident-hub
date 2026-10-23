const express = require('express');
const cors = require('cors');
const incidentsRouter = require('./routes/incidents');
const commentsRouter = require('./routes/comments');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'incident-hub-backend' });
});

app.use('/api/incidents/:id/comments', commentsRouter);
app.use('/api/incidents', incidentsRouter);

// JSON mal formado u otros errores
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ errors: ['JSON mal formado'] });
  }
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;