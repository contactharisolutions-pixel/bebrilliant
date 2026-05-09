'use client'

import React from 'react'
import { P } from './theme'

interface StatusBadgeProps {
    status: string
    type?: 'success' | 'warning' | 'error' | 'info' | 'brand'
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'brand' }) => {
    const getColors = () => {
        switch (type) {
            case 'success': return { bg: P.successBg, text: P.success }
            case 'warning': return { bg: P.warningBg, text: P.warning }
            case 'error': return { bg: P.errorBg, text: P.error }
            case 'info': return { bg: P.infoBg, text: P.info }
            default: return { bg: P.brandBg, text: P.brand }
        }
    }

    const { bg, text } = getColors()

    return (
        <span style={{ 
            fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', 
            padding: '4px 12px', borderRadius: 99, 
            background: bg, color: text,
            display: 'inline-block'
        }}>
            {status}
        </span>
    )
}
