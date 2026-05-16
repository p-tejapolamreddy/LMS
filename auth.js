const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'library_jwt_secret_key_2024';

// ── POST /api/auth/signup ──────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, phone, address, role, barcode } = req.body;

        if (!name || !email || !password)
            return res.status(400).json({ msg: 'Name, email and password are required' });

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing)
            return res.status(400).json({ msg: 'User with this email already exists' });

        const user = new User({
            name,
            email:    email.toLowerCase(),
            password,
            phone:    phone   || '',
            address:  address || '',
            role:     role    || 'member',
            barcode:  barcode || ''
        });
        await user.save();

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error('Signup error:', err.message);
        res.status(500).json({ msg: 'Server error during registration' });
    }
});

// ── POST /api/auth/barcode-login ──────────────────────────────────────────────
router.post('/barcode-login', async (req, res) => {
    try {
        const { barcode } = req.body;
        console.log('Barcode Login Attempt:', barcode);
        
        if (!barcode) return res.status(400).json({ msg: 'Barcode is required' });

        let user = await User.findOne({ barcode: barcode.toString() });
        if (!user) {
            console.log('No user found, creating new user for barcode:', barcode);
            // Create a new user automatically for any scanned barcode
            user = new User({
                name: `Scanned User ${barcode.toString().substring(0, 4)}`,
                email: `user_${barcode}@library.local`,
                password: barcode.toString(),
                barcode: barcode.toString(),
                role: 'member'
            });
            await user.save();
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error('Barcode login error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ── POST /api/auth/login ───────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ msg: 'Email and password are required' });

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user)
            return res.status(401).json({ msg: 'Invalid credentials' });

        const isMatch = await user.matchPassword(password);
        if (!isMatch)
            return res.status(401).json({ msg: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ msg: 'Server error during login' });
    }
});

module.exports = router;
