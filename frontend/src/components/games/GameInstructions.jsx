import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Lightbulb } from 'lucide-react';

// ── Per-type instruction config ───────────────────────────────
const INSTRUCTIONS = {
  word_match: {
    title: 'Word Match',
    color: '#4D96FF',
    bg:    'rgba(77,150,255,0.10)',
    border:'rgba(77,150,255,0.30)',
    goal:  'Match every word on the left to its pair on the right.',
    steps: [
      { text: 'Tap a word on the right side to select it (it turns blue).' },
      { text: 'Then tap the matching word on the left to connect them.' },
      { text: 'Tap a matched word to undo and try again — no penalty!' },
      { text: 'Match all pairs, then press Check Answers.' },
    ],
    tip: 'On a tablet or desktop you can drag and drop instead of tapping!',
    time: 'Usually, It takes 1–3 minutes',
    scoring: 'Each correct pair earns points. Partial credit is given.',
  },
  fill_blank: {
    title: 'Fill in the Blank',
    color: '#F97B6B',
    bg:    'rgba(249,123,107,0.10)',
    border:'rgba(249,123,107,0.30)',
    goal:  'Choose the correct missing word for each sentence.',
    steps: [
      { text: 'Read each sentence — the missing word is shown as ___.' },
      { text: 'Tap the correct word from the choices below.' },
      { text: 'Tap the filled word in the sentence to change your answer.' },
      { text: 'Fill all blanks, then press Check Answers.' },
    ],
    tip: 'Read the whole sentence before choosing — context clues help a lot!',
    time: 'Usually, It takes 2–4 minutes',
    scoring: 'Each correct word earns points. You can retry as many times as you like.',
  },
  sentence_sort: {
    title: 'Sentence Sort',
    color: '#6BCB77',
    bg:    'rgba(107,203,119,0.10)',
    border:'rgba(107,203,119,0.30)',
    goal:  'Put the sentences in the correct order to make a story or sequence.',
    steps: [
      { text: 'Read all the sentences first to understand the topic.' },
      { text: 'Use the ↑ and ↓ arrow buttons to move each sentence up or down.' },
      { text: 'Or drag and drop the sentences into place.' },
      { text: 'When happy with the order, press Check My Order.' },
    ],
    tip: 'Look for time words like "first", "then", "finally" — they hint at the order!',
    time: 'Usually, It takes 2–5 minutes',
    scoring: 'Every sentence in the right position earns points.',
  },
  picture_word: {
    title: 'Picture & Word',
    color: '#FFD93D',
    bg:    'rgba(255,217,61,0.12)',
    border:'rgba(255,217,61,0.40)',
    goal:  'Look at each picture and pick the word that matches it.',
    steps: [
      { text: 'Look at the big picture (emoji or image) shown on screen.' },
      { text: 'Tap the correct word from the four choices.' },
      { text: 'The game moves to the next picture automatically after you answer.' },
      { text: 'After all pictures, press Check Answers to see your score.' },
    ],
    tip: 'Take your time — there is no timer, so look carefully before tapping!',
    time: 'Usually, It takes 1–3 minutes',
    scoring: 'One point per correct picture. Tap the speaker icon to hear the word.',
  },
  picture_choice: {
    title: 'Picture Choice',
    color: '#9B59B6',
    bg:    'rgba(155,89,182,0.10)',
    border:'rgba(155,89,182,0.30)',
    goal:  'Read each question and tap the correct picture as your answer.',
    steps: [
      { text: 'Read the question at the top of the card carefully.' },
      { text: 'Tap the picture that best answers the question.' },
      { text: 'Use Prev / Next to go back and change any answer.' },
      { text: 'Answer all questions, then press Check Answers.' },
    ],
    tip: 'Not sure? Tap the speaker icon next to each option to hear its label!',
    time: 'Usually, It takes 2–4 minutes',
    scoring: 'Each correct picture earns points. You can revisit questions freely.',
  },
};

const FALLBACK = {
  title: 'Game Instructions',
  color: '#4D96FF',
  bg:    'rgba(77,150,255,0.10)',
  border:'rgba(77,150,255,0.30)',
  goal:  'Complete the activity to earn XP and coins.',
  steps: [
    { text: 'Read the instructions on screen carefully.' },
    { text: 'Interact with the elements as directed.' },
    { text: 'Submit your answers when you are ready.' },
  ],
  tip: 'Take your time — there is no time limit!',
  time: 'Usually, It takes 1–5 minutes',
  scoring: 'Correct answers earn XP and coins.',
};

const LS_KEY = 'readable_skip_instructions';
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; 

function getSkippedData() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}

function setSkipped(type) {
  try {
    const data = getSkippedData();
    data[type] = Date.now(); 
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch (_) {}
}

export function useShouldShowInstructions(type) {
  const data = getSkippedData();
  const timestamp = data[type];
  if (!timestamp) return true;
  const elapsed = Date.now() - timestamp;
  const isExpired = elapsed > TWENTY_FOUR_HOURS;
  if (isExpired) {
    try {
      const newData = { ...data };
      delete newData[type];
      localStorage.setItem(LS_KEY, JSON.stringify(newData));
    } catch (_) {}
    return true;
  }
  return false;
}

export default function GameInstructions({ type, onStart, onSkip }) {
  const cfg = INSTRUCTIONS[type] || FALLBACK;
  const [dontShow, setDontShow] = useState(false);
  const [visible,  setVisible]  = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const handleStart = () => {
    if (dontShow) setSkipped(type);
    onStart();
  };

  const handleSkip = () => {
    onSkip();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(3px)', transition: 'opacity 0.25s ease',
        opacity: visible ? 1 : 0,
      }}
      onClick={e => { if (e.target === e.currentTarget) handleSkip(); }}
    >
      <div
        style={{
          width: '100%', maxWidth: 440, margin: 'auto',
          background: 'var(--bg-card-grad, #1a1a2e)',
          border: `2px solid ${cfg.border}`, borderRadius: 24,
          overflow: 'hidden', boxShadow: `0 24px 60px rgba(0,0,0,0.35)`,
          transition: 'transform 0.35s cubic-bezier(0.175,0.885,0.32,1.275), opacity 0.25s ease',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.95)',
          maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* ── Header band ── */}
        <div style={{
          background: cfg.bg, borderBottom: `1px solid ${cfg.border}`,
          padding: '24px 24px 18px', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: cfg.color, margin: '0 0 4px 0', opacity: 0.8 }}>
                How this works
              </p>
              <h2 style={{
                fontFamily: '"Fredoka One", cursive', fontSize: 28,
                color: '#ffffff', margin: 0, lineHeight: 1,
              }}>
                {cfg.title}
              </h2>
            </div>
            
            <button
              onClick={handleSkip}
              style={{
                width: 32, height: 32, borderRadius: 10, border: 'none',
                background: 'rgba(255,255,255,0.1)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ffffff', transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <X size={20} />
            </button>
          </div>

          <p style={{
            fontSize: 14, fontWeight: 500, color: '#ffffff',
            margin: '16px 0 0', lineHeight: 1.5, opacity: 0.9,
          }}>
            🎯 <strong>Goal:</strong> {cfg.goal}
          </p>
        </div>

        {/* ── Steps ── */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
            textTransform: 'uppercase', color: '#9ca3af', marginBottom: 12 }}>
            Steps
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cfg.steps.map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 16px', borderRadius: 16,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: cfg.color, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800,
                }}>
                  {i + 1}
                </div>
                <p style={{
                  fontSize: 14, color: '#ffffff', margin: 0,
                  lineHeight: 1.4, fontWeight: 500,
                }}>
                  {step.text}
                </p>
              </div>
            ))}
          </div>

          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            marginTop: 16, padding: '12px', borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: `1px dashed ${cfg.border}`,
          }}>
            <Lightbulb size={18} style={{ color: cfg.color, flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0, lineHeight: 1.5 }}>
              <strong style={{ color: cfg.color }}>Tip:</strong> {cfg.tip}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
             <span style={{
              fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 99,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#9ca3af',
            }}>
              ⏱ {cfg.time}
            </span>
            <span style={{
              fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 99,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#9ca3af',
            }}>
              💡 {cfg.scoring}
            </span>
          </div>

          <label style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginTop: 20, cursor: 'pointer', userSelect: 'none',
          }}>
            <input
              type="checkbox"
              checked={dontShow}
              onChange={e => setDontShow(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: cfg.color }}
            />
            <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>
              Don't show this again for 24 hours
            </span>
          </label>
        </div>

        {/* ── Footer buttons ── */}
        <div style={{
          padding: '16px 24px 24px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', gap: 12,
        }}>
          <button
            onClick={handleSkip}
            style={{
              padding: '12px 20px', borderRadius: 16,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#9ca3af',
            }}
          >
            Skip
          </button>
          <button
            onClick={handleStart}
            style={{
              flex: 1, padding: '12px', borderRadius: 16,
              fontSize: 16, fontWeight: 800, cursor: 'pointer',
              background: cfg.color, border: 'none',
              color: '#ffffff', fontFamily: '"Fredoka One", cursive',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: `0 8px 20px ${cfg.color}40`,
            }}
          >
            Let's Play! <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
