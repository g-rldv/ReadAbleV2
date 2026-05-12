// ============================================================
// GameInstructions.jsx — Pre-game "How this works" modal
// Uses ReactDOM.createPortal to guarantee true viewport centering
// regardless of any parent stacking context (sidebar, layout wrappers).
// ============================================================
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, ChevronRight, Lightbulb } from 'lucide-react';

const INSTRUCTIONS = {
  word_match: {
    emoji: '🔗',
    title: 'Word Match',
    color: '#4D96FF',
    bg:    'rgba(77,150,255,0.10)',
    border:'rgba(77,150,255,0.30)',
    goal:  'Match every word on the left to its pair on the right.',
    steps: [
      { icon: '👆', text: 'Tap a word on the right side to select it (it turns blue).' },
      { icon: '🎯', text: 'Then tap the matching word on the left to connect them.' },
      { icon: '↩️', text: 'Tap a matched word to undo and try again — no penalty!' },
      { icon: '✅', text: 'Match all pairs, then press Check Answers.' },
    ],
    tip: 'On a tablet or desktop you can drag and drop instead of tapping!',
    time: '1–3 minutes',
    scoring: 'Each correct pair earns points. Partial credit is given.',
  },
  fill_blank: {
    emoji: '✏️',
    title: 'Fill in the Blank',
    color: '#F97B6B',
    bg:    'rgba(249,123,107,0.10)',
    border:'rgba(249,123,107,0.30)',
    goal:  'Choose the correct missing word for each sentence.',
    steps: [
      { icon: '📖', text: 'Read each sentence — the missing word is shown as ___.' },
      { icon: '👆', text: 'Tap the correct word from the choices below.' },
      { icon: '🔄', text: 'Tap the filled word in the sentence to change your answer.' },
      { icon: '✅', text: 'Fill all blanks, then press Check Answers.' },
    ],
    tip: 'Read the whole sentence before choosing — context clues help a lot!',
    time: '2–4 minutes',
    scoring: 'Each correct word earns points. You can retry as many times as you like.',
  },
  sentence_sort: {
    emoji: '🔀',
    title: 'Sentence Sort',
    color: '#6BCB77',
    bg:    'rgba(107,203,119,0.10)',
    border:'rgba(107,203,119,0.30)',
    goal:  'Put the sentences in the correct order to make a story or sequence.',
    steps: [
      { icon: '📝', text: 'Read all the sentences first to understand the topic.' },
      { icon: '↕️',  text: 'Use the ↑ and ↓ arrow buttons to move each sentence up or down.' },
      { icon: '✋', text: 'Or drag and drop the sentences into place.' },
      { icon: '✅', text: 'When happy with the order, press Check My Order.' },
    ],
    tip: 'Look for time words like "first", "then", "finally" — they hint at the order!',
    time: '2–5 minutes',
    scoring: 'Every sentence in the right position earns points.',
  },
  picture_word: {
    emoji: '🖼️',
    title: 'Picture & Word',
    color: '#FFD93D',
    bg:    'rgba(255,217,61,0.12)',
    border:'rgba(255,217,61,0.40)',
    goal:  'Look at each picture and pick the word that matches it.',
    steps: [
      { icon: '👀', text: 'Look at the big picture (emoji or image) shown on screen.' },
      { icon: '👆', text: 'Tap the correct word from the four choices.' },
      { icon: '⏭️', text: 'The game moves to the next picture automatically after you answer.' },
      { icon: '✅', text: 'After all pictures, press Check Answers to see your score.' },
    ],
    tip: 'Take your time — there is no timer, so look carefully before tapping!',
    time: '1–3 minutes',
    scoring: 'One point per correct picture. Tap the speaker icon to hear the word.',
  },
  picture_choice: {
    emoji: '🧩',
    title: 'Picture Choice',
    color: '#9B59B6',
    bg:    'rgba(155,89,182,0.10)',
    border:'rgba(155,89,182,0.30)',
    goal:  'Read each question and tap the correct picture as your answer.',
    steps: [
      { icon: '📖', text: 'Read the question at the top of the card carefully.' },
      { icon: '🖼️', text: 'Tap the picture that best answers the question.' },
      { icon: '◀▶', text: 'Use Prev / Next to go back and change any answer.' },
      { icon: '✅', text: 'Answer all questions, then press Check Answers.' },
    ],
    tip: 'Not sure? Tap the speaker icon next to each option to hear its label!',
    time: '2–4 minutes',
    scoring: 'Each correct picture earns points. You can revisit questions freely.',
  },
};

const FALLBACK = {
  emoji: '🎮',
  title: 'Game Instructions',
  color: '#4D96FF',
  bg:    'rgba(77,150,255,0.10)',
  border:'rgba(77,150,255,0.30)',
  goal:  'Complete the activity to earn XP and coins.',
  steps: [
    { icon: '👀', text: 'Read the instructions on screen carefully.' },
    { icon: '👆', text: 'Interact with the elements as directed.' },
    { icon: '✅', text: 'Submit your answers when you are ready.' },
  ],
  tip: 'Take your time — there is no time limit!',
  time: '1–5 minutes',
  scoring: 'Correct answers earn XP and coins.',
};

const LS_KEY = 'readable_skip_instructions';

function getSkipped() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}
function setSkipped(type) {
  try {
    const s = getSkipped();
    s[type] = true;
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch (_) {}
}

export default function GameInstructions({ type, onStart, onSkip }) {
  const cfg = INSTRUCTIONS[type] || FALLBACK;
  const [dontShow, setDontShow] = useState(false);
  const [visible,  setVisible]  = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleStart = () => {
    if (dontShow) setSkipped(type);
    onStart();
  };

  // Portal renders directly into document.body — this is the key fix.
  // The sidebar uses transform/isolation which creates its own stacking
  // context and clips any position:fixed children inside it.
  // By portalling to body we bypass all parent stacking contexts entirely.
  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(0,0,0,0.60)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.22s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) handleSkip(); }}
    >
      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          maxHeight: 'min(90svh, 90vh)',
          background: 'var(--bg-card-grad)',
          border: `2px solid ${cfg.border}`,
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
          display: 'flex',
          flexDirection: 'column',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.96)',
          transition: 'transform 0.32s cubic-bezier(0.175,0.885,0.32,1.275), opacity 0.22s ease',
          opacity: visible ? 1 : 0,
        }}
      >
        {/* Header — never scrolls */}
        <div style={{
          background: cfg.bg,
          borderBottom: `1px solid ${cfg.border}`,
          padding: '18px 20px 14px',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: cfg.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
                boxShadow: `0 4px 12px ${cfg.color}60`,
              }}>
                {cfg.emoji}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: cfg.color, margin: 0, opacity: 0.8,
                }}>
                  How this works
                </p>
                <h2 style={{
                  fontFamily: '"Fredoka One", cursive',
                  fontSize: 22, color: 'var(--text-primary)', margin: 0, lineHeight: 1.15,
                }}>
                  {cfg.title}
                </h2>
              </div>
            </div>
            <button
              onClick={handleSkip}
              title="Skip"
              style={{
                width: 30, height: 30, borderRadius: 8, border: 'none',
                background: 'rgba(156,163,175,0.18)', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#9ca3af',
              }}
            >
              <X size={15} />
            </button>
          </div>
          <p style={{
            fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
            margin: '10px 0 0', lineHeight: 1.5, opacity: 0.85,
          }}>
            🎯 <strong>Goal:</strong> {cfg.goal}
          </p>
        </div>

        {/* Scrollable body */}
        <div style={{
          padding: '16px 20px',
          overflowY: 'auto',
          flex: 1,
          WebkitOverflowScrolling: 'touch',
        }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
            textTransform: 'uppercase', color: '#9ca3af', margin: '0 0 10px',
          }}>
            Steps
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cfg.steps.map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '10px 12px', borderRadius: 12,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: cfg.color, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800,
                  }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 14, lineHeight: 1 }}>{step.icon}</span>
                </div>
                <p style={{
                  fontSize: 13, color: 'var(--text-primary)',
                  margin: 0, lineHeight: 1.55, fontWeight: 500,
                }}>
                  {step.text}
                </p>
              </div>
            ))}
          </div>

          {/* Tip */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            marginTop: 12, padding: '10px 12px', borderRadius: 12,
            background: cfg.bg, border: `1.5px solid ${cfg.border}`,
          }}>
            <Lightbulb size={15} style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: 'var(--text-primary)', margin: 0, lineHeight: 1.5, opacity: 0.85 }}>
              <strong>Tip:</strong> {cfg.tip}
            </p>
          </div>

          {/* Meta pills */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {[`⏱ ${cfg.time}`, `💡 ${cfg.scoring}`].map(label => (
              <span key={label} style={{
                fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
                background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                color: '#9ca3af',
              }}>
                {label}
              </span>
            ))}
          </div>

          {/* Don't show again */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginTop: 14, cursor: 'pointer', userSelect: 'none',
          }}>
            <input
              type="checkbox"
              checked={dontShow}
              onChange={e => setDontShow(e.target.checked)}
              style={{ width: 15, height: 15, accentColor: cfg.color, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>
              Don't show this again for {cfg.title}
            </span>
          </label>
        </div>

        {/* Footer — never scrolls */}
        <div style={{
          padding: '12px 20px 16px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex', gap: 10, flexShrink: 0,
          background: 'var(--bg-card-grad)',
        }}>
          <button
            onClick={handleSkip}
            style={{
              flex: '0 0 auto', padding: '10px 18px', borderRadius: 14,
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              background: 'var(--bg-primary)',
              border: '1.5px solid var(--border-color)',
              color: '#9ca3af', fontFamily: 'inherit',
            }}
          >
            Skip
          </button>
          <button
            onClick={handleStart}
            style={{
              flex: 1, padding: '11px 16px', borderRadius: 14,
              fontSize: 14, fontWeight: 800, cursor: 'pointer',
              background: cfg.color,
              border: `2px solid ${cfg.color}`,
              color: '#fff', fontFamily: '"Fredoka One", cursive',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: `0 4px 14px ${cfg.color}55`,
            }}
            onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.09)'; }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; }}
            onMouseDown={e  => { e.currentTarget.style.transform = 'scale(0.97)'; }}
            onMouseUp={e    => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            Let's Play! <ChevronRight size={17} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>,
    document.body   // ← portal target: bypasses all parent stacking contexts
  );
}

/**
 * Hook — returns whether instructions should show for a given type.
 * Returns false immediately if user previously clicked "Don't show again".
 */
export function useShouldShowInstructions(type) {
  const skipped = getSkipped();
  return !skipped[type];
}
