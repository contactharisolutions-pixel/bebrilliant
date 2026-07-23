'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Loader2, Inbox } from 'lucide-react';
import { P } from '@/styles/tokens';

export interface Column<T> {
    header: string;
    key?: keyof T | string;
    render?: (item: T, index: number) => React.ReactNode;
    width?: string | number;
    sortable?: boolean;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    // Selection
    selectedIds?: Set<string>;
    onSelectAll?: (checked: boolean) => void;
    onSelectRow?: (id: string, checked: boolean) => void;
    getRowId?: (item: T) => string;
    // Pagination
    page?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
    // Styling/Customization
    emptyText?: string;
    minWidth?: string | number;
}

export function DataTable<T>({
    columns,
    data,
    loading = false,
    selectedIds,
    onSelectAll,
    onSelectRow,
    getRowId,
    page = 1,
    totalPages = 1,
    onPageChange,
    emptyText = 'No items found',
    minWidth = 860,
}: DataTableProps<T>) {
    const hasSelection = selectedIds !== undefined && onSelectAll !== undefined && onSelectRow !== undefined && getRowId !== undefined;
    const allSelected = hasSelection && data.length > 0 && data.every(item => selectedIds.has(getRowId(item)));

    return (
        <div style={{ background: P.card, border: '1px solid ' + P.border, borderRadius: 16, overflow: 'hidden', width: '100%' }}>
            {loading ? (
                <div style={{ padding: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 size={36} color={P.brand} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                    <div style={{ color: P.muted, fontWeight: 600, fontSize: 14 }}>Loading records...</div>
                </div>
            ) : data.length === 0 ? (
                <div style={{ padding: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <Inbox size={48} color={P.border} style={{ marginBottom: 16 }} />
                    <div style={{ fontSize: 16, fontWeight: 800, color: P.dark }}>{emptyText}</div>
                    <div style={{ fontSize: 13, color: P.muted, marginTop: 6 }}>Adjust filters or try adding a new entry.</div>
                </div>
            ) : (
                <>
                    <div style={{ overflowX: 'auto', width: '100%' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth }}>
                            <thead>
                                <tr style={{ background: P.bg, borderBottom: '1px solid ' + P.border }}>
                                    {hasSelection && (
                                        <th style={{ padding: '11px 16px', width: 40, textAlign: 'left' }}>
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                onChange={e => onSelectAll(e.target.checked)}
                                                style={{ cursor: 'pointer', width: 16, height: 16, accentColor: P.brand }}
                                            />
                                        </th>
                                    )}
                                    {columns.map((col, idx) => (
                                        <th
                                            key={idx}
                                            style={{
                                                padding: '11px 16px',
                                                textAlign: 'left',
                                                fontSize: 11,
                                                fontWeight: 700,
                                                color: P.muted,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.07em',
                                                whiteSpace: 'nowrap',
                                                width: col.width,
                                            }}
                                        >
                                            {col.header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item, rowIdx) => {
                                    const itemId = getRowId ? getRowId(item) : String(rowIdx);
                                    const isSelected = hasSelection && selectedIds.has(itemId);
                                    return (
                                        <tr
                                            key={itemId}
                                            style={{
                                                borderBottom: rowIdx < data.length - 1 ? '1px solid ' + P.border : 'none',
                                                background: isSelected ? P.brandBg : 'transparent',
                                                transition: 'background 0.15s',
                                            }}
                                        >
                                            {hasSelection && (
                                                <td style={{ padding: '13px 16px' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={e => onSelectRow(itemId, e.target.checked)}
                                                        style={{ cursor: 'pointer', width: 16, height: 16, accentColor: P.brand }}
                                                    />
                                                </td>
                                            )}
                                            {columns.map((col, colIdx) => (
                                                <td key={colIdx} style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
                                                    {col.render
                                                        ? col.render(item, rowIdx)
                                                        : col.key
                                                        ? String((item as any)[col.key] ?? '')
                                                        : null}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination footer */}
                    {onPageChange && totalPages > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px 20px', borderTop: '1px solid ' + P.border, background: P.bg }}>
                            <button
                                onClick={() => onPageChange(Math.max(1, page - 1))}
                                disabled={page === 1}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '7px 14px',
                                    borderRadius: 9,
                                    border: '1px solid ' + P.border,
                                    background: P.card,
                                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                                    fontWeight: 700,
                                    fontSize: 13,
                                    color: page === 1 ? P.muted : P.dark,
                                    opacity: page === 1 ? 0.5 : 1,
                                    outline: 'none',
                                }}
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span style={{ fontSize: 13, fontWeight: 700, color: P.text }}>
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                                disabled={page === totalPages}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '7px 14px',
                                    borderRadius: 9,
                                    border: '1px solid ' + P.border,
                                    background: P.card,
                                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                    fontWeight: 700,
                                    fontSize: 13,
                                    color: page === totalPages ? P.muted : P.dark,
                                    opacity: page === totalPages ? 0.5 : 1,
                                    outline: 'none',
                                }}
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
