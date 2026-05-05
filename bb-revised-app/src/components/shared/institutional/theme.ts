// ── PALETTE ── SHARED INSTITUTIONAL DESIGN SYSTEM ───────────────────────────────
export const P = {
    bg: '#F7F8FA', 
    card: '#FEFEFE', 
    border: '#E8E8E8',
    brand: '#004B93', 
    brandBg: '#004B9315', 
    brandHover: '#003A72',
    cta: '#F0A026', 
    ctaBg: '#FFF4E5',
    dark: '#1B1D21', 
    text: '#5A5A5A', 
    muted: '#A5A2A6', 
    hover: '#F1F2F4',
    success: '#1FAC63', 
    successBg: '#1FAC6310',
    warning: '#F59E0B', 
    warningBg: '#FFFBEB',
    error: '#EF4444', 
    errorBg: '#FEF2F2',
    info: '#3B82F6', 
    infoBg: '#EFF6FF',
};

export const GLASS_STYLES = `
    .glass-card { 
        backdrop-filter: blur(10px); 
        background: rgba(254, 254, 254, 0.8) !important; 
    }
    .hover-lift { 
        transition: transform 0.2s cubic-bezier(0.3, 0, 0.2, 1), box-shadow 0.2s !important; 
    }
    .hover-lift:hover { 
        transform: translateY(-4px); 
        box-shadow: 0 12px 30px rgba(0,0,0,0.08) !important; 
    }
    @keyframes fadeIn { 
        from { opacity: 0; transform: translateY(10px); } 
        to { opacity: 1; transform: translateY(0); } 
    }
    .fade-in { 
        animation: fadeIn 0.4s ease-out forwards; 
    }
`;
