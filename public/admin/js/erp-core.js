// ERP Core — Auth, Navigation, API, UI helpers
'use strict';

// ── Auth Guard ──────────────────────────────────────────────────────
const SESSION_KEY = 'erp_user';
const USER = JSON.parse(sessionStorage.getItem(SESSION_KEY));
if (!USER) location.href = '/admin/login';

const BIZ = window.BIZ = USER?.business_id || 'biz_blink_001';

// Populate user info
['sideName','topName'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = USER?.name || ''; });
['sideAva','topAva'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = (USER?.name||'A')[0].toUpperCase(); });
const sr = document.getElementById('sideRole'); if(sr) sr.textContent = USER?.role || '';
const pd = document.getElementById('pageDate'); if(pd) pd.textContent = new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

// ── API ─────────────────────────────────────────────────────────────
window.api = async function(path, opts = {}) {
    console.log(`📡 [API CALL]: ${path}`);
    try {
        const res = await fetch(path, { credentials:'include', headers:{'Content-Type':'application/json'}, ...opts });
        console.log(`📥 [API RESPONSE]: ${res.status} | ${path}`);
        
        if (res.status === 401) { 
            console.warn(`[API 401] Redirecting to login...`);
            sessionStorage.clear(); 
            location.href = '/admin/login'; 
            return { success: false, error: 'Unauthorized' };
        }

        const text = await res.text();
        console.log(`[Body Snippet] ${text.slice(0, 100)}...`);
        
        try {
            const json = JSON.parse(text);
            console.groupEnd();
            return json;
        } catch (je) {
            console.error(`[Parse Error] Received HTML at JSON endpoint?`, text.slice(0, 500));
            console.groupEnd();
            throw new Error(`Server returned HTML instead of JSON (likely 404/500 redirect)`);
        }
    } catch (fe) {
        console.error(`[Network/Fetch Error]`, fe);
        console.groupEnd();
        throw fe;
    }
};

window.postAPI = (path, body) => api(path, { method:'POST', body: JSON.stringify(body) });
window.putAPI  = (path, body) => api(path, { method:'PUT',  body: JSON.stringify(body) });
window.patchAPI= (path, body) => api(path, { method:'PATCH',body: JSON.stringify(body) });

// ── Toast ───────────────────────────────────────────────────────────
window.toast = function(msg, type='success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.style.background = type === 'error' ? '#ef4444' 
                        : type === 'warn' ? '#f59e0b' 
                        : type === 'info' ? '#3b82f6' 
                        : '#111';
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
};

// ── Modal ───────────────────────────────────────────────────────────
window.openModal = function(title, bodyHTML, sizeClass) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    const m = document.getElementById('modal');
    m.className = 'modal' + (sizeClass ? ' ' + sizeClass : '');
    m.classList.add('open');
    document.getElementById('modalOverlay').classList.add('open');
};
window.closeModal = function() {
    document.getElementById('modal').classList.remove('open');
    document.getElementById('modalOverlay').classList.remove('open');
};

// ── Formatters ──────────────────────────────────────────────────────
window.fmt  = n => '₹' + parseFloat(n||0).toLocaleString('en-IN',{minimumFractionDigits:0});
window.fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN') : '—';
window.badge = function(s) {
    const map = {
        paid:'badge-green', success:'badge-green', Active:'badge-green', active:'badge-green', true:'badge-green', Booked:'badge-green', Completed:'badge-green',
        partial:'badge-yellow', Processing:'badge-yellow', Pending:'badge-yellow', pending:'badge-yellow', New:'badge-yellow', Draft:'badge-yellow',
        cancelled:'badge-red', failed:'badge-red', Received:'badge-blue', Shipped:'badge-blue'
    };
    const cls = map[String(s)] || 'badge-gray';
    return `<span class="badge ${cls}">${s}</span>`;
};

// ── Skeleton rows ───────────────────────────────────────────────────
window.skelRows = (cols) => Array(4).fill(`<tr>${Array(cols).fill('<td><div class="skeleton"></div></td>').join('')}</tr>`).join('');

// ── Navigation ──────────────────────────────────────────────────────
const viewTitles = {
    dashboard:'Dashboard', pos:'POS — Point of Sale', pos_order:'🔬 POS Order — Optical Booking', orders:'Orders', products:'Standard Product Entry', ecommerce:'Ecommerce Product Management',
    inventory:'Inventory', showrooms:'Showrooms', business:'Business Setup', customers:'Customers', crm:'CRM & Leads',
    appointments:'Appointments', eyetests:'Eye Tests', repairs:'Repairs', loyalty:'Loyalty Program',
    offers:'Offers', coupons:'Coupons', campaigns:'Campaigns', reports:'Reports & Analytics',
    staff:'Staff Management', settings:'Settings', comm:'Communication & Notifications',
    master:'Master Data Management', media:'Media Library', bulk_import:'Bulk Product Import',
    ai_filler:'🤖 AI Intelligent Data Filler',
    accounting:'Accounting & Finance', purchase:'Purchase & Vendor Management'
};




const PERMS = USER?.permissions || [];

async function filterSidebar() {
    // 1. Fallback: If permissions are missing (old session), fetch them and reload
    if (USER && (!USER.permissions || USER.permissions.length === 0)) {
        const r = await api('/api/auth/permissions');
        if (r.success) {
            USER.permissions = r.permissions;
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(USER));
            window.location.reload(); 
            return;
        }
    }

    // 2. Hide items based on permissions
    document.querySelectorAll('.nav-item').forEach(el => {
        const view = el.dataset.view;
        let hasPerm = PERMS.includes(view);
        if (view === 'eyetests' || view === 'repairs' || view === 'loyalty') hasPerm = PERMS.includes('clinic');
        if (view === 'offers' || view === 'coupons' || view === 'campaigns' || view === 'comm') hasPerm = PERMS.includes('marketing');
        if (view === 'inventory_view') hasPerm = PERMS.includes('inventory');
        // pos_order always shows when pos is permitted
        if (view === 'pos_order') hasPerm = PERMS.includes('pos') || PERMS.includes('pos_order');
        if (view === 'business' || view === 'master' || view === 'media' || view === 'comm' || view === 'bulk_import' || view === 'ecommerce' || view === 'accounting' || view === 'purchase' || view === 'reports' || view === 'ai_filler') {
            hasPerm = hasPerm || USER?.role === 'Admin' || USER?.role === 'Manager';
        }
        
        if (!hasPerm) {
            el.style.display = 'none';
        } else {
            el.style.display = 'flex'; // Ensure visible items use flex for icons
        }
    });

    // 3. Hide empty nav-groups (headers)
    document.querySelectorAll('.nav-group').forEach(group => {
        let next = group.nextElementSibling;
        let hasVisible = false;
        while (next && next.classList.contains('nav-item')) {
            if (next.style.display !== 'none') hasVisible = true;
            next = next.nextElementSibling;
        }
        if (!hasVisible) group.style.display = 'none';
        else group.style.display = 'block';
    });

    // 4. Handle initial view redirect
    const activeItem = document.querySelector('.nav-item.active');
    const activeView = activeItem ? activeItem.dataset.view : 'dashboard';
    let initialPerm = PERMS.includes(activeView);
    if (activeView === 'eyetests' || activeView === 'repairs' || activeView === 'loyalty') initialPerm = PERMS.includes('clinic');
    if (activeView === 'settings') initialPerm = true;

    if (!initialPerm) {
        const firstAllowed = document.querySelector('.nav-item:not([style*="display: none"])');
        if (firstAllowed) firstAllowed.click();
    }
}

window.switchView = function(view) {
    const el = document.querySelector(`.nav-item[data-view="${view}"]`);
    if (el) el.click();
};

document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
        const view = el.dataset.view;
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        el.classList.add('active');
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const target = document.getElementById(`view-${view}`);
        if (target) target.classList.add('active');
        const pt = document.getElementById('pageTitle');
        if (pt) pt.textContent = viewTitles[view] || view;
        if (window[`load_${view}`]) window[`load_${view}`]();
    });
});

// Run filter on load
filterSidebar();
initFilters();
applyGlobalPreferences();

// Initial Trigger for active view
setTimeout(() => {
    const active = document.querySelector('.nav-item.active');
    if (active) active.click();
}, 100);

async function applyGlobalPreferences() {
    try {
        const r = await api('/api/settings');
        if (r.success && r.data.preferences) {
            const p = r.data.preferences;
            if (p.dark_mode) document.body.classList.add('dark-mode');
            // Cache preferences for other modules
            window.SYSTEM_PREFS = p;
        }
    } catch (e) { console.error('Failed to apply global prefs', e); }
}

async function initFilters() {
    const sel = document.getElementById('globalShowroom');
    if (!sel) return;
    
    // Populate showrooms
    const d = await api(`/api/showrooms?business_id=${BIZ}`);
    if (d.success) {
        d.data.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.showroom_id;
            opt.textContent = s.showroom_name;
            sel.appendChild(opt);
        });
        // Restore from session
        const saved = sessionStorage.getItem('global_showroom');
        if (saved) sel.value = saved;
    }
    
    sel.addEventListener('change', () => {
        sessionStorage.setItem('global_showroom', sel.value);
        // Refresh current active view
        const active = document.querySelector('.nav-item.active');
        if (active) active.click();
    });
}

window.getGlobalFilters = () => {
    const sr = document.getElementById('globalShowroom')?.value || '';
    return sr ? `&showroom_id=${sr}` : '';
};

// ── Logout ──────────────────────────────────────────────────────────
window.logout = async function() {
    await fetch('/api/auth/logout', { method:'POST', credentials:'include' });
    sessionStorage.clear();
    location.href = '/admin/login';
};

window.skelRows = (n, cols = 6) => Array(n).fill(`<tr>${Array(cols).fill('<td><div class="skeleton" style="height:14px; width:80%; border-radius:4px"></div></td>').join('')}</tr>`).join('');
