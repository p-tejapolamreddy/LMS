const express = require('express');
const router  = express.Router();
const Issue   = require('../models/Issue');
const Book    = require('../models/Book');
const User    = require('../models/User');
const auth    = require('../middleware/auth');

const FINE_PER_DAY = 10; // ₹10 per day overdue

// ── GET /api/issues ────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
    try {
        const issues = await Issue.find()
            .populate('book', 'title author isbn')
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 });
        res.json(issues);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ── GET /api/issues/overdue ────────────────────────────────────────────────────
router.get('/overdue', auth, async (req, res) => {
    try {
        const overdue = await Issue.find({
            status:  'issued',
            dueDate: { $lt: new Date() }
        })
            .populate('book', 'title author isbn')
            .populate('user', 'name email phone')
            .sort({ dueDate: 1 });
        res.json(overdue);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// ── GET /api/issues/report ─────────────────────────────────────────────────────
router.get('/report', auth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = {};
        if (startDate && endDate) {
            query.issueDate = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            };
        }
        const issues = await Issue.find(query)
            .populate('book', 'title author isbn')
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 });
        res.json(issues);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// ── GET /api/issues/:id ────────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id)
            .populate('book', 'title author isbn')
            .populate('user', 'name email phone');
        if (!issue) return res.status(404).json({ msg: 'Issue record not found' });
        res.json(issue);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// ── POST /api/issues/issue ─────────────────────────────────────────────────────
router.post('/issue', auth, async (req, res) => {
    try {
        const { bookId, userId, dueDate } = req.body;

        if (!bookId || !userId || !dueDate)
            return res.status(400).json({ msg: 'Book, user and due date are required' });

        const book = await Book.findById(bookId);
        if (!book)             return res.status(404).json({ msg: 'Book not found' });
        if (book.available <= 0) return res.status(400).json({ msg: 'No copies available for this book' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const issue = new Issue({
            book:      bookId,
            user:      userId,
            issueDate: new Date(),
            dueDate:   new Date(dueDate),
            status:    'issued'
        });
        await issue.save();

        // Decrement available count
        book.available -= 1;
        await book.save();

        await issue.populate('book', 'title author isbn');
        await issue.populate('user', 'name email');

        res.status(201).json(issue);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ── POST /api/issues/return/:id ────────────────────────────────────────────────
router.post('/return/:id', auth, async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id).populate('book');
        if (!issue) return res.status(404).json({ msg: 'Issue record not found' });
        if (issue.status === 'returned')
            return res.status(400).json({ msg: 'Book has already been returned' });

        const today   = new Date();
        const dueDate = new Date(issue.dueDate);
        let fine = 0;
        if (today > dueDate) {
            const daysLate = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
            fine = daysLate * FINE_PER_DAY;
        }

        issue.status     = 'returned';
        issue.returnDate = today;
        issue.fine       = fine;
        await issue.save();

        // Restore available count
        const book = await Book.findById(issue.book._id || issue.book);
        if (book) {
            book.available = Math.min(book.available + 1, book.quantity);
            await book.save();
        }

        res.json({ msg: 'Book returned successfully', fine, issue });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
