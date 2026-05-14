import React from 'react';

// Simple horizontal bar chart for skill breakdown
export function SkillBreakdownChart({ data, title = 'Skill Breakdown' }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg text-center text-slate-500">
        No data available
      </div>
    );
  }

  const skills = {
    literal: { label: '📖 Literal', color: 'bg-blue-500' },
    inference: { label: '🧠 Inference', color: 'bg-purple-500' },
    vocabulary: { label: '📚 Vocabulary', color: 'bg-green-500' },
    sequence: { label: '🔢 Sequence', color: 'bg-orange-500' },
    emotion: { label: '❤️ Emotion/Social', color: 'bg-pink-500' },
  };

  const entries = Object.entries(data)
    .filter(([key]) => key in skills)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <div className="space-y-3">
        {entries.map(([skill, score]) => (
          <div key={skill} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">
                {skills[skill].label}
              </span>
              <span className="text-sm font-bold text-slate-900">{score}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-6 overflow-hidden">
              <div
                className={`${skills[skill].color} h-full flex items-center justify-center text-white text-xs font-semibold transition-all duration-300`}
                style={{ width: `${Math.min(score, 100)}%` }}
              >
                {score > 10 && `${score}%`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Simple line chart showing score progression
export function ProgressionChart({ data, title = 'Score Progression' }) {
  if (!data || data.length === 0) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg text-center text-slate-500">
        No data available
      </div>
    );
  }

  const maxScore = 100;
  const chartHeight = 200;
  const chartWidth = 500;
  const points = data.slice(-10); // Show last 10 attempts

  if (points.length === 0) return null;

  // Calculate SVG points
  const xStep = chartWidth / (points.length - 1 || 1);
  const yStep = chartHeight / maxScore;

  const svgPoints = points
    .map((point, idx) => ({
      x: idx * xStep,
      y: chartHeight - point.score * yStep,
      score: point.score,
      level: point.level,
    }))
    .filter(p => p.score !== undefined);

  const pathD = svgPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <div className="bg-white border rounded-lg p-4">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} className="w-full h-auto">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => {
            const posY = chartHeight - y * yStep;
            return (
              <g key={`grid-${y}`}>
                <line
                  x1="0"
                  y1={posY}
                  x2={chartWidth}
                  y2={posY}
                  stroke="#e2e8f0"
                  strokeDasharray="2,2"
                  strokeWidth="1"
                />
                <text x="-5" y={posY + 5} fontSize="12" textAnchor="end" fill="#94a3b8">
                  {y}%
                </text>
              </g>
            );
          })}

          {/* Line */}
          <polyline
            points={svgPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {svgPoints.map((p, idx) => (
            <g key={`point-${idx}`}>
              <circle cx={p.x} cy={p.y} r="4" fill="#3b82f6" />
              <circle cx={p.x} cy={p.y} r="6" fill="#3b82f6" opacity="0.2" />
              <title>{`Level ${p.level}: ${p.score}%`}</title>
            </g>
          ))}
        </svg>
      </div>
      <div className="text-xs text-slate-500">
        Showing {points.length} assessments
      </div>
    </div>
  );
}

// Comparison chart: Student vs Class Average
export function ComparisonChart({ studentData, classAverage, title = 'Performance vs Class' }) {
  const skills = {
    literal: { label: '📖 Literal' },
    inference: { label: '🧠 Inference' },
    vocabulary: { label: '📚 Vocabulary' },
    sequence: { label: '🔢 Sequence' },
    emotion: { label: '❤️ Emotion/Social' },
  };

  if (!studentData || !classAverage) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg text-center text-slate-500">
        No data available
      </div>
    );
  }

  const entries = Object.keys(skills).filter(key => key in studentData);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <div className="space-y-3">
        {entries.map(skill => {
          const studentScore = studentData[skill] || 0;
          const classScore = classAverage[skill] || 0;
          const diff = studentScore - classScore;

          return (
            <div key={skill} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">
                  {skills[skill].label}
                </span>
                <div className="flex gap-3">
                  <span className="text-xs text-blue-600 font-semibold">
                    You: {studentScore}%
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    Class: {classScore}%
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {/* Student bar */}
                <div className="flex-1 bg-slate-200 rounded-full h-5 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${Math.min(studentScore, 100)}%` }}
                  />
                </div>
                {/* Class bar */}
                <div className="flex-1 bg-slate-200 rounded-full h-5 overflow-hidden">
                  <div
                    className="bg-slate-400 h-full transition-all duration-300"
                    style={{ width: `${Math.min(classScore, 100)}%` }}
                  />
                </div>
              </div>
              {diff !== 0 && (
                <div className="text-xs flex items-center gap-1">
                  {diff > 0 ? (
                    <>
                      <span className="text-green-600 font-semibold">↑ {diff}%</span>
                      <span className="text-green-600">above class</span>
                    </>
                  ) : (
                    <>
                      <span className="text-orange-600 font-semibold">↓ {Math.abs(diff)}%</span>
                      <span className="text-orange-600">below class</span>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Difficulty heatmap
export function DifficultyHeatmap({ students, title = 'Difficulty Mastery' }) {
  if (!students || students.length === 0) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg text-center text-slate-500">
        No data available
      </div>
    );
  }

  const getColor = (score) => {
    if (!score) return 'bg-slate-100';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <div className="overflow-x-auto">
        <div className="flex flex-col gap-2">
          {/* Header */}
          <div className="flex gap-2">
            <div className="w-32 font-semibold text-sm text-slate-700">Student</div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(level => (
                <div
                  key={`header-${level}`}
                  className="w-12 text-center text-xs font-semibold text-slate-700"
                >
                  L{level}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {students.map(student => (
            <div key={student.id} className="flex gap-2 items-center">
              <div className="w-32 text-sm truncate font-medium text-slate-800">
                {student.name}
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(level => {
                  const attempts = student.sessions?.filter(s => s.difficulty_level === level) || [];
                  const avgScore = attempts.length > 0
                    ? Math.round(attempts.reduce((sum, s) => sum + s.percentage, 0) / attempts.length)
                    : null;

                  return (
                    <div
                      key={`${student.id}-level-${level}`}
                      className={`w-12 h-12 rounded flex items-center justify-center cursor-help transition-all ${getColor(avgScore)}`}
                      title={avgScore ? `${avgScore}%` : 'Not attempted'}
                    >
                      {avgScore && (
                        <span className="text-white text-xs font-bold">{avgScore}%</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded" /> 80%+
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded" /> 60-79%
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded" /> 40-59%
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded" /> Below 40%
        </div>
      </div>
    </div>
  );
}
