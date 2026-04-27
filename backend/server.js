import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.set('trust proxy', 1);

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.query(`
    CREATE TABLE IF NOT EXISTS waitlist (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        market_experience TEXT,
        ip_address TEXT,
        country TEXT,
        city TEXT,
        user_agent TEXT,
        referrer TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
`).catch(console.error);

let transporter;
if (process.env.EMAIL_PROVIDER === 'gmail') {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
    });
} else if (process.env.EMAIL_PROVIDER === 'resend') {
    transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: { user: 'resend', pass: process.env.RESEND_API_KEY }
    });
}

const sendEmail = async (to, subject, html) => {
    if (!transporter) return;
    try {
        await transporter.sendMail({
            from: process.env.OWNER_EMAIL,
            to,
            subject,
            html
        });
    } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.error('Email error:', e);
    }
};

const joinLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Too many requests' }
});

let cache = { count: 0, fetchedAt: 0 };

app.post('/api/waitlist/join', joinLimiter, async (req, res) => {
    const { email, name, marketExperience } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email' });
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];
    const referrer = req.headers.referer || '';

    try {
        const check = await pool.query('SELECT * FROM waitlist WHERE email = $1', [email]);
        if (check.rows.length > 0) {
            return res.json({ success: true, alreadyJoined: true, position: check.rows[0].id });
        }

        const insert = await pool.query(
            `INSERT INTO waitlist (email, name, market_experience, ip_address, user_agent, referrer)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [email, name, marketExperience, ipAddress, userAgent, referrer]
        );
        
        const position = insert.rows[0].id;
        
        res.json({ success: true, position });

        if (process.env.ZAPIER_WEBHOOK_URL) {
            fetch(process.env.ZAPIER_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, marketExperience, position, createdAt: new Date().toISOString() })
            }).catch(() => {});
        }

        let personalizedMsg = '';
        if (marketExperience === 'I actively trade stocks') personalizedMsg = "As an active trader, you'll love our Advanced contest mode.";
        else if (marketExperience === "I'm learning about markets") personalizedMsg = "StockLeague is the perfect place to apply what you're learning — zero real money risk.";
        else if (marketExperience === "I play fantasy sports (Dream11 etc.)") personalizedMsg = "If you love Dream11, you're going to be addicted to this.";
        else personalizedMsg = "Don't worry — StockLeague is designed to teach you as you play.";

        const html = `
            <div style="background:#0B0E11;color:#F0F4F8;padding:20px;font-family:sans-serif;">
                <h1 style="color:#00C853;">STOCK<span style="color:#FFF">LEAGUE</span></h1>
                <h2>You're on the waitlist 🏆</h2>
                <p>Hey ${name || 'there'}! You're #${position} on the StockLeague waitlist.</p>
                <p>${personalizedMsg}</p>
                <ul>
                    <li>✅ First contest FREE</li>
                    <li>✅ ₹100 bonus credits</li>
                    <li>✅ Launch day priority access</li>
                </ul>
                <a href="https://wa.me/?text=I%20just%20joined%20the%20StockLeague%20waitlist%20%E2%80%94%20India's%20fantasy%20stock%20market!%20Join%20here:%20https://stockleague.vercel.app">Share on WhatsApp</a>
                <br/><br/>
                <small style="color:#8A99B0;">StockLeague is a fantasy gaming platform. No real money is invested in securities. All contests involve virtual portfolios only. For entertainment and financial literacy purposes.</small>
            </div>
        `;
        
        sendEmail(email, "You're on the StockLeague waitlist 🏆", html);
        
        const ownerHtml = `
            Name: ${name || 'N/A'}<br/>
            Email: ${email}<br/>
            Answer: ${marketExperience}<br/>
            Position: #${position}<br/>
            Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}<br/>
            IP: ${ipAddress}
        `;
        sendEmail(process.env.OWNER_EMAIL, `New StockLeague signup #${position} — ${email}`, ownerHtml);

    } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.error(e);
        if (!res.headersSent) res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/waitlist/count', async (req, res) => {
    const now = Date.now();
    if (now - cache.fetchedAt > 60000) {
        try {
            const countRes = await pool.query('SELECT COUNT(*) FROM waitlist');
            cache.count = parseInt(countRes.rows[0].count, 10);
            cache.fetchedAt = now;
        } catch (e) {
            if (process.env.NODE_ENV !== 'production') console.error(e);
        }
    }
    res.json({ count: cache.count });
});

app.get('/api/waitlist/all', async (req, res) => {
    const auth = req.headers.authorization;
    if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const rows = await pool.query('SELECT * FROM waitlist ORDER BY id DESC');
        const data = rows.rows;
        
        const total = data.length;
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startOfWeek.setHours(0,0,0,0);
        
        const today = data.filter(r => new Date(r.created_at) >= startOfToday).length;
        const thisWeek = data.filter(r => new Date(r.created_at) >= startOfWeek).length;
        
        const byExperience = {
            "I actively trade stocks": 0,
            "I'm learning about markets": 0,
            "I play fantasy sports (Dream11 etc.)": 0,
            "I'm completely new to investing": 0
        };
        data.forEach(r => {
            if (byExperience[r.market_experience] !== undefined) {
                byExperience[r.market_experience]++;
            }
        });

        res.json({
            total,
            today,
            thisWeek,
            byExperience,
            entries: data
        });

    } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.error(e);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
