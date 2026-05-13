// ============================================================
// Settings Routes — simplified for teacher and parent settings only
// ============================================================
const settingsRouter = require('express').Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const DEFAULTS = {
  text_size: 'medium',
  theme: 'cotton',
  tts_enabled: false,
  tts_voice: '',
  tts_rate: 0.9,
  tts_pitch: 1.0,
  bg_music_enabled: false,
  bg_music_theme: 'calm',
  bg_music_volume: 0.7,
};

settingsRouter.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings WHERE user_id=$1', [req.user.id]);
    if (!result.rows[0]) {
      const ins = await pool.query(
        `INSERT INTO settings (
           user_id, text_size, theme,
           tts_enabled, tts_voice, tts_rate, tts_pitch,
           bg_music_enabled, bg_music_theme, bg_music_volume
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [
          req.user.id,
          DEFAULTS.text_size,
          DEFAULTS.theme,
          DEFAULTS.tts_enabled,
          DEFAULTS.tts_voice,
          DEFAULTS.tts_rate,
          DEFAULTS.tts_pitch,
          DEFAULTS.bg_music_enabled,
          DEFAULTS.bg_music_theme,
          DEFAULTS.bg_music_volume,
        ]
      );
      return res.json({ settings: ins.rows[0] });
    }
    res.json({ settings: result.rows[0] });
  } catch (err) {
    console.error('[Settings/Get]', err.message);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

settingsRouter.put('/', requireAuth, async (req, res) => {
  try {
    const {
      text_size,
      theme,
      tts_enabled,
      tts_voice,
      tts_rate,
      tts_pitch,
      bg_music_enabled,
      bg_music_theme,
      bg_music_volume,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO settings (
         user_id, text_size, theme,
         tts_enabled, tts_voice, tts_rate, tts_pitch,
         bg_music_enabled, bg_music_theme, bg_music_volume,
         updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         text_size        = EXCLUDED.text_size,
         theme            = EXCLUDED.theme,
         tts_enabled      = EXCLUDED.tts_enabled,
         tts_voice        = EXCLUDED.tts_voice,
         tts_rate         = EXCLUDED.tts_rate,
         tts_pitch        = EXCLUDED.tts_pitch,
         bg_music_enabled = EXCLUDED.bg_music_enabled,
         bg_music_theme   = EXCLUDED.bg_music_theme,
         bg_music_volume  = EXCLUDED.bg_music_volume,
         updated_at       = NOW()
       RETURNING *`,
      [
        req.user.id,
        text_size || DEFAULTS.text_size,
        theme || DEFAULTS.theme,
        tts_enabled !== undefined ? tts_enabled : DEFAULTS.tts_enabled,
        tts_voice || DEFAULTS.tts_voice,
        tts_rate !== undefined ? tts_rate : DEFAULTS.tts_rate,
        tts_pitch !== undefined ? tts_pitch : DEFAULTS.tts_pitch,
        bg_music_enabled !== undefined ? bg_music_enabled : DEFAULTS.bg_music_enabled,
        bg_music_theme || DEFAULTS.bg_music_theme,
        bg_music_volume !== undefined ? bg_music_volume : DEFAULTS.bg_music_volume,
      ]
    );
    res.json({ settings: result.rows[0] });
  } catch (err) {
    console.error('[Settings/Update]', err.message);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = settingsRouter;
