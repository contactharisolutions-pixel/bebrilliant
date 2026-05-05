'use client'

if (typeof window !== 'undefined' && !(window as any)._timezonePatched) {
    (window as any)._timezonePatched = true;
    
    const _toLocaleDateString = Date.prototype.toLocaleDateString;
    const _toLocaleString = Date.prototype.toLocaleString;
    const _toLocaleTimeString = Date.prototype.toLocaleTimeString;

    Date.prototype.toLocaleDateString = function(locales?: any, options?: any) {
        const opts = { ...options };
        if (!opts.dateStyle && !opts.month && !opts.year && !opts.day) {
            opts.day = '2-digit'; opts.month = '2-digit'; opts.year = 'numeric';
        }
        return _toLocaleDateString.call(this, locales || 'en-GB', { timeZone: 'Asia/Kolkata', ...opts });
    };
    Date.prototype.toLocaleString = function(locales?: any, options?: any) {
        const opts = { ...options };
        if (!opts.dateStyle && !opts.timeStyle && !opts.month) {
            opts.day = '2-digit'; opts.month = '2-digit'; opts.year = 'numeric';
        }
        return _toLocaleString.call(this, locales || 'en-GB', { timeZone: 'Asia/Kolkata', ...opts });
    };
    Date.prototype.toLocaleTimeString = function(locales?: any, options?: any) {
        return _toLocaleTimeString.call(this, locales || 'en-GB', { timeZone: 'Asia/Kolkata', ...options });
    };
}

export function ClientTimeZone() {
    return null
}
