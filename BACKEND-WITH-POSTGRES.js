const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
const { Pool } = require('pg');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const session = require('express-session');
require('dotenv').config();

const app = express();

// Initialize Groq AI
let groq = null;
if (process.env.GROQ_API_KEY) {
  try {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log('✅ Groq AI initialized');
  } catch (error) {
    console.error('❌ Groq initialization failed:', error.message);
  }
}

// ========== POSTGRESQL DATABASE ==========
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Create tables if they don't exist
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        name VARCHAR(255),
        avatar TEXT,
        role VARCHAR(50) DEFAULT 'publisher',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        book_title VARCHAR(255) NOT NULL,
        sport VARCHAR(100) DEFAULT 'baseball',
        unique_link TEXT NOT NULL,
        publisher_id VARCHAR(255) DEFAULT 'publisher_1',
        session_id VARCHAR(255),
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'pending',
        progress INTEGER DEFAULT 0,
        messages JSONB DEFAULT '[]',
        book_draft TEXT DEFAULT '',
        word_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

initDatabase();

// Session & Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'muse-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE google_id = $1', [profile.id]);
      
      if (result.rows.length === 0) {
        const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        await pool.query(
          `INSERT INTO users (id, google_id, email, name, avatar, role, created_at, last_login) 
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          [userId, profile.id, profile.emails[0].value, profile.displayName, profile.photos[0]?.value, 'publisher']
        );
        const newUser = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        console.log(`✅ New user: ${newUser.rows[0].email}`);
        return done(null, newUser.rows[0]);
      } else {
        await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [result.rows[0].id]);
        console.log(`✅ User login: ${result.rows[0].email}`);
        return done(null, result.rows[0]);
      }
    } catch (error) {
      return done(error, null);
    }
  }));
  console.log('✅ Google OAuth configured');
}

// CORS
app.use(cors({
  origin: [
    "https://muse-frontend-three.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.send("🚀 Muse Backend Online with PostgreSQL!");
});

// ========== SIMPLE POWERFUL INTERVIEWER ==========
const getInterviewerPrompt = (sport) => {
  const sportName = sport.charAt(0).toUpperCase() + sport.slice(1);
  
  return `You're interviewing a ${sportName} athlete for their book. Be natural and brief.

STYLE: React (1-2 words) + Ask ONE question. Under 10 words total.

EXAMPLES:

"I grew up poor"
→ "How poor? What did that look like?"

"My dad left at 10"
→ "Ten... What do you remember?"

"I got injured"
→ "Oh no. How did you deal with it?"

"Coach believed in me"
→ "Powerful. What did they see in you?"

"Made it to pros"
→ "Amazing! Who did you tell first?"

QUESTIONS TO ASK:
- "Where did you grow up?"
- "When did you discover ${sportName}?"
- "What was your biggest challenge?"
- "How did that feel?"
- "What kept you going?"
- "Who believed in you?"
- "What did that teach you?"

RULES:
✅ React + ask (under 10 words)
✅ Use their words
✅ One question only
✅ Natural, brief

❌ No "interesting" or "tell me more"
❌ No book/genre questions
❌ No long responses

Keep it real. Keep it short.`;
};

// Auth Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'muse-jwt-secret');
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ========== AUTH ROUTES ==========

app.post('/api/publisher/login', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password required' });
    
    const correctPassword = process.env.PUBLISHER_PASSWORD;
    if (!correctPassword) return res.status(500).json({ error: 'Server config error' });
    if (password !== correctPassword) return res.status(401).json({ error: 'Invalid password' });
    
    const token = jwt.sign(
      { id: 'publisher_1', role: 'publisher', name: 'Publisher' },
      process.env.JWT_SECRET || 'muse-jwt-secret',
      { expiresIn: '24h' }
    );
    
    res.json({ 
      success: true, 
      token,
      user: { id: 'publisher_1', name: 'Publisher', role: 'publisher' }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/publisher/verify', verifyToken, (req, res) => {
  if (req.user.role !== 'publisher') return res.status(403).json({ error: 'Not authorized' });
  res.json({ 
    success: true, 
    user: { id: req.user.id, name: req.user.name, role: req.user.role }
  });
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://muse-frontend-three.vercel.app'}?error=auth_failed`,
    session: false 
  }),
  (req, res) => {
    try {
      const token = jwt.sign(
        { id: req.user.id, email: req.user.email, name: req.user.name, role: req.user.role },
        process.env.JWT_SECRET || 'muse-jwt-secret',
        { expiresIn: '7d' }
      );
      const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://muse-frontend-three.vercel.app';
      res.redirect(`${frontendUrl}?token=${token}`);
    } catch (error) {
      const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://muse-frontend-three.vercel.app';
      res.redirect(`${frontendUrl}?error=token_failed`);
    }
  }
);

app.get('/api/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const user = result.rows[0];
    res.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.post('/api/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ success: true, message: 'Logged out' });
  });
});

app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'All fields required' });
    
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'User exists' });
    
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await pool.query(
      `INSERT INTO users (id, email, password, name, role, created_at, last_login) 
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [userId, email, hashedPassword, name, 'publisher']
    );
    
    const token = jwt.sign(
      { id: userId, email, name, role: 'publisher' },
      process.env.JWT_SECRET || 'muse-jwt-secret',
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true, 
      token,
      user: { id: userId, email, name, role: 'publisher' }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    
    const user = result.rows[0];
    if (!user.password) return res.status(401).json({ error: 'Invalid credentials' });
    
    if (!await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET || 'muse-jwt-secret',
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true, 
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ========== CLIENT ROUTES ==========

app.post('/api/clients', verifyToken, async (req, res) => {
  try {
    const { name, email, bookTitle, sport, publisherId } = req.body;
    if (!name || !email || !bookTitle) return res.status(400).json({ error: "All fields required" });

    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://muse-frontend-three.vercel.app';
    const uniqueLink = `${frontendUrl}/interview/${clientId}?name=${encodeURIComponent(name)}&book=${encodeURIComponent(bookTitle)}&sport=${sport || 'baseball'}`;

    await pool.query(
      `INSERT INTO clients (id, name, email, book_title, sport, unique_link, publisher_id, created_at, last_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [clientId, name, email, bookTitle, sport || 'baseball', uniqueLink, publisherId || 'publisher_1']
    );

    const result = await pool.query('SELECT * FROM clients WHERE id = $1', [clientId]);
    const client = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      email: result.rows[0].email,
      bookTitle: result.rows[0].book_title,
      sport: result.rows[0].sport,
      uniqueLink: result.rows[0].unique_link,
      publisherId: result.rows[0].publisher_id,
      sessionId: result.rows[0].session_id,
      lastActive: result.rows[0].last_active,
      status: result.rows[0].status,
      progress: result.rows[0].progress,
      messages: result.rows[0].messages || [],
      bookDraft: result.rows[0].book_draft || '',
      wordCount: result.rows[0].word_count || 0,
      createdAt: result.rows[0].created_at
    };

    console.log(`✅ Client created: ${name}`);
    res.json({ success: true, client });
  } catch (error) {
    console.error("Create client error:", error);
    res.status(500).json({ error: "Failed to create client" });
  }
});

app.get('/api/clients', async (req, res) => {
  try {
    const publisherId = req.query.publisherId || 'publisher_1';
    const result = await pool.query('SELECT * FROM clients WHERE publisher_id = $1 ORDER BY created_at DESC', [publisherId]);
    
    const clients = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      bookTitle: row.book_title,
      sport: row.sport,
      uniqueLink: row.unique_link,
      publisherId: row.publisher_id,
      sessionId: row.session_id,
      lastActive: row.last_active,
      status: row.status,
      progress: row.progress,
      messages: row.messages || [],
      bookDraft: row.book_draft || '',
      wordCount: row.word_count || 0,
      createdAt: row.created_at
    }));
    
    res.json({ success: true, clients });
  } catch (error) {
    console.error('Fetch clients error:', error);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

app.get('/api/clients/:clientId', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clients WHERE id = $1', [req.params.clientId]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Client not found" });
    
    const row = result.rows[0];
    const client = {
      id: row.id,
      name: row.name,
      email: row.email,
      bookTitle: row.book_title,
      sport: row.sport,
      uniqueLink: row.unique_link,
      publisherId: row.publisher_id,
      sessionId: row.session_id,
      lastActive: row.last_active,
      status: row.status,
      progress: row.progress,
      messages: row.messages || [],
      bookDraft: row.book_draft || '',
      wordCount: row.word_count || 0,
      createdAt: row.created_at
    };
    
    res.json({ success: true, client });
  } catch (error) {
    console.error('Fetch client error:', error);
    res.status(500).json({ error: "Failed to fetch client" });
  }
});

app.put('/api/clients/:clientId', async (req, res) => {
  try {
    const { messages, bookDraft, wordCount, progress, status, sessionId } = req.body;
    
    await pool.query(
      `UPDATE clients 
       SET messages = $1, book_draft = $2, word_count = $3, progress = $4, status = $5, session_id = $6, last_active = NOW()
       WHERE id = $7`,
      [JSON.stringify(messages || []), bookDraft || '', wordCount || 0, progress || 0, status || 'pending', sessionId, req.params.clientId]
    );
    
    const result = await pool.query('SELECT * FROM clients WHERE id = $1', [req.params.clientId]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Client not found" });
    
    const row = result.rows[0];
    const client = {
      id: row.id,
      name: row.name,
      email: row.email,
      bookTitle: row.book_title,
      sport: row.sport,
      uniqueLink: row.unique_link,
      publisherId: row.publisher_id,
      sessionId: row.session_id,
      lastActive: row.last_active,
      status: row.status,
      progress: row.progress,
      messages: row.messages || [],
      bookDraft: row.book_draft || '',
      wordCount: row.word_count || 0,
      createdAt: row.created_at
    };
    
    res.json({ success: true, client });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: "Failed to update client" });
  }
});

app.delete('/api/clients/:clientId', async (req, res) => {
  try {
    await pool.query('DELETE FROM clients WHERE id = $1', [req.params.clientId]);
    res.json({ success: true, message: 'Client deleted' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: "Failed to delete client" });
  }
});

// ========== AI CHAT ==========
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userId, history, sport } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });

    const athleteSport = (sport || "baseball").toLowerCase();
    const systemPrompt = getInterviewerPrompt(athleteSport);

    let apiMessages = [{ role: "system", content: systemPrompt }];

    if (history && history.length > 0) {
      history.forEach(h => {
        if (h.text || h.content) {
          apiMessages.push({
            role: h.role === 'ai' || h.role === 'assistant' ? 'assistant' : 'user',
            content: h.text || h.content
          });
        }
      });
    }

    apiMessages.push({ role: "user", content: message });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 50,
      top_p: 0.9,
      frequency_penalty: 0.8,
      presence_penalty: 0.6
    });

    let reply = completion.choices[0].message.content.trim();
    
    // Clean up bad patterns
    const badPatterns = [
      /^Thanks\.\s*/gi,
      /Start with.*intro/gi,
      /Who are you today/gi,
      /Let's dive into/gi,
      /What genre/gi,
      /What.*theme/gi,
      /That's interesting/gi,
      /Tell me more\.?$/gi,
      /\[START_DRAFT\]/gi,
      /\[END_DRAFT\]/gi
    ];
    
    badPatterns.forEach(pattern => {
      reply = reply.replace(pattern, '');
    });
    
    reply = reply.replace(/protagonist/gi, 'you');
    reply = reply.replace(/antagonist/gi, 'challenge');
    
    // Fallback if bad
    if (reply.length < 5 || reply.toLowerCase().includes('genre') || reply.toLowerCase().includes('book')) {
      if (message.length < 10) {
        reply = "Where did you grow up?";
      } else {
        reply = "How did that feel?";
      }
    }
    
    // Keep brief
    const sentences = reply.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 1) {
      reply = sentences[0] + '?';
    }
    
    if (reply.length > 80) {
      const words = reply.split(' ');
      reply = words.slice(0, 10).join(' ') + '?';
    }

    console.log(`✅ AI: ${reply}`);
    res.json({ reply });

  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ 
      error: "Chat failed",
      reply: "Can you repeat that?"
    });
  }
});

// Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Muse Server on port ${PORT}`);
  console.log(`📍 https://muse-backend-production-29cd.up.railway.app`);
  console.log(`💾 PostgreSQL Database Connected`);
});
