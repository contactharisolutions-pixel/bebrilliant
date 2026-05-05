'use client'

import React from 'react'
import { P } from './theme'
import { LucideIcon } from 'lucide-react'

interface KpiCardProps {
    title: string
    value: string | number
    trend?: string
    trendIsUp?: boolean
    icon: LucideIcon
    color?: string
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, trend, trendIsUp, icon: Icon, color = P.brand }) => {
    return (
        <div className="glass-card hover-lift" style={{ 
            padding: 24, borderRadius: 24, border: `1px solid ${P.border}`, 
            display: 'flex', flexDirection: 'column', gap: 16 
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ background: `${color}10`, padding: 12, borderRadius: 12 }}>
                    <Icon size={20} color={color} />
                </div>
                {trend && (
                    <div style={{ 
                        fontSize: 12, fontWeight: 800, 
                        color: trendIsUp ? P.success : P.error,
                        background: trendIsUp ? P.successBg : P.errorBg,
                        padding: '4px 8px', borderRadius: 6
                    }}>
                        {trendIsUp ? '+' : ''}{trend}
                    </div>
                )}
            </div>
            <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
                <h3 style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 950, color: P.dark, letterSpacing: '-0.02em' }}>{value}</h3>
            </div>
        </div>
    )
}
