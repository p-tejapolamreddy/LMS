const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: String,
        required: true,
        trim: true
    },
    isbn: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    category: {
        type: String,
        default: 'General',
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
        min: 0
    },
    available: {
        type: Number,
        required: true,
        default: 1,
        min: 0
    },
    shelf: {
        type: String,
        default: '',
        trim: true
    },
    publisher: {
        type: String,
        default: '',
        trim: true
    },
    publicationYear: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Book', BookSchema);
