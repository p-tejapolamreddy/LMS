const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const auth    = require('../middleware/auth');

// ── GET /api/users ─────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// ── GET /api/users/:id ─────────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// ── PUT /api/users/:id ─────────────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, phone, address, role, isActive, barcode } = req.body;
        const updates = {};
        if (name     !== undefined) updates.name     = name;
        if (phone    !== undefined) updates.phone    = phone;
        if (address  !== undefined) updates.address  = address;
        if (role     !== undefined) updates.role     = role;
        if (isActive !== undefined) updates.isActive = isActive;
        if (barcode  !== undefined) updates.barcode  = barcode;

        const user = await User.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// ── DELETE /api/users/:id ──────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json({ msg: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
