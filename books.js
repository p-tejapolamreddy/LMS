const express = require('express');
const router  = express.Router();
const Book    = require('../models/Book');
const auth    = require('../middleware/auth');

// ── GET /api/books ─────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
    try {
        const books = await Book.find().sort({ createdAt: -1 });
        res.json(books);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// ── GET /api/books/:id ─────────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ msg: 'Book not found' });
        res.json(book);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// ── POST /api/books ────────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
    try {
        const { title, author, isbn, category, quantity, shelf, publisher, publicationYear, description } = req.body;

        if (!title || !author || !isbn)
            return res.status(400).json({ msg: 'Title, author and ISBN are required' });

        const existing = await Book.findOne({ isbn });
        if (existing)
            return res.status(400).json({ msg: 'A book with this ISBN already exists' });

        const qty  = parseInt(quantity) || 1;
        const book = new Book({
            title, author, isbn,
            category:        category        || 'General',
            quantity:        qty,
            available:       qty,
            shelf:           shelf           || '',
            publisher:       publisher       || '',
            publicationYear: publicationYear || '',
            description:     description     || ''
        });
        await book.save();
        res.status(201).json(book);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ── PUT /api/books/:id ─────────────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
    try {
        const book = await Book.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        if (!book) return res.status(404).json({ msg: 'Book not found' });
        res.json(book);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// ── DELETE /api/books/:id ──────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
    try {
        const book = await Book.findByIdAndDelete(req.params.id);
        if (!book) return res.status(404).json({ msg: 'Book not found' });
        res.json({ msg: 'Book deleted successfully' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
