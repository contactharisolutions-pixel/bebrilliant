'use client';

import React, { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { P } from '@/styles/tokens';

export interface ActivityTypeConfig {
    key: string;
    label: string;
    icon: React.ComponentType<{ size: number; color: string }>;
    color: string;
    bg: string;
}

export interface ActivityItem {
    id: string;
    type: string;
    content: string;
    created_at: string;
    created_by_profile?: {
        first_name?: string;
        last_name?: string;
        avatar_url?: string;
        email?: string;
        role?: string;
    } | null;
    metadata?: any;
}

interface ActivityTimelineProps {
    activities: ActivityItem[];
    activityTypes: ActivityTypeConfig[];
    onAddActivity?: (content: string, type: string) => Promise<void> | void;
    loading?: boolean;
    emptyText?: string;
}

export function ActivityTimeline({
    activities,
    activityTypes,
    onAddActivity,
    loading = false,
    emptyText = 'No activities recorded yet.',
}: ActivityTimelineProps) {
    const [newContent, setNewContent] = useState('');
    const [selectedType, setSelectedType] = useState(activityTypes[0]?.key || '');
    const [submitting, setSubmitting] = useState(false);

    const handleAdd = async () => {
        if (!newContent.trim() || !onAddActivity) return;
        setSubmitting(true);
        try {
            await onAddActivity(newContent.trim(), selectedType);
            setNewContent('');
        } catch (e) {
            console.error('Error logging activity:', e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Input Composer if callback provided */}
            {onAddActivity && (
                <div
                    style={{
                        background: P.bg,
                        borderRadius: 12,
                        padding: 14,
                        marginBottom: 16,
                        border: '1px solid ' + P.border,
                    }}
                >
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                        {activityTypes.map(t => {
                            const Icon = t.icon;
                            const isSelected = selectedType === t.key;
                            return (
                                <button
                                    key={t.key}
                                    onClick={() => setSelectedType(t.key)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 5,
                                        padding: '5px 10px',
                                        borderRadius: 8,
                                        border: '1px solid ' + (isSelected ? t.color : P.border),
                                        background: isSelected ? t.bg : 'transparent',
                                        cursor: 'pointer',
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: isSelected ? t.color : P.muted,
                                        transition: 'all 0.15s',
                                        outline: 'none',
                                    }}
                                >
                                    {Icon && <Icon size={11} color={isSelected ? t.color : P.muted} />}
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            value={newContent}
                            onChange={e => setNewContent(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !submitting && handleAdd()}
                            placeholder="Type a log, note or message..."
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                border: '1px solid ' + P.border,
                                borderRadius: 9,
                                fontSize: 13,
                                background: P.card,
                                color: P.dark,
                                outline: 'none',
                            }}
                        />
                        <button
                            onClick={handleAdd}
                            disabled={submitting || !newContent.trim()}
                            style={{
                                padding: '8px 14px',
                                borderRadius: 9,
                                border: 'none',
                                background: P.brand,
                                color: '#fff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                fontWeight: 700,
                                fontSize: 12,
                                opacity: submitting || !newContent.trim() ? 0.7 : 1,
                                transition: 'opacity 0.15s',
                            }}
                        >
                            {submitting ? (
                                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                                <Send size={12} />
                            )}
                            Log
                        </button>
                    </div>
                </div>
            )}

            {/* List / Event stream */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                        <Loader2 size={24} color={P.brand} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : activities.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: P.muted, fontSize: 13 }}>
                        {emptyText}
                    </div>
                ) : (
                    activities.map((act, idx) => {
                        const config = activityTypes.find(t => t.key === act.type) || {
                            key: act.type,
                            label: act.type,
                            color: P.muted,
                            bg: P.hover,
                            icon: () => null,
                        };
                        const Icon = config.icon;
                        const dateText = new Date(act.created_at).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                        });
                        const author = act.created_by_profile;
                        const authorName = author ? [author.first_name, author.last_name].filter(Boolean).join(' ') : null;

                        return (
                            <div
                                key={act.id}
                                style={{
                                    display: 'flex',
                                    gap: 12,
                                    paddingBottom: idx < activities.length - 1 ? 16 : 0,
                                    marginBottom: idx < activities.length - 1 ? 16 : 0,
                                    borderBottom: idx < activities.length - 1 ? '1px solid ' + P.border : 'none',
                                }}
                            >
                                <div
                                    style={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: '50%',
                                        background: config.bg,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        marginTop: 2,
                                    }}
                                >
                                    {Icon && <Icon size={13} color={config.color} />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                        <span
                                            style={{
                                                background: config.bg,
                                                color: config.color,
                                                borderRadius: 6,
                                                padding: '2px 8px',
                                                fontSize: 10,
                                                fontWeight: 800,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                            }}
                                        >
                                            {config.label}
                                        </span>
                                        {authorName && (
                                            <span style={{ fontSize: 11, fontWeight: 700, color: P.dark }}>
                                                by {authorName}
                                            </span>
                                        )}
                                        <span style={{ fontSize: 11, color: P.muted }}>
                                            {dateText}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 13, color: P.text, lineHeight: 1.5, wordBreak: 'break-word' }}>
                                        {act.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
