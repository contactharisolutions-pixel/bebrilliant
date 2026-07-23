'use client';

import React, { useState } from 'react';
import { P } from '@/styles/tokens';

export interface KanbanColumn {
    key: string;
    label: string;
    color: string;
    bg: string;
    icon: React.ComponentType<{ size: number; color: string }>;
}

interface KanbanBoardProps<T> {
    columns: KanbanColumn[];
    items: T[];
    renderCard: (item: T) => React.ReactNode;
    onDropItem: (itemId: string, targetColumnKey: string) => void;
    getItemColumnKey: (item: T) => string;
    getItemId: (item: T) => string;
    columnTotals?: Record<string, string | number>;
    columnEmptyText?: string;
}

export function KanbanBoard<T>({
    columns,
    items,
    renderCard,
    onDropItem,
    getItemColumnKey,
    getItemId,
    columnTotals,
    columnEmptyText = 'Drop items here',
}: KanbanBoardProps<T>) {
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, item: T) => {
        e.dataTransfer.setData('kanbanItemId', getItemId(item));
    };

    const handleDragOver = (e: React.DragEvent, columnKey: string) => {
        e.preventDefault();
        setDragOverColumn(columnKey);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = (e: React.DragEvent, columnKey: string) => {
        e.preventDefault();
        setDragOverColumn(null);
        const itemId = e.dataTransfer.getData('kanbanItemId');
        if (itemId) {
            onDropItem(itemId, columnKey);
        }
    };

    return (
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 20, width: '100%' }}>
            {columns.map(col => {
                const columnItems = items.filter(item => getItemColumnKey(item) === col.key);
                const total = columnTotals?.[col.key];
                const isOver = dragOverColumn === col.key;
                const Icon = col.icon;

                return (
                    <div
                        key={col.key}
                        onDragOver={e => handleDragOver(e, col.key)}
                        onDragLeave={handleDragLeave}
                        onDrop={e => handleDrop(e, col.key)}
                        style={{
                            minWidth: 280,
                            flex: '0 0 280px',
                            background: isOver ? col.bg : P.bg,
                            border: '2px dashed ' + (isOver ? col.color : P.border),
                            borderRadius: 16,
                            padding: 14,
                            transition: 'all 0.15s',
                            maxHeight: 'calc(100vh - 280px)',
                            overflowY: 'auto',
                            boxSizing: 'border-box',
                        }}
                    >
                        {/* Column Header */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: 14,
                                position: 'sticky',
                                top: 0,
                                background: 'inherit',
                                paddingBottom: 10,
                                borderBottom: '1px solid ' + P.border,
                                zIndex: 5,
                            }}
                        >
                            {Icon && <Icon size={14} color={col.color} />}
                            <span style={{ fontSize: 12, fontWeight: 800, color: col.color }}>
                                {col.label}
                            </span>
                            <span
                                style={{
                                    marginLeft: 'auto',
                                    background: col.color,
                                    color: '#fff',
                                    borderRadius: 12,
                                    padding: '1px 7px',
                                    fontSize: 10,
                                    fontWeight: 800,
                                }}
                            >
                                {columnItems.length}
                            </span>
                        </div>

                        {total !== undefined && (
                            <div style={{ fontSize: 11, color: P.muted, fontWeight: 700, marginBottom: 10 }}>
                                {total}
                            </div>
                        )}

                        {/* Column Cards */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {columnItems.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '30px 10px', color: P.muted, fontSize: 12 }}>
                                    {columnEmptyText}
                                </div>
                            ) : (
                                columnItems.map(item => {
                                    const itemId = getItemId(item);
                                    return (
                                        <div
                                            key={itemId}
                                            draggable
                                            onDragStart={e => handleDragStart(e, item)}
                                            style={{ cursor: 'grab' }}
                                        >
                                            {renderCard(item)}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
