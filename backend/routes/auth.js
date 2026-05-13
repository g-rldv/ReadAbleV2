// ============================================================
// Auth Routes — /api/auth
// ============================================================
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'readable-dev-secret-change-in-production';
const JWT_EXPIRES = '7d';
const ALLOWED_ROLES = ['teacher', 'parent'];

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, otp_code, role, first_name, last_name } = req.body;

    if (!username || !email || !password || !role || !first_name || !last_name) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Role must be teacher or parent' });
    }
    if (!otp_code) {
      return res.status(400).json({ error: 'Email verification code is required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be 3–30 characters' });
    }
    if (first_name.length < 1 || last_name.length < 1) {
      return res.status(400).json({ error: 'First and last name are required' });
    }

    const otpResult = await pool.query(
      `SELECT id FROM otp_tokens
       WHERE email=$1 AND otp=$2 AND type='register'
         AND used=FALSE AND expires_at > NOW()`,
      [email.toLowerCase().trim(), otp_code]
    );
    if (!otpResult.rows[0]) {
      return res.status(400).json({ error: 'Invalid or expired verification code. Please request a new one.' });
    }
    const otpTokenId = otpResult.rows[0].id;

    const existing = await pool.query(
      'SELECT id FROM users WHERE email=$1 OR username=$2',
      [email.toLowerCase().trim(), username.trim()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username or email already taken' });
    }

    await pool.query(
      'UPDATE otp_tokens SET used=TRUE WHERE id=$1',
      [otpTokenId]
    );

    const password_hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, role, first_name, last_name, created_at, last_login`,
      [username.trim(), email.toLowerCase(), password_hash, role, first_name.trim(), last_name.trim()]
    );

    const user = result.rows[0];
    await pool.query(
      'INSERT INTO settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
      [user.id]
    );

    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('[Auth/Register]', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query(
      'SELECT id, username, email, password_hash, role, first_name, last_name FROM users WHERE email=$1',
      [email.toLowerCase()]
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await pool.query('UPDATE users SET last_login=NOW() WHERE id=$1', [user.id]);

    const { password_hash, ...safeUser } = user;
    const token = signToken(safeUser);
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('[Auth/Login]', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, role, first_name, last_name, created_at, last_login
       FROM users WHERE id=$1`,
      [req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('[Auth/Me]', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.post('/refresh', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, first_name, last_name FROM users WHERE id=$1',
      [req.user.id]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ token: signToken(user) });
  } catch (err) {
    console.error('[Auth/Refresh]', err);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

const { generateOTP, sendOTPEmail } = require('../utils/email');

router.post('/send-otp', async (req, res) => {
  const { email, type } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const otpType = type === 'register' ? 'register' : 'reset';
  res.json({ message: 'If that email is eligible, a code was sent.' });

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await pool.query('SELECT id FROM users WHERE email=$1', [normalizedEmail]);

    if (otpType === 'register' && existing.rows[0]) {
      return;
    }
    if (otpType === 'reset' && !existing.rows[0]) {
      return;
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await pool.query(
      `INSERT INTO otp_tokens (email, otp, type, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email, type) DO UPDATE
         SET otp = EXCLUDED.otp,
             expires_at = EXCLUDED.expires_at,
             used = FALSE,
             created_at = NOW()`,
      [normalizedEmail, otp, otpType, expiresAt]
    );

    await sendOTPEmail(normalizedEmail, otp, otpType);
  } catch (err) {
    console.error('[Auth/SendOTP]', err.message);
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp_code, new_password } = req.body;
    if (!email || !otp_code || !new_password)
      return res.status(400).json({ error: 'Email, code, and new password are required.' });
    if (new_password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const normalizedEmail = email.toLowerCase().trim();
    const result = await pool.query(
      `SELECT id FROM otp_tokens
       WHERE email=$1 AND otp=$2 AND type='reset'
         AND used=FALSE AND expires_at > NOW()`,
      [normalizedEmail, otp_code]
    );
    if (!result.rows[0])
      return res.status(400).json({ error: 'Invalid or expired code. Please request a new one.' });

    const otpTokenId = result.rows[0].id;
    const password_hash = await bcrypt.hash(new_password, 12);
    await pool.query(
      'UPDATE users SET password_hash=$1 WHERE email=$2',
      [password_hash, normalizedEmail]
    );
    await pool.query(
      'UPDATE otp_tokens SET used=TRUE WHERE id=$1',
      [otpTokenId]
    );

    res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    console.error('[Auth/ResetPassword]', err.message);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

module.exports = router;
