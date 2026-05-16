import React from 'react';

export default function CoinIcon({ size = 16, className }) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#f5c518',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.08)',
      }}
    />
  );
}
