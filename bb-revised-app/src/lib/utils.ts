/**
 * Standardized Formatting Utilities for BrightBoard
 */

/**
 * Formats a date string or Date object to DD/MM/YYYY
 * @param date - The date to format
 * @returns Formatted date string
 */
export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'N/A'
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'Invalid Date'
    
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })
}

/**
 * Formats a date into a human readable format with time
 */
export function formatDateTime(date: string | Date | null | undefined): string {
    if (!date) return 'N/A'
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'Invalid Date'
    
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}
