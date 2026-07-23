'use client';

import React from 'react';
import { P } from '@/styles/tokens';

interface HealthScoreGaugeProps {
    score: number;
    size?: number;
    strokeWidth?: number;
    showText?: boolean;
}

export function HealthScoreGauge({
    score,
    size = 44,
    strokeWidth = 4,
    showText = true,
}: HealthScoreGaugeProps) {
    const validScore = Math.max(0, Math.min(100, score));
    const r = (size / 2) - strokeWidth;
    const circumference = 2 * Math.PI * r;
    const dash = (validScore / 100) * circumference;

    const getColor = (s: number) => {
        if (s >= 75) return '#059669'; // success (green)
        if (s >= 50) return '#D97706'; // warning (yellow/orange)
        return '#DC2626'; // error (red)
    };

    const color = getColor(validScore);

    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Background Ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={P.border}
                    strokeWidth={strokeWidth}
                />
                {/* Colored Progress Ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${dash} ${circumference}`}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ transition: 'stroke-dasharray 0.4s ease, stroke 0.4s ease' }}
                />
                {/* Centered Text */}
                {showText && (
                    <text
                        x={size / 2}
                        y={size / 2}
                        dominantBaseline="middle"
                        textAnchor="middle"
                        fill={color}
                        fontSize={size > 48 ? 14 : 10}
                        fontWeight={800}
                    >
                        {validScore}
                    </text>
                )}
            </svg>
        </div>
    );
}
