require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── MongoDB Atlas Connection ───────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err  => {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    });

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/books',  require('./routes/books'));
app.use('/api/users',  require('./routes/users'));
app.use('/api/issues', require('./routes/issues'));

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ message: '📚 Library Management API is running!', status: 'OK' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
