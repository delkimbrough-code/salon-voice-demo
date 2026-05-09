require('dotenv').config();
const express = require('express');
const healthRouter = require('./routes/health');
const vapiRouter = require('./routes/vapi');

const app = express();
app.use(express.json());
app.use(healthRouter);
app.use(vapiRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SalonAnswer backend listening on port ${PORT}`));

module.exports = app;
