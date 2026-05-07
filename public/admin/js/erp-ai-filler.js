/* ══════════════════════════════════════════════════════════════════════════════
   🤖  AI INTELLIGENT PRODUCT DATA FILLER  —  V3
   ══════════════════════════════════════════════════════════════════════════════
   RULES:
   • Structural product fields (brand, model, category, shape, gender, MRP…)
     are READ-ONLY — shown for reference, never modified in this module.
   • Excel maps ONLY: Measurement, Lens Composite, Lens Colorway.
   • AI generates: product_name (Brand + Model), short_description,
                   description, seo_title, seo_description, keywords/tags.
   • Images: front-view auto-selected as main; additional auto-linked.
   ══════════════════════════════════════════════════════════════════════════════ */
'use strict';

window._aifState = {
    results:       [],
    filtered:      [],
    stats:         {},
    variantGroups: {},
    columnMapping: {},
    detectedHeaders: [],
};

window.load_ai_filler = function() {
    const el = document.getElementById('view-ai_filler');
    if (el) _aifRender(el, 'upload');
};

function _aifRender(el, tab) {
    window._aifState.currentTab = tab;
    const cnt = window._aifState.results.length;
    const s   = window._aifState.stats;

    el.innerHTML = `
    <div style="background:linear-gradient(135deg,#0f2544 0%,#1a1033 60%,#0f1f3d 100%);
                border-radius:18px;padding:26px 30px 20px;margin-bottom:22px;color:#fff;
                box-shadow:0 8px 40px rgba(0,0,0,0.25);">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:6px;">
            <div style="width:52px;height:52px;border-radius:14px;background:rgba(99,102,241,0.25);
                        display:flex;align-items:center;justify-content:center;font-size:1.8rem;flex-shrink:0;">🤖</div>
            <div style="flex:1;">
                <h2 style="margin:0;font-size:1.5rem;font-weight:800;letter-spacing:-0.5px;">AI Intelligent Data Filler</h2>
                <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:0.82rem;">
                    Excel maps Measurement &amp; Lens details → AI writes all content → Auto-links front image → One-click publish
                </p>
            </div>
            ${s.ai_engine ? `
            <div style="background:rgba(167,139,250,0.15);border:1px solid rgba(167,139,250,0.35);
                        border-radius:10px;padding:6px 14px;font-size:0.72rem;color:#c4b5fd;white-space:nowrap;">
                <i class="fas fa-robot"></i> ${s.ai_engine}
            </div>` : ''}
        </div>
        ${cnt ? `
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-top:16px;">
            ${[
                ['Total',     s.total||0,             '#6366f1'],
                ['High ✓',    s.high_confidence||0,   '#10b981'],
                ['Medium',    s.medium_confidence||0, '#f59e0b'],
                ['Low ⚠',    s.low_confidence||0,    '#ef4444'],
                ['Images ✓',  s.images_found||0,      '#3b82f6'],
                ['No Image',  s.images_missing||0,    '#94a3b8'],
                ['AI Gen ✨', s.ai_generated||0,      '#8b5cf6'],
            ].map(([l,v,c]) => `
            <div style="background:rgba(255,255,255,0.07);border-radius:10px;padding:10px 12px;border-top:3px solid ${c};">
                <div style="font-size:1.2rem;font-weight:800;color:${c};">${v}</div>
                <div style="font-size:0.6rem;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:.4px;margin-top:2px;">${l}</div>
            </div>`).join('')}
        </div>` : ''}
        <div style="display:flex;gap:8px;margin-top:${cnt?'14px':'18px'};">
            ${[
                ['upload', '📊 Upload & Analyze'],
                ['review', `🔍 Review & Approve${cnt?` <span style="background:rgba(255,255,255,0.2);border-radius:10px;padding:1px 7px;font-size:0.7rem;">${cnt}</span>`:''}`],
                ['logs',   '📋 Logs']
            ].map(([k,v]) => `
            <button onclick="_aifRender(document.getElementById('view-ai_filler'),'${k}')"
                style="padding:7px 18px;border-radius:20px;border:none;cursor:pointer;font-size:0.82rem;font-weight:600;
                       background:${tab===k?'#6366f1':'rgba(255,255,255,0.1)'};
                       color:${tab===k?'#fff':'rgba(255,255,255,0.65)'};transition:all .2s;">${v}</button>`).join('')}
        </div>
    </div>
    <div id="aif-tab-body"></div>`;

    const body = document.getElementById('aif-tab-body');
    if (tab === 'upload') _aifRenderUpload(body);
    else if (tab === 'review') _aifRenderReview(body);
    else _aifRenderLogs(body);
}

// ─── UPLOAD TAB ───────────────────────────────────────────────────────────────
function _aifRenderUpload(body) {
    body.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 360px;gap:20px;margin-bottom:20px;">
        <div class="card" style="border:2px dashed rgba(99,102,241,0.4);background:rgba(99,102,241,0.03);">
            <div style="padding:30px;text-align:center;">
                <div style="width:72px;height:72px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:20px;
                            display:flex;align-items:center;justify-content:center;font-size:2rem;margin:0 auto 16px;">📊</div>
                <h3 style="margin:0 0 6px;color:#1e3a5f;font-size:1.1rem;">Upload Master Product Excel</h3>
                <p style="color:#888;font-size:0.8rem;margin-bottom:4px;">
                    Required columns: <b>Brand</b>, <b>Model No</b><br>
                    Optional: <b>Measurement</b>, <b>Lens Composite</b>, <b>Lens Colorway</b>
                </p>
                <p style="color:#6366f1;font-size:0.75rem;margin-bottom:20px;font-weight:600;">
                    ✨ All other product data (Category, Shape, MRP…) is read from existing product record
                </p>
                <input type="file" id="aif-excel-input" accept=".xlsx,.xls" style="display:none;" onchange="aifPreviewFile(this)">
                <div id="aif-file-preview" style="margin-bottom:16px;min-height:40px;"></div>
                <button class="btn btn-primary" onclick="document.getElementById('aif-excel-input').click()"
                    style="background:#6366f1;border-color:#6366f1;padding:10px 28px;">
                    <i class="fas fa-cloud-upload-alt"></i> Select Excel File
                </button>
            </div>

            <!-- Column Mapping (only 3 fields) -->
            <div id="aif-mapping-section" style="display:none;border-top:1px solid rgba(99,102,241,0.15);padding:20px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <h4 style="margin:0;font-size:0.88rem;color:#1e3a5f;">
                        <i class="fas fa-columns" style="color:#6366f1;margin-right:6px;"></i>Column Mapping (Supplementary Fields)
                    </h4>
                    <div style="display:flex;gap:8px;">
                        <button class="btn btn-outline btn-sm" onclick="aifSaveMapping()"
                            style="font-size:0.72rem;padding:4px 10px;color:#6366f1;border-color:#6366f1;">
                            <i class="fas fa-save"></i> Save
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="aifResetMapping()"
                            style="font-size:0.72rem;padding:4px 10px;">
                            <i class="fas fa-redo"></i> Reset
                        </button>
                    </div>
                </div>
                <p style="font-size:0.72rem;color:#888;margin-bottom:12px;">
                    Map your Excel columns to these supplementary fields (auto-detected):
                </p>
                <div id="aif-mapping-grid"></div>
            </div>

            <div style="padding:0 20px 20px;text-align:center;">
                <button id="aif-analyze-btn" onclick="aifRunAnalysis()"
                    style="width:100%;padding:13px;border-radius:12px;border:none;cursor:not-allowed;
                           font-size:1rem;font-weight:700;opacity:0.5;
                           background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;
                           box-shadow:0 4px 20px rgba(99,102,241,0.3);" disabled>
                    <i class="fas fa-brain"></i>&nbsp; Run AI Analysis
                </button>
                <p id="aif-analyze-hint" style="color:#888;font-size:0.75rem;margin-top:8px;">
                    Upload an Excel file to enable analysis
                </p>
                <p style="color:#a78bfa;font-size:0.7rem;margin-top:2px;">
                    <i class="fas fa-clock"></i> ~3-8 sec / 10 products (Gemini generation)
                </p>
            </div>
        </div>

        <!-- Right panel -->
        <div style="display:flex;flex-direction:column;gap:16px;">
            <!-- Data Sources -->
            <div class="card">
                <div style="padding:16px 20px;">
                    <h4 style="margin:0 0 14px;font-size:0.9rem;color:#1e3a5f;">
                        <i class="fas fa-database" style="color:#6366f1;margin-right:6px;"></i>Data Sources
                    </h4>
                    <div style="margin-bottom:10px;">
                        <div style="font-size:0.72rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px;">
                            🔒 From Product Record (Read-Only)
                        </div>
                        ${['Brand Name','Model No','Category','Shape','Frame Type',
                           'Frame Material','Gender','Color Code','Size Code','Quantity','MRP'].map(f =>
                            `<span style="display:inline-block;margin:2px 3px;padding:2px 8px;border-radius:5px;font-size:0.68rem;
                                    background:#f1f5f9;border:1px solid #e2e8f0;color:#475569;">${f}</span>`
                        ).join('')}
                    </div>
                    <div style="margin-bottom:10px;">
                        <div style="font-size:0.72rem;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px;">
                            📊 From Excel (Mapped)
                        </div>
                        ${['Lens Width (e.g. 52)','Bridge Width (e.g. 18)','Temple Length (e.g. 140)',
                           'Lens Composite','Lens Colorway',
                           'Gender','Shape','Frame Material'].map(f =>
                            `<span style="display:inline-block;margin:2px 3px;padding:2px 8px;border-radius:5px;font-size:0.68rem;
                                    background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;">${f}</span>`
                        ).join('')}
                    </div>
                    <div>
                        <div style="font-size:0.72rem;font-weight:700;color:#5b21b6;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px;">
                            ✨ AI Generated (Gemini)
                        </div>
                        ${['Product Name (Brand + Model)','Short Description','Description (3-4 para)',
                           'SEO Title','Meta Description','Keywords / Tags (CSV)'].map(f =>
                            `<span style="display:inline-block;margin:2px 3px;padding:2px 8px;border-radius:5px;font-size:0.68rem;
                                    background:#ede9fe;border:1px solid #c4b5fd;color:#5b21b6;">${f}</span>`
                        ).join('')}
                    </div>
                </div>
            </div>

            <!-- Image Naming -->
            <div class="card" style="border-left:3px solid #3b82f6;">
                <div style="padding:14px 16px;">
                    <h4 style="margin:0 0 10px;font-size:0.82rem;color:#1e3a5f;">
                        <i class="fas fa-image" style="color:#3b82f6;margin-right:6px;"></i>Image Naming Convention
                    </h4>

                    <code style="font-size:0.72rem;background:#eff6ff;color:#1d4ed8;padding:4px 8px;border-radius:6px;display:block;margin-bottom:10px;">
                        MODELNO_COLOR_VIEW.jpg
                    </code>

                    <!-- Priority Table -->
                    <div style="font-size:0.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.6px;color:#64748b;margin-bottom:6px;">
                        View Priority (highest → lowest)
                    </div>
                    <table style="width:100%;border-collapse:collapse;font-size:0.68rem;margin-bottom:10px;">
                        <thead>
                            <tr style="background:#f8fafc;">
                                <th style="padding:4px 6px;text-align:left;color:#64748b;font-weight:700;border-bottom:1px solid #e2e8f0;">#</th>
                                <th style="padding:4px 6px;text-align:left;color:#64748b;font-weight:700;border-bottom:1px solid #e2e8f0;">View</th>
                                <th style="padding:4px 6px;text-align:left;color:#64748b;font-weight:700;border-bottom:1px solid #e2e8f0;">Accepted Keywords in Filename</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${[
                                [1, 'front',  '#10b981', '★ MAIN', 'front, cfront, frnt, main, center, hero, default'],
                                [2, 'angle',  '#f59e0b', '',       'angle, angl, 3q, diagonal'],
                                [3, 'side',   '#94a3b8', '',       'side, profile, lateral'],
                                [4, 'back',   '#94a3b8', '',       'back, rear, reverse'],
                                [5, 'tint',   '#94a3b8', '',       'tint, lens, color, shade'],
                                [6, 'detail', '#94a3b8', '',       'detail, close, macro, zoom'],
                            ].map(([n, view, color, badge, keys]) => `
                            <tr style="border-bottom:1px solid #f1f5f9;">
                                <td style="padding:4px 6px;color:#94a3b8;font-weight:700;">${n}</td>
                                <td style="padding:4px 6px;">
                                    <span style="font-weight:800;color:${color};">${view}</span>
                                    ${badge ? `<span style="background:#d1fae5;color:#065f46;padding:1px 5px;border-radius:5px;font-size:0.58rem;font-weight:700;margin-left:4px;">${badge}</span>` : ''}
                                </td>
                                <td style="padding:4px 6px;color:#475569;font-family:monospace;font-size:0.65rem;">${keys}</td>
                            </tr>`).join('')}
                        </tbody>
                    </table>

                    <!-- Examples -->
                    <div style="font-size:0.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.6px;color:#64748b;margin-bottom:6px;">
                        Examples (auto-selection)
                    </div>
                    ${[
                        ['RB3447_black_front.jpg',  '✅ MAIN IMAGE', '#10b981'],
                        ['RB3447_black_cfront.jpg', '✅ MAIN IMAGE', '#10b981'],
                        ['RB3447_black_angle.jpg',  '➕ Additional', '#94a3b8'],
                        ['RB3447_black_side.jpg',   '➕ Additional', '#94a3b8'],
                        ['RB3447_black_tint.jpg',   '➕ Additional', '#94a3b8'],
                    ].map(([f, l, c]) => `
                    <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.68rem;margin-bottom:3px;">
                        <code style="background:#f8fafc;padding:2px 5px;border-radius:4px;color:#475569;font-size:0.65rem;">${f}</code>
                        <span style="color:${c};font-weight:700;white-space:nowrap;margin-left:6px;">${l}</span>
                    </div>`).join('')}

                    <p style="font-size:0.65rem;color:#94a3b8;margin:8px 0 0;line-height:1.5;">
                        <b>Matching:</b> Model number in filename is compared to product record (fuzzy).<br>
                        Keywords are case-insensitive and matched after stripping separators.
                    </p>
                </div>
            </div>
        </div>
    </div>`;
}

// ─── File selected → detect columns ──────────────────────────────────────────
window.aifPreviewFile = async function(input) {
    if (!input.files[0]) return;
    const f    = input.files[0];
    const prev = document.getElementById('aif-file-preview');
    const btn  = document.getElementById('aif-analyze-btn');
    const hint = document.getElementById('aif-analyze-hint');

    if (prev) prev.innerHTML = `
    <div style="display:inline-flex;align-items:center;gap:10px;background:#f0fff4;
                border:1px solid #bbf7d0;border-radius:8px;padding:8px 14px;">
        <span style="font-size:1.3rem;">📋</span>
        <div style="text-align:left;">
            <div style="font-weight:600;font-size:0.85rem;color:#166534;">${f.name}</div>
            <div style="font-size:0.7rem;color:#166534;opacity:.7;">${(f.size/1048576).toFixed(2)} MB</div>
        </div>
        <i class="fas fa-spinner fa-spin" style="color:#6366f1;" id="aif-col-spinner"></i>
    </div>`;

    try {
        const fd = new FormData();
        fd.append('excel', f);
        const r = await fetch('/api/ai-filler/detect-columns', { method:'POST', credentials:'include', body: fd });
        const d = await r.json();

        const spinner = document.getElementById('aif-col-spinner');
        if (spinner) spinner.className = 'fas fa-check-circle';

        if (d.success) {
            window._aifState.detectedHeaders = d.headers;
            
            let finalMap = d.savedMapping || {};
            if (d.autoMapping) {
                Object.keys(d.autoMapping).forEach(k => {
                    if (!finalMap[k] || !d.headers.includes(finalMap[k])) {
                        finalMap[k] = d.autoMapping[k];
                    }
                });
            }

            window._aifState.columnMapping = finalMap;
            _aifRenderMappingUI(d.headers, window._aifState.columnMapping, d.totalRows);
            if (hint) hint.innerHTML = `<span style="color:#10b981;">✓ ${d.totalRows} rows detected in "${d.sheetName}"</span>`;
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; btn.style.cursor = 'pointer'; }
        } else {
            if (hint) hint.textContent = d.error || 'Could not read file';
        }
    } catch (err) {
        if (hint) hint.textContent = 'Error: ' + err.message;
    }
};

function _aifRenderMappingUI(headers, mapping, totalRows) {
    const sec  = document.getElementById('aif-mapping-section');
    const grid = document.getElementById('aif-mapping-grid');
    if (!sec || !grid) return;
    sec.style.display = 'block';

    const FIELDS = [
        { key: 'Brand',          label: 'Brand (matching key)', req: true },
        { key: 'Model No',       label: 'Model No (matching key)', req: true },
        { key: 'Lens Width',     label: 'Lens Width (size, e.g. 52)' },
        { key: 'Bridge Width',   label: 'Bridge Width (e.g. 18)' },
        { key: 'Temple Length',  label: 'Temple Length (e.g. 140)' },
        { key: 'Gender',         label: 'Gender' },
        { key: 'Shape',          label: 'Shape (Frame Shape)' },
        { key: 'Frame Material', label: 'Frame Material' },
        { key: 'Lens Composite', label: 'Lens Composite' },
        { key: 'Lens Colorway',  label: 'Lens Colorway' },
    ];

    grid.innerHTML = FIELDS.map(f => {
        const current = mapping[f.key] || '';
        return `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:center;margin-bottom:8px;">
            <label style="font-size:0.72rem;font-weight:700;color:${f.req?'#1d4ed8':'#64748b'};">
                ${f.label}${f.req?' <span style="color:#ef4444;">*</span>':''}
            </label>
            <select onchange="window._aifState.columnMapping['${f.key}']=this.value"
                style="padding:5px 8px;border-radius:6px;border:1px solid ${f.req&&!current?'#fca5a5':'#e2e8f0'};font-size:0.72rem;">
                <option value="">-- Not Mapped --</option>
                ${headers.map(h => `<option value="${h}" ${current===h?'selected':''}>${h}</option>`).join('')}
            </select>
        </div>`;
    }).join('');
}

window.aifSaveMapping = async function() {
    try {
        const r = await fetch('/api/ai-filler/save-mapping', {
            method:'POST', credentials:'include',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ mapping: window._aifState.columnMapping })
        });
        const d = await r.json();
        toast(d.success ? '✅ Column mapping saved — auto-applied next upload' : d.error, d.success?'success':'error');
    } catch (err) { toast('Save failed: ' + err.message, 'error'); }
};

window.aifResetMapping = function() {
    window._aifState.columnMapping = {};
    _aifRenderMappingUI(window._aifState.detectedHeaders, {}, 0);
    toast('Mapping reset', 'info');
};

// ─── RUN ANALYSIS ─────────────────────────────────────────────────────────────
window.aifRunAnalysis = async function() {
    const input = document.getElementById('aif-excel-input');
    if (!input?.files[0]) return toast('Please select an Excel file first', 'warn');
    const btn  = document.getElementById('aif-analyze-btn');
    const hint = document.getElementById('aif-analyze-hint');
    if (btn)  { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>&nbsp; Matching products + Generating AI content…'; }
    if (hint) hint.innerHTML = '<span style="color:#6366f1;"><i class="fas fa-robot"></i> Reading Excel, matching brand+model, writing AI content…</span>';

    const fd = new FormData();
    fd.append('excel', input.files[0]);
    fd.append('mapping', JSON.stringify(window._aifState.columnMapping || {}));

    try {
        const res  = await fetch('/api/ai-filler/analyze', { method:'POST', credentials:'include', body: fd });
        const data = await res.json();
        if (!data.success) { toast(data.error || 'Analysis failed', 'error'); return; }

        window._aifState.results       = data.results;
        window._aifState.filtered      = data.results;
        window._aifState.stats         = data.stats;
        window._aifState.variantGroups = data.variantGroups || {};
        window._aifState.columnMapping = data.columnMapping || window._aifState.columnMapping;

        const s = data.stats;
        toast(`✅ Done! ${s.total} products processed • Engine: ${s.ai_engine}`);
        _aifRender(document.getElementById('view-ai_filler'), 'review');
        
        // Auto-select all by default for faster workflow
        setTimeout(() => {
            aifSelAll(true);
            const allChk = document.getElementById('aif-chk-all');
            if (allChk) allChk.checked = true;
        }, 150);
    } catch (err) {
        toast('Network error: ' + err.message, 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-brain"></i>&nbsp; Run AI Analysis'; }
    }
};

// ─── REVIEW TAB ───────────────────────────────────────────────────────────────
function _aifRenderReview(body) {
    const results = window._aifState.results;
    if (!results.length) {
        body.innerHTML = `
        <div class="card" style="text-align:center;padding:80px 40px;">
            <div style="font-size:3rem;margin-bottom:14px;">📂</div>
            <h3 style="color:#888;font-weight:500;">No analysis results yet</h3>
            <p style="color:#aaa;font-size:0.85rem;">Upload your Master Excel and run AI analysis first.</p>
            <button class="btn btn-primary" style="margin-top:16px;"
                onclick="_aifRender(document.getElementById('view-ai_filler'),'upload')">
                <i class="fas fa-arrow-left"></i> Go to Upload
            </button>
        </div>`;
        return;
    }

    const vg = window._aifState.variantGroups;
    const vFamilies = Object.values(vg).filter(c => c > 1).length;

    body.innerHTML = `
    <div style="background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.08));
                border:1px solid rgba(99,102,241,0.2);border-radius:10px;
                padding:10px 16px;margin-bottom:14px;display:flex;align-items:center;gap:12px;">
        <span style="font-size:1.4rem;">✨</span>
        <div style="font-size:0.79rem;color:#4c1d95;flex:1;">
            <b>AI Content Active:</b> Product names, descriptions, SEO &amp; tags generated by Gemini.
            Structural fields (category, shape, brand, MRP…) not modified.
            ${vFamilies ? `<span style="background:#ede9fe;color:#5b21b6;padding:1px 8px;border-radius:8px;font-size:0.7rem;font-weight:700;margin-left:8px;">🧩 ${vFamilies} variant families</span>` : ''}
        </div>
    </div>

    <div class="card" style="margin-bottom:12px;">
        <div style="padding:11px 16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
            <input type="text" placeholder="🔍 Search brand, model, product…" id="aif-q"
                oninput="aifFilter()" style="flex:1;min-width:160px;padding:7px 11px;border-radius:8px;
                border:1px solid var(--border);font-size:0.82rem;">
            <select id="aif-f-conf" onchange="aifFilter()"
                style="padding:7px 11px;border-radius:8px;border:1px solid var(--border);font-size:0.8rem;">
                <option value="">All Confidence</option>
                <option value="high">High (≥85%)</option>
                <option value="medium">Medium (60-84%)</option>
                <option value="low">Low (&lt;60%)</option>
            </select>
            <select id="aif-f-img" onchange="aifFilter()"
                style="padding:7px 11px;border-radius:8px;border:1px solid var(--border);font-size:0.8rem;">
                <option value="">All Images</option>
                <option value="found">Image Found</option>
                <option value="missing">Missing</option>
            </select>
            <span id="aif-cnt" style="font-size:0.79rem;color:#888;">${results.length} items</span>
            <div style="margin-left:auto;display:flex;gap:8px;">
                <button class="btn btn-outline btn-sm" onclick="aifSelAll(true)">Select All</button>
                <button class="btn btn-outline btn-sm" onclick="aifSelAll(false)">Clear</button>
                <button class="btn btn-primary btn-sm" onclick="aifBulkApprove()"
                    style="background:#10b981;border-color:#10b981;">
                    <i class="fas fa-check"></i> Approve Selected
                </button>
                <button class="btn btn-outline btn-sm" onclick="aifBulkReject()"
                    style="color:#ef4444;border-color:rgba(239,68,68,.3);">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>
        </div>
    </div>

    <div class="card" style="overflow:hidden;">
        <div class="table-container" style="max-height:calc(100vh - 420px);overflow-y:auto;">
            <table style="min-width:1100px;">
                <thead style="position:sticky;top:0;background:#f8fafc;z-index:5;">
                    <tr>
                        <th style="width:34px;"><input type="checkbox" id="aif-chk-all" onchange="aifSelAll(this.checked)" style="width:15px;height:15px;"></th>
                        <th>Product Info</th>
                        <th>Specs (Read-Only)</th>
                        <th style="text-align:center;">Image</th>
                        <th>Excel Data</th>
                        <th style="text-align:center;">AI Content</th>
                        <th style="text-align:center;">Match</th>
                        <th style="text-align:center;">Status</th>
                        <th style="text-align:center;">Actions</th>
                    </tr>
                </thead>
                <tbody id="aif-tbody">${_aifRows(results)}</tbody>
            </table>
        </div>
    </div>`;
}

function _aifRows(items) {
    if (!items.length) return `<tr><td colspan="9" style="text-align:center;padding:60px;color:#888;">No results match filters.</td></tr>`;
    const CC = { high:'#10b981', medium:'#f59e0b', low:'#ef4444' };
    const CB = { high:'#d1fae5', medium:'#fef3c7', low:'#fee2e2' };

    return items.map(r => {
        const e  = r.existing  || {};
        const ex = r.excel_data|| {};
        const ai = r.ai_content|| {};
        const globalIdx  = window._aifState.results.indexOf(r);
        const isApproved = r.status === 'approved';
        const isRejected = r.status === 'rejected';

        // Image cell with view badge
        const viewBadge = r.main_image_view
            ? `<div style="font-size:0.53rem;font-weight:700;margin-top:2px;text-transform:uppercase;
                      color:${r.main_image_view==='front'?'#10b981':'#f59e0b'};">
                  ${r.main_image_view==='front'?'✓ FRONT':'📷 '+r.main_image_view}</div>` : '';
        const imgCell = r.matched_image
            ? `<div style="text-align:center;">
                   <img src="${r.matched_image}" style="width:46px;height:46px;object-fit:contain;
                       border-radius:8px;border:1px solid #e2e8f0;">
                   ${viewBadge}
                   ${(r.image_count||0)>1?`<div style="font-size:0.53rem;color:#94a3b8;">${r.image_count} imgs</div>`:''}
               </div>`
            : `<div style="width:46px;height:46px;background:#f1f5f9;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;margin:auto;">📷</div>`;

        // Specs — read-only chips
        const specs = [
            e.category   && `<span style="background:#f1f5f9;color:#475569;padding:1px 5px;border-radius:4px;font-size:0.62rem;">${e.category}</span>`,
            e.gender     && `<span style="background:#fef3c7;color:#92400e;padding:1px 5px;border-radius:4px;font-size:0.62rem;">${e.gender}</span>`,
            e.shape      && `<span style="background:#eff6ff;color:#1d4ed8;padding:1px 5px;border-radius:4px;font-size:0.62rem;">${e.shape}</span>`,
            e.mrp        && `<span style="color:#10b981;font-weight:700;font-size:0.7rem;">₹${e.mrp}</span>`,
        ].filter(Boolean).join(' ');

        // Excel data chips
        const exChips = [
            ex.measurement    && `<div style="font-size:0.66rem;"><b>Meas:</b> ${ex.measurement}</div>`,
            ex.lens_composite && `<div style="font-size:0.66rem;"><b>Comp:</b> ${ex.lens_composite}</div>`,
            ex.lens_colorway  && `<div style="font-size:0.66rem;"><b>Color:</b> ${ex.lens_colorway}</div>`,
        ].filter(Boolean).join('') || `<span style="color:#ccc;font-size:0.68rem;">—</span>`;

        const aiStatus = r.ai_content_status === 'generated'
            ? `<span style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:2px 8px;border-radius:8px;font-size:0.62rem;font-weight:700;">✨ DONE</span>`
            : `<span style="color:#94a3b8;font-size:0.7rem;">—</span>`;

        const stMap = {
            pending:  `<span style="background:#f1f5f9;color:#64748b;padding:2px 8px;border-radius:10px;font-size:0.65rem;font-weight:700;">PENDING</span>`,
            approved: `<span style="background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:10px;font-size:0.65rem;font-weight:700;">✓ APPROVED</span>`,
            rejected: `<span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:10px;font-size:0.65rem;font-weight:700;">✕ REJECTED</span>`,
        };

        const vgCount = window._aifState.variantGroups[r.variant_group_key] || 0;
        const vgBadge = vgCount > 1
            ? `<span style="background:#ede9fe;color:#5b21b6;padding:1px 6px;border-radius:6px;font-size:0.58rem;font-weight:700;">🧩 ${vgCount}V</span>` : '';
        const warn = (r.warnings||[]).length
            ? `<div style="font-size:0.6rem;color:#b45309;">⚠ ${r.warnings[0]}</div>` : '';

        return `
        <tr id="aif-row-${globalIdx}" style="border-bottom:1px solid #f1f5f9;${isApproved?'background:rgba(16,185,129,0.03);':isRejected?'opacity:0.45;':''}">
            <td><input type="checkbox" class="aif-chk" data-gidx="${globalIdx}"
                style="width:15px;height:15px;accent-color:#6366f1;" ${isApproved?'checked disabled':''}></td>
            <td>
                <div style="font-weight:700;font-size:0.8rem;color:#0f172a;">${e.brand_name||'—'} ${e.model_no||''}</div>
                ${ai.product_name ? `<div style="font-size:0.7rem;color:#5b21b6;font-style:italic;margin-top:1px;">✨ "${ai.product_name}"</div>` : ''}
                <code style="font-size:0.62rem;background:#f1f5f9;padding:1px 4px;border-radius:4px;color:#64748b;">${e.model_no||'—'}</code>
                ${vgBadge} ${warn}
            </td>
            <td style="font-size:0.77rem;">${specs}</td>
            <td style="text-align:center;padding:8px 6px;">${imgCell}</td>
            <td style="font-size:0.77rem;min-width:120px;">${exChips}</td>
            <td style="text-align:center;">${aiStatus}</td>
            <td style="text-align:center;">
                <div style="font-size:1rem;font-weight:800;color:${CC[r.match_confidence]};">${r.match_score}%</div>
                <span style="padding:1px 7px;border-radius:10px;font-size:0.57rem;font-weight:700;
                             background:${CB[r.match_confidence]};color:${CC[r.match_confidence]};">
                    ${(r.match_confidence||'low').toUpperCase()}
                </span>
            </td>
            <td style="text-align:center;">${stMap[r.status||'pending']}</td>
            <td style="text-align:center;">
                <div style="display:flex;gap:4px;justify-content:center;">
                    <button class="btn btn-outline btn-sm" onclick="aifOpenEdit(${globalIdx})"
                        style="padding:4px 8px;font-size:0.68rem;" title="Edit & Preview">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="aifApproveOne(${globalIdx})"
                        style="padding:4px 8px;font-size:0.68rem;background:#10b981;border-color:#10b981;${isApproved?'opacity:0.4;':''}"
                        ${isApproved?'disabled':''} title="Approve & Publish">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="aifRejectOne(${globalIdx})"
                        style="padding:4px 8px;font-size:0.68rem;color:#ef4444;border-color:rgba(239,68,68,.3);" title="Reject">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

window.aifFilter = function() {
    const q    = (document.getElementById('aif-q')?.value||'').toLowerCase();
    const conf = document.getElementById('aif-f-conf')?.value||'';
    const img  = document.getElementById('aif-f-img')?.value||'';
    window._aifState.filtered = window._aifState.results.filter(r =>
        (!q    || (r.existing?.brand_name||'').toLowerCase().includes(q)
               || (r.existing?.model_no||'').toLowerCase().includes(q)
               || (r.ai_content?.product_name||'').toLowerCase().includes(q)) &&
        (!conf || r.match_confidence === conf) &&
        (!img  || r.image_status === img)
    );
    const tb = document.getElementById('aif-tbody');
    const ct = document.getElementById('aif-cnt');
    if (tb) tb.innerHTML = _aifRows(window._aifState.filtered);
    if (ct) ct.textContent = `${window._aifState.filtered.length} items`;
};

window.aifSelAll = function(v) {
    document.querySelectorAll('.aif-chk:not([disabled])').forEach(cb => cb.checked = v);
    const ca = document.getElementById('aif-chk-all');
    if (ca) ca.checked = v;
};

window.aifBulkApprove = async function() {
    const selected = Array.from(document.querySelectorAll('.aif-chk:checked:not([disabled])'))
        .map(cb => window._aifState.results[parseInt(cb.dataset.gidx)])
        .filter(r => r && r.status !== 'approved');
    if (!selected.length) return toast('No pending products selected', 'warn');
    if (!confirm(`Approve and publish ${selected.length} product(s)?`)) return;
    await _aifDoApprove(selected);
};

window.aifBulkReject = function() {
    Array.from(document.querySelectorAll('.aif-chk:checked:not([disabled])'))
        .map(cb => parseInt(cb.dataset.gidx)).forEach(i => aifRejectOne(i));
};

window.aifApproveOne = async function(idx) {
    const item = window._aifState.results[idx];
    if (item) await _aifDoApprove([item]);
};

window.aifRejectOne = function(idx) {
    const item = window._aifState.results[idx];
    if (!item) return;
    item.status = 'rejected';
    const row = document.getElementById(`aif-row-${idx}`);
    if (row) {
        row.style.opacity = '0.45';
        const cells = row.querySelectorAll('td');
        if (cells[7]) cells[7].innerHTML = `<span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:10px;font-size:0.65rem;font-weight:700;">✕ REJECTED</span>`;
    }
    fetch('/api/ai-filler/reject', { method:'POST', credentials:'include',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ product_ids:[item.product_id] }) });
    toast('Marked as rejected', 'info');
};

async function _aifDoApprove(items) {
    const overlay = document.createElement('div');
    overlay.innerHTML = `
        <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);">
            <div style="background:#fff;padding:30px 40px;border-radius:15px;text-align:center;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);max-width:350px;">
                <div style="font-size:3rem;margin-bottom:15px;animation:aifSpin 2s linear infinite;">
                    <i class="fas fa-cog" style="color:#6366f1;"></i>
                </div>
                <h3 style="margin:0 0 10px;font-size:1.2rem;color:#1e293b;">Publishing Products</h3>
                <p id="aif-pub-status" style="margin:0;font-size:0.85rem;color:#64748b;font-weight:600;">
                    Writing data and images for ${items.length} item(s)... Please wait.
                </p>
                <div style="margin-top:20px;height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden;">
                    <div style="height:100%;width:100%;background:#10b981;animation:aifIndeterminate 1.5s infinite ease-in-out;transform-origin:0% 50%;"></div>
                </div>
            </div>
        </div>
        <style>
            @keyframes aifSpin { 100% { transform:rotate(360deg); } }
            @keyframes aifIndeterminate { 
                0% { transform: translateX(-100%) scaleX(0.2); }
                50% { transform: translateX(0%) scaleX(0.5); }
                100% { transform: translateX(100%) scaleX(0.2); }
            }
        </style>
    `;
    document.body.appendChild(overlay);

    try {
        const r = await fetch('/api/ai-filler/approve', {
            method:'POST', credentials:'include',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ approvals: items })
        });
        const d = await r.json();
        if (d.success) {
            items.forEach(item => { item.status = 'approved'; });
            const statusEl = document.getElementById('aif-pub-status');
            if (statusEl) {
                let errSummary = '';
                if (d.failed && d.errors?.length) {
                    errSummary = `<div style="font-size:0.7rem;color:#ef4444;background:#fee2e2;padding:8px;border-radius:8px;margin-top:10px;text-align:left;">
                        <b>Errors:</b><br>${d.errors.slice(0,3).map(e => `ID ${e.product_id}: ${e.error}`).join('<br>')}
                        ${d.errors.length > 3 ? '<br>...' : ''}
                    </div>`;
                }
                statusEl.innerHTML = `
                    <span style="color:#10b981;font-size:1.1rem;">✅ Published ${d.applied} product(s)!</span>
                    ${d.failed ? `<br><span style="color:#ef4444;">(${d.failed} failed)</span>${errSummary}` : ''}
                    <br><br>Redirecting to eCommerce Catalog...
                `;
            }
            aifFilter();
            
            setTimeout(() => {
                document.body.removeChild(overlay);
                if (typeof window.loadView === 'function') {
                    window.loadView('ecommerce');
                } else {
                    window.location.hash = '#ecommerce';
                    window.location.reload();
                }
            }, 2500);
            
        } else {
            toast(d.error || 'Failed', 'error');
            document.body.removeChild(overlay);
        }
    } catch (err) { 
        toast('Network error: ' + err.message, 'error'); 
        document.body.removeChild(overlay);
    }
}

// ─── EDIT MODAL ───────────────────────────────────────────────────────────────
window.aifOpenEdit = function(globalIdx) {
    const item = window._aifState.results[globalIdx];
    if (!item) return;
    const e  = item.existing   || {};
    const ex = item.excel_data || {};
    const ai = item.ai_content || {};

    // Additional images
    const additionalImgs = (item.additional_images || []);
    const imgPreview = item.matched_image
        ? `<div style="background:#f8fafc;border-radius:10px;padding:12px;margin-bottom:14px;">
               <div style="font-size:0.7rem;font-weight:700;color:#64748b;margin-bottom:8px;text-transform:uppercase;">
                   🖼️ Images — Auto Selected (${item.main_image_view||'auto'})
               </div>
               <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-start;">
                   <div style="text-align:center;">
                       <img src="${item.matched_image}" style="width:80px;height:80px;object-fit:contain;border-radius:8px;border:2px solid #10b981;">
                       <div style="font-size:0.6rem;font-weight:700;color:#10b981;margin-top:3px;">★ MAIN (${item.main_image_view||'auto'})</div>
                   </div>
                   ${additionalImgs.slice(0,4).map(img => {
                       const url  = typeof img==='string'?img:(img.url||img);
                       const view = typeof img==='object'?(img.view||''):'';
                       return `<div style="text-align:center;">
                           <img src="${url}" style="width:54px;height:54px;object-fit:contain;border-radius:6px;border:1px solid #e2e8f0;">
                           ${view?`<div style="font-size:0.55rem;color:#94a3b8;margin-top:2px;">${view}</div>`:''}
                       </div>`;
                   }).join('')}
               </div>
           </div>`
        : `<div style="background:#fff7ed;border:1px dashed #f59e0b;border-radius:8px;padding:10px;margin-bottom:14px;font-size:0.75rem;color:#92400e;">
               ⚠️ No image found for <b>${e.model_no}</b>. Upload images named <code>${e.model_no}_COLOR_front.jpg</code>
           </div>`;

    openModal(`✏️ Review — ${e.brand_name||''} ${e.model_no||''}`, `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
        <!-- LEFT: Product Record (read-only) + Excel supplementary -->
        <div>
            <div style="background:#f8fafc;border-radius:10px;padding:14px;margin-bottom:14px;border-left:3px solid #94a3b8;">
                <p style="font-size:0.7rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.4px;margin:0 0 10px;">
                    🔒 Product Record (Read-Only — not modified here)
                </p>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.8rem;">
                    ${[
                        ['Brand',      e.brand_name],
                        ['Model No',   e.model_no],
                        ['Category',   e.category],
                        ['Shape',      e.shape],
                        ['Frame Type', e.frame_type],
                        ['Material',   e.material],
                        ['Gender',     e.gender],
                        ['Color Code', e.color_code],
                        ['Size Code',  e.size_code],
                        ['MRP',        e.mrp ? '₹'+e.mrp : ''],
                    ].map(([l,v]) => `
                    <div>
                        <div style="font-size:0.63rem;color:#94a3b8;font-weight:600;">${l}</div>
                        <div style="font-weight:600;color:#374151;">${v||'—'}</div>
                    </div>`).join('')}
                </div>
            </div>

            <div style="background:#eff6ff;border-radius:10px;padding:12px;margin-bottom:14px;border-left:3px solid #3b82f6;">
                <p style="font-size:0.7rem;font-weight:700;color:#1d4ed8;text-transform:uppercase;margin:0 0 10px;">
                    📊 From Excel (Editable)
                </p>

                <!-- Measurement row -->
                <div style="margin-bottom:10px;">
                    <div style="font-size:0.68rem;font-weight:700;color:#1d4ed8;margin-bottom:6px;">Measurement (Lens - Bridge - Temple)</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
                        <div class="form-row" style="margin-bottom:0;">
                            <label style="font-size:0.65rem;color:#64748b;">Lens Width</label>
                            <input id="aife-lens-width" value="${(ex.lens_width||'').replace(/"/g,'&quot;')}"
                                placeholder="52" style="font-size:0.8rem;text-align:center;">
                        </div>
                        <div class="form-row" style="margin-bottom:0;">
                            <label style="font-size:0.65rem;color:#64748b;">Bridge Width</label>
                            <input id="aife-bridge-width" value="${(ex.bridge_width||'').replace(/"/g,'&quot;')}"
                                placeholder="18" style="font-size:0.8rem;text-align:center;">
                        </div>
                        <div class="form-row" style="margin-bottom:0;">
                            <label style="font-size:0.65rem;color:#64748b;">Temple Length</label>
                            <input id="aife-temple-length" value="${(ex.temple_length||'').replace(/"/g,'&quot;')}"
                                placeholder="140" style="font-size:0.8rem;text-align:center;">
                        </div>
                    </div>
                    <div style="font-size:0.63rem;color:#94a3b8;margin-top:4px;">
                        Combined: <span id="aife-meas-preview" style="font-weight:700;color:#1d4ed8;">${ex.measurement||'—'}</span>
                    </div>
                </div>


                <!-- Master-linked fields \u2014 Gender, Shape, Frame Material -->
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px;">
                    ${[['Gender','aife-gender-text',ex.gender_text||'',ex.gender_id],
                       ['Shape', 'aife-shape-text', ex.shape_text||'', ex.shape_id],
                       ['Frame Material','aife-material-text',ex.material_text||'',ex.material_id]
                    ].map(([lbl,id,val,resolved]) => `
                    <div class="form-row" style="margin-bottom:0;">
                        <label style="font-size:0.65rem;font-weight:600;color:#1d4ed8;display:flex;align-items:center;justify-content:space-between;">
                            ${lbl}
                            <span style="font-size:0.55rem;padding:1px 5px;border-radius:5px;font-weight:700;
                                background:${resolved?'#d1fae5':'#fef3c7'};color:${resolved?'#065f46':'#92400e'};margin-left:3px;">
                                ${resolved?'\u2713 Matched':'\u26a0 Unmatched'}</span>
                        </label>
                        <input id="${id}" value="${val.replace(/"/g,'&quot;')}" placeholder="from Excel" style="font-size:0.78rem;">
                    </div>`).join('')}
                </div>
                <p style="font-size:0.62rem;color:#94a3b8;margin:0 0 8px;">⚠ Unmatched values won't update the field on approve. Add to Master Data first.</p>

                <!-- Lens Composite & Colorway -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <div class="form-row" style="margin-bottom:0;">
                        <label style="font-size:0.68rem;font-weight:600;color:#1d4ed8;">Lens Composite</label>
                        <input id="aife-lens-composite" value="${(ex.lens_composite||'').replace(/"/g,'&quot;')}" placeholder="e.g. Polycarbonate" style="font-size:0.8rem;">
                    </div>
                    <div class="form-row" style="margin-bottom:0;">
                        <label style="font-size:0.68rem;font-weight:600;color:#1d4ed8;">Lens Colorway</label>
                        <input id="aife-lens-colorway" value="${(ex.lens_colorway||'').replace(/"/g,'&quot;')}" placeholder="e.g. Gradient Brown" style="font-size:0.8rem;">
                    </div>
                </div>
            </div>


            ${imgPreview}
        </div>

        <!-- RIGHT: AI Content (editable) -->
        <div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                <p style="font-size:0.7rem;font-weight:700;color:#5b21b6;text-transform:uppercase;letter-spacing:.4px;margin:0;">
                    ✨ AI Generated Content
                </p>
                <button id="aife-regen-btn" class="btn btn-outline btn-sm" onclick="aifRegenContent(${globalIdx})"
                    style="font-size:0.7rem;padding:4px 10px;color:#6366f1;border-color:#6366f1;">
                    <i class="fas fa-sync-alt"></i> Regenerate
                </button>
            </div>
            <div id="aife-ai-status" style="background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.15);
                    border-radius:8px;padding:6px 12px;margin-bottom:12px;font-size:0.72rem;color:#5b21b6;">
                <i class="fas fa-robot"></i> Generated by ${window._aifState.stats.ai_engine||'AI'}
            </div>
            <div class="form-row">
                <label>Product Name <span style="color:#7c3aed;font-size:0.62rem;">✨ AI (Brand + Model)</span></label>
                <input id="aife-name" value="${(ai.product_name||'').replace(/"/g,'&quot;')}">
            </div>
            <div class="form-row">
                <label>Short Description <span style="color:#7c3aed;font-size:0.62rem;">✨ AI</span></label>
                <input id="aife-short" value="${(ai.short_description||'').replace(/"/g,'&quot;')}">
            </div>
            <div class="form-row">
                <label>Description <span style="color:#7c3aed;font-size:0.62rem;">✨ AI (3-4 paragraphs)</span></label>
                <textarea id="aife-desc" rows="5" style="font-size:0.78rem;line-height:1.5;">${ai.description||''}</textarea>
            </div>
            <div class="form-row">
                <label>SEO Title <span style="color:#7c3aed;font-size:0.62rem;">✨ AI</span></label>
                <input id="aife-seotitle" value="${(ai.seo_title||'').replace(/"/g,'&quot;')}">
                <div id="aife-stcount" style="font-size:0.62rem;color:#888;margin-top:2px;">${(ai.seo_title||'').length}/60 chars</div>
            </div>
            <div class="form-row">
                <label>Meta Description <span style="color:#7c3aed;font-size:0.62rem;">✨ AI</span></label>
                <textarea id="aife-seodesc" rows="2" style="font-size:0.78rem;">${ai.seo_description||''}</textarea>
                <div id="aife-sdcount" style="font-size:0.62rem;color:#888;margin-top:2px;">${(ai.seo_description||'').length}/155 chars</div>
            </div>
            <div class="form-row">
                <label>Keywords / Tags (CSV) <span style="color:#7c3aed;font-size:0.62rem;">✨ AI</span></label>
                <input id="aife-tags" value="${(ai.tags||'').replace(/"/g,'&quot;')}">
            </div>
            <div style="background:#f8fafc;border-radius:8px;padding:8px 12px;font-size:0.72rem;color:#64748b;margin-top:6px;">
                Match: <b style="color:#6366f1;">${item.match_score}%</b> (${item.match_confidence}) &nbsp;|&nbsp;
                Image: <b style="color:${item.image_status==='found'?'#10b981':'#ef4444'};">${item.image_status}</b>
                ${item.main_image_view?` &nbsp;|&nbsp; View: <b style="color:#6366f1;">${item.main_image_view}</b>`:''}
            </div>
        </div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:18px;border-top:1px solid var(--border);padding-top:14px;">
        <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="aifSaveEdit(${globalIdx})"
            style="background:#10b981;border-color:#10b981;min-width:180px;">
            <i class="fas fa-check"></i> Save &amp; Approve
        </button>
    </div>`, 'lg');

    document.getElementById('aife-seotitle')?.addEventListener('input', function() {
        document.getElementById('aife-stcount').textContent = `${this.value.length}/60 chars`;
    });
    document.getElementById('aife-seodesc')?.addEventListener('input', function() {
        document.getElementById('aife-sdcount').textContent = `${this.value.length}/155 chars`;
    });
    // Live combined measurement preview
    ['aife-lens-width','aife-bridge-width','aife-temple-length'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', () => {
            const lw = document.getElementById('aife-lens-width')?.value    || '';
            const bw = document.getElementById('aife-bridge-width')?.value  || '';
            const tl = document.getElementById('aife-temple-length')?.value || '';
            const prev = document.getElementById('aife-meas-preview');
            if (prev) prev.textContent = [lw, bw, tl].filter(Boolean).join('-') || '—';
        });
    });
};

window.aifRegenContent = async function(globalIdx) {
    const item = window._aifState.results[globalIdx];
    if (!item) return;
    const btn    = document.getElementById('aife-regen-btn');
    const status = document.getElementById('aife-ai-status');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating…'; }
    if (status) status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gemini is writing new content…';
    const e  = item.existing   || {};
    const ex = item.excel_data || {};
    try {
        const r = await fetch('/api/ai-filler/regenerate-content', {
            method:'POST', credentials:'include',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({
                brand:         e.brand_name   || '',
                model:         e.model_no     || '',
                category:      e.category     || '',
                gender:        e.gender       || '',
                shape:         e.shape        || '',
                material:      e.material     || '',
                frameType:     e.frame_type   || '',
                colorCode:     e.color_code   || '',
                lensColorway:  document.getElementById('aife-lens-colorway')?.value  || ex.lens_colorway  || '',
                lensComposite: document.getElementById('aife-lens-composite')?.value || ex.lens_composite || '',
                measurement:   [
                    document.getElementById('aife-lens-width')?.value    || '',
                    document.getElementById('aife-bridge-width')?.value  || '',
                    document.getElementById('aife-temple-length')?.value || ''
                ].filter(Boolean).join('-') || ex.measurement || '',
                mrp:           e.mrp || '',
            })
        });
        const d = await r.json();
        if (!d.success) { toast(d.error||'Failed', 'error'); return; }
        const c = d.data;
        document.getElementById('aife-name').value     = c.product_name      || '';
        document.getElementById('aife-short').value    = c.short_description || '';
        document.getElementById('aife-desc').value     = c.description       || '';
        document.getElementById('aife-seotitle').value = c.seo_title         || '';
        document.getElementById('aife-seodesc').value  = c.seo_description   || '';
        document.getElementById('aife-tags').value     = c.tags              || '';
        document.getElementById('aife-stcount').textContent = `${(c.seo_title||'').length}/60 chars`;
        document.getElementById('aife-sdcount').textContent = `${(c.seo_description||'').length}/155 chars`;
        if (status) status.innerHTML = '<i class="fas fa-check" style="color:#10b981;"></i> New content generated — review and approve.';
        toast('✨ AI content regenerated!');
    } catch (err) {
        toast('Error: ' + err.message, 'error');
        if (status) status.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#f59e0b;"></i> Generation failed.';
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sync-alt"></i> Regenerate'; }
    }
};

window.aifSaveEdit = async function(globalIdx) {
    const item = window._aifState.results[globalIdx];
    if (!item) return;
    item.ai_content = {
        product_name:      document.getElementById('aife-name')?.value     || '',
        short_description: document.getElementById('aife-short')?.value    || '',
        description:       document.getElementById('aife-desc')?.value     || '',
        seo_title:         document.getElementById('aife-seotitle')?.value || '',
        seo_description:   document.getElementById('aife-seodesc')?.value  || '',
        tags:              document.getElementById('aife-tags')?.value     || '',
    };
    const lw = document.getElementById('aife-lens-width')?.value    || '';
    const bw = document.getElementById('aife-bridge-width')?.value  || '';
    const tl = document.getElementById('aife-temple-length')?.value || '';
    item.excel_data = {
        lens_width:     lw,
        bridge_width:   bw,
        temple_length:  tl,
        measurement:    [lw, bw, tl].filter(Boolean).join('-'),
        lens_composite: document.getElementById('aife-lens-composite')?.value || '',
        lens_colorway:  document.getElementById('aife-lens-colorway')?.value  || '',
        // Master-linked fields — keep resolved IDs from original analysis,
        // text is editable so re-send as-is; backend resolves IDs server-side on approve
        gender_text:    document.getElementById('aife-gender-text')?.value    || item.excel_data?.gender_text   || '',
        gender_id:      item.excel_data?.gender_id   || null,
        shape_text:     document.getElementById('aife-shape-text')?.value     || item.excel_data?.shape_text    || '',
        shape_id:       item.excel_data?.shape_id    || null,
        material_text:  document.getElementById('aife-material-text')?.value  || item.excel_data?.material_text || '',
        material_id:    item.excel_data?.material_id || null,
    };
    closeModal();
    await _aifDoApprove([item]);
};

// ─── LOGS TAB ─────────────────────────────────────────────────────────────────
async function _aifRenderLogs(body) {
    body.innerHTML = `<div style="text-align:center;padding:60px;"><i class="fas fa-spinner fa-spin fa-2x" style="color:#6366f1;"></i></div>`;
    const d    = await api('/api/ai-filler/logs');
    const rows = d.data || [];
    const sc   = { approved:'#10b981', rejected:'#ef4444', pending:'#f59e0b' };
    body.innerHTML = `
    <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
            <h3 style="margin:0;font-size:1rem;">AI Processing Logs</h3>
            <span style="font-size:0.8rem;color:#888;">${rows.length} records</span>
        </div>
        <div class="table-container">
            <table>
                <thead><tr>
                    <th>Time</th><th>Product</th><th>Brand</th><th>Model</th>
                    <th style="text-align:center;">Match</th>
                    <th style="text-align:center;">Status</th>
                </tr></thead>
                <tbody>
                    ${rows.length ? rows.map(r => `
                    <tr>
                        <td style="font-size:0.75rem;color:#888;">${new Date(r.processed_at).toLocaleString('en-IN')}</td>
                        <td style="font-weight:600;font-size:0.82rem;">${r.product_name||r.product_id}</td>
                        <td style="font-size:0.78rem;">${r.brand_name||'—'}</td>
                        <td><code style="font-size:0.68rem;background:#f1f5f9;padding:1px 4px;border-radius:4px;">${r.model_no||'—'}</code></td>
                        <td style="text-align:center;font-weight:700;color:#6366f1;">
                            ${r.confidence_score?parseFloat(r.confidence_score).toFixed(0)+'%':'—'}
                        </td>
                        <td style="text-align:center;">
                            <span style="padding:2px 10px;border-radius:10px;font-size:0.68rem;font-weight:700;
                                background:${(sc[r.match_status]||'#888')+'22'};color:${sc[r.match_status]||'#888'};">
                                ${(r.match_status||'pending').toUpperCase()}
                            </span>
                        </td>
                    </tr>`).join('')
                    : `<tr><td colspan="6" style="text-align:center;padding:60px;color:#888;">No processing history yet.</td></tr>`}
                </tbody>
            </table>
        </div>
    </div>`;
}
