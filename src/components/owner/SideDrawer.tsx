'use client';

import React from 'react';
import { X } from 'lucide-react';
import { P, SHADOWS } from '@/styles/tokens';

export interface DrawerTab {
    key: string;
    label: string;
    icon: React.ComponentType<{ size: number }>;
}

interface SideDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: React.ReactNode;
    subTitle?: React.ReactNode;
    headerExtra?: React.ReactNode;
    tabs?: DrawerTab[];
    activeTab?: string;
    onTabChange?: (tabKey: string) => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
    width?: string | number;
}

export function SideDrawer({
    isOpen,
    onClose,
    title,
    subTitle,
    headerExtra,
    tabs,
    activeTab,
    onTabChange,
    children,
    footer,
    width = 540,
}: SideDrawerProps) {
    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'flex', justifyContent: 'flex-end' }}>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.35)',
                    backdropFilter: 'blur(4px)',
                    animation: 'fadeIn 0.2s ease-out forwards',
                }}
            />

            {/* Drawer Container */}
            <div
                style={{
                    position: 'relative',
                    width,
                    background: P.card,
                    height: '100%',
                    boxShadow: SHADOWS.double,
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                    boxSizing: 'border-box',
                }}
            >
                <style>{`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes slideInRight {
                        from { transform: translateX(100%); }
                        to { transform: translateX(0); }
                    }
                `}</style>

                {/* Header */}
                <div
                    style={{
                        padding: '20px 24px 16px',
                        borderBottom: '1px solid ' + P.border,
                        background: P.card,
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: tabs ? 12 : 0 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 17, fontWeight: 900, color: P.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {title}
                            </div>
                            {subTitle && (
                                <div style={{ fontSize: 12, color: P.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {subTitle}
                                </div>
                            )}
                        </div>
                        {headerExtra && <div style={{ flexShrink: 0 }}>{headerExtra}</div>}
                        <button
                            onClick={onClose}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 4,
                                borderRadius: 8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = P.hover)}
                            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                            <X size={18} color={P.muted} />
                        </button>
                    </div>

                    {/* Tabs navigation if present */}
                    {tabs && activeTab && onTabChange && (
                        <div style={{ display: 'flex', gap: 4, borderTop: '1px solid ' + P.border, paddingTop: 10, marginTop: 12 }}>
                            {tabs.map(t => {
                                const Icon = t.icon;
                                const isActive = activeTab === t.key;
                                return (
                                    <button
                                        key={t.key}
                                        onClick={() => onTabChange(t.key)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '8px 12px',
                                            border: 'none',
                                            borderRadius: 8,
                                            cursor: 'pointer',
                                            fontWeight: 700,
                                            fontSize: 12,
                                            background: isActive ? P.brandBg : 'transparent',
                                            color: isActive ? P.brand : P.muted,
                                            transition: 'all 0.15s',
                                            outline: 'none',
                                        }}
                                    >
                                        {Icon && <Icon size={13} />}
                                        {t.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Content body */}
                <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', background: P.bg }}>
                    {children}
                </div>

                {/* Footer if present */}
                {footer && (
                    <div
                        style={{
                            padding: '16px 24px',
                            borderTop: '1px solid ' + P.border,
                            background: P.card,
                            position: 'sticky',
                            bottom: 0,
                            zIndex: 10,
                        }}
                    >
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
