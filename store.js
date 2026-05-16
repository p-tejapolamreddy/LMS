const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

class Store {
    constructor(name) {
        this.filePath = path.join(DATA_DIR, `${name}.json`);
        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
        }
    }

    _read() {
        try {
            return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        } catch {
            return [];
        }
    }

    _write(data) {
        fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    }

    // Get all records
    find(query = {}) {
        let records = this._read();
        const keys = Object.keys(query);
        if (keys.length === 0) return records;
        return records.filter(rec =>
            keys.every(k => rec[k] === query[k])
        );
    }

    // Get one record
    findOne(query = {}) {
        const keys = Object.keys(query);
        return this._read().find(rec =>
            keys.every(k => rec[k] === query[k])
        ) || null;
    }

    // Get by _id
    findById(id) {
        return this._read().find(rec => rec._id === id) || null;
    }

    // Insert a new record
    insert(doc) {
        const records = this._read();
        const newDoc = {
            _id: generateId(),
            ...doc,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        records.push(newDoc);
        this._write(records);
        return newDoc;
    }

    // Update by _id
    updateById(id, updates) {
        const records = this._read();
        const idx = records.findIndex(r => r._id === id);
        if (idx === -1) return null;
        records[idx] = {
            ...records[idx],
            ...updates,
            _id: id,
            updatedAt: new Date().toISOString()
        };
        this._write(records);
        return records[idx];
    }

    // Delete by _id
    deleteById(id) {
        const records = this._read();
        const idx = records.findIndex(r => r._id === id);
        if (idx === -1) return null;
        const [deleted] = records.splice(idx, 1);
        this._write(records);
        return deleted;
    }
}

// Export singleton stores for each collection
module.exports = {
    Users: new Store('users'),
    Books: new Store('books'),
    Issues: new Store('issues')
};
