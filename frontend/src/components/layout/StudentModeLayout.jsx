// ============================================================
// StudentModeLayout — ASD-optimized layout for student assessments
// Features: Large text, minimal UI clutter, reduced animations,
// focus on the activity itself, easy-to-use sensory controls
// ============================================================
import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { Volume2, VolumeX, Plus, Minus, ArrowLeft } from 'lucide-react';

export default function StudentModeLayout() {
  const navigate = useNavigate();
  const { 
    text_size, 
    setTextSize, 
    tts_enabled, 
    setTtsEnabled, 
    bg_music_enabled, 
    setBgMusicEnabled 
  } = useSettings();
  const { user } = useAuth();
  const [showControls, setShowControls] = useState(true);

  // Text size multipliers for student mode
  const sizeMap = { small: 0.8, medium: 1.0, large: 1.3 };
  const textScale = sizeMap[text_size] || 1.0;

  // Large, easily readable font sizes
  const headerSize = `${28 * textScale}px`;
  const bodySize = `${18 * textScale}px`;
  const buttonSize = `${22 * textScale}px`;

  const textSizes = ['small', 'medium', 'large'];
  const nextSize = textSizes[(textSizes.indexOf(text_size) + 1) % textSizes.length];
  const prevSize = textSizes[(textSizes.indexOf(text_size) - 1 + textSizes.length) % textSizes.length];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col">
      {/* ── Header with minimal controls ─────────────────────── */}
      <div 
        className="bg-blue-500 dark:bg-blue-600 text-white px-6 py-4 shadow-sm flex items-center justify-between"
        style={{ minHeight: `${80 * textScale}px` }}>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-3 hover:bg-blue-600 dark:hover:bg-blue-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-300"
            title="Go back">
            <ArrowLeft size={32} />
          </button>
          <h1 
            className="font-bold text-white"
            style={{ fontSize: headerSize }}>
            ReadAble
          </h1>
        </div>

        {/* Right side: Quick controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTtsEnabled(!tts_enabled)}
            className={`p-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-300 ${
              tts_enabled 
                ? 'bg-yellow-400 text-slate-900' 
                : 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-700'
            }`}
            title={tts_enabled ? 'Turn off sound' : 'Turn on sound'}>
            {tts_enabled ? <Volume2 size={28} /> : <VolumeX size={28} />}
          </button>

          <button
            onClick={() => setShowControls(!showControls)}
            className="p-3 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-300"
            title={showControls ? 'Hide settings' : 'Show settings'}>
            <span style={{ fontSize: '24px' }}>⚙️</span>
          </button>
        </div>
      </div>

      {/* ── Settings panel (collapsible, above main content) ──── */}
      {showControls && (
        <div className="bg-slate-100 dark:bg-slate-800 px-6 py-4 border-b-2 border-slate-300 dark:border-slate-700">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-6">
            
            {/* Text Size Control */}
            <div className="flex items-center gap-3">
              <label 
                style={{ fontSize: `${14 * textScale}px` }}
                className="font-semibold text-slate-700 dark:text-slate-300">
                Text Size
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTextSize(prevSize)}
                  className="px-4 py-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  style={{ fontSize: buttonSize }}>
                  <Minus size={24} />
                </button>
                <div 
                  className="px-6 py-2 bg-white dark:bg-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-300 min-w-[80px] text-center border-2 border-slate-300 dark:border-slate-600"
                  style={{ fontSize: `${16 * textScale}px` }}>
                  {text_size.charAt(0).toUpperCase() + text_size.slice(1)}
                </div>
                <button
                  onClick={() => setTextSize(nextSize)}
                  className="px-4 py-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  style={{ fontSize: buttonSize }}>
                  <Plus size={24} />
                </button>
              </div>
            </div>

            {/* TTS Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBgMusicEnabled(!bg_music_enabled)}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-300 ${
                  bg_music_enabled
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-300'
                }`}
                style={{ fontSize: buttonSize }}>
                {bg_music_enabled ? '🎵 Music ON' : '🔇 Music OFF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content area ─────────────────────────────────── */}
      <div 
        className="flex-1 overflow-auto px-4 py-6 md:px-8"
        style={{ fontSize: bodySize }}>
        <div className="max-w-4xl mx-auto">
          <Outlet context={{ textScale, bodySize, buttonSize }} />
        </div>
      </div>
    </div>
  );
}
