// ── PALETTE ── SHARED INSTITUTIONAL DESIGN SYSTEM ───────────────────────────────
export const P = {
    bg: '#F8FAFC', 
    card: '#FFFFFF', 
    border: '#E2E8F0',
    brand: '#0868B2', 
    brandBg: 'rgba(8, 104, 178, 0.08)', 
    brandHover: '#07549A',
    cta: '#0868B2', 
    ctaBg: '#E5F3FB',
    dark: '#092746', 
    text: '#34445A', 
    muted: '#64748B', 
    hover: '#F2F9FD',
    success: '#09834F', 
    successBg: '#DCF7E7',
    warning: '#D97706', 
    warningBg: '#FEF3C7',
    error: '#DC2626', 
    errorBg: '#FEF2F2',
    info: '#0284C7', 
    infoBg: '#E0F2FE',
    purple: '#7C3AED',
    purpleBg: '#F5F3FF',
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
