require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const itemsRouter = require('./routes/items');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;

if (!process.env.JWT_SECRET) {
  console.warn(
    'WARNING: JWT_SECRET is not set in your .env file. Using an insecure default — do NOT do this in production.'
  );
  process.env.JWT_SECRET = 'dev-secret-change-me';
}

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/items', itemsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', dbState: mongoose.connection.readyState });
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
