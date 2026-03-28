import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';

app.use(cors({
    origin: 'https://gavinboris.netlify.app/',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function initDB() {
    try {
        await pool.query(`
        CREATE TABLE IF NOT EXISTS projects (
            id          SERIAL PRIMARY KEY,
            name        TEXT NOT NULL,
            description TEXT NOT NULL,
            tech        TEXT[],
            github_url  TEXT,
            live_url    TEXT,
            created_at  TIMESTAMPTZ DEFAULT NOW()
        );
    `);
        console.log('✅ Database initialized');
    } catch (err) {
        console.error('DB init error:', err);
    }
}

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

app.post('/api/auth/login', async (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password required' });

    const isValid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH || '');
    if (!isValid) return res.status(401).json({ error: 'Unauthorized' });

    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
});

app.get('/api/projects', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/projects', authenticateToken, async (req, res) => {
    const { name, description, tech, github_url, live_url } = req.body;
    if (!name || !description) return res.status(400).json({ error: 'Name and description required' });

    try {
        const result = await pool.query(
            `INSERT INTO projects (name, description, tech, github_url, live_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [name, description, tech || [], github_url || null, live_url || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/projects/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, description, tech, github_url, live_url } = req.body;

    if (!name || !description) return res.status(400).json({ error: 'Name and description required' });

    try {
        const result = await pool.query(
            `UPDATE projects 
        SET name = $1, description = $2, tech = $3, github_url = $4, live_url = $5
       WHERE id = $6 RETURNING *`,
            [name, description, tech || [], github_url || null, live_url || null, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    await initDB();
});