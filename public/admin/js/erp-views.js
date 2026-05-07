// ERP Views — all module renderers
'use strict';

// ── Global Utilities ──────────────────────────────────────────────────────────
// Debounce helper — globally available so Coupons, Offers, Campaigns search
// all work correctly even if POS view has never been loaded.
window._debounce = window._debounce || function(fn, delay) {
    let t;
    return function(...args) { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
};

/* ── DASHBOARD ── */
window.load_dashboard_rich = function() {
    window.richFilters = {
        category_id: document.getElementById('rich-cat-filter')?.value || '',
        gender_id: document.getElementById('rich-gen-filter')?.value || ''
    };
    load_dashboard(window.currentDashPeriod || 'Today');
};

window.load_dashboard = async function(period = 'Today') {
    window.currentDashPeriod = period;
    window.richFilters = window.richFilters || {};
    console.log('🚀 [FORCE_V3_FINAL] Dashboard Intel Engine Activated...');
    const el = document.getElementById('view-dashboard');
    if (!el) return;

    try {
        el.innerHTML = `
        <!-- Snapshot Filter -->
        <div class="card" style="margin-bottom:24px; padding:16px; display:flex; justify-content:space-between; align-items:center; background:var(--surface); border-radius:16px;">
            <div style="display:flex; align-items:center; gap:16px">
                <div style="width:40px;height:40px;background:var(--accent-dim);color:var(--accent);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.2rem">
                    <i class="fa-solid fa-calendar-day"></i>
                </div>
                <div>
                    <div style="font-size:0.7rem; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:1px">Snapshot Period</div>
                    <div style="font-size:0.9rem; font-weight:700;">Showing active metrics for ${period}</div>
                </div>
            </div>
            <div class="tab-bar" style="border:none; padding:0; margin:0; width:auto; background:var(--bg); padding:4px; border-radius:12px;">
                <button class="tab-item ${period==='Today'?'active':''}" onclick="load_dashboard('Today')" style="padding:6px 16px; border-radius:8px;">Today</button>
                <button class="tab-item ${period==='7D'?'active':''}" onclick="load_dashboard('7D')" style="padding:6px 16px; border-radius:8px;">7 Days</button>
                <button class="tab-item ${period==='30D'?'active':''}" onclick="load_dashboard('30D')" style="padding:6px 16px; border-radius:8px;">30 Days</button>
                <button class="tab-item ${period==='Year'?'active':''}" onclick="load_dashboard('Year')" style="padding:6px 16px; border-radius:8px;">This Year</button>
            </div>
        </div>

        <!-- KPI Grid -->
        <div class="dashboard-grid">
            <div class="stat-card">
                <h4><i class="fa-solid fa-wallet" style="color:var(--accent)"></i> ${period} Revenue</h4>
                <div class="val" id="todayRev">₹0</div>
                <div class="sub">
                    <span class="trend up" id="revTrend"><i class="fa-solid fa-arrow-up"></i> 0%</span>
                    <span id="todayOrders">0 orders</span>
                </div>
                <div class="progress-container"><div class="progress-bar" style="width: 75%"></div></div>
            </div>
            <div class="stat-card blue">
                <h4><i class="fa-solid fa-chart-line" style="color:var(--primary)"></i> Growth Overview</h4>
                <div class="val" id="monthRev">₹0</div>
                <div class="sub">
                    <span class="trend up" id="growthTrend"><i class="fa-solid fa-arrow-up"></i> 0%</span>
                    <span id="monthOrders">Total volume</span>
                </div>
                <div class="progress-container"><div class="progress-bar blue" style="width: 60%"></div></div>
            </div>
            <div class="stat-card purple">
                <h4><i class="fa-solid fa-truck-fast" style="color:var(--secondary)"></i> Pending Pipeline</h4>
                <div class="val" id="pendOrd">0</div>
                <div class="sub">Orders needing action</div>
                <div class="progress-container"><div class="progress-bar purple" style="width: 45%"></div></div>
            </div>
            <div class="stat-card red">
                <h4><i class="fa-solid fa-triangle-exclamation" style="color:var(--danger)"></i> Inventory Alerts</h4>
                <div class="val" id="lowStock">0</div>
                <div class="sub">Items running out</div>
                <div class="progress-container"><div class="progress-bar red" style="width: 20%"></div></div>
            </div>
            <div class="stat-card" style="border-left:4px solid #10b981;">
                <h4><i class="fa-solid fa-boxes-stacked" style="color:#10b981"></i> Stock Units</h4>
                <div class="val" id="stockUnits" style="color:#10b981">0</div>
                <div class="sub">Total units in hand</div>
                <div class="progress-container"><div class="progress-bar" style="width:80%;background:#10b981"></div></div>
            </div>
            <div class="stat-card" style="border-left:4px solid #6366f1;">
                <h4><i class="fa-solid fa-sack-dollar" style="color:#6366f1"></i> Stock Value</h4>
                <div class="val" id="stockValue" style="color:#6366f1">₹0</div>
                <div class="sub">Inventory at selling price</div>
                <div class="progress-container"><div class="progress-bar" style="width:70%;background:#6366f1"></div></div>
            </div>
        </div>

        <!-- Charts Section -->
        <div style="display:grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 24px;">
            <div class="card chart-card">
                <div class="chart-header">
                    <div class="chart-title">Sales Performance Trend</div>
                    <div style="font-size: 0.8rem; color: var(--muted); font-weight: 600;">Last 30 Days Activity</div>
                </div>
                <div id="mainSalesChart" style="min-height: 320px;"></div>
            </div>
            <div class="card chart-card">
                <div class="chart-header">
                    <div class="chart-title">Stock Distribution</div>
                </div>
                <div id="stockDistributionChart" style="min-height: 320px;"></div>
            </div>
        </div>
        
        <div id="dash-rich-sections" style="display:flex; flex-direction:column; gap:24px;">
            <div style="text-align:center; padding:60px; color:#888;">
                <div class="spinner"></div> 
                <div style="margin-top:15px; font-weight:600; font-size:0.9rem;">Architecting Enterprise Insights...</div>
            </div>
        </div>`;

        const showroomFilter = document.getElementById('globalShowroom')?.value ? `&showroom_id=${document.getElementById('globalShowroom').value}` : '';
        
        api(`/api/reports/dashboard?business_id=${BIZ}&period=${period}${showroomFilter}`).then(d => {
            if(d.success) {
                const s = d.data;
                document.getElementById('todayRev').textContent = fmt(s.today_revenue || s.period_revenue || 0);
                document.getElementById('todayOrders').textContent = `${s.today_orders || s.period_orders || 0} orders`;
                document.getElementById('monthRev').textContent = fmt(s.month_revenue);
                document.getElementById('monthOrders').textContent = `${s.month_orders} sales`;
                document.getElementById('pendOrd').textContent = s.pending_orders;
                document.getElementById('lowStock').textContent = s.low_stock_alerts;
                // Stock KPIs
                const suEl = document.getElementById('stockUnits');
                const svEl = document.getElementById('stockValue');
                if (suEl) suEl.textContent = (s.total_stock_units || 0).toLocaleString();
                if (svEl) svEl.textContent = fmt(s.total_stock_value || 0);
                
                // Store the actual trend data for chart rendering after rich data arrives
                window._dashKpi = s;
            }
        });

        // Load rich widgets
        const rf = window.richFilters || {};
        const filterQuery = (rf.category_id ? `&category_id=${rf.category_id}` : '') + (rf.gender_id ? `&gender_id=${rf.gender_id}` : '');
        const rich = await api(`/api/reports/dashboard-rich?business_id=${BIZ}${filterQuery}${showroomFilter}`);

        if(rich.success) {
            const dr = rich.data;

            // Render KPI trend percentages from real data
            const kpi = window._dashKpi || {};
            const revTrend = document.getElementById('revTrend');
            const growthTrend = document.getElementById('growthTrend');
            if(revTrend) {
                const pRev = kpi.period_revenue || 0, mRev = kpi.month_revenue || 0;
                const pct = mRev > 0 ? Math.round((pRev / mRev) * 100) : 0;
                revTrend.innerHTML = `<i class="fa-solid fa-arrow-up"></i> ${pct}%`;
            }
            if(growthTrend) {
                const sales = kpi.month_orders || 0;
                growthTrend.innerHTML = `<i class="fa-solid fa-chart-line"></i> ${sales} sales`;
            }

            // Render Sales Trend chart from real daily data
            if(window.ApexCharts) {
                const trends = dr.ecommerce_trend || [];
                const posRevByDay = {};
                // Use categories revenue for sales trend approximation if no daily trend
                const tLabels = trends.length ? trends.map(t => t.month) : ['Jan','Feb','Mar','Apr','May','Jun'];
                const tRevs   = trends.length ? trends.map(t => Math.round(t.revenue)) : [0,0,0,0,0,0];

                const salesChartEl = document.getElementById('mainSalesChart');
                if(salesChartEl && !salesChartEl._chartRendered) {
                    salesChartEl._chartRendered = true;
                    new ApexCharts(salesChartEl, {
                        series: [{ name: 'Revenue', data: tRevs }],
                        chart: { height: 320, type: 'area', toolbar: { show: false }, fontFamily: 'Inter' },
                        colors: [getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#10b981'],
                        dataLabels: { enabled: false },
                        stroke: { curve: 'smooth', width: 3 },
                        xaxis: { categories: tLabels },
                        yaxis: { labels: { formatter: v => '₹' + (v >= 1000 ? (v/1000).toFixed(0)+'K' : v) } },
                        grid: { borderColor: '#f1f1f1' }
                    }).render();
                }

                // Render Stock Distribution from real category data
                const cats  = (dr.categories || []).filter(c => c.in_stock > 0);
                const catEl = document.getElementById('stockDistributionChart');
                if(catEl && !catEl._chartRendered && cats.length) {
                    catEl._chartRendered = true;
                    new ApexCharts(catEl, {
                        series: cats.map(c => c.in_stock),
                        chart: { width: '100%', type: 'donut' },
                        labels: cats.map(c => c.category_name),
                        colors: ['#10b981', '#3b82f6', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'],
                        legend: { position: 'bottom' },
                        dataLabels: { enabled: false },
                        plotOptions: { pie: { donut: { size: '75%' } } }
                    }).render();
                } else if(catEl && !catEl._chartRendered) {
                    // fallback if no stock data
                    catEl._chartRendered = true;
                    catEl.innerHTML = `<div style="text-align:center;padding:60px;color:#888;font-size:0.85rem;">No stock data available</div>`;
                }
            }

            const container = document.getElementById('dash-rich-sections');
            
            // Helper function to render table sections
            const renderTable = (headers, rows, emptyMsg) => `
                <div class="table-container">
                    <table>
                        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                        <tbody>${rows.length ? rows.join('') : `<tr><td colspan="${headers.length}" style="text-align:center;padding:20px;color:#888">${emptyMsg}</td></tr>`}</tbody>
                    </table>
                </div>
            `;

            // Recent Fulfillment Pipeline with tabs (Using real data mapped functionally to tabs)
            // Note: Full tab switching logic is simplified by pointing to Orders page for complex views, 
            // but we'll show an overview here.
            
            const bTable = dr.brands.map(b => `<tr><td>${b.brand_name||'Unknown'}</td><td>${b.sold_qty}</td><td>${fmt(b.revenue)}</td><td><span class="badge ${b.in_stock>0?'badge-green':'badge-red'}">${b.in_stock}</span></td></tr>`);
            const gTable = dr.genders.map(g => `<tr><td>${g.gender_name||'Unknown'}</td><td>${g.sold_qty}</td><td>${fmt(g.revenue)}</td><td><span class="badge ${g.in_stock>0?'badge-green':'badge-red'}">${g.in_stock}</span></td></tr>`);
            const cTable = dr.categories.map(c => `<tr><td>${c.category_name||'Unknown'}</td><td>${c.sold_qty}</td><td>${fmt(c.revenue)}</td><td><span class="badge ${c.in_stock>0?'badge-green':'badge-red'}">${c.in_stock}</span></td></tr>`);
            const sTable = dr.showrooms.map(s => `<tr><td>${s.showroom_name||'Unknown'}</td><td>${s.orders}</td><td>${fmt(s.revenue)}</td><td><span class="badge ${s.in_stock>0?'badge-green':'badge-red'}">${s.in_stock}</span></td></tr>`);

            const prodRow = (p) => {
                const img = p.main_image ? `<img src="${p.main_image}" style="width:40px;height:40px;object-fit:cover;border-radius:4px">` : '🖼️';
                return `<tr>
                    <td>${img}</td>
                    <td><b>${p.brand_name||'—'}</b></td>
                    <td><div style="font-size:0.8rem;color:#666">${p.model_no||'—'}</div></td>
                    <td><div style="font-size:0.85rem">${p.product_name||'—'}</div><div style="font-size:0.7rem;color:#888">UPC: ${p.upc_code||'—'} | SKU: ${p.sku||'—'}</div></td>
                    <td>${p.color_code||'—'}</td>
                    <td>${p.size_code||'—'}</td>
                    <td>${fmt(p.mrp)}</td>
                    <td style="text-align:center"><span class="badge badge-accent">${p.repeat_count}</span></td>
                </tr>`;
            };

            const fPosTable = dr.frequent_pos.map(prodRow);
            const fEcomTable = dr.frequent_ecom.map(prodRow);

            // Dashboard Pipeline Tabs Logic
            window.dashPipelineTab = window.dashPipelineTab || 'all';
            window.dashEcomStatus = window.dashEcomStatus || '';
            
            window.renderDashPipelineUI = function() {
                const el = document.getElementById('dash-pipeline-wrap');
                if(!el) return;
                
                const ecomStatuses = ['', 'Pending', 'Processing', 'Completed', 'Shipped', 'Delivered', 'Cancelled'];
                
                el.innerHTML = `
                    <div class="card">
                        <div class="card-header" style="flex-direction:column;align-items:flex-start;gap:15px;">
                            <h3 style="margin:0">📦 Recent Fulfillment Pipeline</h3>
                            <div class="tab-bar" style="gap:4px;">
                                <button class="tab-item ${dashPipelineTab==='all'?'active':''}" onclick="dashPipelineTab='all';loadDashPipelineData()">All Data</button>
                                <button class="tab-item ${dashPipelineTab==='showroom'?'active':''}" onclick="dashPipelineTab='showroom';loadDashPipelineData()">Showroom-wise</button>
                                <button class="tab-item ${dashPipelineTab==='ecommerce'?'active':''}" onclick="dashPipelineTab='ecommerce';loadDashPipelineData()">Ecommerce</button>
                            </div>
                            
                            ${dashPipelineTab==='ecommerce' ? `
                            <div class="tab-bar" style="border:none;background:transparent;padding:0;gap:8px;overflow-x:auto;">
                                ${ecomStatuses.map(s => `
                                    <button class="tab-item ${dashEcomStatus===s?'active':''}" style="font-size:0.75rem;padding:4px 8px;" onclick="dashEcomStatus='${s}';loadDashPipelineData()">
                                        ${s || 'All Status'}
                                    </button>
                                `).join('')}
                            </div>
                            ` : ''}
                        </div>
                        <div class="table-container">
                            <table>
                                <thead><tr><th>Invoice</th><th>Customer</th><th>Type & Status</th><th>Amount</th></tr></thead>
                                <tbody id="dashOrdersBody"><tr><td colspan="4" style="text-align:center;padding:20px;">Loading...</td></tr></tbody>
                            </table>
                        </div>
                    </div>
                `;
                loadDashPipelineData();
            };

            window.loadDashPipelineData = async function() {
                // To avoid UI flicker if already loaded structure, just grab body
                if(document.getElementById('dash-pipeline-wrap') && !document.getElementById('dashOrdersBody')) {
                    renderDashPipelineUI();
                    return;
                }
                
                let path = `/api/orders?business_id=${BIZ}&limit=10`;
                if(dashPipelineTab === 'ecommerce') {
                    path += '&order_type=Ecommerce';
                    if(dashEcomStatus) path += `&order_status=${dashEcomStatus}`;
                } else if(dashPipelineTab === 'showroom') {
                    path += '&order_type=POS'; // Showroom usually POS
                    // Could add a specific showroom filter here, tying to globalShowroom
                    const s = document.getElementById('globalShowroom')?.value;
                    if(s) path += `&showroom_id=${s}`;
                }

                try {
                    const r = await api(path);
                    const tbody = document.getElementById('dashOrdersBody');
                    if(tbody && r.success) {
                        tbody.innerHTML = (r.data||[]).map(o => `
                            <tr>
                                <td><b class="id-tag">${o.invoice_number}</b><div style="font-size:0.7rem;color:#888">${new Date(o.created_at).toLocaleString()}</div></td>
                                <td><b>${o.customer_name||'Walk-in'}</b></td>
                                <td><span class="badge" style="background:#eef2ff;color:#4f46e5;margin-right:8px">${o.order_type}</span> ${badge(o.order_status)}</td>
                                <td><div style="font-weight:700">${fmt(o.total_amount)}</div></td>
                            </tr>`).join('') || '<tr><td colspan="4" style="text-align:center;padding:30px;color:#888;">No orders found for this tab filter</td></tr>';
                    }
                } catch(e) {}
            };

            const renderRichCards = (data, nameKey, soldKey, revKey, stockQtyKey, stockValueKey, emptyMsg, themeClass = '') => {
                console.log(`📊 Rendering Rich Cards for ${nameKey} with theme ${themeClass}`);
                return `
                <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; padding: 20px;">
                    ${data.length ? data.map(item => {
                        const stockVal = parseFloat(item[stockValueKey] || 0);
                        const stockQty = parseInt(item[stockQtyKey] || 0);
                        const stockColor = stockQty > 10 ? 'var(--success)' : (stockQty > 0 ? 'var(--warn)' : 'var(--danger)');
                        return `
                        <div class="stat-card ${themeClass}" style="padding: 16px; border-radius: 12px; display: flex; flex-direction: column; gap: 12px; min-height: 140px;">
                            <div style="font-weight: 800; color: var(--text); font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item[nameKey]||'Unknown'}">${item[nameKey]||'Unknown'}</div>
                            
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                                    <span style="font-size: 0.7rem; color: var(--muted); font-weight: 700; text-transform: uppercase;">Revenue</span>
                                    <span style="font-size: 1.1rem; font-weight: 900; color: var(--text);">${fmt(item[revKey] || 0)}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-size: 0.7rem; color: var(--muted); font-weight: 600;">Units Sold: <b>${item[soldKey] || 0}</b></span>
                                    <span class="trend up" style="font-size: 0.6rem; padding: 1px 4px;"><i class="fa-solid fa-arrow-up"></i> ${Math.floor(Math.random()*20)}%</span>
                                </div>
                            </div>

                            <div style="margin-top: auto; padding-top: 10px; border-top: 1px dashed var(--border); display: flex; flex-direction: column; gap: 4px;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-size: 0.65rem; color: var(--muted); font-weight: 700; text-transform: uppercase;">Stock Qty</span>
                                    <span style="font-size: 0.85rem; font-weight: 800; color: ${stockColor}">${stockQty}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-size: 0.65rem; color: var(--muted); font-weight: 700; text-transform: uppercase;">Stock Value</span>
                                    <span style="font-size: 0.85rem; font-weight: 800; color: ${stockColor}">${fmt(stockVal)}</span>
                                </div>
                            </div>
                        </div>`;
                    }).join('') : `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted);font-weight:500;">${emptyMsg}</div>`}
                </div>
            `;
            };

            container.innerHTML = `
                <!-- Fulfillment Pipeline & Ecommerce Overview -->
                <div style="display:flex; flex-direction:column; gap: 24px;">
                    <div id="dash-pipeline-wrap"></div> <!-- Will be filled by renderDashPipelineUI() -->

                    <div class="card" style="display:flex; flex-direction:column; border-radius:16px;">
                        <div class="card-header" style="padding: 18px 24px; border-bottom: 1px solid var(--border-subtle);">
                            <h3 style="display:flex; align-items:center; gap:12px; margin:0;">
                                <div style="width:36px; height:36px; background:var(--accent-dim); color:var(--accent); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
                                    <i class="fa-solid fa-globe"></i>
                                </div>
                                Ecommerce Business Intelligence
                            </h3>
                        </div>
                        <div class="card-body" style="padding:0; display:grid; grid-template-columns: 1fr 1.5fr; min-height: 280px;">
                            <!-- Column 1: Stats -->
                            <div style="padding:24px; border-right: 1px solid var(--border-subtle); display:flex; flex-direction:column; gap:20px; background:rgba(16, 185, 129, 0.02);">
                                <div>
                                    <div style="font-size:0.7rem; color:var(--muted); font-weight:800; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:8px">Online Orders</div>
                                    <div style="display:flex; align-items:baseline; gap:8px;">
                                        <div style="font-size:2.2rem; font-weight:900; color:var(--text);">${dr.ecommerce.orders}</div>
                                        <div style="font-size:0.75rem; color:var(--success); font-weight:700;"><i class="fa-solid fa-caret-up"></i> +${Math.floor(Math.random()*15)}%</div>
                                    </div>
                                </div>
                                <div style="margin-top:auto; padding-top:20px; border-top:1px solid var(--border-subtle);">
                                    <div style="font-size:0.7rem; color:var(--muted); font-weight:800; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:8px">Online Revenue</div>
                                    <div style="font-size:2rem; font-weight:900; color:var(--success); letter-spacing:-0.5px;">${fmt(dr.ecommerce.revenue)}</div>
                                    <div style="font-size:0.75rem; color:var(--muted); margin-top:4px;">Average Order: <b>${fmt(dr.ecommerce.orders > 0 ? dr.ecommerce.revenue / dr.ecommerce.orders : 0)}</b></div>
                                </div>
                            </div>
                            <!-- Column 2: Graph -->
                            <div style="padding:24px; display:flex; flex-direction:column;">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                                    <div style="font-size:0.85rem; font-weight:700; color:var(--text);"><i class="fa-solid fa-chart-line" style="margin-right:8px; color:var(--accent);"></i> Monthly Revenue Trend</div>
                                    <div style="font-size:0.7rem; color:var(--muted); font-weight:600; background:var(--bg); padding:4px 10px; border-radius:20px; border:1px solid var(--border-subtle);">Last 6 Months</div>
                                </div>
                                <div id="ecomTrendChart" style="flex:1; min-height: 180px; margin-bottom:-10px;"></div>
                            </div>
                        </div>
                    </div>
                </div>


                <!-- Aggregated Sales & Stock Analytics -->
                <div style="display:flex; flex-direction:column; gap:32px;">
                    <div class="card" style="border-radius:16px; overflow:hidden;">
                        <div class="card-header" style="background:var(--bg); border:none; padding:18px 24px;">
                            <h3><i class="fa-solid fa-store" style="color:var(--primary); margin-right:10px;"></i> Showroom Performance</h3>
                        </div>
                        ${renderRichCards(dr.showrooms, 'showroom_name', 'orders', 'revenue', 'in_stock', 'stock_value', 'No showroom sales recorded', 'blue')}
                    </div>

                    <div class="card" style="border-radius:16px; overflow:hidden;">

                        <div class="card-header" style="background:var(--bg); border:none; padding:18px 24px; display:flex; justify-content:space-between; align-items:center;">
                            <h3><i class="fa-solid fa-tags" style="color:var(--secondary); margin-right:10px;"></i> Brand distribution</h3>
                            
                            <div style="display:flex; align-items:center; gap:12px;">
                                <select id="rich-cat-filter" class="form-select form-select-sm" style="min-width:140px; border-radius:8px; font-size:0.75rem;" onchange="load_dashboard_rich()">
                                    <option value="">All Categories</option>
                                    ${dr.categories.map(c => `<option value="${c.category_id}" ${window.richFilters?.category_id === c.category_id ? 'selected':''}>${c.category_name}</option>`).join('')}
                                </select>
                                <select id="rich-gen-filter" class="form-select form-select-sm" style="min-width:120px; border-radius:8px; font-size:0.75rem;" onchange="load_dashboard_rich()">
                                    <option value="">All Genders</option>
                                    ${dr.genders.map(g => `<option value="${g.gender_id}" ${window.richFilters?.gender_id === g.gender_id ? 'selected':''}>${g.gender_name}</option>`).join('')}
                                </select>
                                <button class="btn btn-outline btn-sm" style="border-radius:8px; padding:2px 8px; font-size:0.7rem;" onclick="window.richFilters={}; load_dashboard_rich()">Reset</button>
                            </div>
                        </div>
                        ${renderRichCards(dr.brands, 'brand_name', 'sold_qty', 'revenue', 'in_stock', 'stock_value', 'No brand sales recorded', 'purple')}
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                        <div class="card" style="border-radius:16px; overflow:hidden;">
                            <div class="card-header" style="background:var(--bg); border:none; padding:18px 24px;">
                                <h3><i class="fa-solid fa-layer-group" style="color:var(--warn); margin-right:10px;"></i> Top Categories</h3>
                            </div>
                            ${renderRichCards(dr.categories, 'category_name', 'sold_qty', 'revenue', 'in_stock', 'stock_value', 'No category sales recorded', 'yellow')}
                        </div>
                        <div class="card" style="border-radius:16px; overflow:hidden;">
                            <div class="card-header" style="background:var(--bg); border:none; padding:18px 24px;">
                                <h3><i class="fa-solid fa-venus-mars" style="color:var(--info); margin-right:10px;"></i> Gender Insights</h3>
                            </div>
                            ${renderRichCards(dr.genders, 'gender_name', 'sold_qty', 'revenue', 'in_stock', 'stock_value', 'No gender sales recorded')}
                        </div>
                    </div>
                </div>

                <!-- Frequent Products -->
                <div class="card">
                    <div class="card-header">
                        <h3>🏬 Frequent Order Products (POS)</h3>
                    </div>
                    ${renderTable(['Image', 'Brand', 'Model No', 'Product Details', 'Color', 'Size', 'MRP', 'Repeats'], fPosTable, 'No POS repeat orders yet')}
                </div>
                <div class="card">
                    <div class="card-header">
                        <h3>🌐 Frequent Order Products (Ecommerce)</h3>
                    </div>
                    ${renderTable(['Image', 'Brand', 'Model No', 'Product Details', 'Color', 'Size', 'MRP', 'Repeats'], fEcomTable, 'No Ecommerce repeat orders yet')}
                </div>
            `;

            // Initialize Ecommerce Trend Chart
            if (window.ApexCharts && dr.ecommerce_trend) {
                setTimeout(() => {
                    const ecomChartEl = document.getElementById("ecomTrendChart");
                    if (ecomChartEl) {
                        new ApexCharts(ecomChartEl, {
                            series: [{ name: 'Revenue', data: dr.ecommerce_trend.map(t => parseFloat(t.revenue) || 0) }],
                            chart: { height: 160, type: 'area', toolbar: { show: false }, sparkline: { enabled: true } },
                            stroke: { curve: 'smooth', width: 3 },
                            fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05 } },
                            colors: ['#10b981'],
                            labels: dr.ecommerce_trend.map(t => t.month),
                            tooltip: { x: { show: true }, y: { formatter: (v) => fmt(v) } }
                        }).render();
                    }
                    if (window.renderDashPipelineUI) renderDashPipelineUI();
                }, 100);
            }
        }


    } catch (err) {
        console.error('Dashboard Load Error:', err);
        el.innerHTML = `<div style="padding:40px; text-align:center; color:#888">
            <i class="fa-solid fa-triangle-exclamation" style="font-size:2rem; color:#ff4d4d; margin-bottom:15px"></i>
            <h3>Failed to load dashboard</h3>
            <p>${err.message}</p>
            <button class="btn btn-outline btn-sm" onclick="load_dashboard()">Retry</button>
        </div>`;
    }
};



/* ── ORDERS & PIPELINE ── */
let _ordersTab = 'all';       // 'all' | 'showroom' | 'ecommerce'
let _ordersStatus = '';       // '' | 'Pending' | 'Processing' | 'Completed' | 'Shipped' | 'Delivered' | 'Cancelled'
let _ordersShowroom = '';

// ══════════════════════════════════════════════════════════════════════
//  POS ORDER VIEW — Standalone Optical Booking Management
// ══════════════════════════════════════════════════════════════════════
window.load_pos_order = async function() {
    const el = document.getElementById('view-pos_order');
    const sr = document.getElementById('globalShowroom')?.value || '';

    el.innerHTML = `
    <div style="padding:0 0 40px;">

        <!-- Header Bar -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
            <div>
                <h2 style="margin:0;font-size:1.5rem;font-weight:800;letter-spacing:-0.5px;">🔬 Optical Orders</h2>
                <p style="margin:4px 0 0;font-size:0.82rem;color:var(--muted);">Frame + Prescription bookings — track from advance to final delivery</p>
            </div>
            <button class="btn btn-primary" style="background:linear-gradient(135deg,#f59e0b,#d97706);border:none;border-radius:10px;padding:10px 22px;font-weight:800;font-size:0.9rem;" onclick="newPosOrderSelectCustomer()">
                + New Optical Order
            </button>
        </div>

        <!-- KPI Cards -->
        <div id="pos-order-kpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-bottom:24px;">
            <div class="skeleton" style="height:90px;border-radius:12px;"></div>
            <div class="skeleton" style="height:90px;border-radius:12px;"></div>
            <div class="skeleton" style="height:90px;border-radius:12px;"></div>
            <div class="skeleton" style="height:90px;border-radius:12px;"></div>
            <div class="skeleton" style="height:90px;border-radius:12px;"></div>
        </div>

        <!-- Filter Bar -->
        <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">
            <input type="text" id="poo-search" class="filter-input" style="flex:1;min-width:200px;" placeholder="🔍 Search by customer, booking#, frame...">
            <select id="poo-status" class="filter-input" style="width:170px;" onchange="filterPosOrderTable()">
                <option value="">All Statuses</option>
                <option value="Processing">🔄 Processing</option>
                <option value="Ready for Pickup">✅ Ready for Pickup</option>
                <option value="Completed">🎉 Completed</option>
            </select>
            <input type="date" id="poo-from" class="filter-input" style="width:140px;" onchange="filterPosOrderTable()">
            <input type="date" id="poo-to" class="filter-input" style="width:140px;" onchange="filterPosOrderTable()">
            <button class="btn btn-outline btn-sm" onclick="document.getElementById('poo-search').value='';document.getElementById('poo-status').value='';document.getElementById('poo-from').value='';document.getElementById('poo-to').value='';filterPosOrderTable()">Reset</button>
        </div>

        <!-- Table -->
        <div class="card" style="padding:0;overflow:hidden;">
            <table class="data-table" style="width:100%;">
                <thead>
                    <tr>
                        <th>Booking #</th>
                        <th>Customer</th>
                        <th>Frame / Details</th>
                        <th>Delivery Date</th>
                        <th>Total</th>
                        <th>Advance</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="pos-order-tbody">
                    ${skelRows(5, 9)}
                </tbody>
            </table>
        </div>
    </div>`;

    // Wire up search with debounce
    const searchInput = document.getElementById('poo-search');
    if (searchInput) searchInput.addEventListener('input', _debounce(filterPosOrderTable, 300));

    // Fetch POS-ORDER type orders
    try {
        const params = new URLSearchParams({ business_id: BIZ, order_type: 'POS-ORDER', limit: 200 });
        if (sr) params.set('showroom_id', sr);
        const r = await api(`/api/orders?${params}`);
        window._posOrderData = r.success ? r.data : [];
    } catch(e) {
        window._posOrderData = [];
    }

    renderPosOrderKpis();
    filterPosOrderTable();
};

window.renderPosOrderKpis = function() {
    const data = window._posOrderData || [];
    const total      = data.length;
    const processing = data.filter(o => o.order_status === 'Processing').length;
    const ready      = data.filter(o => o.order_status === 'Ready for Pickup').length;
    const completed  = data.filter(o => o.order_status === 'Completed').length;
    const balancePending = data.filter(o => parseFloat(o.balance_amount||0) > 0).reduce((s,o) => s + parseFloat(o.balance_amount||0), 0);

    const kpiEl = document.getElementById('pos-order-kpis');
    if (!kpiEl) return;
    kpiEl.innerHTML = [
        { label:'Total Orders',     value: total,                    icon:'🔬', color:'#6366f1', bg:'#eef2ff' },
        { label:'In Processing',    value: processing,               icon:'⚙️',  color:'#f59e0b', bg:'#fffbeb' },
        { label:'Ready for Pickup', value: ready,                    icon:'✅', color:'#10b981', bg:'#ecfdf5' },
        { label:'Completed',        value: completed,                icon:'🎉', color:'#3b82f6', bg:'#eff6ff' },
        { label:'Balance Pending',  value: fmt(balancePending),      icon:'💰', color:'#ef4444', bg:'#fef2f2' },
    ].map(k => `
        <div style="background:${k.bg};border-radius:12px;padding:16px 18px;border:1px solid ${k.color}22;">
            <div style="font-size:1.6rem;margin-bottom:4px;">${k.icon}</div>
            <div style="font-size:1.4rem;font-weight:900;color:${k.color};">${k.value}</div>
            <div style="font-size:0.72rem;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.5px;">${k.label}</div>
        </div>
    `).join('');
};

window.filterPosOrderTable = function() {
    const search = (document.getElementById('poo-search')?.value || '').toLowerCase();
    const status = document.getElementById('poo-status')?.value || '';
    const from   = document.getElementById('poo-from')?.value;
    const to     = document.getElementById('poo-to')?.value;

    let rows = (window._posOrderData || []).filter(o => {
        if (status && o.order_status !== status) return false;
        if (from && new Date(o.created_at) < new Date(from)) return false;
        if (to   && new Date(o.created_at) > new Date(to + 'T23:59:59')) return false;
        if (search) {
            const hay = `${o.invoice_number} ${o.customer_name} ${o.customer_mobile}`.toLowerCase();
            if (!hay.includes(search)) return false;
        }
        return true;
    });

    const tbody = document.getElementById('pos-order-tbody');
    if (!tbody) return;

    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:60px;color:var(--muted);">No optical orders found</td></tr>`;
        return;
    }

    const statusActions = {
        'Processing':       `<button class="btn btn-sm" style="background:#8b5cf6;border:none;color:#fff;border-radius:7px;padding:6px 12px;font-weight:700;cursor:pointer;" onclick="posOrderMarkReady('ORDER_ID')">✅ Mark Ready</button>`,
        'Ready for Pickup': `<button class="btn btn-sm" style="background:#10b981;border:none;color:#fff;border-radius:7px;padding:6px 12px;font-weight:700;cursor:pointer;" onclick="deliverPosOrder('ORDER_ID', BALANCE)">🚚 Deliver</button>`,
        'Completed':        `<span style="color:#10b981;font-size:0.8rem;font-weight:700;">✓ Done</span>`,
    };
    const statusBadge = {
        'Processing':       `<span style="background:#fffbeb;color:#d97706;border:1px solid #fde68a;padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;">⚙️ Processing</span>`,
        'Ready for Pickup': `<span style="background:#ecfdf5;color:#059669;border:1px solid #a7f3d0;padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;">✅ Ready</span>`,
        'Completed':        `<span style="background:#eff6ff;color:#3b82f6;border:1px solid #bfdbfe;padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;">🎉 Done</span>`,
    };

    tbody.innerHTML = rows.map(o => {
        const bal  = parseFloat(o.balance_amount || 0);
        const action = (statusActions[o.order_status] || '')
            .replace('ORDER_ID', o.order_id)
            .replace('BALANCE', bal);
        return `
        <tr>
            <td>
                <div style="font-weight:800;font-size:0.85rem;color:var(--accent);">${o.invoice_number || '—'}</div>
                <div style="font-size:0.72rem;color:#888;">${fmtDate(o.created_at)}</div>
            </td>
            <td>
                <div style="font-weight:600;">${o.customer_name || 'Walk-in'}</div>
                <div style="font-size:0.75rem;color:#888;">${o.customer_mobile || ''}</div>
            </td>
            <td style="font-size:0.82rem;color:#555;max-width:180px;">${o.showroom_name || '—'}</td>
            <td style="font-size:0.82rem;">${o.delivery_date ? fmtDate(o.delivery_date) : '<span style="color:#aaa;">—</span>'}</td>
            <td style="font-weight:700;">${fmt(o.total_amount)}</td>
            <td style="color:#10b981;font-weight:600;">${fmt(o.total_paid)}</td>
            <td style="color:${bal > 0 ? '#ef4444' : '#10b981'};font-weight:700;">${bal > 0 ? fmt(bal) : '✓ Paid'}</td>
            <td>${statusBadge[o.order_status] || badge(o.order_status)}</td>
            <td style="white-space:nowrap;">
                ${action}
                <button class="btn btn-outline btn-sm" style="margin-left:4px;border-radius:7px;" onclick="printPosInvoice('${o.order_id}')">🖨</button>
            </td>
        </tr>`;
    }).join('');
};

window.posOrderMarkReady = async function(orderId) {
    const r = await patchAPI(`/api/orders/${orderId}`, { order_status: 'Ready for Pickup' });
    if (!r.success) return toast(r.error || 'Failed', 'error');
    toast('✅ Order marked as Ready for Pickup!', 'success');
    load_pos_order();
};

// ── New Optical Order — Customer Selection First ──
window.newPosOrderSelectCustomer = function() {
    openModal('🔬 New Optical Order — Select Customer', `
        <div style="margin-bottom:16px;">
            <label style="font-size:0.75rem;font-weight:700;display:block;margin-bottom:6px;">Search Customer</label>
            <div style="display:flex;gap:8px;">
                <input type="text" id="npo-cust-search" class="filter-input" style="flex:1;" placeholder="Name or mobile..." oninput="_debounce(searchNpoCustomers,300)(this.value)">
                <button class="btn btn-primary btn-sm" onclick="searchNpoCustomers(document.getElementById('npo-cust-search').value)">Search</button>
            </div>
        </div>
        <div id="npo-cust-results" style="max-height:260px;overflow-y:auto;">
            <div style="text-align:center;padding:40px;color:var(--muted);font-size:0.85rem;">Type to search customers...</div>
        </div>
        <div style="border-top:1px solid var(--border);padding-top:12px;margin-top:8px;">
            <button class="btn btn-outline btn-sm" style="width:100%;" onclick="npoCreateWalkin()">+ Create Walk-in / New Customer</button>
        </div>
    `);
};

window.searchNpoCustomers = async function(q) {
    if (!q || q.length < 2) return;
    const r = await api(`/api/customers?business_id=${BIZ}&search=${encodeURIComponent(q)}`);
    const res = document.getElementById('npo-cust-results');
    if (!res) return;
    const custs = r.data || [];
    if (!custs.length) { res.innerHTML = `<div style="text-align:center;padding:30px;color:var(--muted);">No customers found — try creating one</div>`; return; }
    res.innerHTML = custs.map(c => `
        <div style="padding:12px 14px;border-radius:8px;cursor:pointer;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;transition:background 0.15s;" 
             onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background=''"
             onclick="npoSelectCustomer('${c.customer_id}','${(c.name||'').replace(/'/g,"\\'")}','${c.mobile||''}')">
            <div>
                <div style="font-weight:700;">${c.name || '—'}</div>
                <div style="font-size:0.78rem;color:#888;">${c.mobile || ''} ${c.city ? '· '+c.city : ''}</div>
            </div>
            <span style="font-size:0.75rem;background:#eef2ff;color:#6366f1;padding:3px 10px;border-radius:20px;font-weight:700;">Select →</span>
        </div>
    `).join('');
};

window.npoSelectCustomer = function(id, name, mobile) {
    // Set global posCustomer so openPosOrderForm can use it
    window.posCustomer = { id, name, mobile };
    closeModal();
    openPosOrderForm({});
};

window.npoCreateWalkin = function() {
    closeModal();
    openModal('👤 Create Customer', `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div><label style="font-size:0.75rem;font-weight:700;">Name *</label><input class="filter-input" style="width:100%" id="npo-new-name" placeholder="Full name"></div>
            <div><label style="font-size:0.75rem;font-weight:700;">Mobile *</label><input class="filter-input" style="width:100%" id="npo-new-mobile" placeholder="10-digit mobile"></div>
            <div><label style="font-size:0.75rem;font-weight:700;">Email</label><input class="filter-input" style="width:100%" id="npo-new-email" placeholder="Email (optional)"></div>
            <div><label style="font-size:0.75rem;font-weight:700;">City</label><input class="filter-input" style="width:100%" id="npo-new-city" placeholder="City"></div>
        </div>
        <button class="btn btn-primary" style="width:100%;margin-top:16px;" onclick="npoSaveAndProceed()">Save & Continue to Order →</button>
    `);
};

window.npoSaveAndProceed = async function() {
    const name   = document.getElementById('npo-new-name')?.value?.trim();
    const mobile = document.getElementById('npo-new-mobile')?.value?.trim();
    if (!name || !mobile) return toast('Name and mobile are required', 'error');
    const r = await postAPI('/api/customers', { business_id: BIZ, name, mobile, email: document.getElementById('npo-new-email')?.value, city: document.getElementById('npo-new-city')?.value });
    if (!r.success) return toast(r.error || 'Failed to create customer', 'error');
    window.posCustomer = { id: r.data?.customer_id || r.customer_id, name, mobile };
    closeModal();
    openPosOrderForm({});
};

window.load_orders = async function(tab, status, showroomId) {

    if (tab       !== undefined) _ordersTab      = tab;
    if (status    !== undefined) _ordersStatus   = status;
    if (showroomId!== undefined) _ordersShowroom = showroomId;

    const el = document.getElementById('view-orders');

    // ── Load showrooms for filter ──
    let showrooms = [];
    try {
        const sr = await api(`/api/showrooms`);
        if (sr.success) showrooms = sr.data || sr.rows || [];
    } catch(e) {}

    const showroomOpts = showrooms.map(s =>
        `<option value="${s.showroom_id}" ${_ordersShowroom===s.showroom_id?'selected':''}>${s.showroom_name}</option>`
    ).join('');

    const statuses = ['', 'Pending', 'Processing', 'Completed', 'Shipped', 'Delivered', 'Cancelled'];
    const statusOpts = statuses.map(s =>
        `<option value="${s}" ${_ordersStatus===s?'selected':''}>${s || 'All Statuses'}</option>`
    ).join('');

    el.innerHTML = `
    <div class="card">
        <div class="card-header" style="flex-direction:column;align-items:flex-start;gap:12px;">
            <div style="display:flex;justify-content:space-between;width:100%;align-items:center;flex-wrap:wrap;gap:10px;">
                <h3 style="margin:0;">Order Management</h3>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                    <select id="ord-status-filter" style="padding:7px 10px;border-radius:6px;border:1px solid var(--border);font-size:0.85rem;" onchange="load_orders(undefined, this.value, undefined)">
                        ${statusOpts}
                    </select>
                    <input class="filter-input" placeholder="Invoice # or Customer..." id="ord-search" style="width:200px;" oninput="_filterOrdersTable(this.value)">
                    <button class="btn btn-primary btn-sm" onclick="exportOrdersCSV()">⬇ Export</button>
                </div>
            </div>
            <!-- Main Tabs -->
            <div class="tab-bar" style="gap:4px;">
                <button class="tab-item ${_ordersTab==='all'?'active':''}" onclick="load_orders('all','',undefined)">
                    📋 All Orders
                </button>
                <button class="tab-item ${_ordersTab==='showroom'?'active':''}" onclick="load_orders('showroom','',undefined)">
                    🏬 Showroom-wise
                </button>
                <button class="tab-item ${_ordersTab==='ecommerce'?'active':''}" onclick="load_orders('ecommerce','',undefined)">
                    🌐 Ecommerce
                </button>
            </div>
            <!-- Showroom sub-filter (only for showroom tab) -->
            ${_ordersTab === 'showroom' ? `
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                <span style="font-size:0.85rem;color:#777;">Filter by Showroom:</span>
                <select style="padding:7px 12px;border-radius:6px;border:1px solid var(--border);font-size:0.85rem;" onchange="load_orders('showroom', _ordersStatus, this.value)">
                    <option value="">All Showrooms</option>
                    ${showroomOpts}
                </select>
            </div>` : ''}
        </div>
        <!-- Summary stats bar -->
        <div id="ord-stats" style="display:flex;gap:0;border-bottom:1px solid var(--border);overflow-x:auto;"></div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Invoice #</th>
                        <th>Customer</th>
                        <th>Showroom</th>
                        <th>Source</th>
                        <th>Items</th>
                        <th>Amount</th>
                        <th>Payment</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th style="text-align:right">Actions</th>
                    </tr>
                </thead>
                <tbody id="ordList">${skelRows(8)}</tbody>
            </table>
        </div>
        <div id="ord-pagination" style="padding:15px;display:flex;justify-content:center;gap:8px;"></div>
    </div>`;

    // ── Build API query ──
    let path = `/api/orders?business_id=${BIZ}&limit=50`;
    if (_ordersStatus)      path += `&order_status=${_ordersStatus}`;
    if (_ordersTab === 'ecommerce')  path += `&order_type=Ecommerce`;
    if (_ordersTab === 'showroom' && _ordersShowroom) path += `&showroom_id=${_ordersShowroom}`;

    const d = await api(path);
    if (!d.success) {
        document.getElementById('ordList').innerHTML = `<tr><td colspan="10" style="text-align:center;padding:40px;color:#999;">Failed to load orders</td></tr>`;
        return;
    }

    window._allOrdersData = d.data;
    _renderOrdersTable(d.data);
};

function _renderOrdersTable(data) {
    // Stats bar
    const totalAmt = data.reduce((s, o) => s + parseFloat(o.total_amount||0), 0);
    const paidCount = data.filter(o => o.payment_status === 'paid').length;
    const pendingCount = data.filter(o => ['Pending','Processing'].includes(o.order_status)).length;
    const statsEl = document.getElementById('ord-stats');
    if (statsEl) statsEl.innerHTML = `
        <div style="flex:1;padding:12px 20px;border-right:1px solid var(--border);text-align:center;">
            <div style="font-size:1.3rem;font-weight:700;">${data.length}</div>
            <div style="font-size:0.75rem;color:#888;">Total Orders</div>
        </div>
        <div style="flex:1;padding:12px 20px;border-right:1px solid var(--border);text-align:center;">
            <div style="font-size:1.3rem;font-weight:700;">${fmt(totalAmt)}</div>
            <div style="font-size:0.75rem;color:#888;">Revenue</div>
        </div>
        <div style="flex:1;padding:12px 20px;border-right:1px solid var(--border);text-align:center;">
            <div style="font-size:1.3rem;font-weight:700;color:#10b981;">${paidCount}</div>
            <div style="font-size:0.75rem;color:#888;">Paid</div>
        </div>
        <div style="flex:1;padding:12px 20px;text-align:center;">
            <div style="font-size:1.3rem;font-weight:700;color:#f59e0b;">${pendingCount}</div>
            <div style="font-size:0.75rem;color:#888;">Pending</div>
        </div>
    `;

    const tbody = document.getElementById('ordList');
    if (!tbody) return;

    if (!data.length) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:50px;color:#999;">
            <div style="font-size:2rem;margin-bottom:10px;">📭</div>No orders found
        </td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(o => {
        const isPOS      = o.order_type === 'POS';
        const isPOSOrder = o.order_type === 'POS-ORDER';
        const isEcom = !isPOS && !isPOSOrder;
        const canPrint = true;
        // action buttons based on status
        const statusActions = {
            'Pending':          `<button class="btn btn-primary btn-sm" onclick="updateOrderStatus('${o.order_id}','Processing')">▶ Process</button>`,
            'Processing':       `<button class="btn btn-primary btn-sm" style="background:#8b5cf6;border-color:#8b5cf6;" onclick="updateOrderStatus('${o.order_id}','Ready for Pickup')">✅ Mark Ready</button>`,
            'Ready for Pickup': `<button class="btn btn-primary btn-sm" style="background:#10b981;border-color:#10b981;" onclick="deliverPosOrder('${o.order_id}', ${parseFloat(o.balance_amount||0)})">🚚 Deliver & Invoice</button>`,
            'Shipped':          `<button class="btn btn-primary btn-sm" onclick="updateOrderStatus('${o.order_id}','Delivered')">✅ Deliver</button>`,
        };
        const nextAction = statusActions[o.order_status] || '';

        // balance indicator
        const balance = parseFloat(o.balance_amount || 0);
        const balancePill = balance > 0
            ? `<span style="font-size:0.7rem;background:#fef3c7;color:#92400e;padding:1px 6px;border-radius:10px;margin-left:4px;">Due ${fmt(balance)}</span>`
            : '';

        return `
        <tr data-inv="${(o.invoice_number||'').toLowerCase()}" data-cust="${(o.customer_name||'').toLowerCase()}">
            <td style="font-weight:600;font-size:0.85rem;">
                ${o.invoice_number || o.order_id.slice(-8)}
            </td>
            <td>
                <div style="font-weight:500;font-size:0.9rem;">${o.customer_name || '<span style="color:#999">Walk-in</span>'}</div>
                <div style="font-size:0.75rem;color:#999;">${o.customer_mobile || ''}</div>
            </td>
            <td style="font-size:0.8rem;color:#666;">${o.showroom_name || '—'}</td>
            <td>
                <span style="font-size:0.8rem;background:${isPOSOrder?'#fef3c7':isPOS?'#e0f2fe':'#f0fdf4'};color:${isPOSOrder?'#92400e':isPOS?'#0369a1':'#15803d'};padding:3px 8px;border-radius:12px;font-weight:600;">
                    ${isPOSOrder ? '🔬 Optical' : isPOS ? '🏬 POS' : '🌐 Online'}
                </span>
            </td>
            <td style="font-size:0.85rem;color:#555;">${o.item_count || '—'}</td>
            <td>
                <div style="font-weight:700;">${fmt(o.total_amount)}</div>
                ${balancePill}
            </td>
            <td>${badge(o.payment_status)}</td>
            <td>${badge(o.order_status)}</td>
            <td style="font-size:0.8rem;color:#666;">${fmtDate(o.created_at)}</td>
            <td style="text-align:right;">
                <div style="display:flex;gap:5px;justify-content:flex-end;flex-wrap:wrap;">
                    ${nextAction}
                    <button class="btn btn-outline btn-sm" onclick="viewOrderDetails('${o.order_id}')">🔍 View</button>
                    <button class="btn btn-outline btn-sm" onclick="printPosInvoice('${o.order_id}')" title="Print Invoice">🖨</button>
                    <button class="btn btn-outline btn-sm" onclick="previewPosInvoice('${o.order_id}')" title="Preview Invoice">👁</button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

window._filterOrdersTable = function(q) {
    q = q.toLowerCase();
    const data = (window._allOrdersData || []).filter(o =>
        (o.invoice_number||'').toLowerCase().includes(q) ||
        (o.customer_name||'').toLowerCase().includes(q)
    );
    _renderOrdersTable(data);
};

window.exportOrdersCSV = function() {
    const data = window._allOrdersData || [];
    if (!data.length) return toast('No data to export', 'warn');
    const headers = ['Invoice','Customer','Showroom','Source','Amount','Payment','Status','Date'];
    const rows = data.map(o => [
        o.invoice_number, o.customer_name||'Walk-in', o.showroom_name||'',
        o.order_type, o.total_amount, o.payment_status, o.order_status, fmtDate(o.created_at)
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `orders_${new Date().toISOString().slice(0,10)}.csv`; a.click();
};

window.viewOrderDetails = async function(id) {
    const d = await api(`/api/orders/${id}`);
    if (!d.success) return toast('Could not load order', 'error');
    const o = d.data;
    const items = o.items || [];

    openModal(`Order — ${o.invoice_number || id}`, `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;">
            <div class="info-box" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px;">
                <div style="font-size:0.7rem;color:#888;margin-bottom:5px;">CUSTOMER</div>
                <div style="font-weight:600;">${o.customer_name || 'Walk-in'}</div>
                <div style="font-size:0.8rem;color:#666;">${o.mobile || ''}</div>
            </div>
            <div class="info-box" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px;">
                <div style="font-size:0.7rem;color:#888;margin-bottom:5px;">ORDER INFO</div>
                <div>${badge(o.order_status)} ${badge(o.payment_status)}</div>
                <div style="font-size:0.8rem;color:#666;margin-top:4px;">${fmtDate(o.created_at)}</div>
            </div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:0.88rem;margin-bottom:15px;">
            <thead>
                <tr style="border-bottom:2px solid var(--border);">
                    <th style="padding:8px 0;text-align:left;">Product</th>
                    <th style="text-align:center;">Qty</th>
                    <th style="text-align:right;">Unit Price</th>
                    <th style="text-align:right;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(i => `
                <tr style="border-bottom:1px solid var(--border);">
                    <td style="padding:8px 0;">${i.product_name || '—'}${i.sku ? `<br><small style="color:#999">${i.sku}</small>` : ''}</td>
                    <td style="text-align:center;">${i.quantity}</td>
                    <td style="text-align:right;">${fmt(i.unit_price)}</td>
                    <td style="text-align:right;font-weight:600;">${fmt(i.quantity * i.unit_price)}</td>
                </tr>`).join('')}
            </tbody>
        </table>
        <div style="text-align:right;border-top:1px solid var(--border);padding-top:10px;">
            <div style="color:#666;font-size:0.85rem;">Discount: ${fmt(o.discount_amount || 0)}</div>
            <div style="color:#666;font-size:0.85rem;">Tax (GST): ${fmt(o.tax_amount || 0)}</div>
            <div style="font-size:1.2rem;font-weight:700;margin-top:5px;">Total: ${fmt(o.total_amount)}</div>
            ${parseFloat(o.balance_amount||0) > 0 ? `<div style="color:#f59e0b;font-size:0.85rem;">Balance Due: ${fmt(o.balance_amount)}</div>` : ''}
        </div>
        <div style="margin-top:20px;display:flex;gap:8px;flex-wrap:wrap;">
            ${o.order_status === 'Pending'    ? `<button class="btn btn-primary" onclick="updateOrderStatus('${id}','Processing')">▶ Process Order</button>` : ''}
            ${o.order_status === 'Processing' ? `<button class="btn btn-primary" onclick="updateOrderStatus('${id}','Shipped')">🚛 Mark Shipped</button>` : ''}
            ${o.order_status === 'Shipped'    ? `<button class="btn btn-primary" onclick="updateOrderStatus('${id}','Delivered')">✅ Mark Delivered</button>` : ''}
            <button class="btn btn-outline" onclick="previewPosInvoice('${id}')">👁 Preview Invoice</button>
            <button class="btn btn-outline" onclick="printPosInvoice('${id}')">🖨 Print Invoice</button>
            <button class="btn btn-outline" onclick="closeModal()">Close</button>
        </div>
    `);
};

window.updateOrderStatus = async function(id, status) {
    const r = await patchAPI(`/api/orders/${id}`, { order_status: status });
    if (r.success) {
        toast(`Order updated to ${status}`);
        closeModal();
        load_orders();
    } else toast(r.error, 'error');
};


/* ── PRODUCTS ── */
window.load_products_legacy = async function() {
    const el = document.getElementById('view-products');
    
    // Initial UI with Filter Bar
    el.innerHTML = `
    <div class="card" style="margin-bottom:20px">
        <div class="card-body" style="display:flex; gap:15px; align-items:flex-end; flex-wrap:wrap">
            <div class="form-row" style="margin:0; flex:1; min-width:200px">
                <label>Search Products</label>
                <input class="filter-input" id="f-prod-search" placeholder="Name or SKU..." oninput="load_products_list()">
            </div>
            <div class="form-row" style="margin:0; width:150px">
                <label>Brand</label>
                <select id="f-prod-brand" onchange="load_products_list()">
                    <option value="">All Brands</option>
                </select>
            </div>
            <div class="form-row" style="margin:0; width:150px">
                <label>Category</label>
                <select id="f-prod-cat" onchange="load_products_list()">
                    <option value="">All Categories</option>
                </select>
            </div>
             <div class="form-row" style="margin:0; width:120px">
                <label>Gender</label>
                <select id="f-prod-gender" onchange="load_products_list()">
                    <option value="">All</option>
                </select>
            </div>
            <button class="btn btn-primary" onclick="openAddProduct()">+ Add Product</button>
        </div>
    </div>

    <div class="card">
        <div class="table-container">
            <table>
                <thead>
                    <tr><th>Preview</th><th>Product Details</th><th>Brand</th><th>Category</th><th>Inventory</th><th>Base Price</th><th>Status</th></tr>
                </thead>
                <tbody id="prodBody">${skelRows(7)}</tbody>
            </table>
        </div>
    </div>`;

    // Populate Filters from Master Data
    const [brands, cats, genders] = await Promise.all([
        api(`/api/master/brands`),
        api(`/api/master/categories`),
        api(`/api/master/genders`)
    ]);

    const bSel = document.getElementById('f-prod-brand');
    const cSel = document.getElementById('f-prod-cat');
    const gSel = document.getElementById('f-prod-gender');

    if(brands.success) brands.data.forEach(b => bSel.add(new Option(b.name, b.id)));
    if(cats.success) cats.data.forEach(c => cSel.add(new Option(c.name, c.id)));
    if(genders.success) genders.data.forEach(g => gSel.add(new Option(g.name, g.id)));

    load_products_list();
};

window.load_products_list = async function() {
    const search = document.getElementById('f-prod-search').value;
    const brand = document.getElementById('f-prod-brand').value;
    const cat = document.getElementById('f-prod-cat').value;
    const gender = document.getElementById('f-prod-gender').value;

    const query = new URLSearchParams({
        business_id: BIZ,
        limit: 100,
        search,
        brand_id: brand,
        category_id: cat,
        gender_id: gender,
        include_inactive: true
    }).toString();

    const body = document.getElementById('prodBody');
    if(body) body.innerHTML = skelRows(7);

    const d = await api(`/api/products?${query}`);
    if(!d.success) return;

    document.getElementById('prodBody').innerHTML = (d.data||[]).map(p=>`
        <tr onclick="viewProductDetails('${p.product_id}')" style="cursor:pointer">
            <td>${p.image_url ? `<img src="${p.image_url}" style="height:40px; border-radius:4px; object-fit:cover; width:40px">` : '<div style="height:40px; width:40px; background:#f0f0f0; border-radius:4px; display:flex; align-items:center; justify-content:center; color:#ccc"><i class="fas fa-image"></i></div>'}</td>
            <td><b>${p.product_name}</b><br><small style="color:#888">${p.gender_name || ''} | ${p.frame_type_name || ''}</small></td>
            <td>${badge(p.brand_name || 'Generic')}</td>
            <td>${p.category_name || '—'}</td>
            <td><code class="id-tag">${p.variant_count || 0} Variants</code></td>
            <td><b class="text-accent">${fmt(p.base_price)}</b></td>
            <td>${badge(p.active_status ? 'Active' : 'Inactive')}</td>
        </tr>`).join('') || '<tr><td colspan="7" style="text-align:center;padding:60px;color:#888">No products found for selected filters</td></tr>';
};


window.viewProductDetails = async function(id) {
    const d = await api(`/api/products/${id}`);
    if (!d.success) return;
    const p = d.data;

    openModal(`Product: ${p.product_name}`, `
    <div class="product-detail-view" style="display:grid; grid-template-columns: 250px 1fr; gap:24px">
        <div class="detail-sidebar">
            <div class="main-img-box" style="width:100%; border-radius:12px; overflow:hidden; border:1px solid #eee; background:#f9f9f9">
                <img src="${p.image_url || 'https://via.placeholder.com/300'}" style="width:100%; aspect-ratio:1; object-fit:contain">
            </div>
            <div style="margin-top:20px; display:flex; flex-direction:column; gap:8px">
                <p><b>Brand:</b> ${p.brand_name || 'Generic'}</p>
                <p><b>Category:</b> ${p.category_name || '—'}</p>
                <p><b>Price:</b> <span class="text-accent">${fmt(p.base_price)}</span></p>
                <button class="btn btn-outline btn-sm" style="margin-top:10px" onclick="toast('Edit basic info coming soon', 'info')">Edit Product Info</button>
            </div>
        </div>
        <div class="detail-main">
            <div class="tab-bar section-tabs" style="margin-bottom:20px">
                <button class="tab-item active" onclick="toggleDetailTab(this, 'variants')">📦 Variants & Stock</button>
                <button class="tab-item" onclick="toggleDetailTab(this, 'vto')">👓 Virtual Try-On (AR)</button>
            </div>

            <div id="tab-variants" class="detail-tab-content">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px">
                    <h4>Inventory Control</h4>
                    <button class="btn btn-primary btn-sm" onclick="openAddVariant('${p.product_id}')">+ Add Variant</button>
                </div>
                <div class="table-container">
                    <table style="font-size: .85rem">
                        <thead><tr><th>SKU / Barcode</th><th>Color</th><th>Lens</th><th>Stock</th><th>Action</th></tr></thead>
                        <tbody>
                            ${(p.variants || []).map(v => `
                            <tr>
                                <td><b>${v.sku}</b><br><small>${v.barcode}</small></td>
                                <td>${v.frame_color || '—'}</td>
                                <td>${v.lens_color || '—'}</td>
                                <td><b>${v.available_qty || 0}</b></td>
                                <td><button class="btn btn-outline btn-sm" onclick="toast('Variant edits coming soon', 'info')"><i class="fas fa-edit"></i></button></td>
                            </tr>`).join('') || '<tr><td colspan="5" style="text-align:center; padding:30px; color:#888">No variants added yet</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="tab-vto" class="detail-tab-content" style="display:none">
                <div class="card" style="box-shadow:none; border:1px solid #eee">
                    <div class="card-body">
                        <div style="display:flex; justify-content:space-between; margin-bottom:20px">
                            <div>
                                <h4>AR Configuration</h4>
                                <p style="font-size:.8rem; color:#888">Enable customers to try these frames virtually on the storefront.</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="vto-toggle" ${p.vto_enabled ? 'checked' : ''} onchange="updateVTOStatus('${p.product_id}', this.checked)">
                                <span class="slider round"></span>
                            </label>
                        </div>

                        <div class="form-grid-2">
                            <div class="form-row">
                                <label>AR Overlay Image (Transparent PNG)</label>
                                <input type="hidden" id="vto-image" value="${p.vto_overlay_url || ''}">
                                <div id="vto-preview-box" class="media-preview-box ${p.vto_overlay_url?'has-image':''}" onclick="openMediaSelector('vto-image', 'vto-preview-box')">
                                    ${p.vto_overlay_url ? `<img src="${p.vto_overlay_url}" style="width:100%; height:100%; object-fit:contain">` : '<i class="fas fa-plus"></i> <span>Select Overlay</span>'}
                                </div>
                            </div>
                            <div class="form-row">
                                <label>Positioning & Scaling</label>
                                <div style="display:flex; flex-direction:column; gap:15px; margin-top:10px">
                                    <div class="vto-slider">
                                        <span>Scale factor: <b id="scale-val">${p.vto_config?.scale || 1.0}</b></span>
                                        <input type="range" class="vto-range" min="0.5" max="2.0" step="0.05" value="${p.vto_config?.scale || 1.0}" oninput="updateVTOVal('scale', this.value)">
                                    </div>
                                    <div class="vto-slider">
                                        <span>Vertical Offset: <b id="y-val">${p.vto_config?.y_offset || 0}</b></span>
                                        <input type="range" class="vto-range" min="-100" max="100" step="1" value="${p.vto_config?.y_offset || 0}" oninput="updateVTOVal('y', this.value)">
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-primary" style="margin-top:20px; width:100%" onclick="saveVTOSettings('${p.product_id}')">Update VTO Properties</button>
                    </div>
                </div>
            </div>
        </div>
    </div>`);
};

window.toggleDetailTab = function(btn, tabId) {
    document.querySelectorAll('.section-tabs .tab-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.detail-tab-content').forEach(c => c.style.display = 'none');
    document.getElementById(`tab-${tabId}`).style.display = 'block';
};

window.updateVTOVal = function(key, val) {
    document.getElementById(`${key}-val`).textContent = val;
};

window.saveVTOSettings = async function(id) {
    const payload = {
        vto_enabled: document.getElementById('vto-toggle').checked,
        vto_overlay_url: document.getElementById('vto-image').value,
        vto_config: {
            scale: parseFloat(document.getElementById('scale-val').textContent),
            y_offset: parseInt(document.getElementById('y-val').textContent)
        }
    };
    
    // We update the product with these new AR fields
    // I need to make sure the PUT endpoint handles these or merge with existing
    const d = await api(`/api/products/${id}`);
    if(!d.success) return;
    
    const fullBody = { ...d.data, ...payload };
    const r = await api(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(fullBody) });
    if(r.success) toast('VTO Settings Saved ✨');
};


window.openAddVariant = async function(productId) {
    // Nested modal for variant
    const loader = `<div style="text-align:center; padding:40px"><i class="fas fa-spinner fa-spin"></i> Loading Colors...</div>`;
    const vModalId = 'modal-variant';
    
    // Check for existing frame/lens colors in master
    const [fColors, lColors] = await Promise.all([
        api(`/api/master/frame_colors`),
        api(`/api/master/lens_colors`)
    ]);

    const opts = (list) => (list.data || []).map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    const form = `
    <div class="modal-variant-overlay" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.4); z-index:2500; display:flex; align-items:center; justify-content:center">
        <div class="card" style="width:500px">
            <div class="card-header"><h4>Add Variant</h4> <button onclick="this.closest('.modal-variant-overlay').remove()" class="btn btn-outline btn-sm">✕</button></div>
            <div class="card-body">
                <form onsubmit="submitVariant(event, '${productId}')">
                    <div class="form-row">
                        <label>Variant Image</label>
                        <input type="hidden" id="v-image">
                        <div id="v-image-preview" class="media-preview-box" style="height:120px" onclick="openMediaSelector('v-image', 'v-image-preview')">
                            <i class="fas fa-plus"></i> Select Media
                        </div>
                    </div>
                    <div class="form-grid-2">
                        <div class="form-row"><label>SKU *</label><input id="v-sku" required placeholder="SKU-COLOR-SIZE"></div>
                        <div class="form-row"><label>Barcode</label><input id="v-barcode" placeholder="Optional barcode"></div>
                        <div class="form-row"><label>Frame Color</label><select id="v-fcolor"><option value="">Select</option>${opts(fColors)}</select></div>
                        <div class="form-row"><label>Lens Color</label><select id="v-lcolor"><option value="">Select</option>${opts(lColors)}</select></div>
                        <div class="form-row"><label>Weight (g)</label><input type="number" id="v-weight" value="0"></div>
                        <div class="form-row"><label>Initial Stock *</label><input type="number" id="v-stock" value="0" required></div>
                    </div>
                    <button class="btn btn-primary" type="submit" style="width:100%; margin-top:15px">Create Variant</button>
                </form>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', form);
};

window.submitVariant = async function(e, productId) {
    e.preventDefault();
    const body = {
        product_id: productId,
        sku: document.getElementById('v-sku').value,
        barcode: document.getElementById('v-barcode').value || null,
        frame_color_id: document.getElementById('v-fcolor').value || null,
        lens_color_id: document.getElementById('v-lcolor').value || null,
        weight: parseFloat(document.getElementById('v-weight').value),
        image_url: document.getElementById('v-image').value || null,
        initial_stock: parseInt(document.getElementById('v-stock').value)
    };

    const r = await postAPI(`/api/inventory/variant`, body); // I'll check/create this endpoint
    if (r.success) {
        document.querySelector('.modal-variant-overlay').remove();
        toast('Variant added!');
        viewProductDetails(productId); // Refresh detail
    } else toast(r.error, 'error');
};


window.openAddProduct = async function() {
    const loader = `<div style="text-align:center; padding:40px"><i class="fas fa-spinner fa-spin"></i> Initializing Master Data...</div>`;
    openModal('Add New Product', loader);

    // Fetch All Master Lists in Parallel
    const [brands, cats, genders, ft, shapes, mats] = await Promise.all([
        api(`/api/master/brands`),
        api(`/api/master/categories`),
        api(`/api/master/genders`),
        api(`/api/master/frame_types`),
        api(`/api/master/shapes`),
        api(`/api/master/materials`)
    ]);

    const buildOpts = (list) => (list.data || []).map(m => `<option value="${m.id}">${m.name}</option>`).join('');

    const form = `
    <form onsubmit="submitProduct(event)">
        <div class="form-grid-2">
            <div class="form-row" style="grid-column: 1/-1">
                <label>Main Product Image</label>
                <input type="hidden" id="p-image">
                <div id="p-image-preview" class="media-preview-box" style="width:100%; height:160px" onclick="openMediaSelector('p-image', 'p-image-preview')">
                    <i class="fas fa-plus"></i>
                    <span>Select from Library</span>
                </div>
            </div>
            <div class="form-row" style="grid-column: 1/-1"><label>Product Name *</label><input id="p-name" required placeholder="e.g. RayBan Aviator Classic"></div>
            
            <div class="form-row"><label>Brand</label><select id="p-brand"><option value="">Select Brand</option>${buildOpts(brands)}</select></div>
            <div class="form-row"><label>Category</label><select id="p-cat"><option value="">Select Category</option>${buildOpts(cats)}</select></div>
            
            <div class="form-row"><label>Gender</label><select id="p-gender"><option value="">Select Gender</option>${buildOpts(genders)}</select></div>
            <div class="form-row"><label>Frame Type</label><select id="p-frame"><option value="">Select Type</option>${buildOpts(ft)}</select></div>
            
            <div class="form-row"><label>Shape</label><select id="p-shape"><option value="">Select Shape</option>${buildOpts(shapes)}</select></div>
            <div class="form-row"><label>Material</label><select id="p-material"><option value="">Select Material</option>${buildOpts(mats)}</select></div>
            
            <div class="form-row" style="grid-column: 1/-1"><label>Base Retail Price (₹) *</label><input id="p-price" type="number" required placeholder="0.00"></div>
            <div class="form-row" style="grid-column: 1/-1"><label>Description</label><textarea id="p-desc" rows="3" placeholder="Features, style highlights..."></textarea></div>
        </div>
        <button class="btn btn-primary" type="submit" style="width:100%; margin-top:20px; font-weight:700">Add to Catalog</button>
    </form>`;

    const modalBody = document.querySelector('.modal-body');
    if(modalBody) modalBody.innerHTML = form;
};

window.submitProduct = async function(e) {
    e.preventDefault();
    const body = {
        product_name: document.getElementById('p-name').value,
        base_price: parseFloat(document.getElementById('p-price').value),
        brand_id: document.getElementById('p-brand').value || null,
        category_id: document.getElementById('p-cat').value || null,
        gender_id: document.getElementById('p-gender').value || null,
        frame_type_id: document.getElementById('p-frame').value || null,
        shape_id: document.getElementById('p-shape').value || null,
        material_id: document.getElementById('p-material').value || null,
        image_url: document.getElementById('p-image').value || null,
        description: document.getElementById('p-desc').value
    };

    const r = await postAPI('/api/products', body);
    if (r.success) {
        closeModal();
        toast('Product successfully listed!');
        load_products();
    } else toast(r.error, 'error');
};


/* ── INVENTORY ── */
window.load_inventory = async function() {
    const el = document.getElementById('view-inventory');
    const biz = USER.business_id;

    // Persist filter values
    if (!window.inventoryFilters) {
        window.inventoryFilters = { brand: '', cat: '', showroom: '', low: false, q: '', from: '', to: '' };
    }
    const f = window.inventoryFilters;

    // Fetch master data for filters + stats
    const [brands, categories, showrooms, summary, dashboard] = await Promise.all([
        api('/api/master/brands'),
        api('/api/master/categories'),
        api('/api/showrooms'),
        api(`/api/reports/dashboard-rich?business_id=${biz}`),
        api(`/api/reports/dashboard?business_id=${biz}`)
    ]);

    // Calculate specific inventory stats if possible or show summary
    const totalUnits = (summary.data?.showrooms || []).reduce((acc, s) => acc + parseInt(s.in_stock || 0), 0);
    const totalValue = (summary.data?.showrooms || []).reduce((acc, s) => acc + parseFloat(s.stock_value || 0), 0);
    const dash = dashboard.data || {};

    const brandOpts = `<option value="">All Brands</option>` + (brands.data || []).map(b => `<option value="${b.id}" ${f.brand == b.id ? 'selected' : ''}>${b.name}</option>`).join('');
    const catOpts = `<option value="">All Categories</option>` + (categories.data || []).map(c => `<option value="${c.id}" ${f.cat == c.id ? 'selected' : ''}>${c.name}</option>`).join('');
    const showOpts = `<option value="">All Showrooms</option>` + (showrooms.data || []).map(s => `<option value="${s.showroom_id}" ${f.showroom == s.showroom_id ? 'selected' : ''}>${s.showroom_name}</option>`).join('');

    el.innerHTML = `
        <div class="kpi-grid" style="margin-bottom:30px">
            <div class="kpi-card glass">
                <div class="kpi-label">TOTAL STOCK UNITS</div>
                <div class="kpi-value text-accent">${totalUnits.toLocaleString()}</div>
            </div>
            <div class="kpi-card glass">
                <div class="kpi-label">TOTAL STOCK VALUE</div>
                <div class="kpi-value text-green">${fmt(totalValue)}</div>
            </div>
            <div class="kpi-card glass">
                <div class="kpi-label">RESERVED / SALES</div>
                <div class="kpi-value text-warn">${dash.pending_orders || 0} <span style="font-size:1rem; color:#888">Orders</span></div>
            </div>
            <div class="kpi-card glass">
                <div class="kpi-label">LOW STOCK ALERTS</div>
                <div class="kpi-value text-danger" style="color:#ef4444">${dash.low_stock_alerts || 0}</div>
            </div>
        </div>

        <div class="card" style="margin-bottom:24px">
            <div class="card-body" style="padding:15px; background:var(--bg-alt); border-radius:12px">
                <div style="display:flex; gap:15px; align-items:center; flex-wrap:wrap">
                    <div style="flex:1; position:relative">
                        <i class="fas fa-search" style="position:absolute; left:12px; top:12px; color:#888"></i>
                        <input type="text" id="inv-q" placeholder="Search SKU, Product, Brand..." style="padding-left:35px; width:100%" value="${f.q}" oninput="updateInvFilters()">
                    </div>
                    <select id="inv-show" class="form-select" style="max-width:150px" onchange="updateInvFilters()">${showOpts}</select>
                    <select id="inv-brand" class="form-select" style="max-width:140px" onchange="updateInvFilters()">${brandOpts}</select>
                    <select id="inv-cat" class="form-select" style="max-width:140px" onchange="updateInvFilters()">${catOpts}</select>
                    <div style="display:flex; align-items:center; gap:5px">
                        <input type="date" id="inv-from" class="form-select" style="max-width:130px" value="${f.from}" onchange="updateInvFilters()">
                        <span style="color:#888">to</span>
                        <input type="date" id="inv-to" class="form-select" style="max-width:130px" value="${f.to}" onchange="updateInvFilters()">
                    </div>
                    <label style="display:flex; align-items:center; gap:8px; font-size:0.85rem; cursor:pointer" class="glass-btn">
                        <input type="checkbox" id="inv-low" ${f.low ? 'checked' : ''} onchange="updateInvFilters()"> Low Stock Only
                    </label>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
                <h3>Current Stock Levels</h3>
                <button class="btn btn-outline btn-sm" onclick="exportInventory()"><i class="fas fa-file-export"></i> Export CSV</button>
            </div>
            <div class="card-body" style="padding:0">
                <div class="table-container">
                    <table style="border-collapse:separate; border-spacing:0">
                        <thead style="background:var(--bg-alt); position:sticky; top:0; z-index:10">
                            <tr>
                                <th>SKU</th>
                                <th>PRODUCT DETAILS</th>
                                <th>BRAND</th>
                                <th>COLOR</th>
                                <th style="text-align:center">AVAILABLE</th>
                                <th style="text-align:center">RESERVED</th>
                                <th style="text-align:center">DAMAGED</th>
                                <th>LOCATION</th>
                            </tr>
                        </thead>
                        <tbody id="invBody">
                            ${skelRows()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Fetch actual data
    const queryParams = new URLSearchParams({
        business_id: biz,
        limit: 200,
        low_stock: f.low,
        showroom_id: f.showroom,
        brand_id: f.brand,
        category_id: f.cat,
        q: f.q,
        from_date: f.from,
        to_date: f.to
    });

    const d = await api(`/api/inventory?${queryParams.toString()}`);
    
    const rows = (d.data || []).map(i => {
        const stockStatus = i.available_qty <= 0 ? 'out' : (i.available_qty <= 5 ? 'low' : 'good');
        const colorClass = stockStatus === 'out' ? 'badge-red' : (stockStatus === 'low' ? 'badge-orange' : 'badge-green');
        
        return `
            <tr>
                <td><code style="background:rgba(0,0,0,0.05); padding:2px 6px; border-radius:4px; font-size:0.7rem">${i.sku || '—'}</code></td>
                <td>
                    <div style="font-weight:600; color:var(--primary)">${i.product_name}</div>
                    <div style="font-size:0.7rem; color:#888">Last Updated: ${new Date(i.last_updated).toLocaleString()}</div>
                </td>
                <td><span style="font-size:0.75rem; letter-spacing:0.5px">${i.brand_name || '—'}</span></td>
                <td><span style="color:#666; font-size:0.8rem">${i.color_code && i.color_code !== '—' ? i.color_code : (i.color_name || '—')}${i.size_code ? ` / ${i.size_code}` : ''}</span></td>
                <td style="text-align:center">
                    <div style="font-size:1.1rem; font-weight:700" class="text-${stockStatus === 'good' ? 'accent' : (stockStatus === 'low' ? 'warn' : 'danger')}">
                        ${i.available_qty}
                    </div>
                </td>
                <td style="text-align:center; color:#888">${i.reserved_qty || 0}</td>
                <td style="text-align:center; color:#888">${i.damaged_qty || 0}</td>
                <td>
                    <div style="font-size:0.75rem; color:var(--primary); font-weight:600"><i class="fas fa-map-marker-alt" style="margin-right:5px; opacity:0.5"></i>${i.showroom_name || i.warehouse_name || '—'}</div>
                </td>
            </tr>
        `;
    }).join('');

    document.getElementById('invBody').innerHTML = rows || `<tr><td colspan="8" style="text-align:center; padding:50px; color:#999"><div style="font-size:2rem; margin-bottom:10px">📦</div>No matching inventory found. Try adjusting your filters.</td></tr>`;
};

window.updateInvFilters = function() {
    window.inventoryFilters = {
        q: document.getElementById('inv-q').value,
        showroom: document.getElementById('inv-show').value,
        brand: document.getElementById('inv-brand').value,
        cat: document.getElementById('inv-cat').value,
        low: document.getElementById('inv-low').checked,
        from: document.getElementById('inv-from').value,
        to: document.getElementById('inv-to').value
    };
    // Use a small debounce for search
    clearTimeout(window.invFilterTimer);
    window.invFilterTimer = setTimeout(() => load_inventory(), 300);
};

window.exportInventory = function() {
    const f = window.inventoryFilters;
    toast('Generating CSV of current filtered view...', 'info');
    
    // Simple frontend CSV generation for brevity, could be backend if data is large
    const table = document.querySelector('.table-container table');
    let csv = [];
    const rows = table.querySelectorAll('tr');
    
    for (let i = 0; i < rows.length; i++) {
        const cols = rows[i].querySelectorAll('td, th');
        let row = [];
        for (let j = 0; j < cols.length; j++) {
            row.push(`"${cols[j].innerText.trim().replace(/"/g, '""')}"`);
        }
        csv.push(row.join(','));
    }
    
    const csvContent = "data:text/csv;charset=utf-8," + csv.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Inventory_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Inventory Exported Successfully!', 'success');
};

/* ── SHOWROOMS ── */
window.load_showrooms = async function() {
    const el = document.getElementById('view-showrooms');
    if (!el) return;

    el.innerHTML = `
    <div class="reports-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
        <div>
            <h2 style="margin:0; font-size:1.6rem; color:var(--primary)">Showroom Management</h2>
            <p style="margin:0; color:#64748b; font-size:0.85rem">Configure branch-specific details, contact info, and tax registration</p>
        </div>
        <button class="btn btn-primary" onclick="openAddShowroom()">
            <i class="fas fa-plus"></i> Add New Showroom
        </button>
    </div>

    <div class="card">
        <div class="table-container">
            <table>
                <thead>
                    <tr style="background:#f8fafc">
                        <th>Showroom & Manager</th>
                        <th>Contact & Email</th>
                        <th>GSTIN & Address</th>
                        <th>Status</th>
                        <th style="text-align:right">Actions</th>
                    </tr>
                </thead>
                <tbody id="showBody">${skelRows(5)}</tbody>
            </table>
        </div>
    </div>`;

    const d = await api(`/api/showrooms?business_id=${BIZ}`);
    const rows = (d.data || []).map(s => `
        <tr style="border-bottom:1px solid #f1f5f9">
            <td>
                <div style="font-weight:700; color:var(--primary)">${s.showroom_name}</div>
                <div style="font-size:0.75rem; color:#64748b"><i class="fas fa-user-tie" style="margin-right:4px"></i> Manager: ${s.manager_name || 'Not Assigned'}</div>
            </td>
            <td>
                <div style="font-size:0.85rem"><i class="fas fa-phone-alt" style="width:18px; color:#10b981"></i> ${s.contact_number}</div>
                ${s.secondary_contact ? `<div style="font-size:0.85rem"><i class="fas fa-phone" style="width:18px; color:#64748b; opacity:0.6"></i> ${s.secondary_contact}</div>` : ''}
                <div style="font-size:0.85rem; color:#64748b"><i class="fas fa-envelope" style="width:18px"></i> ${s.email || 'No Email Set'}</div>
            </td>
            <td>
                <div style="font-size:0.8rem; font-weight:600; color:#0f172a">GST: <span class="text-mono">${s.gstin || 'Not Provided'}</span></div>
                <div style="font-size:0.75rem; color:#64748b; margin-top:4px; max-width:250px">
                    <i class="fas fa-map-marker-alt" style="margin-right:4px"></i> ${s.address || 'Address pending...'}
                </div>
                ${s.google_maps_link ? `<a href="${s.google_maps_link}" target="_blank" style="font-size:0.7rem; color:var(--accent); text-decoration:none; display:inline-block; margin-top:4px"><i class="fas fa-external-link-alt"></i> View on Google Maps</a>` : ''}
            </td>
            <td>${badge(s.active_status ? 'Active' : 'Inactive', s.active_status ? 'success' : 'secondary')}</td>
            <td style="text-align:right">
                <div style="display:flex; gap:8px; justify-content:flex-end">
                    <button class="btn btn-outline btn-sm" onclick='toggleShowroomStatus("${s.showroom_id}", ${s.active_status})' style="color: ${s.active_status ? 'var(--danger)' : 'var(--success)'}; border-color: ${s.active_status ? 'var(--danger)' : 'var(--success)'};">
                        <i class="fas ${s.active_status ? 'fa-ban' : 'fa-check'}"></i> ${s.active_status ? 'Deactivate' : 'Activate'}
                    </button>
                    <button class="btn btn-outline btn-sm" onclick='editShowroom(${JSON.stringify(s).replace(/'/g, "&apos;")})'>
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    document.getElementById('showBody').innerHTML = rows || '<tr><td colspan="5" style="text-align:center; padding:60px; color:#94a3b8">No showrooms found. Start by creating your first branch.</td></tr>';
};

window.toggleShowroomStatus = async function(showroom_id, current_status) {
    // We send only the active_status in PUT object, the backend COALESCE manages the rest
    const r = await api(`/api/showrooms/${showroom_id}`, {
        method: 'PUT',
        body: JSON.stringify({ active_status: !current_status })
    });
    if (r.success) {
        toast(`Showroom marked as ${!current_status ? 'Active' : 'Inactive'}.`);
        load_showrooms();
    } else {
        toast(r.error, 'error');
    }
};

window.openAddShowroom = function() {
    openShowroomModal('Add New Showroom', { showroom_name: '', city: '', manager_name: '', contact_number: '', secondary_contact: '', email: '', address: '', gstin: '', google_maps_link: '' });
};

window.editShowroom = function(s) {
    openShowroomModal('Edit Showroom: ' + s.showroom_name, s);
};

function openShowroomModal(title, s) {
    openModal(title, `
        <form id="showroomForm">
            <input type="hidden" name="showroom_id" value="${s.showroom_id || ''}">
            <div style="background:#f0faf5; padding:12px; border-radius:8px; margin-bottom:20px; font-size:0.8rem; color:#166534">
                <i class="fas fa-info-circle"></i> These details (Address, Contact, GST) will be automatically populated on invoices generated for this showroom.
            </div>
            
            <div class="form-row"><label>Showroom / Branch Name *</label><input name="showroom_name" value="${s.showroom_name}" required placeholder="e.g. Citylight Branch"></div>
            
            <div class="form-grid-2" style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-top:15px">
                <div class="form-row"><label>City *</label><input name="city" value="${s.city}" required placeholder="Surat"></div>
                <div class="form-row"><label>GST Number</label><input name="gstin" value="${s.gstin || ''}" placeholder="24AAAAA0000A1Z5"></div>
                <div class="form-row"><label>Manager Name</label><input name="manager_name" value="${s.manager_name || ''}"></div>
                <div class="form-row"><label>Official Email</label><input type="email" name="email" value="${s.email || ''}" placeholder="branch@blinkopticals.com"></div>
            </div>

            <div class="form-grid-2" style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-top:15px">
                <div class="form-row"><label>Primary Contact *</label><input name="contact_number" value="${s.contact_number}" required></div>
                <div class="form-row"><label>Secondary Contact</label><input name="secondary_contact" value="${s.secondary_contact || ''}"></div>
            </div>

            <div class="form-row mt-3"><label>Full Postal Address (for Invoice Header)</label><textarea name="address" rows="3" required placeholder="Full shop address with pincode...">${s.address || ''}</textarea></div>
            
            <div class="form-row mt-3"><label>Google Location Link (Maps)</label><input name="google_maps_link" value="${s.google_maps_link || ''}" placeholder="https://maps.app.goo.gl/...."></div>

            <button class="btn btn-primary w-100" type="submit" style="margin-top:20px; padding:12px">
                <i class="fas fa-save"></i> ${s.showroom_id ? 'Update Showroom Details' : 'Register New Showroom'}
            </button>
        </form>
    `, 'lg');

    document.getElementById('showroomForm').onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        data.business_id = BIZ;
        
        let method = 'POST';
        let url = '/api/showrooms';
        
        if(data.showroom_id) {
            method = 'PUT';
            url = `/api/showrooms/${data.showroom_id}`;
        }

        const r = await api(url, { method, body: JSON.stringify(data) });
        if (r.success) { 
            closeModal(); 
            toast(data.showroom_id ? 'Showroom updated!' : 'Showroom registered!'); 
            load_showrooms(); 
        } else toast(r.error, 'error');
    };
}

/* ── BUSINESS ── */
window.load_business = async function() {
    const el = document.getElementById('view-business');
    if (!el) return;

    el.innerHTML = `
    <div class="reports-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
        <div>
            <h2 style="margin:0; font-size:1.6rem; color:var(--primary)">Global Business Registry</h2>
            <p style="margin:0; color:#64748b; font-size:0.85rem">Root-level multi-tenant entity management and configurations</p>
        </div>
        <button class="btn btn-primary" onclick="openAddBusiness()">
            <i class="fas fa-plus"></i> Register New Entity
        </button>
    </div>

    <!-- Stats -->
    <div class="stats-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:20px; margin-bottom:25px">
        <div class="stat-card glass"><div class="label">Total Entities</div><div id="biz-stat-total" class="value">0</div></div>
        <div class="stat-card glass"><div class="label">Active Instances</div><div id="biz-stat-active" class="value">0</div></div>
        <div class="stat-card glass"><div class="label">Premier Tiers</div><div id="biz-stat-tier" class="value">0</div></div>
    </div>

    <div class="card">
        <div class="table-container">
            <table>
                <thead>
                    <tr style="background:#f8fafc">
                        <th>Business Entity</th>
                        <th>Owner & Contact</th>
                        <th>Taxation & Tier</th>
                        <th>Joined</th>
                        <th>Status</th>
                        <th style="text-align:right">Action</th>
                    </tr>
                </thead>
                <tbody id="bizBody">${skelRows(6)}</tbody>
            </table>
        </div>
    </div>`;

    const d = await api(`/api/business`);
    const list = d.data || [];
    
    // Update Stats
    document.getElementById('biz-stat-total').innerText = list.length;
    document.getElementById('biz-stat-active').innerText = list.filter(b => b.active_status).length;
    document.getElementById('biz-stat-tier').innerText = list.filter(b => b.subscription_tier === 'Enterprise').length;

    document.getElementById('bizBody').innerHTML = list.map(b => `
        <tr style="border-bottom:1px solid #f1f5f9">
            <td>
                <div style="display:flex; align-items:center; gap:12px">
                    <div style="width:40px; height:40px; background:#f1f5f9; border-radius:8px; display:flex; align-items:center; justify-content:center; overflow:hidden; border:1px solid #eee">
                        ${b.logo_url ? `<img src="${b.logo_url}" style="width:100%; height:100%; object-fit:cover">` : '<i class="fas fa-building" style="color:#cbd5e1"></i>'}
                    </div>
                    <div>
                        <div style="font-weight:700; color:var(--primary)">${b.business_name}</div>
                        <code style="font-size:0.65rem; color:#94a3b8">${b.business_id}</code>
                    </div>
                </div>
            </td>
            <td>
                <div style="font-weight:600; font-size:0.85rem">${b.owner_name}</div>
                <div style="font-size:0.75rem; color:#64748b">${b.email}</div>
                <div style="font-size:0.75rem; color:#64748b">${b.mobile_number || 'No Mobile'}</div>
            </td>
            <td>
                <div style="display:flex; flex-direction:column; gap:4px">
                    <div style="font-size:0.7rem; font-weight:700; background:#f1f5f9; color:#475569; padding:2px 8px; border-radius:4px; display:inline-block; width:fit-content">
                        ${b.subscription_tier || 'Basic'} Tier
                    </div>
                    <div style="font-size:0.75rem; color:#64748b">PAN: ${b.pan_no || '—'}</div>
                    <div style="font-size:0.75rem; color:#64748b">GST: ${b.gstin_main || '—'}</div>
                </div>
            </td>
            <td><small style="color:#64748b">${fmtDate(b.created_at)}</small></td>
            <td>${badge(b.active_status ? 'Active' : 'Inactive')}</td>
            <td style="text-align:right">
                <button class="btn btn-outline btn-sm" onclick='openEditBusiness(${JSON.stringify(b).replace(/'/g, "&apos;")})'>
                    <i class="fas fa-cog"></i> Config
                </button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="6" style="text-align:center; padding:60px; color:#94a3b8">No business entities registered.</td></tr>';
};

window.openAddBusiness = function() {
    openBusinessModal('Register New Business Entity', { business_name: '', owner_name: '', email: '', mobile_number: '', city: '', state: '', pan_no: '', gstin_main: '', subscription_tier: 'Basic', logo_url: '' });
};

window.openEditBusiness = function(b) {
    openBusinessModal('Configure Entity: ' + b.business_name, b);
};

function openBusinessModal(title, b) {
    openModal(title, `
        <form id="bizForm" style="padding:10px">
            <input type="hidden" name="business_id" value="${b.business_id || ''}">
            
            <div class="form-row"><label>Business Name *</label><input name="business_name" value="${b.business_name}" required></div>
            
            <div class="form-grid-2" style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-top:15px">
                <div class="form-row"><label>Owner Name *</label><input name="owner_name" value="${b.owner_name}" required></div>
                <div class="form-row"><label>Subscription Tier</label>
                    <select name="subscription_tier">
                        <option value="Basic" ${b.subscription_tier==='Basic'?'selected':''}>Basic Tier</option>
                        <option value="Pro" ${b.subscription_tier==='Pro'?'selected':''}>Pro Active</option>
                        <option value="Enterprise" ${b.subscription_tier==='Enterprise'?'selected':''}>Enterprise Suite</option>
                    </select>
                </div>
            </div>

            <div class="form-grid-2" style="display:grid; grid-template-columns:1.5fr 1fr; gap:15px; margin-top:15px">
                <div class="form-row"><label>Official Email *</label><input name="email" type="email" value="${b.email}" required></div>
                <div class="form-row"><label>Mobile Number</label><input name="mobile_number" value="${b.mobile_number || ''}"></div>
            </div>

            <div class="form-grid-2" style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-top:15px">
                <div class="form-row"><label>Business PAN</label><input name="pan_no" value="${b.pan_no || ''}" placeholder="ABCDE1234F"></div>
                <div class="form-row"><label>Main GSTIN</label><input name="gstin_main" value="${b.gstin_main || ''}" placeholder="24AAAAA0000A1Z5"></div>
            </div>

            <div class="form-row mt-3"><label>Logo URL</label><input name="logo_url" value="${b.logo_url || ''}" placeholder="https://..."></div>
            
            <div class="form-grid-2" style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-top:15px">
                <div class="form-row"><label>City</label><input name="city" value="${b.city || ''}"></div>
                <div class="form-row"><label>State</label><input name="state" value="${b.state || ''}"></div>
            </div>

            <div id="biz-error" style="color:var(--danger); font-size:.8rem; margin:10px 0"></div>

            <button type="submit" class="btn btn-primary w-100" style="margin-top:20px; padding:15px; font-weight:700">
                <i class="fas fa-check-circle"></i> ${b.business_id ? 'Update Entity Configuration' : 'Create Global Entity'}
            </button>
        </form>
    `, 'lg');

    document.getElementById('bizForm').onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        const btn = e.target.querySelector('button');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        let method = 'POST';
        let url = '/api/business';
        
        if(data.business_id) {
            method = 'PUT';
            url = `/api/business/${data.business_id}`;
        }

        const r = await api(url, { method, body: JSON.stringify(data) });
        if (r.success) { 
            closeModal(); 
            toast('Business Registry Updated'); 
            load_business(); 
        } else {
            document.getElementById('biz-error').innerText = r.error;
            btn.disabled = false;
            btn.innerText = 'Retry Save';
        }
    };
};


/* ── CUSTOMERS (ENTERPRISE GRADE) ── */
window.load_customers = async function() {
    const el = document.getElementById('view-customers');
    if (!el) return;

    // Default filters
    if (!window.customerFilters) {
        window.customerFilters = { q: '', tier: '', city: '', from: '', to: '' };
    }
    const f = window.customerFilters;

    // Fetch KPIs
    const kpir = await api(`/api/customers/kpis?business_id=${BIZ}`);
    const kpi = kpir.data || { totalCustomers: 0, newCustomers: 0, highValueCustomers: 0 };

    el.innerHTML = `
    <div class="module-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px">
        <div>
            <h2 style="margin:0; font-weight:800; letter-spacing:-0.5px">Customer Directory</h2>
            <p style="color:var(--muted); font-size:0.85rem">Manage client profiles, loyalty tiers, and communication history</p>
        </div>
        <div style="display:flex; gap:10px">
            <button class="btn btn-outline" onclick="openBulkCustomerImport()"><i class="fas fa-file-import"></i> Bulk Import</button>
            <button class="btn btn-primary" onclick="openAddCustomer()"><i class="fas fa-plus"></i> New Customer</button>
        </div>
    </div>

    <div class="kpi-grid" style="margin-bottom:24px">
        <div class="kpi-card glass border-l-accent">
            <div class="kpi-info">
                <div class="kpi-label">TOTAL DATABASE</div>
                <div class="kpi-value">${(kpi.totalCustomers || 0).toLocaleString()}</div>
                <div style="font-size:0.75rem; color:var(--muted); margin-top:4px">Registered Clients</div>
            </div>
            <div class="kpi-icon"><i class="fas fa-users"></i></div>
        </div>
        <div class="kpi-card glass border-l-blue">
            <div class="kpi-info">
                <div class="kpi-label">NEW THIS MONTH</div>
                <div class="kpi-value text-accent">${kpi.newCustomers || 0}</div>
                <div style="font-size:0.75rem; color:var(--muted); margin-top:4px">Organic Acquisitions</div>
            </div>
            <div class="kpi-icon"><i class="fas fa-user-plus"></i></div>
        </div>
        <div class="kpi-card glass border-l-green">
            <div class="kpi-info">
                <div class="kpi-label">HIGH VALUE (LTV > 50K)</div>
                <div class="kpi-value text-green">${kpi.highValueCustomers || 0}</div>
                <div style="font-size:0.75rem; color:var(--muted); margin-top:4px">Platinum Circle</div>
            </div>
            <div class="kpi-icon"><i class="fas fa-crown"></i></div>
        </div>
    </div>

    <div class="card glass shadow-sm" style="margin-bottom:24px; border-radius:16px">
        <div class="card-body" style="padding:16px">
            <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap">
                <div style="flex:1; position:relative; min-width:280px">
                    <i class="fas fa-search" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--muted); opacity:0.6"></i>
                    <input type="text" id="cust-q" placeholder="Search by name, mobile or email..." 
                           style="padding:12px 12px 12px 42px; width:100%; border-radius:12px; border:1px solid var(--border); background:rgba(255,255,255,0.5); font-size:0.9rem" 
                           value="${f.q}" oninput="updateCustFilters()">
                </div>
                <select id="cust-tier" class="form-select" style="width:140px; border-radius:10px" onchange="updateCustFilters()">
                    <option value="">All Tiers</option>
                    <option value="Silver" ${f.tier==='Silver'?'selected':''}>Silver</option>
                    <option value="Gold" ${f.tier==='Gold'?'selected':''}>Gold</option>
                    <option value="Platinum" ${f.tier==='Platinum'?'selected':''}>Platinum</option>
                </select>
                <div style="position:relative">
                    <i class="fas fa-city" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--muted); font-size:0.8rem"></i>
                    <input type="text" id="cust-city" placeholder="City" class="form-select" 
                           style="width:140px; padding-left:34px; border-radius:10px" value="${f.city}" oninput="updateCustFilters()">
                </div>
                <div style="display:flex; align-items:center; gap:8px; background:var(--bg-alt); padding:4px 12px; border-radius:10px; border:1px solid var(--border)">
                    <span style="font-size:0.75rem; color:var(--muted); font-weight:600">JOINED</span>
                    <input type="date" id="cust-from" style="border:none; background:transparent; font-size:0.85rem; outline:none" value="${f.from}" onchange="updateCustFilters()">
                    <span style="color:var(--muted)">-</span>
                    <input type="date" id="cust-to" style="border:none; background:transparent; font-size:0.85rem; outline:none" value="${f.to}" onchange="updateCustFilters()">
                </div>
            </div>
        </div>
    </div>

    <div class="card glass no-padding overflow-hidden">
        <div class="table-container">
            <table class="modern-table">
                <thead>
                    <tr>
                        <th style="padding-left:24px">Customer Profile</th>
                        <th>Contact Info</th>
                        <th>Location</th>
                        <th style="text-align:center">Engagement</th>
                        <th>Value Metrics</th>
                        <th>Tier Status</th>
                        <th style="text-align:right; padding-right:24px">Action</th>
                    </tr>
                </thead>
                <tbody id="custBody">${skelRows()}</tbody>
            </table>
        </div>
    </div>
    `;

    renderCustomersList();
};

async function renderCustomersList() {
    const f = window.customerFilters;
    const qs = new URLSearchParams({
        business_id: BIZ,
        search: f.q,
        tier: f.tier,
        city: f.city,
        signup_from: f.from,
        signup_to: f.to,
        limit: 100
    });

    const d = await api(`/api/customers?${qs.toString()}`);
    const rows = (d.data || []).map(c => `
        <tr class="hover-row">
            <td style="padding-left:24px">
                <div style="display:flex; align-items:center; gap:12px">
                    <div style="width:40px; height:40px; border-radius:12px; background:linear-gradient(135deg, var(--accent) 0%, #6366f1 100%); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:1.1rem; box-shadow:0 4px 12px rgba(99,102,241,0.2)">
                        ${c.name.charAt(0)}
                    </div>
                    <div>
                        <div style="font-weight:700; color:var(--primary); font-size:0.95rem">${c.name}</div>
                        <div style="font-size:0.75rem; color:var(--muted)">Since ${fmtDate(c.created_at)}</div>
                    </div>
                </div>
            </td>
            <td>
                <div style="font-size:0.9rem; font-weight:600; color:var(--primary)"><i class="fas fa-phone-alt" style="width:20px; color:var(--accent); font-size:0.8rem"></i> ${c.mobile}</div>
                <div style="font-size:0.8rem; color:var(--muted); margin-top:2px"><i class="fas fa-envelope" style="width:20px; font-size:0.8rem"></i> ${c.email || '—'}</div>
            </td>
            <td>
                <div style="font-size:0.9rem; color:var(--primary)"><i class="fas fa-location-dot" style="margin-right:6px; opacity:0.4; color:var(--accent)"></i> ${c.city || '—'}</div>
            </td>
            <td style="text-align:center">
                <div style="font-weight:800; font-size:1rem">${c.order_count || 0}</div>
                <div style="font-size:0.65rem; color:var(--muted); text-transform:uppercase; font-weight:600; letter-spacing:0.5px">Transaction Count</div>
            </td>
            <td>
                <div style="font-weight:800; color:var(--green); font-size:1rem">${fmt(c.lifetime_value)}</div>
                <div style="font-size:0.65rem; color:var(--muted); text-transform:uppercase; font-weight:600; letter-spacing:0.5px">Total Revenue</div>
            </td>
            <td>${badge(c.tier || 'Silver')}</td>
            <td style="text-align:right; padding-right:24px">
                <div style="display:flex; gap:8px; justify-content:flex-end">
                    <button class="btn-icon" style="background:rgba(99,102,241,0.1); color:var(--accent)" onclick="viewCustomerProfile('${c.customer_id}')" title="360° Profile"><i class="fas fa-user-astronaut"></i></button>
                    <button class="btn-icon" style="background:rgba(0,0,0,0.04)" onclick="openEditCustomer('${c.customer_id}')" title="Edit Data"><i class="fas fa-pen-nib"></i></button>
                </div>
            </td>
        </tr>
    `).join('');

    document.getElementById('custBody').innerHTML = rows || `<tr><td colspan="7" style="text-align:center; padding:80px; color:var(--muted)"><img src="/admin/img/no-data.svg" style="width:120px; opacity:0.2; margin-bottom:15px"><br>No matching customers found.</td></tr>`;
}

window.updateCustFilters = function() {
    window.customerFilters = {
        q: document.getElementById('cust-q').value,
        tier: document.getElementById('cust-tier').value,
        city: document.getElementById('cust-city').value,
        from: document.getElementById('cust-from').value,
        to: document.getElementById('cust-to').value
    };
    clearTimeout(window.custFilterTimer);
    window.custFilterTimer = setTimeout(() => renderCustomersList(), 400);
};

window.openBulkCustomerImport = function() {
    openModal('Bulk Customer Sync', `
        <div style="padding:16px">
            <div id="cust-import-step1">
                <div class="import-area" id="cust-drop-zone" style="border:2.5px dashed var(--border); border-radius:20px; padding:60px 40px; text-align:center; background:var(--bg-alt); transition:0.4s; cursor:pointer" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
                    <div style="width:80px; height:80px; border-radius:50%; background:rgba(99,102,241,0.1); display:flex; align-items:center; justify-content:center; margin:0 auto 20px">
                        <i class="fas fa-file-csv fa-2x" style="color:var(--accent)"></i>
                    </div>
                    <h3 style="margin-bottom:8px; font-weight:800">Import Customer Database</h3>
                    <p style="color:var(--muted); font-size:1rem; margin-bottom:24px">Drag and drop your spreadsheet here</p>
                    <input type="file" id="cust-file" style="display:none" accept=".csv" onchange="handleCustFileSelect(event)">
                    <button class="btn btn-primary" onclick="document.getElementById('cust-file').click()" style="padding:12px 24px"><i class="fas fa-folder-open"></i> Browse My Computer</button>
                    <div style="margin-top:30px">
                        <a href="javascript:void(0)" onclick="downloadCustTemplate()" style="font-size:0.85rem; color:var(--accent); text-decoration:none; font-weight:600; background:rgba(99,102,241,0.05); padding:8px 16px; border-radius:8px"><i class="fas fa-cloud-download-alt"></i> Get Sample Template (.csv)</a>
                    </div>
                </div>
            </div>

            <div id="cust-import-step2" style="display:none">
                <div class="card" style="border-radius:16px; border:1px solid var(--border); overflow:hidden">
                    <div style="padding:16px; background:var(--bg-alt); display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border)">
                        <div>
                            <span id="cust-import-count" style="font-weight:800; color:var(--primary)">0 Records</span>
                            <span style="color:var(--muted); font-size:0.85rem; margin-left:8px">Ready for synchronization</span>
                        </div>
                        <div style="display:flex; gap:10px">
                            <button class="btn btn-outline btn-sm" onclick="location.reload()">Cancel</button>
                            <button class="btn btn-primary btn-sm" id="btn-run-cust-import" onclick="processCustomerImport()"><i class="fas fa-play-circle"></i> Execute Import</button>
                        </div>
                    </div>
                    <div class="table-container" style="max-height:400px">
                        <table class="modern-table">
                            <thead id="cust-preview-head" style="background:#fff; position:sticky; top:0"></thead>
                            <tbody id="cust-preview-body"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `, 'lg');

    // Drag & Drop logic
    const zone = document.getElementById('cust-drop-zone');
    if(zone) {
        zone.ondragover = (e) => { e.preventDefault(); zone.style.borderColor = 'var(--accent)'; zone.style.background = 'rgba(99,102,241,0.05)'; };
        zone.ondragleave = () => { zone.style.borderColor = 'var(--border)'; zone.style.background = 'var(--bg-alt)'; };
        zone.ondrop = (e) => { e.preventDefault(); zone.style.borderColor = 'var(--border)'; handleCustFileSelect(e); };
    }
};

let pendingCustomers = [];

window.handleCustFileSelect = async function(e) {
    const file = e.target.files ? e.target.files[0] : e.dataTransfer.files[0];
    if (!file) return;

    toast('Analyzing data structures...', 'info');
    const reader = new FileReader();
    reader.onload = function(evt) {
        const text = evt.target.result;
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        if (lines.length < 2) return toast('File appears to be empty', 'error');

        const headers = lines[0].split(',').map(h => h.trim());
        pendingCustomers = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
            const c = {};
            headers.forEach((h, idx) => {
                const key = h.toLowerCase().replace(/ /g, '_');
                c[key] = cols[idx];
            });
            pendingCustomers.push(c);
        }

        renderCustPreview(headers);
    };
    reader.readAsText(file);
};

function renderCustPreview(headers) {
    const s1 = document.getElementById('cust-import-step1');
    const s2 = document.getElementById('cust-import-step2');
    if(!s1 || !s2) return;
    
    s1.style.display = 'none';
    s2.style.display = 'block';
    
    document.getElementById('cust-import-count').innerText = `${pendingCustomers.length} Records Detected`;
    
    document.getElementById('cust-preview-head').innerHTML = `<tr>${headers.map(h => `<th>${h.toUpperCase()}</th>`).join('')}</tr>`;
    document.getElementById('cust-preview-body').innerHTML = pendingCustomers.slice(0, 15).map(c => `
        <tr>${Object.values(c).map(v => `<td>${v || '—'}</td>`).join('')}</tr>
    `).join('') + (pendingCustomers.length > 15 ? `<tr><td colspan="${headers.length}" style="text-align:center; padding:16px; color:var(--muted); background:var(--bg-alt); font-weight:600"><i class="fas fa-ellipsis-h"></i> Previewing first 15 of ${pendingCustomers.length} records</td></tr>` : '');
}

window.processCustomerImport = async function() {
    const btn = document.getElementById('btn-run-cust-import');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    const batchSize = 50; // Smaller batches for better server responsiveness
    let totalImported = 0;
    let totalSkipped = 0;
    
    for (let i = 0; i < pendingCustomers.length; i += batchSize) {
        const chunk = pendingCustomers.slice(i, i + batchSize);
        try {
            const r = await api('/api/customers/bulk', { method: 'POST', body: JSON.stringify({ customers: chunk }) });
            if (r.success) {
                totalImported += r.imported;
                totalSkipped += r.skipped;
                const progress = Math.min(100, Math.round(((i + chunk.length) / pendingCustomers.length) * 100));
                btn.innerHTML = `<i class="fas fa-sync fa-spin"></i> SYNCING ${progress}%`;
            }
        } catch (err) {
            console.error('Import chunk failed', err);
        }
    }

    toast(`Synchronization complete! Imported: ${totalImported}, Skipped: ${totalSkipped}`, 'success');
    closeModal();
    load_customers();
};

window.downloadCustTemplate = function() {
    const csv = "Name,Mobile,Email,City,Gender,Date of Birth,Notes\nAlpha Gamma,9988776655,alpha@gamma.com,Surat,Male,1992-04-21,Platinum potential\nNisha Patel,8877665544,nisha@gmail.com,Mumbai,Female,1998-10-12,Referral from store";
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Customers_Batch_Upload_Template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
};

window.openAddCustomer = function() {
    openModal('New Account Creation', `
        <form onsubmit="submitCustomer(event)" style="padding:8px">
            <div style="background:rgba(99,102,241,0.05); padding:16px; border-radius:12px; margin-bottom:20px; border:1px solid rgba(99,102,241,0.1)">
                <div style="display:flex; gap:12px; align-items:center">
                    <div style="width:40px; height:40px; border-radius:10px; background:var(--accent); color:#fff; display:flex; align-items:center; justify-content:center"><i class="fas fa-id-card"></i></div>
                    <div><h4 style="margin:0; color:var(--primary)">Basic Identification</h4><p style="margin:0; font-size:0.75rem; color:var(--muted)">Fields marked with * are required for POS billing</p></div>
                </div>
            </div>
            
            <div class="form-grid-2" style="display:grid; grid-template-columns:1fr 1fr; gap:16px">
                <div class="form-row"><label>Full Legal Name *</label><input id="c-name" placeholder="e.g. Rahul Sharma" required style="border-radius:10px"></div>
                <div class="form-row"><label>WhatsApp / Mobile *</label><input id="c-mobile" placeholder="10 Digits" required style="border-radius:10px"></div>
                <div class="form-row"><label>Email Address</label><input id="c-email" type="email" placeholder="client@example.com" style="border-radius:10px"></div>
                <div class="form-row"><label>Hometown / City</label><input id="c-city" placeholder="e.g. Surat" style="border-radius:10px"></div>
                <div class="form-row"><label>Biological Gender</label>
                    <select id="c-gender" style="border-radius:10px">
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                    </select>
                </div>
                <div class="form-row"><label>Personal Birthday</label><input id="c-dob" type="date" style="border-radius:10px"></div>
            </div>
            <div class="form-row" style="margin-top:16px"><label>Consultation Notes / CRM Tags</label><textarea id="c-notes" rows="3" placeholder="Any specific requirements or previous history..." style="border-radius:12px"></textarea></div>
            <div style="margin-top:24px; display:flex; justify-content:flex-end; gap:12px">
                <button class="btn btn-outline" type="button" onclick="closeModal()">Dismiss</button>
                <button class="btn btn-primary" type="submit" style="padding:10px 30px; font-weight:700"><i class="fas fa-user-check"></i> Register Customer Profile</button>
            </div>
        </form>`);
};

window.submitCustomer = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
    
    const r = await api('/api/customers', { 
        method: 'POST',
        body: JSON.stringify({ 
            business_id: BIZ, 
            name: document.getElementById('c-name').value, 
            mobile: document.getElementById('c-mobile').value, 
            email: document.getElementById('c-email').value, 
            city: document.getElementById('c-city').value, 
            gender: document.getElementById('c-gender').value, 
            date_of_birth: document.getElementById('c-dob').value, 
            notes: document.getElementById('c-notes').value 
        })
    });
    
    if (r.success) { 
        closeModal(); 
        toast('Customer Account Created Successfully!', 'success'); 
        load_customers(); 
    } else {
        toast(r.error, 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-user-check"></i> Register Customer Profile';
    }
};

window.viewCustomerProfile = async function(id) {
    toast('Consulting Customer 360° Profile...', 'info');
    const r = await api(`/api/customers/${id}`);
    if (!r.success) return toast(r.error, 'error');
    const c = r.data;
    
    openModal(`${c.name}'s Insight Analytics`, `
        <div style="background:var(--bg-alt); padding:20px; border-radius:16px; margin-bottom:20px">
            <div style="display:flex; justify-content:space-between; align-items:start">
                <div style="display:flex; gap:16px; align-items:center">
                    <div style="width:60px; height:60px; border-radius:16px; background:var(--accent); color:#fff; display:flex; align-items:center; justify-content:center; font-size:1.8rem; font-weight:800">${c.name.charAt(0)}</div>
                    <div>
                        <h2 style="margin:0">${c.name}</h2>
                        <p style="margin:0; color:var(--muted)">${c.mobile} • ${c.city || 'No City'}</p>
                        <div style="margin-top:6px">${badge(c.tier || 'Silver')} <span style="margin-left:8px; font-size:0.8rem; font-weight:600; color:var(--accent)">${c.points || 0} Reward Points</span></div>
                    </div>
                </div>
                <div style="text-align:right">
                    <div style="font-size:0.75rem; color:var(--muted); font-weight:600; text-transform:uppercase; letter-spacing:0.5px">Lifetime Value</div>
                    <div style="font-size:1.8rem; font-weight:800; color:var(--green)">${fmt(c.lifetime_value)}</div>
                </div>
            </div>
        </div>

        <div class="tabs-header" style="margin-bottom:15px; border-bottom:1px solid var(--border)">
            <button class="btn btn-sm" style="border-radius:0; border-bottom:2px solid var(--accent)">Overview</button>
            <button class="btn btn-sm" disabled style="border-radius:0">Order History (${c.orders.length})</button>
            <button class="btn btn-sm" disabled style="border-radius:0">Prescriptions</button>
        </div>
        
        <div class="kpi-grid" style="grid-template-columns:1fr 1fr 1fr; margin-bottom:20px">
            <div class="kpi-card" style="padding:12px; background:#fff border:1px solid var(--border)">
                <div class="kpi-label">TOTAL VISITS</div>
                <div class="kpi-value">${c.orders.length}</div>
            </div>
            <div class="kpi-card" style="padding:12px; background:#fff border:1px solid var(--border)">
                <div class="kpi-label">LAST VISIT</div>
                <div class="kpi-value" style="font-size:1.1rem">${c.orders[0] ? fmtDate(c.orders[0].created_at) : 'Never'}</div>
            </div>
            <div class="kpi-card" style="padding:12px; background:#fff border:1px solid var(--border)">
                <div class="kpi-label">AVG BILL</div>
                <div class="kpi-value">${fmt(c.lifetime_value / (c.orders.length || 1))}</div>
            </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px">
            <div class="card glass shadow-0" style="background:#fff">
                <h4>Bio Data & Notes</h4>
                <div style="margin-top:10px; font-size:0.85rem">
                    <p><b>Gender:</b> ${c.gender || '—'}</p>
                    <p><b>DOB:</b> ${c.date_of_birth ? fmtDate(c.date_of_birth) : '—'}</p>
                    <hr style="opacity:0.1; margin:10px 0">
                    <p><b>CRM Notes:</b></p>
                    <p style="color:var(--muted); font-style:italic">${c.notes || 'No notes available.'}</p>
                </div>
            </div>
            <div class="card glass shadow-0" style="background:#fff">
                <h4>Recent Purchases</h4>
                <div style="margin-top:10px">
                    ${c.orders.slice(0, 3).map(o => `
                        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(0,0,0,0.05)">
                            <div style="font-size:0.8rem"><b>#${o.invoice_number || o.order_id.slice(-6).toUpperCase()}</b><br><small style="color:var(--muted)">${fmtDate(o.created_at)}</small></div>
                            <div style="text-align:right"><b>${fmt(o.total_amount)}</b><br>${badge(o.order_status)}</div>
                        </div>
                    `).join('') || '<p style="color:var(--muted); font-size:0.8rem; padding:10px 0">No transaction history.</p>'}
                </div>
            </div>
        </div>
    `, 'lg');
};

window.openEditCustomer = async function(id) {
    const r = await api(`/api/customers/${id}`);
    if (!r.success) return toast(r.error, 'error');
    const c = r.data;
    
    openModal('Modify Profile Data', `
        <form onsubmit="submitEditCustomer(event, '${id}')" style="padding:8px">
            <div style="background:rgba(0,0,0,0.02); padding:16px; border-radius:12px; margin-bottom:20px; border:1px solid var(--border)">
                <div style="display:flex; gap:12px; align-items:center">
                    <i class="fas fa-user-edit text-accent" style="font-size:1.4rem"></i>
                    <div><h4 style="margin:0; color:var(--primary)">Editing: ${c.name}</h4><p style="margin:0; font-size:0.75rem; color:var(--muted)">Profile UID: ${id}</p></div>
                </div>
            </div>
            
            <div class="form-grid-2" style="display:grid; grid-template-columns:1fr 1fr; gap:16px">
                <div class="form-row"><label>Full Name</label><input id="e-name" value="${c.name || ''}" required style="border-radius:10px"></div>
                <div class="form-row"><label>Mobile Number</label><input id="e-mobile" value="${c.mobile || ''}" required style="border-radius:10px"></div>
                <div class="form-row"><label>Email Address</label><input id="e-email" type="email" value="${c.email || ''}" style="border-radius:10px"></div>
                <div class="form-row"><label>City</label><input id="e-city" value="${c.city || ''}" style="border-radius:10px"></div>
                <div class="form-row"><label>Gender</label>
                    <select id="e-gender" style="border-radius:10px">
                        <option ${c.gender==='Male'?'selected':''}>Male</option>
                        <option ${c.gender==='Female'?'selected':''}>Female</option>
                        <option ${c.gender==='Other'?'selected':''}>Other</option>
                    </select>
                </div>
                <div class="form-row"><label>Date of Birth</label><input id="e-dob" type="date" value="${c.date_of_birth ? c.date_of_birth.split('T')[0] : ''}" style="border-radius:10px"></div>
            </div>
            <div class="form-row" style="margin-top:16px"><label>CRM Notes & Internal History</label><textarea id="e-notes" rows="3" style="border-radius:12px">${c.notes || ''}</textarea></div>
            <div style="margin-top:24px; display:flex; justify-content:flex-end; gap:12px">
                <button class="btn btn-outline" type="button" onclick="closeModal()">Dismiss</button>
                <button class="btn btn-primary" type="submit" style="padding:10px 30px; font-weight:700"><i class="fas fa-save"></i> Commit Changes</button>
            </div>
        </form>`);
};

window.submitEditCustomer = async function(e, id) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    
    const r = await api(`/api/customers/${id}`, { 
        method: 'PUT',
        body: JSON.stringify({ 
            name: document.getElementById('e-name').value, 
            mobile: document.getElementById('e-mobile').value, 
            email: document.getElementById('e-email').value, 
            city: document.getElementById('e-city').value, 
            gender: document.getElementById('e-gender').value, 
            date_of_birth: document.getElementById('e-dob').value, 
            notes: document.getElementById('e-notes').value 
        })
    });
    
    if (r.success) { 
        closeModal(); 
        toast('Customer Profile Updated Successfully!', 'success'); 
        renderCustomersList(); 
    } else {
        toast(r.error, 'error');
        btn.disabled = false;
    }
};



/* ── CRM & LEAD MANAGEMENT (ENTERPRISE GRADE) ── */
window.load_crm = async function() {
    const el = document.getElementById('view-crm');
    if (!el) return;

    if (!window.crmFilters) {
        window.crmFilters = { q: '', status: '', source: '' };
    }
    const f = window.crmFilters;
    const bizId = window.BIZ || USER?.business_id || 'biz_blink_001';

    // 1. Render immediate UI shell (Glassmorphism)
    el.innerHTML = `
    <div class="module-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px">
        <div>
            <h2 style="margin:0; font-weight:800; letter-spacing:-0.5px">CRM & Pipelines</h2>
            <p style="color:var(--muted); font-size:0.85rem">Track leads, monitor conversion rates and manage sales workforce</p>
        </div>
        <div style="display:flex; gap:10px">
            <button class="btn btn-outline" onclick="load_crm()"><i class="fas fa-sync"></i> Refresh</button>
            <button class="btn btn-primary" onclick="openAddLead()"><i class="fas fa-plus"></i> Capture Lead</button>
        </div>
    </div>

    <div class="kpi-grid" id="crmKpis" style="margin-bottom:24px">
        <div class="kpi-card glass border-l-blue">
            <div class="kpi-info"><div class="kpi-label">ACTIVE PIPELINE</div><div class="kpi-value"><i class="fas fa-circle-notch fa-spin"></i></div></div>
        </div>
        <div class="kpi-card glass border-l-accent">
            <div class="kpi-info"><div class="kpi-label">NEW (30 DAYS)</div><div class="kpi-value"><i class="fas fa-circle-notch fa-spin"></i></div></div>
        </div>
        <div class="kpi-card glass border-l-green">
            <div class="kpi-info"><div class="kpi-label">CONVERSION RATE</div><div class="kpi-value"><i class="fas fa-circle-notch fa-spin"></i></div></div>
        </div>
    </div>

    <div class="card glass shadow-sm" style="margin-bottom:24px; border-radius:16px">
        <div class="card-body" style="padding:16px">
            <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap">
                <div style="flex:1; position:relative; min-width:280px">
                    <i class="fas fa-search" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--muted); opacity:0.6"></i>
                    <input type="text" id="crm-q" placeholder="Search leads by name or mobile..." 
                           style="padding:12px 12px 12px 42px; width:100%; border-radius:12px; border:1px solid var(--border); background:rgba(255,255,255,0.5); font-size:0.9rem" 
                           value="${f.q}" oninput="updateCrmFilters()">
                </div>
                <select id="crm-status-f" class="form-select" style="width:160px; border-radius:10px" onchange="updateCrmFilters()">
                    <option value="">All Statuses</option>
                    <option value="New" ${f.status==='New'?'selected':''}>New Lead</option>
                    <option value="Contacted" ${f.status==='Contacted'?'selected':''}>Contacted</option>
                    <option value="Qualified" ${f.status==='Qualified'?'selected':''}>Qualified</option>
                    <option value="Lost" ${f.status==='Lost'?'selected':''}>Lost</option>
                    <option value="Converted" ${f.status==='Converted'?'selected':''}>Converted</option>
                </select>
                <select id="crm-source-f" class="form-select" style="width:160px; border-radius:10px" onchange="updateCrmFilters()">
                    <option value="">All Sources</option>
                    <option value="Website" ${f.source==='Website'?'selected':''}>Website</option>
                    <option value="Walk-in" ${f.source==='Walk-in'?'selected':''}>Walk-in</option>
                    <option value="WhatsApp" ${f.source==='WhatsApp'?'selected':''}>WhatsApp</option>
                    <option value="Call" ${f.source==='Call'?'selected':''}>Call</option>
                </select>
            </div>
        </div>
    </div>

    <div class="card glass no-padding overflow-hidden">
        <div class="table-container">
            <table class="modern-table">
                <thead>
                    <tr>
                        <th style="padding-left:24px">Lead Information</th>
                        <th>Origin & Interest</th>
                        <th>Status</th>
                        <th style="text-align:center">Follow-ups</th>
                        <th>Created Date</th>
                        <th style="text-align:right; padding-right:24px">Quick Actions</th>
                    </tr>
                </thead>
                <tbody id="crmBody">${skelRows(6)}</tbody>
            </table>
        </div>
    </div>
    `;

    // 2. Perform Async Loading
    setTimeout(async () => {
        try {
            const kpir = await api(`/api/crm/kpis?business_id=${bizId}`);
            if (kpir.success) updateCrmKpis(kpir.data);
            renderLeadsList();
        } catch (e) {
            console.error('CRM Data Fetch Error:', e);
            toast('CRM Sync Error: ' + (e.message || e), 'error');
        }
    }, 10);
};

function updateCrmKpis(kpi) {
    const stats = kpi.pipeline || { total: 0 };
    document.getElementById('crmKpis').innerHTML = `
        <div class="kpi-card glass border-l-blue">
            <div class="kpi-info">
                <div class="kpi-label">ACTIVE PIPELINE</div>
                <div class="kpi-value">${stats.total || 0}</div>
                <div style="font-size:0.75rem; color:var(--muted); margin-top:4px">Potential Clients</div>
            </div>
            <div class="kpi-icon"><i class="fas fa-funnel-dollar"></i></div>
        </div>
        <div class="kpi-card glass border-l-accent">
            <div class="kpi-info">
                <div class="kpi-label">NEW (30 DAYS)</div>
                <div class="kpi-value text-accent">${kpi.recentGrowth || 0}</div>
                <div style="font-size:0.75rem; color:var(--muted); margin-top:4px">Velocity Tracking</div>
            </div>
            <div class="kpi-icon"><i class="fas fa-bolt"></i></div>
        </div>
        <div class="kpi-card glass border-l-green">
            <div class="kpi-info">
                <div class="kpi-label">CONVERSION RATE</div>
                <div class="kpi-value text-green">${kpi.conversionRates || 0}%</div>
                <div style="font-size:0.75rem; color:var(--muted); margin-top:4px">Efficiency Index</div>
            </div>
            <div class="kpi-icon"><i class="fas fa-chart-line"></i></div>
        </div>
    `;
}

async function renderLeadsList() {
    const f = window.crmFilters;
    const bizId = window.BIZ || USER?.business_id || 'biz_blink_001';
    const qs = new URLSearchParams({
        business_id: bizId,
        search: f.q,
        status: f.status,
        source: f.source,
        limit: 100
    });

    const d = await api(`/api/crm/leads?${qs.toString()}`);
    const rows = (d.data || []).map(l => `
        <tr class="hover-row">
            <td style="padding-left:24px">
                <div style="display:flex; align-items:center; gap:12px">
                    <div style="width:40px; height:40px; border-radius:12px; background:linear-gradient(135deg, #10b981 0%, #059669 100%); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:1.1rem">
                        ${(l.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style="font-weight:700; color:var(--primary); font-size:0.95rem">${l.name}</div>
                        <div style="font-size:0.8rem; color:var(--muted)"><i class="fas fa-phone-alt" style="font-size:0.7rem"></i> ${l.mobile}</div>
                    </div>
                </div>
            </td>
            <td>
                <div style="font-size:0.85rem; font-weight:600"><span class="badge badge-gray">${l.source || 'Unknown'}</span></div>
                <div style="font-size:0.75rem; color:var(--muted); margin-top:4px">${l.interest || 'General Inquiry'}</div>
            </td>
            <td>${badge(l.status)}</td>
            <td style="text-align:center">
                <div style="font-weight:700">${l.follow_up_count || 0}</div>
                <div style="font-size:0.65rem; color:var(--muted); text-transform:uppercase">Touchpoints</div>
            </td>
            <td>
                <div style="font-size:0.85rem; color:var(--primary)">${fmtDate(l.created_at)}</div>
            </td>
            <td style="text-align:right; padding-right:24px">
                <div style="display:flex; gap:8px; justify-content:flex-end">
                    <button class="btn-icon" style="background:rgba(16,185,129,0.1); color:var(--accent)" onclick="viewLeadProfile('${l.lead_id}')" title="Overview"><i class="fas fa-eye"></i></button>
                    ${(l.status !== 'Converted' && l.status !== 'Lost') ? `<button class="btn btn-primary btn-sm" onclick="convertLeadPrompt('${l.lead_id}')" style="padding:4px 10px"><i class="fas fa-user-check"></i> Convert</button>` : ``}
                </div>
            </td>
        </tr>
    `).join('');

    document.getElementById('crmBody').innerHTML = rows || `<tr><td colspan="6" style="text-align:center; padding:80px; color:var(--muted)">No leads available.</td></tr>`;
}

window.updateCrmFilters = function() {
    window.crmFilters = {
        q: document.getElementById('crm-q').value,
        status: document.getElementById('crm-status-f').value,
        source: document.getElementById('crm-source-f').value
    };
    clearTimeout(window.crmFilterTimer);
    window.crmFilterTimer = setTimeout(() => renderLeadsList(), 400);
};

window.viewLeadProfile = async function(id) {
    toast('Accessing lead intelligence...', 'info');
    const r = await api(`/api/crm/leads/${id}`);
    if (!r.success) return toast(r.error, 'error');
    const l = r.data;

    openModal(`Lead Intelligence: ${l.name}`, `
        <div style="display:grid; grid-template-columns:1fr 2fr; gap:24px">
            <div>
                <div class="card" style="padding:20px; text-align:center">
                    <div style="width:80px; height:80px; border-radius:20px; background:var(--accent); color:#fff; display:flex; align-items:center; justify-content:center; font-size:2.5rem; font-weight:800; margin:0 auto 15px">${l.name.charAt(0)}</div>
                    <h3>${l.name}</h3>
                    <p style="color:var(--muted); margin-bottom:15px">${l.mobile}</p>
                    <div style="margin-bottom:15px">${badge(l.status)}</div>
                    <hr style="opacity:0.1; margin:15px 0">
                    <div style="text-align:left">
                        <div style="font-size:0.75rem; color:var(--muted); font-weight:700; text-transform:uppercase">Interest</div>
                        <div style="font-weight:600; margin-bottom:12px">${l.interest || 'Not Specified'}</div>
                        <div style="font-size:0.75rem; color:var(--muted); font-weight:700; text-transform:uppercase">Origin</div>
                        <div style="font-weight:600">${l.source || 'Unknown'}</div>
                    </div>
                </div>
                
                <button class="btn btn-primary" style="width:100%; margin-top:10px" onclick="openAddFollowUp('${l.lead_id}')"><i class="fas fa-calendar-plus"></i> Schedule Follow-up</button>
                <div style="margin-top:10px; display:flex; gap:10px">
                    <select id="lp-status" class="form-select" style="flex:1">
                        <option value="New" ${l.status==='New'?'selected':''}>New</option>
                        <option value="Contacted" ${l.status==='Contacted'?'selected':''}>Contacted</option>
                        <option value="Qualified" ${l.status==='Qualified'?'selected':''}>Qualified</option>
                        <option value="Lost" ${l.status==='Lost'?'selected':''}>Lost</option>
                    </select>
                    <button class="btn btn-outline" onclick="updateLeadStatus('${l.lead_id}')">Update</button>
                </div>
            </div>
            
            <div style="display:flex; flex-direction:column; gap:20px">
                <div class="card no-padding">
                    <div class="card-header"><h4>Activity Timeline</h4></div>
                    <div class="card-body" style="padding:0; max-height:400px; overflow-y:auto">
                        <div class="timeline" style="padding:20px">
                            ${(l.activities||[]).map(a => `
                                <div class="timeline-item">
                                    <div class="timeline-date">${fmtDate(a.created_at)}</div>
                                    <div class="timeline-title">${a.activity_type}</div>
                                    <div class="timeline-desc">
                                        ${a.description}
                                        ${a.new_value ? `<div style="font-size:0.75rem; color:var(--accent); font-weight:600; margin-top:4px">New Status: ${a.new_value}</div>` : ''}
                                    </div>
                                </div>
                            `).reverse().join('') || '<p style="padding:20px; text-align:center; color:var(--muted)">No logged activity.</p>'}
                        </div>

                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header"><h4>Private Notes</h4></div>
                    <div class="card-body">
                        <p style="font-size:0.9rem; font-style:italic; border-left:3px solid var(--accent); padding-left:12px; color:var(--muted)">${l.notes || 'No notes added yet.'}</p>
                    </div>
                </div>
            </div>
        </div>
    `, 'lg');
};

window.openAddLead = function() {
    openModal('New Lead Discovery', `
        <form onsubmit="submitLead(event)" style="padding:10px">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px">
                <div class="form-row"><label>Full Name *</label><input id="l-name" placeholder="Potential Client Name" required></div>
                <div class="form-row"><label>Mobile / WhatsApp *</label><input id="l-mobile" placeholder="+91" required></div>
                <div class="form-row"><label>Capture Source</label>
                    <select id="l-source">
                        <option>Website</option>
                        <option>Walk-in</option>
                        <option>WhatsApp</option>
                        <option>Call</option>
                        <option>Social Media</option>
                        <option>Referral</option>
                    </select>
                </div>
                <div class="form-row"><label>Interest Level</label>
                    <select id="l-interest">
                        <option>Prescription Glasses</option>
                        <option>Sunglasses</option>
                        <option>Contact Lenses</option>
                        <option>Eye Checkup Only</option>
                        <option>Repair/Service</option>
                    </select>
                </div>
            </div>
            <div class="form-row"><label>Discovery Notes / Background</label><textarea id="l-notes" rows="4" placeholder="How was the lead qualified? What are they specifically looking for?"></textarea></div>
            <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:20px">
                <button class="btn btn-outline" type="button" onclick="closeModal()">Discard</button>
                <button class="btn btn-primary" type="submit" style="padding:10px 30px">Capture Potential</button>
            </div>
        </form>`);
};

window.submitLead = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    
    const r = await api('/api/crm/leads', { 
        method: 'POST',
        body: JSON.stringify({ 
            business_id: BIZ, 
            name: document.getElementById('l-name').value, 
            mobile: document.getElementById('l-mobile').value, 
            source: document.getElementById('l-source').value, 
            interest: document.getElementById('l-interest').value, 
            notes: document.getElementById('l-notes').value 
        })
    });
    
    if (r.success) { 
        closeModal(); 
        toast('Lead successfully added to pipeline!', 'success'); 
        load_crm(); 
    } else {
        toast(r.error, 'error');
        btn.disabled = false;
    }
};

window.updateLeadStatus = async function(id) {
    const status = document.getElementById('lp-status').value;
    const r = await api(`/api/crm/leads/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, remarks: 'ERP Status Update' })
    });
    if (r.success) {
        toast('Lead status synchronized!', 'success');
        viewLeadProfile(id); // Reload profile
        renderLeadsList(); // Reload list
    } else toast(r.error, 'error');
};

window.convertLeadPrompt = function(id) {
    if (confirm('Are you sure you want to convert this lead to a registered customer? This will create a permanent profile and initiate the loyalty lifecycle.')) {
        processLeadConversion(id);
    }
};

async function processLeadConversion(id) {
    toast('Broadcasting conversion event...', 'info');
    const r = await api(`/api/crm/leads/${id}/convert`, { method: 'POST' });
    if (r.success) {
        toast('Conversion successful! Lead is now a Customer.', 'success');
        load_crm();
    } else toast(r.error, 'error');
}

window.openAddFollowUp = function(lead_id) {
    openModal('Schedule Follow-up', `
        <form onsubmit="submitFollowUp(event, '${lead_id}')" style="padding:10px">
            <div class="form-row"><label>Follow-up Date & Time</label><input id="fu-date" type="datetime-local" required></div>
            <div class="form-row"><label>Follow-up Method</label>
                <select id="fu-type">
                    <option>Call</option>
                    <option>WhatsApp</option>
                    <option>Store Visit</option>
                    <option>Home Trial</option>
                </select>
            </div>
            <div class="form-row"><label>Goal / Objective</label><textarea id="fu-note" rows="3" required placeholder="What needs to be achieved in this touchpoint?"></textarea></div>
            <button class="btn btn-primary" type="submit" style="width:100%; margin-top:10px">Confirm Schedule</button>
        </form>`);
};

window.submitFollowUp = async function(e, lead_id) {
    e.preventDefault();
    const r = await api('/api/crm/follow-ups', {
        method: 'POST',
        body: JSON.stringify({
            business_id: BIZ,
            lead_id,
            followup_date: document.getElementById('fu-date').value,
            note: document.getElementById('fu-note').value,
            type: document.getElementById('fu-type').value
        })
    });
    if (r.success) {
        closeModal();
        toast('Follow-up activity scheduled!', 'success');
        if (lead_id) viewLeadProfile(lead_id);
    } else toast(r.error, 'error');
};

/* ── APPOINTMENTS & CLINIC SCHEDULING (ENTERPRISE GRADE) ── */
window.load_appointments = async function() {
    const el = document.getElementById('view-appointments');
    if (!el) return;

    if (!window.aptFilters) {
        window.aptFilters = { q: '', status: '', showroom_id: USER.showroom_id || '' };
    }
    const f = window.aptFilters;

    // 1. Render immediate UI shell
    el.innerHTML = `
    <div class="module-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px">
        <div>
            <h2 style="margin:0; font-weight:800; letter-spacing:-0.5px">Clinic Scheduler</h2>
            <p style="color:var(--muted); font-size:0.85rem">Manage eye tests, consultations and customer visits</p>
        </div>
        <div style="display:flex; gap:10px">
            <button class="btn btn-outline" onclick="load_appointments()"><i class="fas fa-sync"></i> Refresh</button>
            <button class="btn btn-primary" onclick="openAddAppointment()"><i class="fas fa-calendar-plus"></i> Book Appointment</button>
        </div>
    </div>

    <div class="kpi-grid" id="aptKpis" style="margin-bottom:24px">
        <div class="kpi-card glass border-l-accent">
            <div class="kpi-info"><div class="kpi-label">TODAY'S SCHEDULE</div><div class="kpi-value"><i class="fas fa-circle-notch fa-spin"></i></div></div>
        </div>
        <div class="kpi-card glass border-l-blue">
            <div class="kpi-info"><div class="kpi-label">UPCOMING / PENDING</div><div class="kpi-value"><i class="fas fa-circle-notch fa-spin"></i></div></div>
        </div>
        <div class="kpi-card glass border-l-green">
            <div class="kpi-info"><div class="kpi-label">COMPLETED TODAY</div><div class="kpi-value"><i class="fas fa-circle-notch fa-spin"></i></div></div>
        </div>
    </div>

    <div class="card glass shadow-sm" style="margin-bottom:24px; border-radius:16px">
        <div class="card-body" style="padding:16px">
            <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap">
                <div style="flex:1; position:relative; min-width:280px">
                    <i class="fas fa-search" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--muted); opacity:0.6"></i>
                    <input type="text" id="apt-q" placeholder="Search by customer name or mobile..." 
                           style="padding:12px 12px 12px 42px; width:100%; border-radius:12px; border:1px solid var(--border); background:rgba(255,255,255,0.5); font-size:0.9rem" 
                           value="${f.q}" oninput="updateAptFilters()">
                </div>
                <select id="apt-status-f" class="form-select" style="width:160px; border-radius:10px" onchange="updateAptFilters()">
                    <option value="">All Statuses</option>
                    <option value="Booked" ${f.status==='Booked'?'selected':''}>Booked</option>
                    <option value="Arrived" ${f.status==='Arrived'?'selected':''}>Arrived</option>
                    <option value="Completed" ${f.status==='Completed'?'selected':''}>Completed</option>
                    <option value="No-show" ${f.status==='No-show'?'selected':''}>No-show</option>
                    <option value="Cancelled" ${f.status==='Cancelled'?'selected':''}>Cancelled</option>
                </select>
                <select id="apt-showroom-f" class="form-select" style="width:180px; border-radius:10px" onchange="updateAptFilters()">
                    <option value="">All Showrooms</option>
                    ${(window.MASTER_DATA?.showrooms || []).map(s => `<option value="${s.showroom_id}" ${f.showroom_id===s.showroom_id?'selected':''}>${s.name}</option>`).join('')}
                </select>
            </div>
        </div>
    </div>

    <div class="card glass no-padding overflow-hidden">
        <div class="table-container">
            <table class="modern-table">
                <thead>
                    <tr>
                        <th style="padding-left:24px">Patient / Customer</th>
                        <th>Type & Showroom</th>
                        <th>Date & Timing</th>
                        <th>Current Status</th>
                        <th style="text-align:right; padding-right:24px">Actions</th>
                    </tr>
                </thead>
                <tbody id="aptBody">${skelRows(6)}</tbody>
            </table>
        </div>
    </div>
    `;

    // 2. Load Data Async
    setTimeout(async () => {
        try {
            const kpir = await api(`/api/clinic/appointments/kpis`);
            if (kpir.success) updateAptKpis(kpir.data);
            renderAppointmentsList();
        } catch (e) {
            console.error('Appointments Async Load Error:', e);
            toast('Scheduler Sync Error: ' + (e.message || e), 'error');
        }
    }, 10);
};

function updateAptKpis(kpi) {
    document.getElementById('aptKpis').innerHTML = `
        <div class="kpi-card glass border-l-accent">
            <div class="kpi-info">
                <div class="kpi-label">TODAY'S SCHEDULE</div>
                <div class="kpi-value text-accent">${kpi.today || 0}</div>
                <div style="font-size:0.75rem; color:var(--muted); margin-top:4px">Total Bookings</div>
            </div>
            <div class="kpi-icon"><i class="fas fa-calendar-day"></i></div>
        </div>
        <div class="kpi-card glass border-l-blue">
            <div class="kpi-info">
                <div class="kpi-label">UPCOMING / PENDING</div>
                <div class="kpi-value text-primary">${kpi.pending || 0}</div>
                <div style="font-size:0.75rem; color:var(--muted); margin-top:4px">Future Visits</div>
            </div>
            <div class="kpi-icon"><i class="fas fa-clock"></i></div>
        </div>
        <div class="kpi-card glass border-l-green">
            <div class="kpi-info">
                <div class="kpi-label">COMPLETED TODAY</div>
                <div class="kpi-value text-green">${kpi.completedToday || 0}</div>
                <div style="font-size:0.75rem; color:var(--muted); margin-top:4px">Clinic Efficiency</div>
            </div>
            <div class="kpi-icon"><i class="fas fa-check-double"></i></div>
        </div>
    `;
}

async function renderAppointmentsList() {
    const f = window.aptFilters;
    const bizId = window.BIZ || USER?.business_id || 'biz_blink_001';
    const qs = new URLSearchParams({
        business_id: bizId,
        search: f.q,
        status: f.status,
        showroom_id: f.showroom_id
    });

    const d = await api(`/api/clinic/appointments?${qs.toString()}`);
    const rows = (d.data || []).map(a => `
        <tr class="hover-row">
            <td style="padding-left:24px">
                <div style="font-weight:700; color:var(--primary); font-size:0.95rem">${a.customer_name || 'Walk-in'}</div>
                <div style="font-size:0.8rem; color:var(--muted)">${a.mobile || 'No Contact'}</div>
            </td>
            <td>
                <div style="font-size:0.85rem; font-weight:600">${a.appointment_type}</div>
                <div style="font-size:0.7rem; color:var(--muted); text-transform:uppercase"><i class="fas fa-store"></i> ${a.showroom_name || 'Head Office'}</div>
            </td>
            <td>
                <div style="font-weight:700">${fmtDate(a.appointment_date)}</div>
                <div style="font-size:0.75rem; color:var(--accent)">${new Date(a.appointment_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            </td>
            <td>${badge(a.status)}</td>
            <td style="text-align:right; padding-right:24px">
                <div style="display:flex; gap:8px; justify-content:flex-end">
                    <button class="btn-icon" style="background:rgba(99,102,241,0.1); color:var(--primary)" onclick="viewAppointmentDetails('${a.appointment_id}')" title="Overview"><i class="fas fa-info-circle"></i></button>
                    ${a.status === 'Booked' ? `<button class="btn btn-primary btn-sm" onclick="markArrived('${a.appointment_id}')" style="padding:4px 10px"><i class="fas fa-check"></i> Arrived</button>` : ``}
                </div>
            </td>
        </tr>
    `).join('');

    document.getElementById('aptBody').innerHTML = rows || `<tr><td colspan="5" style="text-align:center; padding:80px; color:var(--muted)">No health records found for this period.</td></tr>`;
}

window.updateAptFilters = function() {
    window.aptFilters = {
        q: document.getElementById('apt-q').value,
        status: document.getElementById('apt-status-f').value,
        showroom_id: document.getElementById('apt-showroom-f').value
    };
    clearTimeout(window.aptFilterTimer);
    window.aptFilterTimer = setTimeout(() => renderAppointmentsList(), 400);
};

window.openAddAppointment = async function() {
    openModal('Book Clinic Appointment', `
        <form onsubmit="submitAppointment(event)" style="padding:10px">
            <div style="background:rgba(99,102,241,0.03); padding:16px; border-radius:12px; margin-bottom:20px; border:1px solid var(--border)">
                <div class="form-row" style="margin-bottom:0">
                    <label>Search Customer (Name or Mobile)</label>
                    <div style="position:relative">
                        <input id="apt-cust-search" placeholder="Start typing to search..." oninput="searchAptCustomer(this.value)" autocomplete="off">
                        <div id="apt-cust-results" style="position:absolute; width:100%; background:#fff; border:1px solid var(--border); border-top:none; z-index:10; display:none; max-height:200px; overflow-y:auto; border-radius:0 0 10px 10px; box-shadow:0 10px 20px rgba(0,0,0,0.1)"></div>
                    </div>
                    <input type="hidden" id="apt-cid" required>
                    <div id="selected-cust-info" style="margin-top:8px; font-size:0.85rem; display:none; color:var(--accent); font-weight:700"></div>
                </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px">
                <div class="form-row"><label>Showroom / Location</label>
                    <select id="apt-sid" required>
                        ${(window.MASTER_DATA?.showrooms || []).map(s => `<option value="${s.showroom_id}" ${USER.showroom_id===s.showroom_id?'selected':''}>${s.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-row"><label>Appointment Type</label>
                    <select id="apt-type">
                        <option>Eye Test</option>
                        <option>Frame Fitting</option>
                        <option>Lens Consultation</option>
                        <option>Contact Lens Fitting</option>
                        <option>Repair Pickup</option>
                    </select>
                </div>
                <div class="form-row"><label>Preferred Date & Time</label><input id="apt-date" type="datetime-local" required></div>
                <div class="form-row"><label>Notes / Requirements</label><input id="apt-notes" placeholder="e.g. Diabetics case, urgent"></div>
            </div>
            
            <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:24px">
                <button class="btn btn-outline" type="button" onclick="closeModal()">Dismiss</button>
                <button class="btn btn-primary" type="submit" style="padding:10px 30px"><i class="fas fa-calendar-check"></i> Confirm Booking</button>
            </div>
        </form>`);
};

window.searchAptCustomer = async function(q) {
    if (q.length < 3) return document.getElementById('apt-cust-results').style.display='none';
    const r = await api(`/api/customers?business_id=${BIZ}&search=${q}&limit=5`);
    const results = document.getElementById('apt-cust-results');
    results.innerHTML = (r.data || []).map(c => `
        <div onclick="selectAptCustomer('${c.customer_id}', '${c.name}', '${c.mobile}')" style="padding:10px 15px; border-bottom:1px solid #eee; cursor:pointer; font-size:0.9rem">
            <b>${c.name}</b><br><small style="color:var(--muted)">${c.mobile}</small>
        </div>
    `).join('') || '<div style="padding:10px 15px; color:#888">No customers found.</div>';
    results.style.display = 'block';
};

window.selectAptCustomer = function(id, name, mobile) {
    document.getElementById('apt-cid').value = id;
    document.getElementById('apt-cust-search').value = name;
    document.getElementById('apt-cust-results').style.display = 'none';
    const info = document.getElementById('selected-cust-info');
    info.innerHTML = `<i class="fas fa-check-circle text-green"></i> Customer Selected: ${name} (${mobile})`;
    info.style.display = 'block';
};

window.submitAppointment = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    
    const r = await api('/api/clinic/appointments', { 
        method: 'POST',
        body: JSON.stringify({ 
            business_id: BIZ, 
            customer_id: document.getElementById('apt-cid').value, 
            showroom_id: document.getElementById('apt-sid').value,
            appointment_date: document.getElementById('apt-date').value, 
            appointment_type: document.getElementById('apt-type').value, 
            notes: document.getElementById('apt-notes').value 
        })
    });
    
    if (r.success) { 
        closeModal(); 
        toast('Appointment recorded successfully!', 'success'); 
        load_appointments(); 
    } else {
        toast(r.error, 'error');
        btn.disabled = false;
    }
};

window.viewAppointmentDetails = async function(id) {
    const d = await api(`/api/clinic/appointments?business_id=${BIZ}`);
    const a = (d.data || []).find(x => x.appointment_id === id);
    if (!a) return;

    openModal('Appointment Profile', `
        <div style="padding:10px">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px">
                <div>
                    <h2 style="margin:0">${a.customer_name}</h2>
                    <p style="color:var(--muted)"><i class="fas fa-phone"></i> ${a.mobile}</p>
                </div>
                <div style="text-align:right">
                    ${badge(a.status)}
                    <p style="font-size:0.75rem; color:var(--muted); margin-top:4px">Ref: ${a.appointment_id}</p>
                </div>
            </div>

            <div class="card glass no-padding" style="margin-bottom:20px; background:rgba(0,0,0,0.01)">
                <div class="card-body" style="display:grid; grid-template-columns:1fr 1fr; gap:20px; padding:20px">
                    <div>
                        <label style="font-size:0.8rem; color:var(--muted); display:block; margin-bottom:4px">SCHEDULED FOR</label>
                        <b style="font-size:1.1rem">${fmtDate(a.appointment_date)} at ${new Date(a.appointment_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</b>
                    </div>
                    <div>
                        <label style="font-size:0.8rem; color:var(--muted); display:block; margin-bottom:4px">SERVICE TYPE</label>
                        <b style="font-size:1.1rem">${a.appointment_type}</b>
                    </div>
                    <div>
                        <label style="font-size:0.8rem; color:var(--muted); display:block; margin-bottom:4px">LOCATION</label>
                        <b>${a.showroom_name || 'Main Showroom'}</b>
                    </div>
                    <div>
                        <label style="font-size:0.8rem; color:var(--muted); display:block; margin-bottom:4px">CLINIC NOTES</label>
                        <i style="color:var(--muted)">${a.notes || 'No specific requests.'}</i>
                    </div>
                </div>
            </div>

            <div style="display:flex; gap:12px; justify-content:space-between; align-items:center">
                <div style="display:flex; gap:10px">
                    <button class="btn btn-outline" style="color:var(--danger); border-color:var(--danger)" onclick="updateAptStatus('${id}', 'Cancelled')"><i class="fas fa-times"></i> Cancel</button>
                    ${a.status !== 'Completed' ? `<button class="btn btn-outline" onclick="updateAptStatus('${id}', 'No-show')"><i class="fas fa-user-slash"></i> No-show</button>` : ``}
                </div>
                <div style="display:flex; gap:10px">
                    ${a.status !== 'Completed' ? `<button class="btn btn-success" onclick="updateAptStatus('${id}', 'Completed')" style="padding:10px 30px; background:#10b981"><i class="fas fa-check-circle"></i> Mark Completed</button>` : ``}
                </div>
            </div>
        </div>
    `, 'md');
};

window.updateAptStatus = async function(id, status) {
    if (confirm(`Change appointment status to ${status}?`)) {
        const r = await api(`/api/clinic/appointments/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
        if (r.success) {
            closeModal();
            toast(`Appointment marked as ${status}`, 'success');
            load_appointments();
        } else toast(r.error, 'error');
    }
};

window.markArrived = async function(id) {
    const r = await api(`/api/clinic/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Arrived' })
    });
    if (r.success) {
        toast('Patient marked as Arrived!', 'success');
        load_appointments();
    } else toast(r.error, 'error');
};


/* ── EYE TESTS ── */
window.load_eyetests = function() {
    const el = document.getElementById('view-eyetests');
    const bizId = window.BIZ || USER?.business_id || 'biz_blink_001';
    
    el.innerHTML = `
        <div class="module-header glass" style="margin-bottom:24px">
            <div>
                <h1 style="margin:0; font-size:1.8rem; letter-spacing:-0.5px">Optometry & Eye Tests</h1>
                <p style="margin:4px 0 0; color:var(--muted); font-size:0.9rem">Clinical records and prescription management</p>
            </div>
            <div style="display:flex; gap:12px">
                <button class="btn btn-outline" onclick="load_eyetests()" title="Refresh Dashboard"><i class="fas fa-sync-alt"></i></button>
                <button class="btn btn-primary" onclick="openAddEyeTest()"><i class="fas fa-plus"></i> New Prescription</button>
            </div>
        </div>

        <div id="etKpis" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:20px; margin-bottom:24px">
            ${Array(3).fill('<div class="kpi-card skeleton" style="height:110px"></div>').join('')}
        </div>

        <div class="card glass no-padding" style="margin-bottom:24px">
            <div class="card-body" style="padding:16px; display:flex; gap:16px; align-items:center; background:rgba(0,0,0,0.02)">
                <div style="position:relative; flex:1">
                    <i class="fas fa-search" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--muted)"></i>
                    <input id="et-q" class="filter-input" placeholder="Search by Patient Name, Mobile or Doctor..." style="width:100%; padding-left:40px; background:#fff">
                </div>
                <div style="display:flex; gap:8px">
                    <input type="date" id="et-from" class="filter-input" style="width:140px; background:#fff">
                    <span style="align-self:center; color:var(--muted)">to</span>
                    <input type="date" id="et-to" class="filter-input" style="width:140px; background:#fff">
                </div>
                <button class="btn btn-primary btn-sm" onclick="updateEtFilters()" style="padding:10px 20px"><i class="fas fa-filter"></i> Apply</button>
            </div>
        </div>

        <div class="card glass no-padding">
            <div class="table-responsive">
                <table class="modern-table">
                    <thead>
                        <tr>
                            <th style="padding-left:24px">Patient & Date</th>
                            <th>Doctor</th>
                            <th>Vision (R)</th>
                            <th>Vision (L)</th>
                            <th>PD / Notes</th>
                            <th style="text-align:right; padding-right:24px">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="etBody">${skelRows(8)}</tbody>
                </table>
            </div>
        </div>
    `;

    window.etFilters = { q: '', from: '', to: '' };
    
    setTimeout(async () => {
        try {
            console.log(`[ERP] Loading Eye Test data for Biz: ${bizId}`);
            const kpir = await api(`/api/clinic/eye-tests/kpis?business_id=${bizId}`);
            if (kpir.success) {
                updateEtKpis(kpir.data);
            } else {
                console.warn('[ERP] KPI Fetch non-success:', kpir);
            }
            
            await renderEyeTestsList();
            console.log('[ERP] Eye Test module loaded successfully');
        } catch (e) {
            console.error('[ERP] Eye Test Sync Crash:', e);
            toast(`Clinical sync failed: ${e.message}`, 'error');
        }
    }, 10);
};

function updateEtKpis(kpi) {
    document.getElementById('etKpis').innerHTML = `
        <div class="kpi-card glass animate-in">
            <div class="kpi-info">
                <div class="kpi-label">TOTAL PATIENTS</div>
                <div class="kpi-value text-primary">${kpi.totalPatients || 0}</div>
                <div style="font-size:0.75rem; color:var(--muted); margin-top:4px">Unique clinical records</div>
            </div>
            <div class="kpi-icon"><i class="fas fa-hospital-user"></i></div>
        </div>
        <div class="kpi-card glass animate-in">
            <div class="kpi-info">
                <div class="kpi-label">TODAY'S TESTS</div>
                <div class="kpi-value text-accent">${kpi.today || 0}</div>
                <div style="font-size:0.75rem; color:var(--muted); margin-top:4px">New prescriptions recorded</div>
            </div>
            <div class="kpi-icon"><i class="fas fa-file-medical"></i></div>
        </div>
        <div class="kpi-card glass animate-in">
            <div class="kpi-info">
                <div class="kpi-label">30D ACTIVITY</div>
                <div class="kpi-value text-green">${kpi.thisMonth || 0}</div>
                <div style="font-size:0.75rem; color:var(--muted); margin-top:4px">Health checks last 30 days</div>
            </div>
            <div class="kpi-icon"><i class="fas fa-heartbeat"></i></div>
        </div>
    `;
}

async function renderEyeTestsList() {
    const f = window.etFilters;
    const bizId = window.BIZ || USER?.business_id || 'biz_blink_001';
    const qs = new URLSearchParams({
        business_id: bizId,
        search: f.q,
        from_date: f.from,
        to_date: f.to
    });

    const d = await api(`/api/clinic/eye-tests?${qs.toString()}`);
    const rows = (d.data || []).map(t => `
        <tr class="hover-row">
            <td style="padding-left:24px">
                <div style="font-weight:700; color:var(--primary); font-size:0.95rem">${t.customer_name || 'Walk-in'}</div>
                <div style="font-size:0.75rem; color:var(--muted)"><i class="far fa-calendar-alt"></i> ${fmtDate(t.test_date)}</div>
            </td>
            <td>
                <div style="font-weight:600; font-size:0.85rem">Dr. ${t.doctor_name || 'General Optom'}</div>
                <div style="font-size:0.75rem; color:var(--muted)">Clinic Verified</div>
            </td>
            <td>
                <div style="display:flex; flex-direction:column; gap:2px; font-size:0.8rem">
                    <span><small style="color:var(--muted)">SPH:</small> <b>${t.right_sph || '—'}</b></span>
                    <span><small style="color:var(--muted)">CYL:</small> <b>${t.right_cyl || '—'}</b></span>
                </div>
            </td>
            <td>
                <div style="display:flex; flex-direction:column; gap:2px; font-size:0.8rem">
                    <span><small style="color:var(--muted)">SPH:</small> <b>${t.left_sph || '—'}</b></span>
                    <span><small style="color:var(--muted)">CYL:</small> <b>${t.left_cyl || '—'}</b></span>
                </div>
            </td>
            <td>
                <div style="font-size:0.8rem"><b>PD: ${t.pd || '—'} mm</b></div>
                <div style="font-size:0.75rem; color:var(--muted); max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">${t.notes || 'No remarks'}</div>
            </td>
            <td style="text-align:right; padding-right:24px">
                <div style="display:flex; gap:8px; justify-content:flex-end">
                    <button class="btn-icon" style="background:rgba(99,102,241,0.1); color:var(--primary)" onclick="printPrescription('${t.test_id}')" title="Print Prescription"><i class="fas fa-print"></i></button>
                    <button class="btn-icon" style="background:rgba(0,0,0,0.05); color:var(--muted)" onclick="viewEyeTestDetails('${t.test_id}')" title="View Full Analysis"><i class="fas fa-eye"></i></button>
                </div>
            </td>
        </tr>
    `).join('');

    document.getElementById('etBody').innerHTML = rows || `<tr><td colspan="6" style="text-align:center; padding:80px; color:var(--muted)">No clinical records found.</td></tr>`;
}

window.updateEtFilters = function() {
    window.etFilters = {
        q: document.getElementById('et-q').value,
        from: document.getElementById('et-from').value,
        to: document.getElementById('et-to').value
    };
    renderEyeTestsList();
};

window.openAddEyeTest = function() {
    openModal('New Eye Examination & Prescription', `
        <form onsubmit="submitEyeTest(event)" style="padding:10px">
            <div style="background:rgba(99,102,241,0.03); padding:20px; border-radius:12px; margin-bottom:24px; border:1px solid var(--border)">
                <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:20px">
                    <div class="form-row" style="margin-bottom:0">
                        <label>Patient (Search by Name or Mobile)</label>
                        <div style="position:relative">
                            <input id="et-cust-search" placeholder="Search customer..." oninput="searchEtCustomer(this.value)" autocomplete="off" required>
                            <div id="et-cust-results" class="glass" style="position:absolute; width:100%; border:1px solid var(--border); border-top:none; z-index:100; display:none; max-height:200px; overflow-y:auto; border-radius:0 0 10px 10px; box-shadow:0 10px 20px rgba(0,0,0,0.1)"></div>
                        </div>
                        <input type="hidden" id="et-cid" required>
                    </div>
                    <div class="form-row" style="margin-bottom:0"><label>Attending Doctor</label>
                        <input id="et-doc" placeholder="e.g. Dr. Verma">
                    </div>
                </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:30px; margin-bottom:20px">
                <!-- Right Eye (OD) -->
                <div>
                    <div style="padding:8px 12px; background:rgba(30,58,138,0.1); color:var(--primary); font-weight:700; border-radius:8px; margin-bottom:15px; display:inline-block">RIGHT EYE (OD)</div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
                        <div class="form-row"><label>SPH</label><input id="et-rsph" placeholder="0.00"></div>
                        <div class="form-row"><label>CYL</label><input id="et-rcyl" placeholder="0.00"></div>
                        <div class="form-row"><label>AXIS</label><input id="et-raxis" placeholder="0"></div>
                        <div class="form-row"><label>ADD</label><input id="et-radd" placeholder="0.00"></div>
                    </div>
                </div>
                <!-- Left Eye (OS) -->
                <div>
                    <div style="padding:8px 12px; background:rgba(185,28,28,0.1); color:var(--danger); font-weight:700; border-radius:8px; margin-bottom:15px; display:inline-block">LEFT EYE (OS)</div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
                        <div class="form-row"><label>SPH</label><input id="et-lsph" placeholder="0.00"></div>
                        <div class="form-row"><label>CYL</label><input id="et-lcyl" placeholder="0.00"></div>
                        <div class="form-row"><label>AXIS</label><input id="et-laxis" placeholder="0"></div>
                        <div class="form-row"><label>ADD</label><input id="et-ladd" placeholder="0.00"></div>
                    </div>
                </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 2fr; gap:20px">
                <div class="form-row"><label>Pupillary Distance (PD)</label><input id="et-pd" placeholder="63 mm"></div>
                <div class="form-row"><label>Clinical Remarks / Instructions</label><input id="et-notes" placeholder="e.g. Advised progressives"></div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:24px; border-top:1px solid var(--border); padding-top:20px">
                <button class="btn btn-outline" type="button" onclick="closeModal()">Discard</button>
                <button class="btn btn-primary" type="submit" style="padding:10px 40px"><i class="fas fa-save"></i> Save & Authorize</button>
            </div>
        </form>
    `, 'lg');
};

window.searchEtCustomer = async function(q) {
    if (q.length < 3) return document.getElementById('et-cust-results').style.display='none';
    const bizId = window.BIZ || USER?.business_id || 'biz_blink_001';
    const r = await api(`/api/customers?business_id=${bizId}&search=${q}&limit=5`);
    const results = document.getElementById('et-cust-results');
    results.innerHTML = (r.data || []).map(c => `
        <div onclick="selectEtCustomer('${c.customer_id}', '${c.name}', '${c.mobile}')" style="padding:12px 15px; border-bottom:1px solid rgba(0,0,0,0.05); cursor:pointer">
            <div style="font-weight:700; font-size:0.95rem">${c.name}</div>
            <div style="font-size:0.75rem; color:var(--muted)">Mobile: ${c.mobile}</div>
        </div>
    `).join('') || '<div style="padding:15px; color:var(--muted)">No patient found</div>';
    results.style.display = 'block';
};

window.selectEtCustomer = function(id, name, mobile) {
    document.getElementById('et-cid').value = id;
    document.getElementById('et-cust-search').value = `${name} (${mobile})`;
    document.getElementById('et-cust-results').style.display = 'none';
};

window.submitEyeTest = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    
    const bizId = window.BIZ || USER?.business_id || 'biz_blink_001';
    const g = id => document.getElementById(id).value;
    
    const r = await api('/api/clinic/eye-tests', {
        method: 'POST',
        body: JSON.stringify({
            business_id: bizId,
            customer_id: g('et-cid'),
            doctor_name: g('et-doc'),
            right_sph: g('et-rsph'),
            right_cyl: g('et-rcyl'),
            right_axis: g('et-raxis'),
            right_add: g('et-radd'),
            left_sph: g('et-lsph'),
            left_cyl: g('et-lcyl'),
            left_axis: g('et-laxis'),
            left_add: g('et-ladd'),
            pd: g('et-pd'),
            notes: g('et-notes')
        })
    });

    if (r.success) {
        closeModal();
        toast('Prescription saved successfully!', 'success');
        load_eyetests();
    } else {
        toast(r.error, 'error');
        btn.disabled = false;
    }
};

/* ── REPAIRS ── */
window.load_repairs = function() {
    const el = document.getElementById('view-repairs');
    const bizId = window.BIZ || USER?.business_id || 'biz_blink_001';
    
    el.innerHTML = `
        <div class="module-header glass" style="margin-bottom:24px">
            <div>
                <h1 style="margin:0; font-size:1.8rem; letter-spacing:-0.5px">Support & Repairs</h1>
                <p style="margin:4px 0 0; color:var(--muted); font-size:0.9rem">Manage service tickets and frame maintenance</p>
            </div>
            <div style="display:flex; gap:12px">
                <button class="btn btn-outline" onclick="load_repairs()" title="Refresh Dashboard"><i class="fas fa-sync-alt"></i></button>
                <button class="btn btn-primary" onclick="openAddRepair()"><i class="fas fa-tools"></i> New Repair Ticket</button>
            </div>
        </div>

        <div id="repKpis" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:20px; margin-bottom:24px">
            ${Array(3).fill('<div class="kpi-card skeleton" style="height:110px"></div>').join('')}
        </div>

        <div class="card glass no-padding" style="margin-bottom:24px">
            <div class="card-body" style="padding:16px; display:flex; gap:16px; align-items:center; background:rgba(0,0,0,0.02)">
                <div style="position:relative; flex:1">
                    <i class="fas fa-search" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--muted)"></i>
                    <input id="rep-q" class="filter-input" placeholder="Search by Ticket ID, Customer or Mobile..." style="width:100%; padding-left:40px; background:#fff">
                </div>
                <div style="display:flex; gap:12px">
                    <select id="rep-status-filter" class="filter-input" style="width:180px; background:#fff" onchange="updateRepFilters()">
                        <option value="">All Statuses</option>
                        <option value="Received">Received</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Ready">Ready for Pickup</option>
                        <option value="Delivered">Delivered</option>
                    </select>
                </div>
                <button class="btn btn-primary btn-sm" onclick="updateRepFilters()" style="padding:10px 20px"><i class="fas fa-filter"></i> Apply</button>
            </div>
        </div>

        <div class="card glass no-padding">
            <div class="table-responsive">
                <table class="modern-table">
                    <thead>
                        <tr>
                            <th style="padding-left:24px">Ticket & Customer</th>
                            <th>Issue / Type</th>
                            <th>Cost</th>
                            <th>Assigned To</th>
                            <th>Status</th>
                            <th style="text-align:right; padding-right:24px">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="repBody">${skelRows(8)}</tbody>
                </table>
            </div>
        </div>
    `;

    window.repFilters = { q: '', status: '' };
    
    setTimeout(async () => {
        try {
            const kpir = await api(`/api/clinic/repairs/kpis?business_id=${bizId}`);
            if (kpir.success) updateRepKpis(kpir.data);
            await renderRepairsList();
        } catch (e) {
            console.error('Repair Load Error:', e);
            toast(`Failed to sync repair tickets: ${e.message}`, 'error');
        }
    }, 10);
};

function updateRepKpis(kpi) {
    document.getElementById('repKpis').innerHTML = `
        <div class="kpi-card glass animate-in">
            <div class="kpi-info">
                <div class="kpi-label">PENDING REPAIRS</div>
                <div class="kpi-value text-primary">${kpi.pending || 0}</div>
                <div style="font-size:0.75rem; color:var(--muted); margin-top:4px">Tickets currently in workshop</div>
            </div>
            <div class="kpi-icon"><i class="fas fa-wrench"></i></div>
        </div>
        <div class="kpi-card glass animate-in">
            <div class="kpi-info">
                <div class="kpi-label">READY FOR PICKUP</div>
                <div class="kpi-value text-accent">${kpi.readyForPickup || 0}</div>
                <div style="font-size:0.75rem; color:var(--muted); margin-top:4px">Customers awaiting collection</div>
            </div>
            <div class="kpi-icon"><i class="fas fa-box-open"></i></div>
        </div>
        <div class="kpi-card glass animate-in">
            <div class="kpi-info">
                <div class="kpi-label">30D REVENUE</div>
                <div class="kpi-value text-green">${fmt(kpi.revenue30d)}</div>
                <div style="font-size:0.75rem; color:var(--muted); margin-top:4px">Health checks last 30 days</div>
            </div>
            <div class="kpi-icon"><i class="fas fa-hand-holding-usd"></i></div>
        </div>
    `;
}

async function renderRepairsList() {
    const f = window.repFilters;
    const bizId = window.BIZ || USER?.business_id || 'biz_blink_001';
    const qs = new URLSearchParams({
        business_id: bizId,
        search: f.q,
        status: f.status
    });

    const d = await api(`/api/clinic/repairs?${qs.toString()}`);
    const rows = (d.data || []).map(r => `
        <tr class="hover-row">
            <td style="padding-left:24px">
                <div style="font-weight:700; color:var(--primary); font-size:0.95rem">${r.customer_name || 'Walk-in'}</div>
                <div style="font-size:0.75rem; color:var(--muted); font-family:monospace; margin-top:2px">ID: ${r.repair_id}</div>
            </td>
            <td>
                <div style="font-weight:600; font-size:0.85rem">${r.issue}</div>
                <div style="font-size:0.75rem; color:var(--muted)">${r.repair_type}</div>
            </td>
            <td>
                <div style="font-weight:700; color:var(--green)">${fmt(r.cost)}</div>
            </td>
            <td>
                <div style="font-size:0.85rem">${r.assigned_staff || 'Workshop'}</div>
                <div style="font-size:0.75rem; color:var(--muted)">${fmtDate(r.created_at)}</div>
            </td>
            <td>${badge(r.status)}</td>
            <td style="text-align:right; padding-right:24px">
                <div style="display:flex; gap:8px; justify-content:flex-end">
                    <button class="btn-icon" style="background:rgba(99,102,241,0.1); color:var(--primary)" onclick="updateRepairStatusFlow('${r.repair_id}', '${r.status}')" title="Update Status"><i class="fas fa-stream"></i></button>
                    <button class="btn-icon" style="background:rgba(0,0,0,0.05); color:var(--muted)" onclick="printRepairTicket('${r.repair_id}')" title="Print Job Card"><i class="fas fa-print"></i></button>
                </div>
            </td>
        </tr>
    `).join('');

    document.getElementById('repBody').innerHTML = rows || `
        <tr><td colspan="6" style="text-align:center; padding:48px; color:var(--muted)">
            <i class="fas fa-tools" style="font-size:2.5rem; margin-bottom:12px; display:block; opacity:0.2"></i>
            No repair tickets found matching your filters.
        </td></tr>
    `;
}

window.updateRepFilters = function() {
    window.repFilters = {
        q: document.getElementById('rep-q').value,
        status: document.getElementById('rep-status-filter').value
    };
    renderRepairsList();
};

window.openAddRepair = function() {
    openModal('New Repair Ticket', `
        <form onsubmit="submitRepairTicket(event)" id="repairForm">
            <div class="card glass no-padding" style="margin-bottom:20px">
                <div class="card-body" style="padding:20px; background:rgba(0,0,0,0.02)">
                    <div style="position:relative">
                        <label style="font-size:0.8rem; color:var(--muted); display:block; margin-bottom:6px">SEARCH CUSTOMER (NAME/MOBILE)</label>
                        <input id="rep-cust-search" class="filter-input" placeholder="Start typing customer details..." style="width:100%" oninput="searchRepCustomer(this.value)">
                        <input type="hidden" id="rep-cid" required>
                        <div id="rep-cust-results" class="glass shadow" style="display:none; position:absolute; top:100%; left:0; width:100%; z-index:100; max-height:200px; overflow-y:auto; border:1px solid var(--border)"></div>
                    </div>
                </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px">
                <div class="form-row">
                    <label>Repair Type</label>
                    <select id="rep-type" required style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border)">
                        <option>Lens Replacement</option>
                        <option>Frame Alignment / Adjustment</option>
                        <option>Nose Pad Replacement</option>
                        <option>Screw / Hinge Repair</option>
                        <option>Temple Soldering</option>
                        <option>Ultrasonic Cleaning</option>
                        <option>Other / Complex Repair</option>
                    </select>
                </div>
                <div class="form-row">
                    <label>Estimated Cost (₹)</label>
                    <input type="number" id="rep-cost" placeholder="0.00" required step="0.01">
                </div>
            </div>

            <div class="form-row" style="margin-bottom:24px">
                <label>Issue Description / Notes</label>
                <textarea id="rep-issue" placeholder="Describe the problem or damage..." rows="3" required style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border)"></textarea>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:12px; border-top:1px solid var(--border); padding-top:20px">
                <button class="btn btn-outline" type="button" onclick="closeModal()">Discard</button>
                <button class="btn btn-primary" type="submit" style="padding:10px 40px"><i class="fas fa-check"></i> Accept Repair Job</button>
            </div>
        </form>
    `, 'md');
};

window.searchRepCustomer = async function(q) {
    if (q.length < 3) return document.getElementById('rep-cust-results').style.display = 'none';
    const bizId = window.BIZ || USER?.business_id || 'biz_blink_001';
    const r = await api(`/api/customers?business_id=${bizId}&search=${q}&limit=5`);
    const results = document.getElementById('rep-cust-results');
    results.innerHTML = (r.data || []).map(c => `
        <div onclick="selectRepCustomer('${c.customer_id}', '${c.name}', '${c.mobile}')" style="padding:12px 15px; border-bottom:1px solid rgba(0,0,0,0.05); cursor:pointer">
            <div style="font-weight:700; font-size:0.95rem">${c.name}</div>
            <div style="font-size:0.75rem; color:var(--muted)">Mobile: ${c.mobile}</div>
        </div>
    `).join('') || '<div style="padding:15px; color:var(--muted)">No customer found</div>';
    results.style.display = 'block';
};

window.selectRepCustomer = function(id, name, mobile) {
    document.getElementById('rep-cid').value = id;
    document.getElementById('rep-cust-search').value = `${name} (${mobile})`;
    document.getElementById('rep-cust-results').style.display = 'none';
};

window.submitRepairTicket = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    
    const bizId = window.BIZ || USER?.business_id || 'biz_blink_001';
    const g = id => document.getElementById(id).value;
    
    const r = await api('/api/clinic/repairs', {
        method: 'POST',
        body: JSON.stringify({
            business_id: bizId,
            customer_id: g('rep-cid'),
            issue: g('rep-issue'),
            repair_type: g('rep-type'),
            cost: g('rep-cost')
        })
    });

    if (r.success) {
        closeModal();
        toast('Repair ticket generated successfully!', 'success');
        load_repairs();
    } else {
        toast(r.error, 'error');
        btn.disabled = false;
    }
};

window.updateRepairStatusFlow = function(id, currentStatus) {
    const statuses = ['Received', 'In Progress', 'Ready', 'Delivered'];
    openModal('Update Pipeline', `
        <div style="padding:10px">
            <p style="color:var(--muted); font-size:0.9rem; margin-bottom:20px">Current Status: ${badge(currentStatus)}</p>
            <div style="display:grid; gap:12px">
                ${statuses.map(s => `
                    <button class="btn ${s === currentStatus ? 'btn-primary' : 'btn-outline'}" 
                            style="justify-content:flex-start; height:50px; font-weight:600" 
                            onclick="submitRepStatusChange('${id}', '${s}')">
                        <i class="fas ${s === 'Delivered' ? 'fa-check-double' : 'fa-arrow-right'}" style="margin-right:12px; opacity:0.5"></i>
                        Move to ${s}
                    </button>
                `).join('')}
            </div>
        </div>
    `, 'sm');
};

window.submitRepStatusChange = async function(id, status) {
    const r = await api(`/api/clinic/repairs/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
    });
    if (r.success) {
        closeModal();
        toast(`Ticket marked as ${status}`, 'success');
        load_repairs();
    } else toast(r.error, 'error');
};

window.printRepairTicket = function(id) {
    toast('Generating job card PDF...', 'info');
    setTimeout(() => toast('Job card sent to printer!', 'success'), 1000);
};

/* ── OFFERS ── */
/* ── OFFERS & PROMOTIONS (MARKETING ENGINE) ── */

window.load_offers = async function() {
    const el = document.getElementById('view-offers');
    if (!el) return;

    el.innerHTML = `
    <div class="module-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px">
        <div>
            <h2 style="margin:0; font-weight:800; letter-spacing:-0.5px">Active Offers</h2>
            <p style="color:var(--muted); font-size:0.85rem">Strategic promotions and tactical discount management</p>
        </div>
        <div class="module-actions" style="display:flex; gap:12px">
            <button class="btn btn-outline" onclick="load_offers()"><i class="fas fa-sync"></i> Refresh</button>
            <button class="btn btn-primary" onclick="openAddOffer()"><i class="fas fa-plus"></i> Create Offer</button>
        </div>
    </div>

    <div id="offers-kpis" class="kpi-grid" style="grid-template-columns: repeat(4, 1fr); gap:20px; margin-bottom:24px">
        <div class="kpi-card glass">${skelRows(2)}</div>
        <div class="kpi-card glass">${skelRows(2)}</div>
        <div class="kpi-card glass">${skelRows(2)}</div>
        <div class="kpi-card glass">${skelRows(2)}</div>
    </div>

    <div class="card glass" style="margin-bottom:24px; padding:16px; display:flex; gap:16px; align-items:center">
        <div style="flex:1; position:relative">
            <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--muted)"></i>
            <input type="text" id="off-search" class="filter-input" placeholder="Search offers by name..." style="width:100%; padding-left:36px" oninput="_debounce(renderOffersList, 300)()">
        </div>
        <select id="off-status-filter" class="filter-input" style="width:180px" onchange="renderOffersList()">
            <option value="">All Status</option>
            <option value="active">Active Now</option>
            <option value="expired">Expired</option>
            <option value="inactive">Manually Paused</option>
        </select>
        <select id="off-type-filter" class="filter-input" style="width:180px" onchange="renderOffersList()">
            <option value="">All Types</option>
            <option value="Percentage discount">Percentage %</option>
            <option value="Flat discount">Flat ₹</option>
        </select>

    </div>

    <div class="card no-padding">
        <div class="table-container">
            <table class="modern-table">
                <thead>
                    <tr>
                        <th style="padding-left:24px">Offer Details</th>
                        <th>Type</th>
                        <th>Value</th>
                        <th>Validity Period</th>
                        <th>Target Scope</th>
                        <th>Status</th>
                        <th style="text-align:right; padding-right:24px">Control</th>
                    </tr>
                </thead>
                <tbody id="offers-table-body">
                    ${skelRows(5, 7)}
                </tbody>
            </table>
        </div>
    </div>
    `;

    renderOffersKPIs();
    renderOffersList();
};

async function renderOffersKPIs() {
    const r = await api('/api/marketing/offers-stats');
    const container = document.getElementById('offers-kpis');
    if (!r.success || !container) return;

    const d = r.data;
    container.innerHTML = `
        <div class="kpi-card glass">
            <div class="kpi-label">Active Promotions</div>
            <div class="kpi-value">${d.activeOffers || 0}</div>
            <div class="kpi-trend text-green"><i class="fas fa-check-circle"></i> Live Now</div>
        </div>
        <div class="kpi-card glass">
            <div class="kpi-label">Total Created</div>
            <div class="kpi-value" style="color:var(--accent)">${d.totalOffers || 0}</div>
            <div class="kpi-trend"><i class="fas fa-folder-open"></i> Full Registry</div>
        </div>
        <div class="kpi-card glass">
            <div class="kpi-label">Expired Offers</div>
            <div class="kpi-value" style="color:var(--danger)">${d.expiredOffers || 0}</div>
            <div class="kpi-trend text-red"><i class="fas fa-clock"></i> Past Term</div>
        </div>
        <div class="kpi-card glass">
            <div class="kpi-label">Success Rate</div>
            <div class="kpi-value" style="color:var(--secondary)">84%</div>
            <div class="kpi-trend text-green"><i class="fas fa-chart-line"></i> Efficiency High</div>
        </div>
    `;
}

window.renderOffersList = async function() {
    const search = document.getElementById('off-search')?.value || '';
    const status = document.getElementById('off-status-filter')?.value || '';
    const type = document.getElementById('off-type-filter')?.value || '';
    
    const r = await api(`/api/marketing/offers?search=${search}&status=${status}&type=${type}`);
    const body = document.getElementById('offers-table-body');
    if (!r.success || !body) return;

    body.innerHTML = r.data.map(o => {
        const isExpired = new Date(o.end_date) < new Date();
        const isActive = o.active_status && !isExpired;
        
        return `
        <tr class="${!o.active_status ? 'opacity-50' : ''}">
            <td style="padding-left:24px">
                <div style="font-weight:700; color:var(--primary)">${o.offer_name}</div>
                <div style="font-size:0.75rem; color:var(--muted)">ID: ${o.offer_id}</div>
            </td>
            <td>
                <span class="badge ${o.offer_type === 'Percentage discount' ? 'badge-blue' : 'badge-gray'}" style="font-size:0.65rem">
                    ${o.offer_type.toUpperCase()}
                </span>
            </td>
            <td>
                <div style="font-size:1rem; font-weight:800; color:var(--accent)">
                    ${o.offer_type === 'Percentage discount' ? o.discount_value + '%' : fmt(o.discount_value)}
                </div>
            </td>
            <td>
                <div style="font-size:0.85rem">${fmtDate(o.start_date)} – ${fmtDate(o.end_date)}</div>
                <div style="font-size:0.7rem; color:${isExpired ? 'var(--danger)' : 'var(--muted)'}">
                    ${isExpired ? 'Promotion Ended' : 'Ongoing'}
                </div>
            </td>
            <td>
                <div style="font-size:0.85rem; font-weight:600; color:var(--primary)">${o.apply_on}</div>
                ${(o.apply_target && o.apply_target.toLowerCase() !== 'all') 
                    ? `<div style="font-size:0.75rem; color:var(--muted); margin-top:2px">${o.apply_target}</div>` 
                    : `<div style="font-size:0.75rem; color:var(--muted); font-style:italic">All ${o.apply_on}s</div>`}
                <div style="font-size:0.65rem; color:var(--accent); margin-top:6px; display:flex; align-items:center; gap:4px; opacity:0.8">
                    <i class="fas ${o.channel_scope === 'Ecommerce' ? 'fa-globe' : o.channel_scope === 'Showrooms' ? 'fa-store' : 'fa-network-wired'}" style="font-size:0.6rem"></i> 
                    <span style="text-transform:uppercase; letter-spacing:0.5px">${(!o.channel_scope || o.channel_scope === 'All') ? 'Omnichannel' : o.channel_scope}</span>
                </div>
            </td>
            <td>
                <span class="badge ${isActive ? 'badge-green' : isExpired ? 'badge-red' : 'badge-gray'}" style="padding:4px 12px; font-weight:700">
                    ${isActive ? 'LIVE' : isExpired ? 'EXPIRED' : 'PAUSED'}
                </span>
            </td>
            <td style="text-align:right; padding-right:24px">
                <div style="display:flex; gap:8px; justify-content:flex-end">
                    <button class="btn-icon" style="background:${o.active_status ? 'var(--accent-dim)' : 'rgba(0,0,0,0.05)'}; color:${o.active_status ? 'var(--accent)' : 'var(--muted)'}" 
                            onclick="toggleOfferStatus('${o.offer_id}')" title="${o.active_status ? 'Pause Offer' : 'Resume Offer'}">
                        <i class="fas ${o.active_status ? 'fa-pause' : 'fa-play'}"></i>
                    </button>
                    <button class="btn-icon" style="background:rgba(0,0,0,0.05)" onclick="openEditOffer('${o.offer_id}')" title="Edit Offer">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" style="background:rgba(239,68,68,0.1); color:var(--danger)" onclick="deleteOffer('${o.offer_id}')" title="Delete Offer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('') || `<tr><td colspan="7" style="text-align:center; padding:48px; color:var(--muted)">No offers found matching your criteria.</td></tr>`;
};

window.openAddOffer = function() {
    openModal('Engineering New Offer', `
        <form onsubmit="submitOffer(event)" id="offerForm">
            <div class="form-row" style="margin-bottom:20px">
                <label>Offer Campaign Name *</label>
                <input id="o-name" placeholder="e.g. Summer Festival 20% Off" required style="font-size:1.1rem; font-weight:600">
            </div>

            <div class="form-grid-2" style="margin-bottom:20px">
                <div class="form-row">
                    <label>Incentive Type</label>
                    <select id="o-type">
                        <option value="Percentage discount">Percentage Discount (%)</option>
                        <option value="Flat discount">Flat Cash Discount (₹)</option>
                    </select>
                </div>

                <div class="form-row">
                    <label>Discount Value *</label>
                    <input id="o-val" type="number" placeholder="0" required>
                </div>
            </div>

            <div class="form-row" style="margin-bottom:20px">
                <label>Application Scope</label>
                <select id="o-on" onchange="refreshOfferScopeUI(this.value)">
                    <option value="Full cart">Entire Cart Value</option>
                    <option value="Product">Specific Products Only</option>
                    <option value="Category">Specific Categories</option>
                    <option value="Brand">Specific Brands</option>
                    <option value="BOGO">Buy One Get One (BOGO)</option>
                    <option value="Second pair discount">Second Pair Discount</option>
                </select>
            </div>

            <div id="scope-targets-wrap" style="margin-bottom:20px; display:none; background:var(--bg-sec); padding:15px; border-radius:12px; border:1px solid var(--border);">
                <!-- Dynamic Content Here -->
            </div>


            <div class="form-row" style="margin-bottom:20px">
                <label>Availability Channel</label>
                <select id="o-channel" onchange="refreshShowroomSelection(this.value, 'o-sh-wrap')">
                    <option value="All">All (Omnichannel)</option>
                    <option value="Ecommerce">Ecommerce Only</option>
                    <option value="Showrooms">Specific Showrooms</option>
                </select>
            </div>

            <div id="o-sh-wrap" style="margin-bottom:20px; display:none; background:var(--bg-sec); padding:15px; border-radius:12px; border:1px solid var(--border);">
                <!-- Showroom selection here -->
            </div>

            <div class="form-grid-2" style="margin-bottom:24px">
                <div class="form-row">
                    <label>Valid From</label>
                    <input id="o-start" type="date" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-row">
                    <label>Valid Until</label>
                    <input id="o-end" type="date" required>
                </div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:12px; border-top:1px solid var(--border); padding-top:20px">
                <button class="btn btn-outline" type="button" onclick="closeModal()">Discard</button>
                <button class="btn btn-primary" type="submit" id="off-save-btn" style="padding:10px 30px"><i class="fas fa-check"></i> Register Offer</button>
            </div>
        </form>
    `, 'md');
};

window.submitOffer = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('off-save-btn');
    btn.disabled = true;

    const applyOn = document.getElementById('o-on').value;
    let target = '';
    
    if(['Product','Category','Brand'].includes(applyOn)) {
        target = document.getElementById('o-target')?.value || '';
    }

    const r = await api('/api/marketing/offers', {
        method: 'POST',
        body: JSON.stringify({
            offer_name: document.getElementById('o-name').value,
            offer_type: document.getElementById('o-type').value,
            discount_value: document.getElementById('o-val').value,
            apply_on: applyOn,
            apply_target: target,
            channel_scope: document.getElementById('o-channel').value,
            showroom_targets: Array.from(document.querySelectorAll('.o-sh-check:checked')).map(c => c.value),
            start_date: document.getElementById('o-start').value,
            end_date: document.getElementById('o-end').value
        })
    });

    if (r.success) {
        toast('New offer deployment successful!', 'success');
        closeModal();
        load_offers();
    } else {
        toast(r.error, 'error');
        btn.disabled = false;
    }
};

window.openEditOffer = async function(offerId) {
    try {
        const r = await api(`/api/marketing/offers/${offerId}`);
        if (!r.success) return toast(r.error, 'error');
        
        const o = r.data;
        // Fix: Ensure dates are strings for split and safely handle if they come as Date objects
        const startDate = o.start_date ? new Date(o.start_date).toISOString().split('T')[0] : '';
        const endDate = o.end_date ? new Date(o.end_date).toISOString().split('T')[0] : '';
        
        // Fix: Ensure showroom_targets is an array for join()
        const stArr = Array.isArray(o.showroom_targets) ? o.showroom_targets : [];

        openModal('Refining Offer Architecture', `
            <form onsubmit="updateOffer(event, '${offerId}')" id="offerEditForm">
                <div class="form-row" style="margin-bottom:20px">
                    <label>Offer Campaign Name *</label>
                    <input id="eo-name" value="${o.offer_name}" required style="font-size:1.1rem; font-weight:600">
                </div>

                <div class="form-grid-2" style="margin-bottom:20px">
                    <div class="form-row">
                        <label>Incentive Type</label>
                        <select id="eo-type">
                            <option value="Percentage discount" ${o.offer_type === 'Percentage discount' ? 'selected':''}>Percentage Discount (%)</option>
                            <option value="Flat discount" ${o.offer_type === 'Flat discount' ? 'selected':''}>Flat Cash Discount (₹)</option>
                        </select>
                    </div>

                    <div class="form-row">
                        <label>Discount Value *</label>
                        <input id="eo-val" type="number" value="${o.discount_value}" required>
                    </div>
                </div>

                <div class="form-row" style="margin-bottom:20px">
                    <label>Application Scope</label>
                    <select id="eo-on" onchange="refreshOfferScopeUI(this.value, 'eo-target-wrap', 'eo-target')">
                        <option value="Full cart" ${o.apply_on === 'Full cart' ? 'selected':''}>Entire Cart Value</option>
                        <option value="Product" ${o.apply_on === 'Product' ? 'selected':''}>Specific Products Only</option>
                        <option value="Category" ${o.apply_on === 'Category' ? 'selected':''}>Specific Categories</option>
                        <option value="Brand" ${o.apply_on === 'Brand' ? 'selected':''}>Specific Brands</option>
                        <option value="BOGO" ${o.apply_on === 'BOGO' ? 'selected':''}>Buy One Get One (BOGO)</option>
                        <option value="Second pair discount" ${o.apply_on === 'Second pair discount' ? 'selected':''}>Second Pair Discount</option>
                    </select>
                </div>

                <div id="eo-target-wrap" style="margin-bottom:20px; display:none; background:var(--bg-sec); padding:15px; border-radius:12px; border:1px solid var(--border);">
                    <!-- Target selection populated via refreshOfferScopeUI -->
                </div>

                <div class="form-row" style="margin-bottom:20px">
                    <label>Availability Channel</label>
                    <select id="eo-channel" onchange="refreshShowroomSelection(this.value, 'eo-sh-wrap')">
                        <option value="All" ${o.channel_scope === 'All' ? 'selected' : ''}>All (Omnichannel)</option>
                        <option value="Ecommerce" ${o.channel_scope === 'Ecommerce' ? 'selected' : ''}>Ecommerce Only</option>
                        <option value="Showrooms" ${o.channel_scope === 'Showrooms' ? 'selected' : ''}>Specific Showrooms</option>
                    </select>
                </div>

                <div id="eo-sh-wrap" style="margin-bottom:20px; display:${o.channel_scope === 'Showrooms' ? 'block' : 'none'}; background:var(--bg-sec); padding:15px; border-radius:12px; border:1px solid var(--border);">
                    <p style="font-size:0.8rem; color:var(--muted)">Active Showrooms: <b>${stArr.join(', ') || 'Global'}</b>. Modify if needed.</p>
                </div>

                <div class="form-grid-2" style="margin-bottom:24px">
                    <div class="form-row">
                        <label>Valid From</label>
                        <input id="eo-start" type="date" value="${startDate}">
                    </div>
                    <div class="form-row">
                        <label>Valid Until</label>
                        <input id="eo-end" type="date" value="${endDate}" required>
                    </div>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:12px; border-top:1px solid var(--border); padding-top:20px">
                    <button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button>
                    <button class="btn btn-primary" type="submit" id="off-upd-btn" style="padding:10px 30px">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
            </form>
        `, 'md');

        if(['Product','Category','Brand'].includes(o.apply_on)) {
            refreshOfferScopeUI(o.apply_on, 'eo-target-wrap', 'eo-target', o.apply_target);
        }
        // Fix: Auto-load showroom targets list for editing
        if(o.channel_scope === 'Showrooms') {
            refreshShowroomSelection('Showrooms', 'eo-sh-wrap');
        }
    } catch(e) {
        console.error(e);
        toast('Failed to load offer details: ' + e.message, 'error');
    }
};

window.updateOffer = async function(e, offerId) {
    e.preventDefault();
    const btn = document.getElementById('off-upd-btn');
    btn.disabled = true;

    const applyOn = document.getElementById('eo-on').value;
    let target = document.getElementById('eo-target')?.value || '';

    const r = await api(`/api/marketing/offers/${offerId}`, {
        method: 'PUT',
        body: JSON.stringify({
            offer_name: document.getElementById('eo-name').value,
            offer_type: document.getElementById('eo-type').value,
            discount_value: document.getElementById('eo-val').value,
            apply_on: applyOn,
            apply_target: target,
            channel_scope: document.getElementById('eo-channel').value,
            showroom_targets: Array.from(document.querySelectorAll('.eo-sh-check:checked')).map(c => c.value),
            start_date: document.getElementById('eo-start').value,
            end_date: document.getElementById('eo-end').value
        })
    });

    if (r.success) {
        toast('Offer architecture updated successfully!', 'success');
        closeModal();
        load_offers();
    } else {
        toast(r.error, 'error');
        btn.disabled = false;
    }
};

window.deleteOffer = async function(offerId) {
    if (!confirm('Are you certain you want to decommission this offer? This action is irreversible.')) return;
    
    try {
        const r = await api(`/api/marketing/offers/${offerId}`, { method: 'DELETE' });
        if (r.success) {
            toast('Offer successfully decommissioned', 'success');
            load_offers();
        } else {
            toast(r.error || 'Failed to delete offer', 'error');
        }
    } catch(e) {
        toast('Network Error during decommissioning', 'error');
    }
};

window.refreshOfferScopeUI = async function(scope, containerId = 'scope-targets-wrap', selectId = 'o-target', initialValue = null) {
    const wrap = document.getElementById(containerId);
    if (!['Product', 'Category', 'Brand'].includes(scope)) {
        wrap.style.display = 'none';
        return;
    }

    wrap.style.display = 'block';
    wrap.innerHTML = `<div style="text-align:center; padding:10px;"><div class="spinner-sm"></div> Synchronizing ${scope} data...</div>`;

    try {
        let items = [];
        
        if (scope === 'Category') {
            const res = await api('/api/public/categories');
            items = res.data || [];
        } else if (scope === 'Brand') {
            const res = await api('/api/public/brands');
            items = res.data || [];
        } else if (scope === 'Product') {
            const res = await api('/api/public/catalog-public');
            items = (res.data || []).map(p => ({ id: p.id, name: `[${p.frame_code}] ${p.name}` }));
        }

        wrap.innerHTML = `
            <div class="form-row">
                <label style="font-size:0.8rem; color:var(--muted);">${scope} Selection</label>
                <select id="${selectId}" class="filter-input">
                    <option value="">-- Select One --</option>
                    ${items.map(it => {
                        const val = it.name || it.id;
                        // Fix: Case-insensitive check for selection match
                        const isSelected = initialValue && val && String(initialValue).toLowerCase() === String(val).toLowerCase();
                        return `<option value="${val}" ${isSelected ? 'selected' : ''}>${it.name || it.id}</option>`;
                    }).join('')}
                </select>
                <p style="margin:8px 0 0; font-size:0.75rem; color:var(--muted);">This offer will only apply to items matching this selection.</p>
            </div>
        `;
    } catch(e) {
        wrap.innerHTML = `<div style="color:var(--danger); font-size:0.85rem;">Failed to load data.</div>`;
    }
};

window.refreshShowroomSelection = async function(channel, containerId) {
    const wrap = document.getElementById(containerId);
    if (channel !== 'Showrooms') {
        wrap.style.display = 'none';
        return;
    }

    wrap.style.display = 'block';
    wrap.innerHTML = `<div style="text-align:center; padding:10px;"><div class="spinner-sm"></div> Accessing showroom registry...</div>`;

    try {
        const res = await api('/api/showrooms');
        const showrooms = res.data || [];
        
        const prefix = containerId.startsWith('eo') ? 'eo' : 'o';

        wrap.innerHTML = `
            <label style="font-size:0.8rem; color:var(--muted); margin-bottom:10px; display:block;">Target Showrooms</label>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                ${showrooms.map(s => `
                    <label style="display:flex; align-items:center; gap:8px; font-size:0.85rem; cursor:pointer;">
                        <input type="checkbox" class="${prefix}-sh-check" value="${s.showroom_name}">
                        ${s.showroom_name}
                    </label>
                `).join('')}
            </div>
            <p style="margin:12px 0 0; font-size:0.75rem; color:var(--muted); border-top:1px solid var(--border); padding-top:8px;">Selected showrooms will be able to apply this discount at POS.</p>
        `;
    } catch(e) {
        wrap.innerHTML = `<div style="color:var(--danger); font-size:0.85rem;">Failed to load showrooms.</div>`;
    }
};

window.toggleOfferStatus = async function(offerId) {
    const r = await api(`/api/marketing/offers/${offerId}/toggle`, { method: 'PATCH' });
    if (r.success) {
        toast('Offer status updated', 'success');
        renderOffersList();
        renderOffersKPIs();
    } else {
        toast(r.error, 'error');
    }
};

window.deleteOffer = async function(id) {
    if(!confirm('Permanently decommission this offer?')) return;
    const r = await api(`/api/marketing/offers/${id}`, { method: 'DELETE' });
    if(r.success) {
        toast('Offer decommissioned');
        load_offers();
    } else {
        toast(r.error, 'error');
    }
};



/* ── COUPONS MANAGEMENT ── */
window.load_coupons = async function() {
    const el = document.getElementById('view-coupons');
    if (!el) return;

    el.innerHTML = `
    <div class="module-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px">
        <div>
            <h2 style="margin:0; font-weight:800; letter-spacing:-0.5px">Voucher & Coupon Hub</h2>
            <p style="color:var(--muted); font-size:0.85rem">Generate and manage promotional discount codes</p>
        </div>
        <div class="module-actions" style="display:flex; gap:12px">
            <button class="btn btn-outline" onclick="load_coupons()"><i class="fas fa-sync"></i> Refresh</button>
            <button class="btn btn-primary" onclick="openAddCoupon()"><i class="fas fa-ticket-alt"></i> Create Coupon</button>
        </div>
    </div>

    <div class="kpi-grid" id="coupons-kpi" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:20px; margin-bottom:30px">
        <!-- KPIs Loading -->
        <div class="kpi-card glass">${skelRows(2)}</div>
        <div class="kpi-card glass">${skelRows(2)}</div>
        <div class="kpi-card glass">${skelRows(2)}</div>
    </div>

    <div class="card glass" style="padding:24px">
        <div class="filter-bar" style="display:flex; gap:15px; margin-bottom:20px; background:rgba(0,0,0,0.02); padding:15px; border-radius:12px">
            <div style="flex:1; position:relative">
                <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--muted)"></i>
                <input type="text" id="coupon-search" placeholder="Search coupon code..." class="filter-input" style="padding-left:35px" oninput="renderCouponsList()">
            </div>
            <select id="coupon-status" class="filter-input" style="max-width:200px" onchange="renderCouponsList()">
                <option value="">All Statuses</option>
                <option value="active">Active & Valid</option>
                <option value="expired">Expired</option>
                <option value="inactive">Manually Paused</option>
            </select>
        </div>

        <div class="table-responsive">
            <table class="erp-table">
                <thead>
                    <tr>
                        <th>Coupon Details</th>
                        <th>Type</th>
                        <th>Value</th>
                        <th>Usage</th>
                        <th>Expiry</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="coupons-list">
                    ${skelRows(7)}
                </tbody>
            </table>
        </div>
    </div>
    `;

    renderCouponsKPIs();
    renderCouponsList();
};

async function renderCouponsKPIs() {
    const r = await api('/api/marketing/coupons-stats');
    const container = document.getElementById('coupons-kpi');
    if(!container || !r.success) return;

    const k = r.data;
    container.innerHTML = `
        <div class="kpi-card glass">
            <label>Total Coupons</label>
            <div class="value">${k.totalCoupons}</div>
        </div>
        <div class="kpi-card glass">
            <label>Active & Valid</label>
            <div class="value" style="color:var(--accent)">${k.activeCoupons}</div>
        </div>
        <div class="kpi-card glass">
            <label>Expired</label>
            <div class="value" style="color:var(--muted)">${k.expiredCoupons}</div>
        </div>
    `;
}

async function renderCouponsList() {
    const search = document.getElementById('coupon-search')?.value || '';
    const status = document.getElementById('coupon-status')?.value || '';
    const body = document.getElementById('coupons-list');
    if(!body) return;

    const r = await api(`/api/marketing/coupons?search=${search}&status=${status}`);
    if(!r.success) return body.innerHTML = `<tr><td colspan="7" class="text-center">Error loading coupons</td></tr>`;

    body.innerHTML = r.data.map(c => {
        const isExpired = new Date(c.expiry_date) < new Date();
        const usageLimit = c.usage_limit || '∞';
        
        return `
        <tr>
            <td>
                <div style="font-family:monospace; font-weight:800; font-size:1.1rem; color:var(--primary)">${c.code}</div>
                <div style="font-size:0.75rem; color:var(--muted)">Created: ${fmtDate(c.created_at)}</div>
            </td>
            <td><span class="badge badge-gray">${c.coupon_type}</span></td>
            <td>
                <div style="font-weight:700">
                    ${c.discount_type === 'Percentage' ? c.discount_value + '%' : fmt(c.discount_value)}
                </div>
                <div style="font-size:0.75rem; color:var(--muted)">Min Order: ${fmt(c.min_order_value)}</div>
            </td>
            <td>
                <div style="font-weight:600">${c.used_count} / ${usageLimit}</div>
                <div class="progress-lite" style="width:100%; height:4px; background:var(--border); border-radius:2px; margin-top:4px">
                    <div style="width:${c.usage_limit ? (c.used_count/c.usage_limit*100) : 0}%; height:100%; background:var(--accent); border-radius:2px"></div>
                </div>
            </td>
            <td style="color:${isExpired ? 'var(--red)' : 'inherit'}">
                ${fmtDate(c.expiry_date)}
                ${isExpired ? '<div style="font-size:0.65rem; font-weight:700">EXPIRED</div>' : ''}
            </td>
            <td>${badge(c.active_status && !isExpired)}</td>
            <td>
                <div style="display:flex; gap:8px">
                    <button class="btn-icon" style="background:${c.active_status ? 'var(--accent-dim)' : 'rgba(0,0,0,0.05)'}; color:${c.active_status ? 'var(--accent)' : 'var(--muted)'}" 
                            onclick="toggleCouponStatus('${c.code}')" title="Toggle Status">
                        <i class="fas fa-power-off"></i>
                    </button>
                    <button class="btn-icon" style="background:rgba(59, 130, 246, 0.1); color:#3b82f6" 
                            onclick="openEditCoupon('${c.code}')" title="Edit Properties">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" style="background:rgba(239, 68, 68, 0.1); color:#ef4444" 
                            onclick="deleteCoupon('${c.code}')" title="Delete Permanent">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('') || `<tr><td colspan="7" style="text-align:center; padding:48px; color:var(--muted)">No coupons found.</td></tr>`;
}

window.openAddCoupon = function() {
    openModal('Architecting New Promo Code', `
        <form onsubmit="submitCoupon(event)" id="couponForm">
            <div class="form-row" style="margin-bottom:20px">
                <label>Coupon Code *</label>
                <div style="position:relative">
                    <input id="c-code" placeholder="E.g. WELCOME10" required maxlength="20" style="font-family:monospace; font-weight:800; text-transform:uppercase; font-size:1.2rem; padding-right:50px">
                    <i class="fas fa-magic" style="position:absolute; right:15px; top:50%; transform:translateY(-50%); color:var(--accent); cursor:pointer" onclick="document.getElementById('c-code').value='BLINK'+Math.random().toString(36).substring(2,7).toUpperCase()" title="Generate Random"></i>
                </div>
            </div>

            <div class="form-grid-2" style="margin-bottom:20px">
                <div class="form-row">
                    <label>Discount Type</label>
                    <select id="c-dtype">
                        <option value="Percentage">Percentage (%)</option>
                        <option value="Flat">Flat Discount (₹)</option>
                    </select>
                </div>
                <div class="form-row">
                    <label>Discount Value *</label>
                    <input id="c-dval" type="number" placeholder="Value" required>
                </div>
            </div>

            <div class="form-grid-2" style="margin-bottom:20px">
                <div class="form-row">
                    <label>Minimum Order (₹)</label>
                    <input id="c-min" type="number" value="0">
                </div>
                <div class="form-row">
                    <label>Usage Limit (Max Uses)</label>
                    <input id="c-limit" type="number" placeholder="Infinity if empty">
                </div>
            </div>

            <div class="form-grid-2" style="margin-bottom:24px">
                <div class="form-row">
                    <label>Category / Type</label>
                    <select id="c-type">
                        <option value="Festival coupon">Festival / Seasonal</option>
                        <option value="Welcome coupon">New User Welcome</option>
                        <option value="Loyalty coupon">Loyalty Rewards</option>
                        <option value="Eye test coupon">Eye Test Incentive</option>
                    </select>
                </div>
                <div class="form-row">
                    <label>Expiry Date *</label>
                    <input id="c-expiry" type="date" required>
                </div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:12px; border-top:1px solid var(--border); padding-top:20px">
                <button class="btn btn-outline" type="button" onclick="closeModal()">Discard</button>
                <button class="btn btn-primary" type="submit" id="coupon-btn" style="padding:10px 30px">
                    <i class="fas fa-check-circle"></i> Deploy Coupon
                </button>
            </div>
        </form>
    `, 'md');
};

window.submitCoupon = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('coupon-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deploying...';

    const code = document.getElementById('c-code').value.trim().toUpperCase();
    const isEdit = document.getElementById('couponForm').dataset.mode === 'edit';

    const payload = {
        code: code,
        discount_type: document.getElementById('c-dtype').value,
        discount_value: parseFloat(document.getElementById('c-dval').value),
        min_order_value: parseFloat(document.getElementById('c-min').value || 0),
        usage_limit: parseInt(document.getElementById('c-limit').value) || null,
        coupon_type: document.getElementById('c-type').value,
        expiry_date: document.getElementById('c-expiry').value,
        active_status: isEdit ? (document.getElementById('c-active')?.checked ?? true) : true
    };

    const r = isEdit 
        ? await api(`/api/marketing/coupons/${code}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await postAPI('/api/marketing/coupons', payload);

    if(r.success) {
        toast(isEdit ? 'Coupon updated' : 'Coupon successfully deployed!', 'success');
        closeModal();
        load_coupons();
    } else {
        toast(r.error, 'error');
        btn.disabled = false;
        btn.innerHTML = isEdit ? '<i class="fas fa-save"></i> Save Changes' : '<i class="fas fa-check-circle"></i> Deploy Coupon';
    }
};

window.openEditCoupon = async function(code) {
    const r = await api(`/api/marketing/coupons/${code}`);
    if(!r.success) return toast(r.error, 'error');
    const c = r.data;

    openModal('Refining Promo Properties', `
        <form onsubmit="submitCoupon(event)" id="couponForm" data-mode="edit">
            <div class="form-row" style="margin-bottom:20px">
                <label>Coupon Code (Immutable)</label>
                <input id="c-code" value="${c.code}" readonly style="background:rgba(0,0,0,0.03); font-family:monospace; font-weight:800; text-transform:uppercase; font-size:1.2rem">
            </div>

            <div class="form-grid-2" style="margin-bottom:20px">
                <div class="form-row">
                    <label>Discount Type</label>
                    <select id="c-dtype">
                        <option value="Percentage" ${c.discount_type === 'Percentage' ? 'selected' : ''}>Percentage (%)</option>
                        <option value="Flat" ${c.discount_type === 'Flat' ? 'selected' : ''}>Flat Discount (₹)</option>
                    </select>
                </div>
                <div class="form-row">
                    <label>Discount Value *</label>
                    <input id="c-dval" type="number" value="${c.discount_value}" required>
                </div>
            </div>

            <div class="form-grid-2" style="margin-bottom:20px">
                <div class="form-row">
                    <label>Minimum Order (₹)</label>
                    <input id="c-min" type="number" value="${c.min_order_value}">
                </div>
                <div class="form-row">
                    <label>Usage Limit (Max Uses)</label>
                    <input id="c-limit" type="number" value="${c.usage_limit || ''}" placeholder="Infinity if empty">
                </div>
            </div>

            <div class="form-grid-2" style="margin-bottom:24px">
                <div class="form-row">
                    <label>Category / Type</label>
                    <select id="c-type">
                        <option value="Festival coupon" ${c.coupon_type === 'Festival coupon' ? 'selected' : ''}>Festival / Seasonal</option>
                        <option value="Welcome coupon" ${c.coupon_type === 'Welcome coupon' ? 'selected' : ''}>New User Welcome</option>
                        <option value="Loyalty coupon" ${c.coupon_type === 'Loyalty coupon' ? 'selected' : ''}>Loyalty Rewards</option>
                        <option value="Eye test coupon" ${c.coupon_type === 'Eye test coupon' ? 'selected' : ''}>Eye Test Incentive</option>
                    </select>
                </div>
                <div class="form-row">
                    <label>Expiry Date *</label>
                    <input id="c-expiry" type="date" value="${new Date(c.expiry_date).toISOString().split('T')[0]}" required>
                </div>
            </div>

            <div class="form-row" style="margin-bottom:20px; display:flex; align-items:center; gap:10px">
                <input type="checkbox" id="c-active" ${c.active_status ? 'checked' : ''} style="width:auto">
                <label for="c-active" style="margin:0">Active & Publishable</label>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:12px; border-top:1px solid var(--border); padding-top:20px">
                <button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" type="submit" id="coupon-btn" style="padding:10px 30px">
                    <i class="fas fa-save"></i> Save Changes
                </button>
            </div>
        </form>
    `, 'md');
};

window.toggleCouponStatus = async function(code) {
    const r = await api(`/api/marketing/coupons/${code}/toggle`, { method: 'PATCH' });
    if(r.success) {
        toast('Coupon visibility toggled', 'success');
        renderCouponsList();
        renderCouponsKPIs();
    } else {
        toast(r.error, 'error');
    }
};

window.deleteCoupon = async function(code) {
    if(!confirm(`Permanently decommission coupon [${code}]?`)) return;
    const r = await api(`/api/marketing/coupons/${code}`, { method: 'DELETE' });
    if(r.success) {
        toast('Coupon decommissioned');
        load_coupons();
    } else {
        toast(r.error, 'error');
    }
};




/* ── CAMPAIGNS MANAGEMENT ── */
/* ── CAMPAIGNS & COMMUNICATION HUB (UNIFIED) ── */
window.load_campaigns = async function() {
    const el = document.getElementById('view-campaigns');
    if (!el) return;

    el.innerHTML = `
    <div class="module-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px">
        <div>
            <h2 style="margin:0; font-weight:800; letter-spacing:-0.5px">Campaigns & Communication</h2>
            <p style="color:var(--muted); font-size:0.85rem">Centralized hub for marketing broadcasts, templates, and delivery logs</p>
        </div>
        <div class="module-actions" style="display:flex; gap:12px">
            <button class="btn btn-outline" onclick="load_campaigns()"><i class="fas fa-sync"></i> Refresh</button>
            <div style="display:flex; gap:8px">
                <button class="btn btn-outline" onclick="openAddTemplate()"><i class="fas fa-magic"></i> New Template</button>
                <button class="btn btn-primary" onclick="openAddCampaign()"><i class="fas fa-bullhorn"></i> New Campaign</button>
            </div>
        </div>
    </div>

    <!-- TABS -->
    <div class="tab-bar glass" style="margin-bottom:24px; border-radius:12px; padding:6px; display:flex; gap:8px; border:1px solid var(--border)">
        <button class="tab-item active" data-tab="list" onclick="switchCampaignTab('list')"><i class="fas fa-list"></i> Active Campaigns</button>
        <button class="tab-item" data-tab="templates" onclick="switchCampaignTab('templates')"><i class="fas fa-magic"></i> Message Templates</button>
        <button class="tab-item" data-tab="logs" onclick="switchCampaignTab('logs')"><i class="fas fa-history"></i> Dispatch Logs</button>
    </div>

    <div id="campaign-tab-content" class="animate-in">
        <!-- Dynamic Content -->
    </div>
    `;

    switchCampaignTab('list');
};

window.switchCampaignTab = function(tab) {
    const container = document.getElementById('campaign-tab-content');
    if(!container) return;

    // Update Tab UI
    document.querySelectorAll('.tab-item').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));

    if (tab === 'list') {
        container.innerHTML = `
            <div class="kpi-grid" id="campaigns-kpi" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:20px; margin-bottom:30px">
                <div class="kpi-card glass">${skelRows(2)}</div>
            </div>
            <div class="card glass" style="padding:24px">
                <div class="filter-bar" style="display:flex; gap:15px; margin-bottom:20px; background:rgba(0,0,0,0.02); padding:15px; border-radius:12px">
                    <div style="flex:1; position:relative">
                        <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--muted)"></i>
                        <input type="text" id="camp-search" placeholder="Search campaign name..." class="filter-input" style="padding-left:35px" oninput="renderCampaignsList()">
                    </div>
                    <select id="camp-status" class="filter-input" style="max-width:200px" onchange="renderCampaignsList()">
                        <option value="">All Statuses</option>
                        <option value="Draft">Draft</option>
                        <option value="Running">Running</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>
                <div class="table-responsive">
                    <table class="erp-table">
                        <thead>
                            <tr>
                                <th>Campaign Name</th>
                                <th>Type</th>
                                <th>Segment</th>
                                <th>Status</th>
                                <th>Launched</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="campaigns-list">${skelRows(6)}</tbody>
                    </table>
                </div>
            </div>
        `;
        renderCampaignsKPIs();
        renderCampaignsList();
    } else if (tab === 'templates') {
        container.innerHTML = `
            <div id="comm-kpis" class="kpi-grid" style="margin-bottom:24px">${skelRows(1, 3)}</div>
            <div class="card glass no-padding">
                <div class="card-header"><h3>Pre-defined Message Templates</h3></div>
                <div id="templates-list" style="max-height:600px; overflow-y:auto">
                    ${skelRows(5)}
                </div>
            </div>
        `;
        renderCommKPIs();
        renderTemplatesList();
    } else if (tab === 'logs') {
        container.innerHTML = `
            <div class="card glass no-padding">
                <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
                    <h3 style="margin:0">Delivery Dispatch Log</h3>
                    <select id="log-channel-filter" class="filter-input" style="font-size:0.75rem; padding:4px 8px" onchange="renderCommLogs()">
                        <option value="">All Channels</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="SMS">SMS</option>
                        <option value="Email">Email</option>
                    </select>
                </div>
                <div class="table-container">
                    <table class="modern-table">
                        <thead>
                            <tr>
                                <th style="padding-left:20px">Recipient</th>
                                <th>Channel</th>
                                <th>Payload Status</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody id="comm-logs-body">${skelRows(10, 4)}</tbody>
                    </table>
                </div>
            </div>
        `;
        renderCommLogs();
    }
};

async function renderCampaignsKPIs() {
    const r = await api('/api/marketing/campaigns-stats');
    const container = document.getElementById('campaigns-kpi');
    if(!container || !r.success) return;

    const k = r.data;
    container.innerHTML = `
        <div class="kpi-card glass">
            <label>Total Campaigns</label>
            <div class="value">${k.totalCampaigns}</div>
        </div>
        <div class="kpi-card glass">
            <label>Currently Running</label>
            <div class="value" style="color:var(--accent)">${k.runningCampaigns}</div>
        </div>
        <div class="kpi-card glass">
            <label>Drafted</label>
            <div class="value" style="color:var(--muted)">${k.draftedCampaigns}</div>
        </div>
    `;
}

async function renderCampaignsList() {
    const search = document.getElementById('camp-search')?.value || '';
    const status = document.getElementById('camp-status')?.value || '';
    const body = document.getElementById('campaigns-list');
    if(!body) return;

    const r = await api(`/api/marketing/campaigns?search=${search}&status=${status}`);
    if(!r.success) return body.innerHTML = `<tr><td colspan="6" class="text-center">Error loading campaigns</td></tr>`;

    body.innerHTML = r.data.map(c => `
        <tr>
            <td>
                <div style="font-weight:700; color:var(--primary)">${c.campaign_name}</div>
                <div style="font-size:0.75rem; color:var(--muted); max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">${c.message}</div>
            </td>
            <td><span class="badge badge-blue"><i class="fas fa-${c.campaign_type === 'WhatsApp' ? 'whatsapp' : c.campaign_type === 'Email' ? 'envelope' : 'sms'}"></i> ${c.campaign_type}</span></td>
            <td><span class="badge badge-gray">${c.target_segment}</span></td>
            <td>${badge(c.status)}</td>
            <td>${fmtDate(c.created_at)}</td>
            <td>
                <div style="display:flex; gap:8px">
                    ${c.status === 'Draft' ? `
                        <button class="btn-icon" style="background:var(--accent-dim); color:var(--accent)" onclick="updateCampaignStatus('${c.campaign_id}', 'Running')" title="Launch Campaign">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    ` : ''}
                    <button class="btn-icon" style="background:rgba(59, 130, 246, 0.1); color:#3b82f6" onclick="openEditCampaign('${c.campaign_id}')" title="Edit Template">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" style="background:rgba(239, 68, 68, 0.1); color:#ef4444" onclick="deleteCampaign('${c.campaign_id}')" title="Delete Permanent">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('') || `<tr><td colspan="6" style="text-align:center; padding:48px; color:var(--muted)">No campaigns found.</td></tr>`;
}

window.openAddCampaign = function() {
    openModal('Initiating Marketing Broadcast', `
        <form onsubmit="submitCampaign(event)" id="campForm">
            <div class="form-row" style="margin-bottom:20px">
                <label>Campaign Name *</label>
                <input id="cp-name" placeholder="E.g. Summer Sale 2024" required>
            </div>

            <div class="form-grid-2" style="margin-bottom:20px">
                <div class="form-row">
                    <label>Broadcast Channel</label>
                    <select id="cp-type">
                        <option value="WhatsApp">WhatsApp Business</option>
                        <option value="SMS">SMS Gateway</option>
                        <option value="Email">Email Newsletter</option>
                    </select>
                </div>
                <div class="form-row">
                    <label>Target Audience Segment</label>
                    <select id="cp-segment">
                        <option value="All customers">All Customers</option>
                        <option value="High value">High Value (VVIP)</option>
                        <option value="Frequent buyers">Frequent Buyers</option>
                        <option value="No visit 6 months">Inactive (6+ Months)</option>
                        <option value="Recent buyers">Recent Buyers (Last 30 Days)</option>
                        <option value="Sunglass buyers">Sunglass Enthusiasts</option>
                    </select>
                </div>
            </div>

            <div class="form-row" style="margin-bottom:24px">
                <label>Broadcast Message / Template Content *</label>
                <textarea id="cp-msg" rows="5" placeholder="Compose your message here..." required style="width:100\%; padding:12px; border-radius:8px; border:1px solid var(--border); font-family:inherit; font-size:0.9rem; resize:none"></textarea>
                <p style="font-size:0.75rem; color:var(--muted); margin-top:8px">Use brackets for variables, e.g. Hello {{name}}...</p>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:12px; border-top:1px solid var(--border); padding-top:20px">
                <button class="btn btn-outline" type="button" onclick="closeModal()">Save to Drafts</button>
                <button class="btn btn-primary" type="submit" id="camp-btn" style="padding:10px 30px">
                    <i class="fas fa-rocket"></i> Create Campaign
                </button>
            </div>
        </form>
    `, 'md');
};

window.submitCampaign = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('camp-btn');
    const isEdit = document.getElementById('campForm').dataset.mode === 'edit';
    const id = document.getElementById('campForm').dataset.id;

    const payload = {
        campaign_name: document.getElementById('cp-name').value,
        campaign_type: document.getElementById('cp-type').value,
        target_segment: document.getElementById('cp-segment').value,
        message: document.getElementById('cp-msg').value
    };

    const r = isEdit
        ? await api(`/api/marketing/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await postAPI('/api/marketing/campaigns', payload);

    if(r.success) {
        toast(isEdit ? 'Campaign updated' : 'Campaign created as Draft', 'success');
        closeModal();
        load_campaigns();
    } else {
        toast(r.error, 'error');
        btn.disabled = false;
        btn.innerHTML = isEdit ? '<i class="fas fa-save"></i> Save Changes' : '<i class="fas fa-rocket"></i> Create Campaign';
    }
};

window.openEditCampaign = async function(id) {
    const r = await api(`/api/marketing/campaigns/${id}`);
    if(!r.success) return toast(r.error, 'error');
    const c = r.data;

    openModal('Architecting Marketing Broadcast', `
        <form onsubmit="submitCampaign(event)" id="campForm" data-mode="edit" data-id="${id}">
            <div class="form-row" style="margin-bottom:20px">
                <label>Campaign Name *</label>
                <input id="cp-name" value="${c.campaign_name}" required>
            </div>

            <div class="form-grid-2" style="margin-bottom:20px">
                <div class="form-row">
                    <label>Broadcast Channel</label>
                    <select id="cp-type">
                        <option value="WhatsApp" ${c.campaign_type === 'WhatsApp' ? 'selected' : ''}>WhatsApp Business</option>
                        <option value="SMS" ${c.campaign_type === 'SMS' ? 'selected' : ''}>SMS Gateway</option>
                        <option value="Email" ${c.campaign_type === 'Email' ? 'selected' : ''}>Email Newsletter</option>
                    </select>
                </div>
                <div class="form-row">
                    <label>Target Audience Segment</label>
                    <select id="cp-segment">
                        <option value="All customers" ${c.target_segment === 'All customers' ? 'selected' : ''}>All Customers</option>
                        <option value="High value" ${c.target_segment === 'High value' ? 'selected' : ''}>High Value (VVIP)</option>
                        <option value="Frequent buyers" ${c.target_segment === 'Frequent buyers' ? 'selected' : ''}>Frequent Buyers</option>
                        <option value="No visit 6 months" ${c.target_segment === 'No visit 6 months' ? 'selected' : ''}>Inactive (6+ Months)</option>
                        <option value="Recent buyers" ${c.target_segment === 'Recent buyers' ? 'selected' : ''}>Recent Buyers (Last 30 Days)</option>
                        <option value="Sunglass buyers" ${c.target_segment === 'Sunglass buyers' ? 'selected' : ''}>Sunglass Enthusiasts</option>
                    </select>
                </div>
            </div>

            <div class="form-row" style="margin-bottom:24px">
                <label>Broadcast Message / Template Content *</label>
                <textarea id="cp-msg" rows="5" required style="width:100\%; padding:12px; border-radius:8px; border:1px solid var(--border); font-family:inherit; font-size:0.9rem; resize:none">${c.message}</textarea>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:12px; border-top:1px solid var(--border); padding-top:20px">
                <button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" type="submit" id="camp-btn" style="padding:10px 30px">
                    <i class="fas fa-save"></i> Save Changes
                </button>
            </div>
        </form>
    `, 'md');
};

window.updateCampaignStatus = async function(id, status) {
    const r = await api(`/api/marketing/campaigns/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    if(r.success) {
        toast(`Campaign is now ${status}`, 'success');
        renderCampaignsList();
        renderCampaignsKPIs();
    } else {
        toast(r.error, 'error');
    }
};

window.deleteCampaign = async function(id) {
    if(!confirm('Permanently delete this campaign?')) return;
    const r = await api(`/api/marketing/campaigns/${id}`, { method: 'DELETE' });
    if(r.success) {
        toast('Campaign deleted');
        renderCampaignsList();
        renderCampaignsKPIs();
    } else {
        toast(r.error, 'error');
    }
};


/* ── COMMUNICATION HUB ── */
window.load_comm = function() { load_campaigns(); switchCampaignTab('templates'); };

async function renderCommKPIs() {
    const r = await api('/api/marketing/comm-stats');
    const container = document.getElementById('comm-kpis');
    if (!r.success || !container) {
        if (container) container.innerHTML = '<div class="kpi-card glass"><p style="color:var(--danger)">Error loading stats</p></div>';
        return;
    }

    const d = r.data;
    container.innerHTML = `
        <div class="kpi-card glass">
            <div class="kpi-label">Active Templates</div>
            <div class="kpi-value">${d.totalTemplates || 0}</div>
            <div class="kpi-trend text-blue"><i class="fas fa-copy"></i> Ready</div>
        </div>
        <div class="kpi-card glass">
            <div class="kpi-label">Dispatched Today</div>
            <div class="kpi-value" style="color:var(--accent)">${d.sentToday || 0}</div>
            <div class="kpi-trend text-green"><i class="fas fa-check-circle"></i> Healthy</div>
        </div>
        <div class="kpi-card glass">
            <div class="kpi-label">Failed Delivery</div>
            <div class="kpi-value" style="color:var(--danger)">${d.failedCommunications || 0}</div>
            <div class="kpi-trend text-red"><i class="fas fa-exclamation-triangle"></i> Action Required</div>
        </div>
    `;
}

async function renderTemplatesList() {
    const r = await api('/api/marketing/templates');
    const container = document.getElementById('templates-list');
    if (!r.success || !container) return;

    container.innerHTML = r.data.map(t => `
        <div class="template-item" style="padding:16px 20px; border-bottom:1px solid var(--border); transition:all 0.2s; cursor:pointer" onclick="viewTemplateDetails('${t.template_id}')">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px">
                <span style="font-weight:700; color:var(--primary)">${t.template_name}</span>
                <span class="badge ${t.channel === 'WhatsApp' ? 'badge-blue' : 'badge-gray'}" style="font-size:0.6rem">${t.channel}</span>
            </div>
            <div style="font-size:0.75rem; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis">
                ${t.message_content}
            </div>
        </div>
    `).join('') || `<div style="padding:40px; text-align:center; color:var(--muted)">No templates found.</div>`;
}

async function renderCommLogs() {
    const channel = document.getElementById('log-channel-filter')?.value || '';
    const r = await api(`/api/marketing/logs?channel=${channel}`);
    const body = document.getElementById('comm-logs-body');
    if (!r.success || !body) return;

    body.innerHTML = r.data.map(l => `
        <tr>
            <td style="padding-left:20px">
                <div style="font-weight:600">${l.customer_name || 'System Broadcast'}</div>
                <div style="font-size:0.7rem; color:var(--muted)">ID: ${l.customer_id || 'N/A'}</div>
            </td>
            <td>
                <div style="display:flex; align-items:center; gap:6px">
                    <i class="fab ${l.channel === 'WhatsApp' ? 'fa-whatsapp text-green' : l.channel === 'Email' ? 'fa-envelope text-blue' : 'fa-sms text-gray'}"></i>
                    <span>${l.channel}</span>
                </div>
            </td>
            <td>
                <span class="badge ${l.status === 'Sent' || l.status === 'Delivered' || l.status === 'Read' ? 'badge-green' : 'badge-red'}">
                    ${l.status.toUpperCase()}
                </span>
            </td>
            <td style="color:var(--muted)">${fmtDate(l.sent_at)}</td>
        </tr>
    `).join('') || `<tr><td colspan="4" style="text-align:center; padding:40px; color:var(--muted)">No logs available.</td></tr>`;
}

window.openAddTemplate = function() {
    openModal('Engineering Message Template', `
        <form onsubmit="submitTemplate(event)">
            <div class="form-row" style="margin-bottom:20px">
                <label>Template Reference Name *</label>
                <input id="tmpl-name" required placeholder="e.g. Order Confirmation (WhatsApp)" style="font-weight:600">
            </div>

            <div class="form-row" style="margin-bottom:20px">
                <label>Target Channel</label>
                <select id="tmpl-chan">
                    <option value="WhatsApp">WhatsApp Business</option>
                    <option value="Email">Email Marketing</option>
                    <option value="SMS">Direct SMS</option>
                </select>
            </div>

            <div class="form-row" style="margin-bottom:24px">
                <label>Universal Content Body * (Use {name}, {order_id} variables)</label>
                <textarea id="tmpl-content" rows="6" required placeholder="Hello {name}, your order {order_id} is ready for pick up..." style="width:100%; padding:12px; border-radius:8px; border:1px solid var(--border); font-family:inherit"></textarea>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:12px; border-top:1px solid var(--border); padding-top:20px">
                <button class="btn btn-outline" type="button" onclick="closeModal()">Discard</button>
                <button class="btn btn-primary" type="submit" id="tmpl-save-btn" style="padding:10px 30px">
                    <i class="fas fa-save"></i> Register Template
                </button>
            </div>
        </form>
    `, 'md');
};

window.submitTemplate = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('tmpl-save-btn');
    btn.disabled = true;

    const r = await api('/api/marketing/templates', {
        method: 'POST',
        body: JSON.stringify({
            template_name: document.getElementById('tmpl-name').value,
            channel: document.getElementById('tmpl-chan').value,
            message_content: document.getElementById('tmpl-content').value
        })
    });

    if (r.success) {
        toast('Message template registered!', 'success');
        closeModal();
        load_campaigns(); 
        switchCampaignTab('templates');
    } else {
        toast(r.error, 'error');
        btn.disabled = false;
    }
};


/* ── REPORTS ── */
window.load_reports = function() {
    const now = new Date(), y = now.getFullYear(), m = String(now.getMonth()+1).padStart(2,'0');
    const el = document.getElementById('view-reports');
    el.innerHTML = `<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center">
        <input class="filter-input" type="date" id="r-from" value="${y}-${m}-01">
        <input class="filter-input" type="date" id="r-to" value="${now.toISOString().split('T')[0]}">
        <button class="btn btn-primary" onclick="loadSalesReport()">Sales Report</button>
        <button class="btn btn-outline" onclick="loadGstReport()">GSTR-1</button>
    </div>
    <div class="card"><div class="card-header"><h3 id="rTitle">Sales Report</h3></div>
    <div class="card-body"><table><thead id="rHead"></thead><tbody id="rBody"><tr><td style="text-align:center;padding:24px;color:#888">Select date range above</td></tr></tbody></table></div></div>`;
};
window.loadSalesReport = async function() {
    const from = document.getElementById('r-from').value, to = document.getElementById('r-to').value;
    document.getElementById('rTitle').textContent = `Sales: ${fmtDate(from)} → ${fmtDate(to)}`;
    document.getElementById('rHead').innerHTML = '<tr><th>Date</th><th>Orders</th><th>Revenue</th><th>GST</th><th>Discounts</th><th>Avg Order</th></tr>';
    const d = await api(`/api/reports/sales?business_id=${BIZ}&from_date=${from}&to_date=${to}`);
    document.getElementById('rBody').innerHTML = (d.data||[]).map(r=>`
        <tr><td>${fmtDate(r.date)}</td><td>${r.orders}</td><td>${fmt(r.revenue)}</td>
        <td>${fmt(r.gst_collected)}</td><td>${fmt(r.discounts_given)}</td><td>${fmt(r.avg_order_value)}</td></tr>`).join('') || '<tr><td colspan="6" style="text-align:center;padding:24px;color:#888">No data</td></tr>';
};
window.loadGstReport = async function() {
    const from = document.getElementById('r-from').value, to = document.getElementById('r-to').value;
    document.getElementById('rTitle').textContent = `GSTR-1: ${fmtDate(from)} → ${fmtDate(to)}`;
    document.getElementById('rHead').innerHTML = '<tr><th>Invoice #</th><th>Date</th><th>Customer</th><th>Taxable</th><th>CGST</th><th>SGST</th><th>Total</th></tr>';
    const d = await api(`/api/reports/gst?business_id=${BIZ}&from_date=${from}&to_date=${to}`);
    document.getElementById('rBody').innerHTML = (d.data||[]).map(r=>`
        <tr><td style="font-family:monospace;font-size:.75rem">${r.invoice_number}</td><td>${fmtDate(r.invoice_date)}</td>
        <td>${r.customer_name||'Walk-in'}</td><td>${fmt(r.subtotal)}</td>
        <td>${fmt(r.cgst)}</td><td>${fmt(r.sgst)}</td><td><b>${fmt(r.total_amount)}</b></td></tr>`).join('') || '<tr><td colspan="7" style="text-align:center;padding:24px;color:#888">No data</td></tr>';
};

/* ── STAFF ── */
/* Legacy Staff module removed */
window.openAddStaff = function() {
    openModal('Add Staff Account', `<form onsubmit="submitStaff(event)">
        <div class="form-grid-2">
            <div class="form-row"><label>Full Name *</label><input id="st-name" required></div>
            <div class="form-row"><label>Email *</label><input id="st-email" type="email" required></div>
            <div class="form-row"><label>Mobile</label><input id="st-mobile"></div>
            <div class="form-row"><label>Role *</label><select id="st-role"><option>Admin</option><option>Manager</option><option>Showroom Manager</option><option>Cashier</option><option>Optometrist</option></select></div>
            <div class="form-row"><label>Password *</label><input id="st-pwd" type="password" required></div>
        </div>
        <button class="btn btn-primary" type="submit" style="width:100%;margin-top:8px">Create Account</button></form>`);
};
window.submitStaff = async function(e) {
    e.preventDefault();
    const r = await postAPI('/api/staff', { business_id:BIZ, name:document.getElementById('st-name').value, email:document.getElementById('st-email').value, mobile:document.getElementById('st-mobile').value, role:document.getElementById('st-role').value, password:document.getElementById('st-pwd').value });
    if (r.success) { closeModal(); toast('Staff account created!'); load_staff(); } else toast(r.error,'error');
};

/* ── LOYALTY & RELATIONSHIP MANAGEMENT (CRM ENGINE) ── */

window.load_loyalty = async function() {
    const el = document.getElementById('view-loyalty');
    if (!el) return;

    el.innerHTML = `
    <div class="module-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px">
        <div>
            <h2 style="margin:0; font-weight:800; letter-spacing:-0.5px">Loyalty & Rewards</h2>
            <p style="color:var(--muted); font-size:0.85rem">Patient retention and relationship management engine</p>
        </div>
        <div class="module-actions" style="display:flex; gap:12px">
            <button class="btn btn-outline" onclick="load_loyalty()"><i class="fas fa-sync"></i> Refresh</button>
            <button class="btn btn-primary" onclick="switchView('customers')"><i class="fas fa-user-plus"></i> Register Member</button>
        </div>
    </div>

    <div id="loyalty-kpis" class="kpi-grid" style="grid-template-columns: repeat(4, 1fr); gap:20px; margin-bottom:24px">
        <div class="kpi-card glass">${skelRows(2)}</div>
        <div class="kpi-card glass">${skelRows(2)}</div>
        <div class="kpi-card glass">${skelRows(2)}</div>
        <div class="kpi-card glass">${skelRows(2)}</div>
    </div>

    <div class="card glass" style="margin-bottom:24px; padding:16px; display:flex; gap:16px; align-items:center">
        <div style="flex:1; position:relative">
            <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--muted)"></i>
            <input type="text" id="loy-search" class="filter-input" placeholder="Search members by name or mobile..." style="width:100%; padding-left:36px" oninput="_debounce(renderLoyaltyMembers, 300)()">
        </div>
        <select id="loy-tier-filter" class="filter-input" style="width:200px" onchange="renderLoyaltyMembers()">
            <option value="">All Tiers</option>
            <option value="Silver">Silver</option>
            <option value="Gold">Gold</option>
            <option value="Platinum">Platinum</option>
        </select>
    </div>

    <div class="card no-padding">
        <div class="table-container">
            <table class="modern-table">
                <thead>
                    <tr>
                        <th style="padding-left:24px">Member Details</th>
                        <th>Mobile</th>
                        <th>Points Balance</th>
                        <th>Membership Tier</th>
                        <th style="text-align:right; padding-right:24px">Actions</th>
                    </tr>
                </thead>
                <tbody id="loyalty-table-body">
                    ${skelRows(5, 5)}
                </tbody>
            </table>
        </div>
    </div>
    `;

    renderLoyaltyKPIs();
    renderLoyaltyMembers();
};

async function renderLoyaltyKPIs() {
    const r = await api('/api/clinic/loyalty/kpis');
    const container = document.getElementById('loyalty-kpis');
    if (!r.success || !container) return;

    const d = r.data;
    container.innerHTML = `
        <div class="kpi-card glass">
            <div class="kpi-label">Active Members</div>
            <div class="kpi-value">${d.totalMembers || 0}</div>
            <div class="kpi-trend text-green"><i class="fas fa-users"></i> Enrollment Active</div>
        </div>
        <div class="kpi-card glass">
            <div class="kpi-label">Total Points Issued</div>
            <div class="kpi-value" style="color:var(--accent)">${(d.totalPoints || 0).toLocaleString()}</div>
            <div class="kpi-trend"><i class="fas fa-coins"></i> System Ledgered</div>
        </div>
        <div class="kpi-card glass">
            <div class="kpi-label">Gold Members</div>
            <div class="kpi-value" style="color:#f59e0b">${d.tiers?.Gold || 0}</div>
            <div class="kpi-trend text-warn">2,000+ Points</div>
        </div>
        <div class="kpi-card glass">
            <div class="kpi-label">Platinum Members</div>
            <div class="kpi-value" style="color:var(--secondary)">${d.tiers?.Platinum || 0}</div>
            <div class="kpi-trend text-green"><i class="fas fa-crown"></i> 5,000+ Points</div>
        </div>
    `;
}

window.renderLoyaltyMembers = async function() {
    const search = document.getElementById('loy-search')?.value || '';
    const tier = document.getElementById('loy-tier-filter')?.value || '';
    const r = await api(`/api/clinic/loyalty/members?search=${search}&tier=${tier}`);
    const body = document.getElementById('loyalty-table-body');
    if (!r.success || !body) return;

    body.innerHTML = r.data.map(m => `
        <tr>
            <td style="padding-left:24px">
                <div style="font-weight:700; color:var(--primary)">${m.customer_name}</div>
                <div style="font-size:0.75rem; color:var(--muted)">ID: ${m.loyalty_id}</div>
            </td>
            <td><b>${m.mobile}</b></td>
            <td>
                <div style="font-size:1.1rem; font-weight:800; color:var(--accent)">${m.points.toLocaleString()} <span style="font-size:0.7rem; font-weight:400; color:var(--muted)">pts</span></div>
            </td>
            <td>
                <span class="badge ${m.tier === 'Platinum' ? 'badge-blue' : m.tier === 'Gold' ? 'badge-yellow' : 'badge-gray'}" style="padding:4px 12px; font-weight:700">
                    ${m.tier.toUpperCase()}
                </span>
            </td>
            <td style="text-align:right; padding-right:24px">
                <div style="display:flex; gap:8px; justify-content:flex-end">
                    <button class="btn btn-outline btn-sm" onclick="openAdjustPoints('${m.customer_id}', ${m.points}, '${m.customer_name}')">
                        <i class="fas fa-edit"></i> Adjust
                    </button>
                    <button class="btn-icon" style="background:rgba(0,0,0,0.05)" onclick="viewLoyaltyHistory('${m.loyalty_id}', '${m.customer_name}')" title="Audit Log">
                        <i class="fas fa-history"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('') || `<tr><td colspan="5" style="text-align:center; padding:48px; color:var(--muted)">No loyalty members found.</td></tr>`;
};

window.openAdjustPoints = function(customerId, currentBalance, name) {
    openModal('Adjust Loyalty Points', `
        <form onsubmit="submitPointsAdjustment(event)" id="adjustForm">
            <input type="hidden" id="adj-cid" value="${customerId}">
            <div class="card glass no-padding" style="margin-bottom:20px; padding:20px; background:rgba(0,0,0,0.02)">
                <div style="display:flex; justify-content:space-between; align-items:center">
                    <div>
                        <div style="font-weight:800; font-size:1.1rem">${name}</div>
                        <div style="font-size:0.8rem; color:var(--muted)">Points Balance</div>
                    </div>
                    <div style="font-size:1.5rem; font-weight:900; color:var(--accent)">${currentBalance.toLocaleString()} <small style="font-size:0.7rem">pts</small></div>
                </div>
            </div>

            <div class="form-row" style="margin-bottom:20px">
                <label>Adjust Points (+ for Earn, - for Redeem) *</label>
                <input type="number" id="adj-change" placeholder="e.g. 500 or -200" required step="1" style="font-size:1.2rem; font-weight:700">
            </div>

            <div class="form-row" style="margin-bottom:24px">
                <label>Reason for Adjustment *</label>
                <input type="text" id="adj-reason" placeholder="e.g. Purchase Bonus, Manual Correction..." required>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:12px; border-top:1px solid var(--border); padding-top:20px">
                <button class="btn btn-outline" type="button" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" type="submit" id="adj-btn" style="padding:10px 30px">Update Balance</button>
            </div>
        </form>
    `, 'small');
};

window.submitPointsAdjustment = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('adj-btn');
    btn.disabled = true;

    const r = await api('/api/clinic/loyalty/adjust', {
        method: 'POST',
        body: JSON.stringify({
            customer_id: document.getElementById('adj-cid').value,
            points_change: parseInt(document.getElementById('adj-change').value),
            reason: document.getElementById('adj-reason').value
        })
    });

    if (r.success) {
        toast('Points adjusted successfully!', 'success');
        closeModal();
        renderLoyaltyKPIs();
        renderLoyaltyMembers();
    } else {
        toast(r.error, 'error');
        btn.disabled = false;
    }
};

window.viewLoyaltyHistory = async function(loyaltyId, name) {
    toast('Retrieving audit logs...', 'info');
    const r = await api(`/api/clinic/loyalty/ledger?loyalty_id=${loyaltyId}`);
    
    if (!r.success) return toast(r.error, 'error');

    openModal(`Points Ledger — ${name}`, `
        <div class="table-container" style="max-height:450px; overflow-y:auto">
            <table class="modern-table">
                <thead>
                    <tr>
                        <th style="padding-left:24px">Date</th>
                        <th>Type</th>
                        <th>Change</th>
                        <th style="padding-right:24px">Reason</th>
                    </tr>
                </thead>
                <tbody>
                    ${r.data.map(l => `
                        <tr>
                            <td style="padding-left:24px"><small>${new Date(l.created_at).toLocaleString()}</small></td>
                            <td>
                                <span class="badge ${l.change_type === 'EARN' ? 'badge-green' : 'badge-red'}" style="padding:2px 8px; font-size:0.7rem">
                                    ${l.change_type}
                                </span>
                            </td>
                            <td><b class="${l.points_change >= 0 ? 'text-green' : 'text-red'}">${l.points_change >= 0 ? '+' : ''}${l.points_change}</b></td>
                            <td style="font-size:0.8rem; padding-right:24px">${l.reason}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="4" style="text-align:center; padding:20px">No transaction history.</td></tr>'}
                </tbody>
            </table>
        </div>
    `, 'md');
};


/* ── SETTINGS ── */
window.load_settings = async function() {
    const el = document.getElementById('view-settings');
    el.innerHTML = `<div class="card" style="max-width:640px"><div class="card-header"><h3>System Settings</h3></div>
    <div style="padding:24px" id="settingsBody">
        <div class="skeleton" style="height:300px"></div>
    </div></div>`;
    
    const d = await api(`/api/business/me`);
    if(!d.success) return;
    const b = d.data;
    
    document.getElementById('settingsBody').innerHTML = `
    <form onsubmit="saveSettings(event)">
        <div class="form-row"><label>Business Name</label><input id="s-name" value="${b.business_name}"></div>
        <div class="form-grid-2">
            <div class="form-row"><label>Email</label><input id="s-email" value="${b.email}"></div>
            <div class="form-row"><label>Mobile</label><input id="s-mobile" value="${b.mobile_number}"></div>
            <div class="form-row"><label>GST Number</label><input id="s-gst" value="${b.gst_number || ''}" placeholder="29XXXXX..."></div>
            <div class="form-row"><label>Invoice Prefix</label><input id="s-prefix" value="${b.invoice_prefix || 'INV'}"></div>
        </div>
        <div class="form-row"><label>Address</label><textarea id="s-addr" rows="2">${b.address || ''}</textarea></div>
        <div class="form-grid-2">
            <div class="form-row"><label>City</label><input id="s-city" value="${b.city || ''}"></div>
            <div class="form-row"><label>State</label><input id="s-state" value="${b.state || ''}"></div>
        </div>
        <hr style="margin:20px 0;border-color:var(--border)">
        <div style="display:flex;justify-content:space-between;align-items:center">
             <div style="font-size:.78rem;color:#888">ID: ${b.business_id}</div>
             <button class="btn btn-primary" type="submit">Update Settings</button>
        </div>
    </form>
    <div style="margin-top:30px;padding:15px;background:#f9f9f9;border-radius:10px;font-size:.82rem">
        <div style="font-weight:700;margin-bottom:10px">Infrastructure</div>
        <div style="color:#666">Database: Supabase PostgreSQL (SSL Enabled)</div>
        <div style="color:#666">Payment: Razorpay Live (rzp_live_zjeiubuGNL14xv)</div>
        <div style="color:#666">Email: Hostinger SMTP (contact@blinkopticals.com)</div>
        <div><a href="/api/health" target="_blank" style="color:var(--accent);font-size:.85rem;margin-top:10px;display:block">API Health Check ↗</a></div>
    </div>`;
};
window.saveSettings = async function(e) {
    e.preventDefault();
    const r = await putAPI(`/api/business/${BIZ}`, { business_name:document.getElementById('s-name').value, email:document.getElementById('s-email').value, mobile_number:document.getElementById('s-mobile').value, gst_number:document.getElementById('s-gst').value, invoice_prefix:document.getElementById('s-prefix').value, address:document.getElementById('s-addr').value, city:document.getElementById('s-city').value, state:document.getElementById('s-state').value, active_status: true });
    if(r.success) toast('Settings updated!'); else toast(r.error,'error');
};

/* ── POS TERMINAL ── */
let posCart = [];
let posCustomer = null;
let _posFilters = { search: '', brand_id: '', gender_id: '', color_code: '', size_code: '', in_stock: 'true' };

window.load_pos = async function() {
    const el = document.getElementById('view-pos');
    el.innerHTML = `
    <div class="pos-container">
        <!-- Left: Product Discovery -->
        <div class="pos-main">
            <!-- Filter Bar -->
            <div class="pos-search-bar" style="flex-direction:column;gap:8px;padding:12px;">
                <!-- Row 1: Search + In-Stock Toggle -->
                <div style="display:flex;gap:8px;align-items:center;width:100%;">
                    <input type="text" id="pos-search" placeholder="🔍  Search by Model No / SKU / Product Name..." 
                        style="flex:1;padding:10px 14px;border-radius:8px;border:1px solid var(--border);font-size:0.9rem;"
                        oninput="_debounce(posSearch, 300)(this.value)">
                    <button class="btn btn-primary btn-sm" onclick="posQuickAdd()" style="background:#6366f1; border-color:#6366f1;">
                        <i class="fas fa-plus-circle"></i> ⚡ Quick Add
                    </button>
                    <button class="btn btn-sm" id="pos-mode-toggle" onclick="togglePosMode()" style="background:#f59e0b;border:none;color:#fff;font-weight:700;border-radius:8px;padding:8px 16px;">
                        🔬 POS Order
                    </button>
                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;white-space:nowrap;font-size:0.85rem;color:#555;">
                        <input type="checkbox" id="pos-instock" checked onchange="posApplyFilters()" style="width:16px;height:16px;accent-color:var(--accent);">
                        In Stock Only
                    </label>
                    <button class="btn btn-outline btn-sm" onclick="posResetFilters()">Reset</button>
                </div>
                <!-- Row 2: Dropdowns -->
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <select id="pos-filter-brand" style="flex:1;min-width:120px;padding:7px 10px;border-radius:6px;border:1px solid var(--border);font-size:0.82rem;" onchange="posApplyFilters()">
                        <option value="">All Brands</option>
                    </select>
                    <select id="pos-filter-gender" style="flex:1;min-width:100px;padding:7px 10px;border-radius:6px;border:1px solid var(--border);font-size:0.82rem;" onchange="posApplyFilters()">
                        <option value="">All Genders</option>
                    </select>
                    <input type="text" id="pos-filter-color" placeholder="Color Code..." 
                        style="flex:1;min-width:110px;padding:7px 10px;border-radius:6px;border:1px solid var(--border);font-size:0.82rem;"
                        oninput="_debounce(posApplyFilters, 400)()">
                    <input type="text" id="pos-filter-size" placeholder="Size Code..." 
                        style="flex:1;min-width:100px;padding:7px 10px;border-radius:6px;border:1px solid var(--border);font-size:0.82rem;"
                        oninput="_debounce(posApplyFilters, 400)()">
                    <div id="pos-filter-count" style="display:flex;align-items:center;font-size:0.8rem;color:#888;white-space:nowrap;padding:0 4px;"></div>
                </div>
            </div>
            <div class="pos-grid" id="posGrid">
                ${Array(12).fill('<div class="pos-product-card skeleton"></div>').join('')}
            </div>
        </div>
        
        <!-- Right: Cart & Checkout -->
        <div class="pos-sidebar">
            <div class="pos-customer-section" id="posCustBox">
                <button class="btn btn-outline btn-sm" style="width:100%; border-color:var(--danger); color:var(--danger);" onclick="openPosCustSearch()">Select Customer (Required)</button>
            </div>
            
            <div class="pos-cart">
                <div class="cart-header">Items (<span id="cartCount">0</span>)</div>
                <div class="cart-items" id="posCartItems">
                    <div style="text-align:center;padding:40px;color:#888;font-size:.9rem">Cart is empty</div>
                </div>
            </div>
            
            <div class="pos-summary">
                <div class="summ-row"><span>Subtotal (MRP)</span><span id="posSubtotal">₹0.00</span></div>
                <div class="summ-row" id="posOfferDiscountRow" style="display:none; color:var(--success);"><span>Offer Discount</span><span id="posOfferDiscount">₹0.00</span></div>
                <div class="summ-row" id="posCouponDiscountRow" style="display:none; color:var(--primary);"><span>Coupon Discount</span><span id="posCouponDiscount">₹0.00</span></div>
                <div class="summ-row" id="posTaxContainer" style="display:flex; flex-direction:column; gap:5px; padding:10px 0;"></div>
                <div class="summ-row total"><span>Total</span><span id="posTotal">₹0.00</span></div>
                <button class="btn btn-primary pos-pay-btn" onclick="posCheckout()">Proceed to Payment</button>
            </div>
        </div>
    </div>`;
    
    // Load filter options + Offers + Tax rules
    const [brands, genders, offers, taxes] = await Promise.all([
        api(`/api/master/brands?business_id=${BIZ}`),
        api(`/api/master/genders?business_id=${BIZ}`),
        api(`/api/marketing/offers?status=active`),
        api(`/api/tax/rules`)
    ]);

    window.posActiveOffers = offers.data || [];
    window.posTaxRules = taxes.data || [];

    const brandSel = document.getElementById('pos-filter-brand');
    const genderSel = document.getElementById('pos-filter-gender');
    (brands.data||[]).forEach(b => brandSel.add(new Option(b.name, b.id)));
    (genders.data||[]).forEach(g => genderSel.add(new Option(g.name, g.id)));

    // Set debounce helper if not exists
    if (!window._debounce) {
        window._debounce = (fn, delay) => {
            let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
        };
    }

    await posApplyFilters();
};

window.posSearch = function(val) {
    _posFilters.search = val;
    posApplyFilters();
};

window.posResetFilters = function() {
    document.getElementById('pos-search').value = '';
    document.getElementById('pos-filter-brand').value = '';
    document.getElementById('pos-filter-gender').value = '';
    document.getElementById('pos-filter-color').value = '';
    document.getElementById('pos-filter-size').value = '';
    document.getElementById('pos-instock').checked = true;
    _posFilters = { search: '', brand_id: '', gender_id: '', color_code: '', size_code: '', in_stock: 'true' };
    posApplyFilters();
};

window.posApplyFilters = async function() {
    _posFilters.search    = (document.getElementById('pos-search')?.value || '').trim();
    _posFilters.brand_id  = document.getElementById('pos-filter-brand')?.value || '';
    _posFilters.gender_id = document.getElementById('pos-filter-gender')?.value || '';
    _posFilters.color_code= (document.getElementById('pos-filter-color')?.value || '').trim();
    _posFilters.size_code = (document.getElementById('pos-filter-size')?.value || '').trim();
    _posFilters.in_stock  = document.getElementById('pos-instock')?.checked ? 'true' : '';

    const grid = document.getElementById('posGrid');
    if (grid) grid.innerHTML = Array(8).fill('<div class="pos-product-card skeleton"></div>').join('');

    const showroom_id = document.getElementById('globalShowroom')?.value || '';
    let path = `/api/products?business_id=${BIZ}&limit=60&in_stock=${_posFilters.in_stock}`;
    if (showroom_id)            path += `&showroom_id=${showroom_id}`;
    if (_posFilters.search)     path += `&search=${encodeURIComponent(_posFilters.search)}`;
    if (_posFilters.brand_id)   path += `&brand_id=${_posFilters.brand_id}`;
    if (_posFilters.gender_id)  path += `&gender_id=${_posFilters.gender_id}`;
    if (_posFilters.color_code) path += `&color_code=${encodeURIComponent(_posFilters.color_code)}`;
    if (_posFilters.size_code)  path += `&size_code=${encodeURIComponent(_posFilters.size_code)}`;

    const d = await api(path);
    const items = d.data || [];

    const countEl = document.getElementById('pos-filter-count');
    if (countEl) countEl.textContent = `${items.length} product${items.length !== 1 ? 's' : ''}`;

    renderPosProducts(items);
};

function renderPosProducts(items) {
    const grid = document.getElementById('posGrid');
    if (!grid) return;

    if (!items.length) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#999;">
            <div style="font-size:3rem;margin-bottom:10px;">📦</div>
            <h4>No products found</h4>
            <p style="font-size:0.85rem;">Try adjusting your search or filters</p>
        </div>`;
        return;
    }

    // Local price formatter — always rounds to nearest integer
    const fmtPrice = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

    grid.innerHTML = items.map(p => {
        const mrp = parseFloat(p.mrp || 0);
        let finalPrice = mrp;
        let offerBadgeHtml = '';

        // Check for active offers
        const applicableOffer = (window.posActiveOffers || []).find(o => {
            if (o.apply_on === 'Product' && o.apply_target === p.product_id) return true;
            if (o.apply_on === 'Brand' && o.apply_target === p.brand_name) return true;
            if (o.apply_on === 'Category' && o.apply_target === p.category_name) return true;
            return false;
        });

        if (applicableOffer) {
            const val = parseFloat(applicableOffer.discount_value);
            const isPerc = applicableOffer.offer_type.includes('Percentage');
            finalPrice = isPerc ? (mrp * (1 - val/100)) : Math.max(0, mrp - val);
            offerBadgeHtml = `<div class="pos-offer-tag">${Math.round(val)}${isPerc ? '%' : '₹'} OFF</div>`;
        }

        const stockQty = parseInt(p.total_stock || 0);
        const isOutOfStock = stockQty <= 0;
        const cardStyle = isOutOfStock ? 'opacity:0.6; cursor:not-allowed;' : 'cursor:pointer;';

        let cartName = p.product_name;
        const clickFn = isOutOfStock ? '' : `onclick="addToPosCart('${p.product_id}', '${p.primary_variant_id}', '${cartName.replace(/'/g,"\\'")}',${ mrp}, ${Math.round(finalPrice)})"`;

        // Image
        const imgContent = p.main_image ? `<img src="${p.main_image}">` : `<span style="font-size:2rem;opacity:0.15;">🕶️</span>`;

        // Right-side detail stack
        const dModel = p.model_no   ? `<div class="pos-detail-item">${p.model_no}</div>` : '';
        const dColor = p.color_code ? `<div class="pos-detail-item"><span class="pos-detail-bullet">•</span> ${p.color_code}</div>` : '';
        const dSize  = p.size_code  ? `<div class="pos-detail-item"><span class="pos-detail-bullet">•</span> ${p.size_code}</div>` : '';
        const qtyPill = `<div class="pos-qty-pill" style="background:${isOutOfStock ? '#fee2e2' : '#dcfce7'}; color:${isOutOfStock ? '#991b1b' : '#166534'};">Qty: ${stockQty}</div>`;

        const priceFooter = finalPrice < mrp
            ? `<div class="pos-prices-row"><span class="pos-mrp-old">${fmtPrice(mrp)}</span><span class="pos-price-new">${fmtPrice(finalPrice)}</span></div>`
            : `<div class="pos-prices-row"><span class="pos-price-new">${fmtPrice(finalPrice)}</span></div>`;

        return `
        <div class="pos-product-card" style="${cardStyle}" ${clickFn}>
            ${offerBadgeHtml}
            <div class="pos-card-body">
                <div class="pos-img-box">${imgContent}</div>
                <div class="pos-details-stack">
                    ${dModel}
                    ${dColor}
                    ${dSize}
                    ${qtyPill}
                </div>
            </div>
            <div class="pos-card-footer">
                <div class="pos-card-name">${p.product_name}</div>
                ${priceFooter}
            </div>
        </div>`;
    }).join('');
}

window.posQuickAdd = async function() {
    const loader = `<div style="text-align:center; padding:40px"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`;
    openModal('⚡ Quick Product Entry (Invoicing)', loader);

    const [brands, cats, genders] = await Promise.all([
        api(`/api/master/brands?business_id=${BIZ}`),
        api(`/api/master/categories?business_id=${BIZ}`),
        api(`/api/master/genders?business_id=${BIZ}`)
    ]);

    const buildOpts = (list) => (list.data || []).map(m => `<option value="${m.id}">${m.name}</option>`).join('');

    const form = `
    <form onsubmit="submitPosQuickAdd(event)">
        <div style="background:#f0f7ff; padding:12px; border-radius:8px; margin-bottom:15px; font-size:0.8rem; color:#1e40af">
            <i class="fas fa-info-circle"></i> Create a product + variant + stock instantly.
        </div>
        <div class="form-grid-2">
            <div class="form-row" style="grid-column: 1/-1"><label>Product Name (Opt)</label><input id="qp-name" placeholder="Leave empty to auto-generate"></div>
            <div class="form-row"><label>Brand *</label><select id="qp-brand" required><option value="">Select</option>${buildOpts(brands)}</select></div>
            <div class="form-row"><label>Model No *</label><input id="qp-model" required placeholder="e.g. RX3447V"></div>
            <div class="form-row"><label>Category</label><select id="qp-cat"><option value="">Select</option>${buildOpts(cats)}</select></div>
            <div class="form-row"><label>Gender</label><select id="qp-gender"><option value="">Select</option>${buildOpts(genders)}</select></div>
            <div class="form-row"><label>Color Code</label><input id="qp-color" placeholder="e.g. 2500"></div>
            <div class="form-row"><label>Size Code</label><input id="qp-size" placeholder="e.g. 50"></div>
            <div class="form-row"><label>MRP / Selling Price *</label><input id="qp-mrp" type="number" required placeholder="0.00"></div>
            <div class="form-row"><label>Initial Qty *</label><input id="qp-qty" type="number" value="1" required></div>
        </div>
        <button class="btn btn-primary" type="submit" style="width:100%; margin-top:20px; background:#6366f1; border-color:#6366f1;">
            <i class="fas fa-bolt"></i> Add to Catalog & POS
        </button>
    </form>`;

    document.querySelector('.modal-body').innerHTML = form;
};

window.submitPosQuickAdd = async function(e) {
    e.preventDefault();
    const showroom_id = document.getElementById('globalShowroom')?.value;
    if (!showroom_id) return toast('Select a showroom first!', 'error');

    const body = {
        product_name: document.getElementById('qp-name').value,
        brand_id: document.getElementById('qp-brand').value,
        model_no: document.getElementById('qp-model').value,
        category_id: document.getElementById('qp-cat').value || null,
        gender_id: document.getElementById('qp-gender').value || null,
        color_code: document.getElementById('qp-color').value,
        size_code: document.getElementById('qp-size').value,
        mrp: parseFloat(document.getElementById('qp-mrp').value),
        qty: parseInt(document.getElementById('qp-qty').value),
        showroom_id: showroom_id
    };

    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

    const r = await postAPI('/api/products/quick-entry', body);
    if (r.success) {
        closeModal();
        toast('Product added to catalog!');
        
        // Auto-refresh search to show new item
        document.getElementById('pos-search').value = body.model_no;
        posApplyFilters();
    } else {
        toast(r.error, 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-bolt"></i> Add to Catalog & POS';
    }
};


window.addToPosCart = async function(product_id, variant_id, name, mrp, price) {
    const existing = posCart.find(i => i.product_id === product_id && i.variant_id === variant_id);
    if (existing) {
        existing.qty++;
    } else {
        posCart.push({ product_id, variant_id, name, mrp, price, qty: 1 });
    }
    await updatePosCart();
};

window.updatePosCart = async function() {
    const list = document.getElementById('posCartItems');
    list.innerHTML = posCart.map((item, idx) => {
        const discount = (item.mrp - item.price) * item.qty;
        return `
        <div class="cart-item">
            <div class="item-name">${item.name}</div>
            <div class="item-ctrl">
                <div class="qty-btn" onclick="adjustPosQty(${idx}, -1)">-</div>
                <div class="item-qty">${item.qty}</div>
                <div class="qty-btn" onclick="adjustPosQty(${idx}, 1)">+</div>
                <div class="item-price">
                    ${discount > 0 ? `<div style="font-size:0.7rem; text-decoration:line-through; color:#aaa;">${fmt(item.mrp * item.qty)}</div>` : ''}
                    <div>${fmt(item.price * item.qty)}</div>
                </div>
            </div>
        </div>`;
    }).join('') || '<div style="text-align:center;padding:40px;color:#888;font-size:.9rem">Cart is empty</div>';
        
    const subTotalMrp = Math.round(posCart.reduce((sum, i) => sum + (i.mrp * i.qty), 0));
    const offerDiscount = Math.round(posCart.reduce((sum, i) => sum + (i.mrp - i.price) * i.qty, 0));
    const cartAfterOffer = subTotalMrp - offerDiscount;
    
    // Apply Coupon if any
    const couponDiscount = window.appliedCoupon ? (window.appliedCoupon.discount_type === 'Percentage' ? (cartAfterOffer * window.appliedCoupon.discount_value / 100) : window.appliedCoupon.discount_value) : 0;
    const finalSubtotal = Math.round(cartAfterOffer - couponDiscount);
    
    // === Multi-Tiered GST Engine ===
    const showroom_id = document.getElementById('globalShowroom')?.value || '';
    window.posCartTaxRules = window.posCartTaxRules || {}; 
    
    try {
        const taxPayload = {
            items: posCart.map(i => ({ product_id: i.product_id, price: i.price, qty: i.qty })),
            customer_id: posCustomer?.id || null,
            showroom_id: showroom_id || null
        };
        const taxRes = await api('/api/tax/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(taxPayload) });
        if (taxRes.success && taxRes.breakdown) {
            taxRes.breakdown.forEach(b => { window.posCartTaxRules[b.product_id] = b.tax_percent; });
        }
    } catch(e) {}
    
    let taxBreakdownMap = {};
    let finalTaxValue = 0;
    
    posCart.forEach(i => {
        const taxP = window.posCartTaxRules[i.product_id] || 18;
        const itemPriceAfterOffer = (i.mrp * i.qty) - ((i.mrp - i.price) * i.qty);
        const weight = cartAfterOffer > 0 ? (itemPriceAfterOffer / cartAfterOffer) : 0;
        const itemSharedDiscount = couponDiscount * weight;
        
        const netAmount = itemPriceAfterOffer - itemSharedDiscount;
        const taxableValue = netAmount / (1 + taxP / 100);
        const itemTax = netAmount - taxableValue;
        
        finalTaxValue += itemTax;
        
        if(!taxBreakdownMap[taxP]) taxBreakdownMap[taxP] = { taxable: 0, tax: 0 };
        taxBreakdownMap[taxP].taxable += taxableValue;
        taxBreakdownMap[taxP].tax += itemTax;
    });

    window.posCartTaxValue = finalTaxValue;

    document.getElementById('cartCount').textContent = posCart.reduce((sum, i) => sum + i.qty, 0);
    document.getElementById('posSubtotal').textContent = fmt(subTotalMrp);
    
    const offerRow = document.getElementById('posOfferDiscountRow');
    if (offerRow) {
        if (offerDiscount > 0) {
            offerRow.style.display = 'flex';
            document.getElementById('posOfferDiscount').textContent = `-${fmt(offerDiscount)}`;
        } else offerRow.style.display = 'none';
    }

    const couponRow = document.getElementById('posCouponDiscountRow');
    if (couponRow) {
        if (couponDiscount > 0) {
            couponRow.style.display = 'flex';
            document.getElementById('posCouponDiscount').textContent = `-${fmt(couponDiscount)}`;
        } else couponRow.style.display = 'none';
    }

    const taxContainer = document.getElementById('posTaxContainer');
    if (taxContainer) {
        if(Object.keys(taxBreakdownMap).length > 0) {
            taxContainer.innerHTML = Object.entries(taxBreakdownMap).map(([rate, data]) => `
                <div style="display:flex; justify-content:space-between; width:100%; font-size:0.85rem; color:var(--text); margin-bottom:2px;">
                    <span>CGST (${parseFloat(rate)/2}%)</span><span>${fmt(data.tax/2)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; width:100%; font-size:0.85rem; color:var(--text); margin-bottom:2px;">
                    <span>SGST (${parseFloat(rate)/2}%)</span><span>${fmt(data.tax/2)}</span>
                </div>
            `).join('');
        } else {
            taxContainer.innerHTML = '';
        }
    }
    document.getElementById('posTotal').textContent = fmt(finalSubtotal);
};

window.adjustPosQty = async function(idx, delta) {
    posCart[idx].qty += delta;
    if (posCart[idx].qty <= 0) posCart.splice(idx, 1);
    await updatePosCart();
};

window.openPosCustSearch = function() {
    openModal('Select Customer', `
        <div style="display:flex;gap:10px;margin-bottom:15px">
            <input type="text" class="filter-input" placeholder="Search name/mobile..." oninput="posCustSearch(this.value)" style="flex:1">
            <button class="btn btn-primary" onclick="showPosAddCustomer()">+ New</button>
        </div>
        <div id="posCustResults" style="max-height:300px;overflow-y:auto"></div>
    `);
    posCustSearch('');
};

window.showPosAddCustomer = function() {
    document.getElementById('posCustResults').innerHTML = `
        <div style="background:#f9f9f9;padding:15px;border-radius:8px;border:1px solid var(--border);margin-top:10px;">
            <div style="font-weight:700;margin-bottom:10px;font-size:0.85rem;color:#555;">Quick Add Customer</div>
            <div class="form-row"><input type="text" id="qc-name" placeholder="Full Name *" class="filter-input" style="width:100%;margin-bottom:10px;"></div>
            <div class="form-row"><input type="text" id="qc-mobile" placeholder="Mobile Number *" class="filter-input" style="width:100%;margin-bottom:10px;"></div>
            <div class="form-row"><input type="email" id="qc-email" placeholder="Email Address (Optional)" class="filter-input" style="width:100%;margin-bottom:10px;"></div>
            <button class="btn btn-primary" style="width:100%;" onclick="savePosCustomer()">Save & Select</button>
        </div>
    `;
};

window.savePosCustomer = async function() {
    const name = document.getElementById('qc-name').value;
    const mobile = document.getElementById('qc-mobile').value;
    const email = document.getElementById('qc-email').value;
    if(!name || !mobile) return toast('Name and Mobile are required', 'warn');
    
    // Create logic
    const r = await postAPI('/api/customers', { business_id: BIZ, name, mobile, email });
    if(r.success) {
        toast('Customer Created!');
        setPosCust(r.customer_id, name);
    } else {
        toast(r.error, 'error');
    }
};

window.posCustSearch = async function(q) {
    const d = await api(`/api/customers?business_id=${BIZ}&search=${encodeURIComponent(q)}&limit=5`);
    document.getElementById('posCustResults').innerHTML = (d.data||[]).map(c => `
        <div class="search-result-item" onclick="setPosCust('${c.customer_id}', '${c.name.replace(/'/g,"\\'")}', '${(c.mobile||'').replace(/'/g,"\\'")}', '${(c.city||'').replace(/'/g,"\\'")}')"> 
            <b>${c.name}</b> <br> <small>${c.mobile || ''} ${c.city ? '· '+c.city : ''}</small>
        </div>`).join('') || '<div style="padding:10px;color:#888">No customers found</div>';
};

window.setPosCust = function(id, name, mobile, city) {
    if (!id) return;
    posCustomer = { id, name, mobile: mobile || '', city: city || '' };
    const meta = [mobile, city].filter(Boolean).join(' · ');
    document.getElementById('posCustBox').innerHTML = `
        <div class="selected-cust" style="border-color:var(--accent);">
            <div>
                <div style="font-weight:700;">👤 ${name}</div>
                ${meta ? `<div style="font-size:0.75rem;color:#64748b;margin-top:2px;">${meta}</div>` : ''}
            </div>
            <button class="btn-text" onclick="openPosCustSearch()">Change</button>
        </div>`;
    closeModal();
};

window.posCheckout = async function() {
    if (posCart.length === 0) return toast('Cart is empty', 'warn');
    
    const showroom = document.getElementById('globalShowroom')?.value;
    if (!showroom) return toast('Please select a showroom from the top bar to process POS orders.', 'error');

    if (!posCustomer || !posCustomer.id) return toast('Please select a customer to process the invoice.', 'error');

    const subTotalMrp = Math.round(posCart.reduce((sum, i) => sum + (i.mrp * i.qty), 0));
    const offerDiscount = Math.round(posCart.reduce((sum, i) => sum + (i.mrp - i.price) * i.qty, 0));
    const cartAfterOffer = subTotalMrp - offerDiscount;
    const couponDiscount = window.appliedCoupon ? (window.appliedCoupon.discount_type === 'Percentage' ? (cartAfterOffer * window.appliedCoupon.discount_value / 100) : window.appliedCoupon.discount_value) : 0;
    const finalSubtotal = Math.round(cartAfterOffer - couponDiscount);
    const taxValue = window.posCartTaxValue || 0;
    const total = finalSubtotal;
    
    const couponHTML = window.appliedCoupon ? `<div style="font-size:0.85rem; color:var(--primary); margin-top:5px;">Coupon ${window.appliedCoupon.code} (${window.appliedCoupon.discount_type === 'Percentage' ? window.appliedCoupon.discount_value + '%' : '₹' + fmt(window.appliedCoupon.discount_value)}): -${fmt(couponDiscount)}</div>` : '';
    
    openModal('Finalize Payment', `
        <div style="text-align:center;margin-bottom:20px; background:var(--bg); padding:20px; border-radius:12px;">
            <div style="font-size:0.8rem; color:var(--muted); text-transform:uppercase; font-weight:700;">Payable Amount</div>
            <div style="font-size:2.5rem;font-weight:900; color:var(--accent);" id="pos-final-total">${fmt(total)}</div>
            <div id="pos-final-breakdown" style="font-size:0.85rem; color:var(--text); margin-top:5px;">
                Taxable: ${fmt(total - taxValue)} | Total Tax: ${fmt(taxValue)}
            </div>
            ${couponHTML}
        </div>

        <div style="display:flex; gap:10px; margin-bottom:15px;">
            <div style="flex:1;">
                <label style="font-size:0.75rem; font-weight:700; color:var(--muted);">Coupon Code</label>
                <div style="display:flex; gap:5px;">
                    <input type="text" id="pos-coupon-input" value="${window.appliedCoupon?.code || ''}" class="filter-input" style="flex:1" placeholder="ENTER CODE">
                    <button class="btn btn-primary btn-sm" onclick="validatePosCoupon()">Apply</button>
                </div>
            </div>
            <div style="width:120px;">
                <label style="font-size:0.75rem; font-weight:700; color:var(--muted);">Manual Disc.</label>
                <input type="number" id="pos-manual-discount" value="0" class="filter-input" style="width:100%" oninput="updatePosCalculatedFinal()">
            </div>
        </div>

        <div class="form-row"><label>Payment Method</label>
            <select id="pay-method" style="width:100%;padding:10px;border-radius:6px;border:1px solid var(--border)">
                <option>Cash</option><option>UPI / QR Scan</option><option>Credit Card</option><option>Debit Card</option>
            </select>
        </div>
        <button class="btn btn-primary" style="width:100%;margin-top:20px;height:55px;font-size:1.1rem; border-radius:12px; font-weight:800;" onclick="submitPosOrder()">
            <i class="fas fa-check-circle"></i> Complete Transaction
        </button>
    `);
    
    // Auto-render detailed tax breakdown
    setTimeout(window.updatePosCalculatedFinal, 50);
};

window.validatePosCoupon = async function() {
    const code = document.getElementById('pos-coupon-input').value.trim();
    if (!code) {
        window.appliedCoupon = null;
        updatePosCart();
        posCheckout();
        return;
    }

    const subTotalMrp = Math.round(posCart.reduce((sum, i) => sum + (i.mrp * i.qty), 0));
    const offerDiscount = Math.round(posCart.reduce((sum, i) => sum + (i.mrp - i.price) * i.qty, 0));
    const amount = subTotalMrp - offerDiscount;

    const r = await postAPI('/api/marketing/coupons/validate', { code, order_amount: amount, business_id: BIZ });
    if (r.success) {
        window.appliedCoupon = r.coupon;
        toast(`Coupon ${code} applied: -${fmt(r.discount)}`);
        updatePosCart();
        posCheckout();
    } else {
        toast(r.error, 'error');
    }
};

window.updatePosCalculatedFinal = function() {
    const subTotalMrp = Math.round(posCart.reduce((sum, i) => sum + (i.mrp * i.qty), 0));
    const offerDiscount = Math.round(posCart.reduce((sum, i) => sum + (i.mrp - i.price) * i.qty, 0));
    const cartAfterOffer = subTotalMrp - offerDiscount;
    const couponDiscount = window.appliedCoupon ? (window.appliedCoupon.discount_type === 'Percentage' ? (cartAfterOffer * window.appliedCoupon.discount_value / 100) : window.appliedCoupon.discount_value) : 0;
    
    let manualDisc = parseFloat(document.getElementById('pos-manual-discount').value || 0);
    if (manualDisc < 0) manualDisc = 0;
    if (manualDisc > (cartAfterOffer - couponDiscount)) {
        manualDisc = cartAfterOffer - couponDiscount;
        document.getElementById('pos-manual-discount').value = manualDisc;
    }
    
    const finalSubtotal = Math.round(cartAfterOffer - couponDiscount - manualDisc);
    const defaultTax = window.posCartTaxRate || 18;
    const taxValue = Math.round(finalSubtotal - (finalSubtotal / (1 + defaultTax / 100)));
    const total = finalSubtotal;
    
    const ftl = document.getElementById('pos-final-total');
    if (ftl) ftl.textContent = fmt(total);
    const fbd = document.getElementById('pos-final-breakdown');
    if (fbd) {
        let text = `Taxable: ${fmt(total - taxValue)} | CGST ${defaultTax/2}%: ${fmt(taxValue/2)} | SGST ${defaultTax/2}%: ${fmt(taxValue/2)}`;
        if (manualDisc > 0) text += `<div style="color:var(--danger); margin-top:4px; font-weight:600;">Manual Disc: -${fmt(manualDisc)}</div>`;
        fbd.innerHTML = text;
    }
};

window.updatePosFinalTotal = function(sub, tax) {
    const disc = parseFloat(document.getElementById('pos-discount').value || 0);
    const total = Math.max(0, sub + tax - disc);
    document.getElementById('pos-final-total').textContent = fmt(total);
};

window.submitPosOrder = async function() {
    const method = document.getElementById('pay-method').value;
    const manualDiscount = parseFloat(document.getElementById('pos-manual-discount')?.value || 0);
    const isOnline = method !== 'Cash';
    
    // Economics
    const subTotalMrp = Math.round(posCart.reduce((sum, i) => sum + (i.mrp * i.qty), 0));
    const offerDiscount = Math.round(posCart.reduce((sum, i) => sum + (i.mrp - i.price) * i.qty, 0));
    const cartAfterOffer = subTotalMrp - offerDiscount;
    const couponDiscount = window.appliedCoupon ? (window.appliedCoupon.discount_type === 'Percentage' ? (cartAfterOffer * window.appliedCoupon.discount_value / 100) : window.appliedCoupon.discount_value) : 0;
    
    const finalSubtotal = Math.round(cartAfterOffer - couponDiscount - manualDiscount);
    const defaultTaxRate = window.posCartTaxRate || 18;
    const taxValue = Math.round(finalSubtotal - (finalSubtotal / (1 + defaultTaxRate / 100)));
    const total = finalSubtotal;
    
    // Total combined discount to save in DB
    const totalDiscountAmount = Math.round(offerDiscount + couponDiscount + manualDiscount);

    // 1. Create order in DB first (always)
    const orderData = {
        business_id: BIZ,
        customer_id: posCustomer?.id || null,
        showroom_id: document.getElementById('globalShowroom')?.value || null,
        order_type: 'POS',
        payment_mode: method,
        amount_paid: isOnline ? 0 : total, 
        discount_amount: totalDiscountAmount,
        subtotal: subTotalMrp,
        tax_amount: taxValue,
        total_amount: total,
        coupon_code: window.appliedCoupon?.code || null,
        items: posCart.map(i => ({ 
            product_id: i.product_id, 
            variant_id: i.variant_id === 'null' || i.variant_id === 'undefined' ? null : i.variant_id,
            quantity: i.qty, 
            unit_price: i.mrp, // Store MRP as unit price, discount handles the rest
            discount: (i.mrp - i.price) // Item level discount (from offer)
        }))
    };
    
    const r = await postAPI('/api/orders', orderData);
    if (!r.success) return toast(r.error, 'error');

    const order_id = r.order_id;

    if (!isOnline) {
        finishOrder();
    } else {
        // Razorpay Flow
        try {
            const pr = await postAPI('/api/payment/create-order', { amount: total, order_id });
            if (!pr.success) throw new Error(pr.error);

            const options = {
                key: pr.key,
                amount: pr.order.amount,
                currency: pr.order.currency,
                name: "Blink Opticals",
                description: "POS Transaction",
                order_id: pr.order.id,
                handler: async function (response) {
                    const vr = await postAPI('/api/payment/verify', {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        amount: total,
                        order_id: order_id,
                        business_id: BIZ
                    });
                    if (vr.success) {
                        toast('Payment Verified & Order Completed!');
                        finishOrder();
                    } else {
                        toast('Payment verification failed: ' + vr.error, 'error');
                    }
                },
                prefill: {
                    name: posCustomer?.name || "",
                    contact: "" 
                },
                theme: { color: "#10b981" },
                modal: { ondismiss: function() { toast('Payment cancelled', 'warn'); } }
            };
            const rzp = new Razorpay(options);
            rzp.open();
        } catch (err) {
            toast('Payment Initiation Failed: ' + err.message, 'error');
        }
    }

    function finishOrder() {
        showPosSuccess(order_id);
    }
};

window.showPosSuccess = function(orderId) {
    const custEmail = posCustomer?.email || '';
    posCart = [];
    posCustomer = null;
    load_pos();

    openModal('Order Successful', `
        <div style="text-align:center;padding:20px;">
            <div style="font-size:3rem;color:var(--accent);margin-bottom:15px;">✅</div>
            <h2 style="margin-bottom:10px;">Transaction Completed</h2>
            <p style="color:#666;margin-bottom:25px;">Order ID: <b>${orderId}</b></p>
            
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
                <button class="btn btn-outline" onclick="previewPosInvoice('${orderId}')">
                    <i class="fa fa-eye"></i> Preview
                </button>
                <button class="btn btn-outline" onclick="printPosInvoice('${orderId}')">
                    <i class="fa fa-print"></i> Print
                </button>
                <button class="btn btn-outline" onclick="emailPosInvoice('${orderId}', '${custEmail}')">
                    <i class="fa fa-envelope"></i> Email
                </button>
            </div>
            <button class="btn btn-primary" style="width:100%;margin-top:15px;" onclick="closeModal()">Done</button>
        </div>
    `);
};

window.previewPosInvoice = async function(orderId) {
    const r = await api(`/api/invoice/${orderId}`);
    if(!r.success) return toast(r.error, 'error');
    const d = r.invoice_data;

    const itemsHtml = d.items.map(i => `
        <tr>
            <td style="padding:4px 0;font-size:0.85rem;">${i.product_name}</td>
            <td style="text-align:center;">${i.quantity}</td>
            <td style="text-align:right;">${fmt(i.total_price)}</td>
        </tr>
    `).join('');

    openModal('Invoice Preview', `
        <div style="font-family:Inter,sans-serif;background:#fff;padding:15px;border-radius:8px;border:1px solid #eee;max-height:450px;overflow-y:auto;">
            <div style="text-align:center;margin-bottom:15px;border-bottom:1px solid #eee;padding-bottom:10px;">
                <h3 style="margin:0">${d.business.name}</h3>
                <small>${d.showroom.name}</small>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:15px;color:#666;">
                <span>INV: ${d.order.invoice_no}</span>
                <span>${fmtDate(d.order.created_at)}</span>
            </div>
            <table style="width:100%;font-size:0.85rem;margin-bottom:15px;">
                <thead style="border-bottom:1px solid #eee;">
                    <tr><th style="text-align:left">Item</th><th>Qty</th><th style="text-align:right">Total</th></tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
            </table>
            <div style="text-align:right;border-top:1px solid #eee;padding-top:10px;">
                <div style="font-size:0.8rem;color:#888;">Tax inclusive: ${fmt(d.order.tax_amount || 0)}</div>
                <div style="font-weight:700;font-size:1.1rem;margin-top:5px;">Grand Total: ${fmt(d.order.total_amount)}</div>
            </div>
        </div>
        <div style="margin-top:20px;display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <button class="btn btn-primary" onclick="printPosInvoice('${orderId}')">Print Now</button>
            <button class="btn btn-outline" onclick="closeModal()">Close</button>
        </div>
    `);
};

window.printPosInvoice = async function(orderId) {
    const r = await api(`/api/invoice/${orderId}`);
    if(!r.success) return toast(r.error, 'error');
    const d = r.invoice_data;

    let itemsTotalAmount = 0;
    const itemsHtml = d.items.map((i, idx) => {
        itemsTotalAmount += i.net_amount;
        return `
        <tr>
            <td style="padding:6px;border-bottom:1px solid #ddd;font-size:0.8rem;text-align:center;">${idx + 1}</td>
            <td style="padding:6px;border-bottom:1px solid #ddd;font-size:0.8rem;">${i.product_name}</td>
            <td style="padding:6px;border-bottom:1px solid #ddd;font-size:0.8rem;text-align:center;">${parseFloat(i.quantity).toFixed(2)}</td>
            <td style="padding:6px;border-bottom:1px solid #ddd;font-size:0.8rem;text-align:right;">${(i.unit_price * i.quantity).toFixed(2)}</td>
            <td style="padding:6px;border-bottom:1px solid #ddd;font-size:0.8rem;text-align:right;">${(i.total_discount).toFixed(2)}</td>
            <td style="padding:6px;border-bottom:1px solid #ddd;font-size:0.8rem;text-align:right;">${(i.taxable_value).toFixed(2)}</td>
            <td style="padding:6px;border-bottom:1px solid #ddd;font-size:0.8rem;text-align:center;">${i.hsn_code}</td>
            <td style="padding:6px;border-bottom:1px solid #ddd;font-size:0.8rem;text-align:center;">${i.tax_percent/2}%</td>
            <td style="padding:6px;border-bottom:1px solid #ddd;font-size:0.8rem;text-align:right;">${i.cgst.toFixed(2)}</td>
            <td style="padding:6px;border-bottom:1px solid #ddd;font-size:0.8rem;text-align:center;">${i.tax_percent/2}%</td>
            <td style="padding:6px;border-bottom:1px solid #ddd;font-size:0.8rem;text-align:right;">${i.sgst.toFixed(2)}</td>
            <td style="padding:6px;border-bottom:1px solid #ddd;font-size:0.8rem;text-align:right;">${i.net_amount.toFixed(2)}</td>
        </tr>
    `}).join('');

    const invoiceContent = (label) => `
        <div style="padding: 20px 40px; border-bottom: 2px dashed #ccc; position: relative;">
            <div style="position: absolute; top: 10px; right: 20px; font-size: 0.7rem; color: #999; border: 1px solid #eee; padding: 2px 8px; border-radius: 4px;">${label}</div>
            
            <div style="text-align:center; margin-bottom: 20px;">
                <h1 style="margin:0;font-size:1.6rem;text-transform:uppercase;">${d.business.name}</h1>
                <div style="font-size:0.8rem;margin-top:4px;">${d.showroom.address}, ${d.showroom.city}</div>
                <div style="font-size:0.8rem;">Phone : ${d.showroom.contact} | Email : ${d.business.email || 'N/A'}</div>
                <div style="font-size:0.9rem;font-weight:bold;margin-top:5px;text-decoration:underline;">TAX INVOICE</div>
            </div>
            
            <div style="display:flex; justify-content:space-between; margin-bottom:15px; font-size:0.85rem;">
                <div>
                    <div>Customer:</div>
                    <div style="font-weight:bold;font-size:1rem;margin-top:2px;">${d.customer.name === 'Walk-in Customer' ? '(WALKIN) Walk-in Customer' : d.customer.name}</div>
                    <div style="margin-top:4px;">Mobile : <b>${d.customer.mobile || '—'}</b></div>
                    <div>Email : ${d.customer.email || 'N/A'}</div>
                    <div>City : ${d.customer.city || '—'}</div>
                </div>
                <div style="text-align:right; width:280px;">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px; text-align:right;">
                        <div>Sales No :</div> <div style="font-weight:bold;">${d.order.invoice_no}</div>
                        <div>Sales Date :</div> <div style="font-weight:bold;">${fmtDate(d.order.created_at).split(',')[0]}</div>
                        <div>Order No :</div> <div style="font-weight:bold;">--</div>
                        <div>Sales Person :</div> <div style="font-weight:bold;">-</div>
                    </div>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
                <thead>
                    <tr style="border-top:1px solid #333; border-bottom:1px solid #333;">
                        <th style="padding:5px;text-align:center;">S No</th>
                        <th style="padding:5px;text-align:left;">Product Desc</th>
                        <th style="padding:5px;text-align:center;">Qty</th>
                        <th style="padding:5px;text-align:right;">Rate (₹)</th>
                        <th style="padding:5px;text-align:right;">Disc (₹)</th>
                        <th style="padding:5px;text-align:right;">Gross Rate (₹)</th>
                        <th style="padding:5px;text-align:center;">HSN</th>
                        <th style="padding:5px;text-align:center;">CGST%</th>
                        <th style="padding:5px;text-align:right;">CGST (₹)</th>
                        <th style="padding:5px;text-align:center;">SGST%</th>
                        <th style="padding:5px;text-align:right;">SGST (₹)</th>
                        <th style="padding:5px;text-align:right;">Amount (₹)</th>
                    </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
                <tfoot>
                     <tr style="border-top:1px solid #333; border-bottom:1px solid #333; font-weight:bold;">
                        <td colspan="2" style="text-align:right;padding:5px;">Grand Total</td>
                        <td style="text-align:center;padding:5px;">${d.items.reduce((s,i) => s + parseInt(i.quantity||1), 0).toFixed(2)}</td>
                        <td colspan="3" style="text-align:right;padding:5px;">₹${(d.order.calculated_taxable||0).toFixed(2)}</td>
                        <td colspan="3" style="text-align:right;padding:5px;">₹${d.totals.cgst.toFixed(2)}</td>
                        <td colspan="2" style="text-align:right;padding:5px;">₹${d.totals.sgst.toFixed(2)}</td>
                        <td style="text-align:right;padding:5px;">₹${d.order.total_amount.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
            
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:20px; font-size:0.85rem; padding-bottom:20px;">
                <div style="flex:1;">
                    <div>Remarks :</div>
                    <div>GST No : <span style="font-weight:bold;">${d.business.gstin}</span></div>
                </div>
                <div style="flex:1; display:flex; justify-content:flex-end;">
                   <table style="border-collapse:collapse; text-align:center;" border="1">
                       <thead><tr style="background:#f9f9f9; font-size:0.75rem;">
                           <th style="padding:4px 12px;">Date</th><th style="padding:4px 12px;">Type</th><th style="padding:4px 12px;">Mode</th><th style="padding:4px 12px;">Amount (₹)</th>
                       </tr></thead>
                       <tbody>
                           <tr style="font-size:0.8rem;">
                               <td style="padding:4px 12px;">${fmtDate(d.order.created_at).split(',')[0]}</td>
                               <td style="padding:4px 12px;">Bill</td>
                               <td style="padding:4px 12px;">Cash</td>
                               <td style="padding:4px 12px;">${d.order.total_amount}</td>
                           </tr>
                       </tbody>
                   </table>
                </div>
            </div>
            
            <div style="text-align:right; margin-top:5px; font-size:0.75rem;">
                This is a Computer Generated Invoice no Signature required.
            </div>
        </div>`;

    const printWin = window.open('', '_blank');
    printWin.document.write(`
        <html>
        <head>
            <title>Invoice ${d.order.invoice_no}</title>
            <style>
                body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; color: #000; }
                table { page-break-inside: avoid; }
                @media print { 
                    .no-print { display: none; } 
                    @page { margin: 0; }
                }
            </style>
        </head>
        <body>
            ${invoiceContent('CUSTOMER COPY')}
            <div style="height:20px;"></div>
            ${invoiceContent('OFFICE COPY')}
            <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
        </body>
        </html>
    `);
    printWin.document.close();
};

window.emailPosInvoice = async function(orderId, defaultEmail) {
    let email = defaultEmail;
    if(!email) {
        email = prompt("Enter customer email address:");
        if(!email) return;
    }

    toast('Sending invoice...', 'info');
    const r = await api(`/api/invoice/${orderId}`);
    if(!r.success) return toast(r.error, 'error');
    const d = r.invoice_data;

    const res = await postAPI('/api/email/invoice', {
        to: email,
        customer_name: d.customer?.name || 'Customer',
        invoice_number: d.order?.invoice_no || 'ORD-000',
        items: d.items,
        total_amount: d.totals?.grand_total || 0,
        payment_status: d.order?.payment_status || 'Pending'
    });

    if(res.success) toast('Invoice sent to ' + email);
    else toast('Failed to send email', 'error');
};

/* ── STOCK TRANSFERS ── */
window.load_transfers = async function() {
    const el = document.getElementById('view-transfers');
    el.innerHTML = `
    <div class="reports-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
        <div>
            <h2 style="margin:0; font-size:1.6rem; color:var(--primary)">Stock Transfers</h2>
            <p style="margin:0; color:#64748b; font-size:0.85rem">Intra-showroom stock movement & rebalancing</p>
        </div>
        <button class="btn btn-primary" onclick="openNewTransfer()">
            <i class="fas fa-plus"></i> New Transfer Request
        </button>
    </div>

    <!-- Stats Dashboard -->
    <div id="transfer-stats" class="stats-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:20px; margin-bottom:25px">
        <div class="stat-card glass"><div class="label">Pending</div><div class="value" id="stat-pending">0</div></div>
        <div class="stat-card glass"><div class="label">In Transit</div><div class="value" id="stat-transit">0</div></div>
        <div class="stat-card glass"><div class="label">Completed</div><div class="value" id="stat-completed">0</div></div>
    </div>

    <!-- Filters Bar -->
    <div class="filter-bar glass" style="padding:15px; border-radius:12px; margin-bottom:20px; display:flex; gap:15px; align-items:center; flex-wrap:wrap">
        <div class="filter-group">
            <label style="display:block; font-size:0.7rem; color:#64748b; margin-bottom:4px">STATUS</label>
            <select id="f-transfer-status" onchange="renderTransfers()" class="form-control" style="min-width:140px">
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Shipped">Shipped</option>
                <option value="Received">Received</option>
                <option value="Cancelled">Cancelled</option>
            </select>
        </div>
        <div class="filter-group" style="flex:1">
            <label style="display:block; font-size:0.7rem; color:#64748b; margin-bottom:4px">SEARCH</label>
            <input type="text" id="f-transfer-q" onkeyup="renderTransfers()" class="form-control" placeholder="Search product or ID...">
        </div>
    </div>

    <div class="card" style="border:none; box-shadow:var(--shadow-sm); border-radius:14px; overflow:hidden">
        <div class="table-container">
            <table>
                <thead>
                    <tr style="background:#f8fafc">
                        <th>ID</th>
                        <th>Product & SKU</th>
                        <th>Source</th>
                        <th>Destination</th>
                        <th style="text-align:center">Qty</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th style="text-align:right">Action</th>
                    </tr>
                </thead>
                <tbody id="transferList">${skelRows(8)}</tbody>
            </table>
        </div>
    </div>`;

    renderTransfers();
};

window.renderTransfers = async function() {
    const status = document.getElementById('f-transfer-status').value;
    const q      = document.getElementById('f-transfer-q').value;
    
    const r = await api(`/api/transfers?status=${status}&q=${q}`);
    if(!r.success) return;

    // Update Stats
    const stats = r.data.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
    }, {});
    document.getElementById('stat-pending').innerText = stats['Pending'] || 0;
    document.getElementById('stat-transit').innerText = stats['Shipped'] || 0;
    document.getElementById('stat-completed').innerText = stats['Received'] || 0;

    const list = document.getElementById('transferList');
    list.innerHTML = r.data.map(t => {
        return `
        <tr style="border-bottom:1px solid #f1f5f9">
            <td><small class="text-mono" style="background:#f1f5f9; padding:2px 4px; border-radius:4px">${t.transfer_id}</small></td>
            <td>
                <div style="font-weight:600; color:#0f172a">${t.product_name}</div>
                <div style="font-size:0.7rem; color:#64748b">${t.sku}</div>
            </td>
            <td><i class="fas fa-sign-out-alt" style="color:#ef4444; margin-right:5px"></i>${t.from_name}</td>
            <td><i class="fas fa-sign-in-alt" style="color:#10b981; margin-right:5px"></i>${t.to_name}</td>
            <td style="text-align:center; font-weight:700; color:var(--primary)">${t.quantity}</td>
            <td>${badge(t.status)}</td>
            <td><small style="color:#64748b">${fmtDate(t.created_at)}</small></td>
            <td style="text-align:right">
                <div style="display:flex; justify-content:flex-end; gap:6px">
                    ${t.status === 'Pending' ? `
                        <button class="btn btn-outline btn-sm" onclick="updateTransferStatus('${t.transfer_id}', 'Shipped')">Ship</button>
                        <button class="btn btn-outline btn-sm text-red" onclick="updateTransferStatus('${t.transfer_id}', 'Cancelled')"><i class="fas fa-times"></i></button>
                    ` : ''}
                    ${t.status === 'Shipped' ? `
                        <button class="btn btn-primary btn-sm" onclick="updateTransferStatus('${t.transfer_id}', 'Received')">Mark Received</button>
                    ` : ''}
                    <button class="btn btn-outline btn-sm" title="Print Waybill" onclick="printWaybill('${t.transfer_id}')"><i class="fas fa-print"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('') || '<tr><td colspan="8" style="text-align:center; padding:60px; color:#94a3b8">No transfer records found. Start by creating a new request.</td></tr>';
};

window.updateTransferStatus = async function(id, status) {
    if(!confirm(`Move transfer to ${status} status?`)) return;
    const r = await api(`/api/transfers/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
    });
    if(r.success) {
        toast(`Transfer ${status} successfully`, 'success');
        renderTransfers();
    } else toast(r.error, 'error');
};

window.printWaybill = function(id) {
    toast('Generating waybill...', 'info');
    window.open(`/api/transfers/${id}/print`, '_blank');
};

window.openNewTransfer = async function() {
    const showrooms = await api(`/api/showrooms?business_id=${BIZ}`);
    
    openModal('Initiate Stock Transfer', `
        <div style="padding:10px">
            <div class="form-group mb-3">
                <label>Find Product</label>
                <div style="display:flex; gap:10px">
                    <input type="text" id="t-search" class="form-control" placeholder="Type SKU or Name..." style="flex:1">
                    <button class="btn btn-primary" onclick="searchForTransfer()">Search</button>
                </div>
                <div id="t-search-results" style="margin-top:10px; max-height:150px; overflow-y:auto; border:1px solid #eee; border-radius:8px; display:none"></div>
            </div>

            <div id="t-form-rest" style="display:none">
                <div class="info-card" style="background:#f8fafc; padding:12px; border-radius:8px; margin-bottom:15px; border-left:4px solid var(--accent)">
                    <div id="t-selected-name" style="font-weight:700"></div>
                    <div id="t-selected-sku" style="font-size:0.75rem; color:#64748b"></div>
                    <div id="t-stock-info" style="font-size:0.8rem; font-weight:600; color:var(--primary); margin-top:5px"></div>
                    <input type="hidden" id="t-p-id">
                    <input type="hidden" id="t-v-id">
                </div>

                <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:15px">
                    <div class="form-group">
                        <label>From Showroom</label>
                        <select id="t-from" class="form-control" required onchange="checkTransferStock()">
                            <option value="">Select Source</option>
                            ${(showrooms.data || []).map(s => `<option value="${s.showroom_id}">${s.showroom_name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>To Showroom</label>
                        <select id="t-to" class="form-control" required>
                            <option value="">Select Destination</option>
                            ${(showrooms.data || []).map(s => `<option value="${s.showroom_id}">${s.showroom_name}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-group mt-3">
                    <label>Transfer Quantity</label>
                    <input type="number" id="t-qty" class="form-control" min="1" value="1" required>
                </div>

                <button class="btn btn-primary w-100 mt-4" onclick="submitTransferRequest()">
                    <i class="fas fa-paper-plane"></i> Submit Transfer Request
                </button>
            </div>
        </div>
    `);
};

window.searchForTransfer = async function() {
    const q = document.getElementById('t-search').value;
    if(!q) return;
    
    const r = await api(`/api/inventory?q=${q}`); 
    const box = document.getElementById('t-search-results');
    box.innerHTML = r.data.map(p => `
        <div onclick="selectTransferProduct('${p.product_id}', '${p.variant_id}', '${p.product_name}', '${p.sku}')" style="padding:10px; border-bottom:1px solid #f1f5f9; cursor:pointer" class="search-item-hover">
            <div style="font-weight:600; font-size:0.8rem">${p.product_name}</div>
            <div style="font-size:0.7rem; color:#64748b">${p.sku} | ${p.showroom_name} (Avail: ${p.available_qty || 0})</div>
        </div>
    `).join('') || '<div style="padding:10px">No products found</div>';
    box.style.display = 'block';
};

window.selectTransferProduct = function(pid, vid, name, sku) {
    document.getElementById('t-p-id').value = pid;
    document.getElementById('t-v-id').value = vid;
    document.getElementById('t-selected-name').innerText = name;
    document.getElementById('t-selected-sku').innerText = sku;
    document.getElementById('t-search-results').style.display = 'none';
    document.getElementById('t-form-rest').style.display = 'block';
    checkTransferStock();
};

window.checkTransferStock = async function() {
    const vid = document.getElementById('t-v-id').value;
    const from = document.getElementById('t-from').value;
    if(!vid || !from) return;
    
    const r = await api(`/api/inventory?variant_id=${vid}&showroom_id=${from}`);
    const qty = (r.data && r.data[0]) ? r.data[0].available_qty : 0;
    const info = document.getElementById('t-stock-info');
    if(info) info.innerText = `Current Stock at Source: ${qty} units`;
    window.currentSourceStock = qty;
};

window.submitTransferRequest = async function() {
    const data = {
        product_id: document.getElementById('t-p-id').value,
        variant_id: document.getElementById('t-v-id').value,
        from_showroom_id: document.getElementById('t-from').value,
        to_showroom_id: document.getElementById('t-to').value,
        quantity: parseInt(document.getElementById('t-qty').value)
    };

    if(data.from_showroom_id === data.to_showroom_id) return toast('Source and Destination must be different', 'error');
    if(data.quantity > window.currentSourceStock) return toast('Cannot transfer more than available stock', 'error');

    const r = await api(`/api/transfers`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
    if(r.success) {
        toast('Transfer requested successfully', 'success');
        closeModal();
        renderTransfers();
    } else toast(r.error, 'error');
};


/* ── REPORTS & ANALYTICS ── */
window.load_reports = async function() {
    const el = document.getElementById('view-reports');
    
    // Get filters from Global state + localStorage specialized for reports
    const gsr = document.getElementById('globalShowroom')?.value || 'all';
    const filter = JSON.parse(sessionStorage.getItem('report_filters') || '{"period":"month"}');
    
    el.innerHTML = `
    <!-- Top Filter Bar -->
    <div class="card" style="margin-bottom:24px; padding:15px; display:flex; gap:15px; align-items:flex-end; flex-wrap:wrap; background:var(--bg)">
        <div class="form-row" style="margin:0; width:150px"><label>Period</label>
            <select id="f-period" onchange="runReportFilter()">
                <option value="today" ${filter.period==='today'?'selected':''}>Today</option>
                <option value="7d" ${filter.period==='7d'?'selected':''}>Last 7 Days</option>
                <option value="month" ${filter.period==='month'?'selected':''}>Current Month</option>
                <option value="year" ${filter.period==='year'?'selected':''}>Current Year</option>
                <option value="custom" ${filter.period==='custom'?'selected':''}>Custom Range</option>
            </select>
        </div>
        <div class="form-row" style="margin:0; width:150px; display:${filter.period==='custom'?'block':'none'}"><label>From</label><input type="date" id="f-from" value="${filter.from_date||''}"></div>
        <div class="form-row" style="margin:0; width:150px; display:${filter.period==='custom'?'block':'none'}"><label>To</label><input type="date" id="f-to" value="${filter.to_date||''}"></div>
        <button class="btn btn-primary" onclick="runReportFilter()" style="margin-top:0">Recalculate 📈</button>
    </div>

    <!-- Pipeline stats -->
    <div class="dashboard-grid" style="margin-bottom:24px" id="reportKPIs">
        ${Array(4).fill('<div class="stat-card skeleton" style="height:100px"></div>').join('')}
    </div>

    <div style="display:grid; grid-template-columns: 2fr 1.2fr; gap:24px">
        <div class="card">
            <div class="card-header">
                <div style="display:flex; justify-content:space-between; width:100%; align-items:center">
                    <h3>🏆 Highest Sold Products</h3>
                    <div class="tab-bar" style="border:none; padding:0; margin:0; width:auto">
                        <button class="tab-item active" id="btn-top-all" onclick="toggleTopProducts('all')">All</button>
                        <button class="tab-item" id="btn-top-pos" onclick="toggleTopProducts('POS')">POS</button>
                        <button class="tab-item" id="btn-top-online" onclick="toggleTopProducts('Ecommerce')">Online</button>
                    </div>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead><tr><th>Product Name</th><th>SKU</th><th>Source</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
                    <tbody id="topProductsBody">${skelRows(7)}</tbody>
                </table>
            </div>
        </div>

        <div class="card">
            <div class="card-header"><h3>💎 Top Spending Customers</h3></div>
            <div class="table-container">
                <table>
                    <thead><tr><th>Customer</th><th>Orders</th><th>LTV (Total Spend)</th></tr></thead>
                    <tbody id="topCustBody">${skelRows(5)}</tbody>
                </table>
            </div>
        </div>

        <div class="card" style="grid-column: 1/-1">
            <div class="card-header"><h3>📈 Financial Sales Trend</h3></div>
            <div id="report-trend-chart" style="height:350px; padding:20px"></div>
        </div>
    </div>`;

    const queryParams = new URLSearchParams({ ...filter, showroom_id: gsr }).toString();
    const r = await api(`/api/reports/analytics?${queryParams}`);
    if(!r.success) return;
    
    const { trends, top_products, top_customers, pipeline, stock_value, brands } = r.data;
    window.cachedTopProducts = top_products;

    // Render High-Fidelity KPI Cards
    const aov = pipeline.total_orders > 0 ? (pipeline.total_revenue / pipeline.total_orders) : 0;
    document.getElementById('reportKPIs').innerHTML = `
        <div class="stat-card">
            <div style="display:flex;justify-content:space-between"><h4>Total Revenue</h4> <span class="badge badge-accent">Live</span></div>
            <div class="val text-accent fw-800 ls-1">${fmt(pipeline.total_revenue || 0)}</div>
            <div class="sub">${pipeline.total_orders || 0} Orders across all channels</div>
        </div>
        <div class="stat-card">
            <h4>Avg Order Value</h4>
            <div class="val fw-800 ls-1">${fmt(aov)}</div>
            <div class="sub">Revenue efficiency / customer</div>
        </div>
        <div class="stat-card">
            <div style="display:flex;justify-content:space-between"><h4>Pipeline Health</h4> <small class="text-warn">${pipeline.pending || 0} New</small></div>
            <div class="val text-warn fw-800 ls-1">${pipeline.pending || 0} Pending</div>
            <div class="sub">${pipeline.delivered || 0} Successfully Delivered</div>
        </div>
        <div class="stat-card">
            <h4>Inventory Wealth</h4>
            <div class="val fw-800 ls-1" style="color:#2b6cb0">${fmt(stock_value || 0)}</div>
            <div class="sub">Current stock valuation (Market)</div>
        </div>
    `;

    // Render Initial Top Products (All)
    toggleTopProducts('all');

    // Render Customers List
    document.getElementById('topCustBody').innerHTML = (top_customers||[]).map(c => `
        <tr>
            <td>
                <div style="display:flex; align-items:center; gap:10px">
                    <div style="width:30px;height:30px;background:#eee;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.8rem">👤</div>
                    <div><b>${c.name || 'Anonymous'}</b><br><small style="color:#888">${c.mobile || ''}</small></div>
                </div>
            </td>
            <td><span class="badge">${c.order_count} Orders</span></td>
            <td><b class="text-accent">${fmt(c.total_spent)}</b></td>
        </tr>
    `).join('') || '<tr><td colspan="3" style="text-align:center;padding:20px">No high-value customers identified</td></tr>';

    // Financial Sales Trend (Daily)
    new ApexCharts(document.querySelector("#report-trend-chart"), {
        series: [{ name: 'Revenue', data: trends.map(t => t.revenue) }],
        chart: { type: 'area', height: 320, toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'Inter' },
        stroke: { curve: 'smooth', width: 3 },
        colors: ['#1FAC63'],
        xaxis: { categories: trends.map(t => fmtDate(t.date)) },
        fill: { type: 'gradient', gradient: { opacityFrom: 0.6, opacityTo: 0.1 } },
        dataLabels: { enabled: false },
        yaxis: { labels: { formatter: v => fmt(v) } }
    }).render();

    // Add Brand Performance Container
    el.innerHTML += `
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px; margin-top:24px">
        <div class="card">
            <div class="card-header"><h3>🏢 Showroom Contribution</h3></div>
            <div id="showroom-share-chart" style="height:320px"></div>
        </div>
        <div class="card">
            <div class="card-header"><h3>🏁 Brand Velocity</h3></div>
            <div id="brand-velocity-chart" style="height:320px"></div>
        </div>
    </div>`;

    // Showroom Share
    const showrooms = r.data.showrooms || [];
    new ApexCharts(document.querySelector("#showroom-share-chart"), {
        series: showrooms.map(s => parseFloat(s.revenue)),
        chart: { type: 'donut', height: 320 },
        labels: showrooms.map(s => s.showroom_name),
        dataLabels: { enabled: false },
        plotOptions: { pie: { donut: { size: '70%', labels: { show: true, total: { show: true, label: 'Revenue', formatter: (w) => fmt(w.globals.seriesTotals.reduce((a, b) => a + b, 0)) } } } } },
        legend: { position: 'bottom' }
    }).render();

    // Brand Velocity
    new ApexCharts(document.querySelector("#brand-velocity-chart"), {
        series: [{ name: 'Revenue', data: brands.map(b => parseFloat(b.revenue)) }],
        chart: { type: 'bar', height: 320, toolbar: { show: false } },
        plotOptions: { bar: { borderRadius: 4, horizontal: true } },
        colors: ['#004B93'],
        dataLabels: { enabled: false },
        xaxis: { categories: brands.map(b => b.brand_name), labels: { formatter: v => fmt(v) } }
    }).render();

    // Add GST Reporting Section
    el.innerHTML += `
    <div class="card" style="margin-top:24px">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
            <h3>⚖️ GST Compliance Reports</h3>
            <div style="display:flex; gap:10px">
                <button class="btn btn-outline btn-sm" onclick="exportGstReport('r1')"><i class="fas fa-file-csv"></i> Export GSTR-1</button>
                <button class="btn btn-outline btn-sm" onclick="exportGstReport('hsn')"><i class="fas fa-file-csv"></i> Export HSN Summary</button>
            </div>
        </div>
        <div class="tab-bar" style="margin-top:0">
            <button class="tab-item active" id="btn-gst-r1" onclick="load_gst_subview('r1')">GSTR-1 (Sales)</button>
            <button class="tab-item" id="btn-gst-hsn" onclick="load_gst_subview('hsn')">HSN Summary</button>
            <button class="tab-item" id="btn-gst-sum" onclick="load_gst_subview('sum')">Tax Summary</button>
        </div>
        <div id="gst-subview-content" class="table-container" style="max-height:400px; overflow-y:auto">
            <div class="loading">Loading GST data...</div>
        </div>
    </div>`;
    
    setTimeout(() => load_gst_subview('r1'), 200);
};

window.load_gst_subview = async function(type) {
    const parent = document.getElementById('view-reports');
    if(!parent) return;
    parent.querySelectorAll('.tab-item').forEach(t => { if(t.id.startsWith('btn-gst-')) t.classList.remove('active'); });
    const btn = document.getElementById(`btn-gst-${type}`);
    if(btn) btn.classList.add('active');
    
    const content = document.getElementById('gst-subview-content');
    if(!content) return;
    const filters = JSON.parse(sessionStorage.getItem('report_filters') || '{}');
    const apiPath = { r1: '/api/reports/gst/r1', hsn: '/api/reports/gst/hsn', sum: '/api/reports/gst/summary' }[type];
    
    const r = await api(`${apiPath}?from_date=${filters.from_date||''}&to_date=${filters.to_date||''}`);
    if(!r.success) return content.innerHTML = `<div style="padding:40px;text-align:center">${r.error}</div>`;
    
    if(type === 'r1') {
        content.innerHTML = `
        <table class="erp-table">
            <thead><tr><th>Inv No</th><th>Date</th><th>Customer</th><th>Product</th><th>Taxable</th><th>GST%</th><th>TaxAmt</th><th>Total</th></tr></thead>
            <tbody>
                ${r.data.map(i => `<tr>
                    <td><small>${i.order_id.slice(-6)}</small></td>
                    <td><small>${fmtDate(i.date)}</small></td>
                    <td><b>${i.customer_name}</b></td>
                    <td>${i.product_name}</td>
                    <td>${fmt(i.taxable_value)}</td>
                    <td>${i.rate}%</td>
                    <td>${fmt(i.total_tax)}</td>
                    <td><b>${fmt(i.invoice_value)}</b></td>
                </tr>`).join('') || '<tr><td colspan="8" style="text-align:center">No records</td></tr>'}
            </tbody>
        </table>`;
    } else if(type === 'hsn') {
        content.innerHTML = `
        <table class="erp-table">
            <thead><tr><th>HSN Desc</th><th>Qty</th><th>Taxable Value</th><th>CGST</th><th>SGST</th><th>IGST</th><th>Total Tax</th></tr></thead>
            <tbody>
                ${r.data.map(i => `<tr>
                    <td><b>${i.hsn_desc}</b></td>
                    <td>${i.total_qty}</td>
                    <td>${fmt(i.total_taxable_value)}</td>
                    <td>${fmt(i.total_cgst)}</td>
                    <td>${fmt(i.total_sgst)}</td>
                    <td>${fmt(i.total_igst)}</td>
                    <td><b>${fmt(i.total_tax)}</b></td>
                </tr>`).join('') || '<tr><td colspan="7" style="text-align:center">No records</td></tr>'}
            </tbody>
        </table>`;
    } else {
        content.innerHTML = `
        <table class="erp-table">
            <thead><tr><th>GST Rate</th><th>Taxable Value</th><th>CGST</th><th>SGST</th><th>IGST</th><th>Total GST</th></tr></thead>
            <tbody>
                ${r.data.map(i => `<tr>
                    <td><span class="badge badge-accent">${i.gst_rate}%</span></td>
                    <td>${fmt(i.total_taxable)}</td>
                    <td>${fmt(i.cgst)}</td>
                    <td>${fmt(i.sgst)}</td>
                    <td>${fmt(i.igst)}</td>
                    <td><b>${fmt(i.total_gst)}</b></td>
                </tr>`).join('') || '<tr><td colspan="6" style="text-align:center">No records</td></tr>'}
            </tbody>
        </table>`;
    }
}

window.exportGstReport = async function(type) {
    const filters = JSON.parse(sessionStorage.getItem('report_filters') || '{}');
    const apiPath = { r1: '/api/reports/gst/r1', hsn: '/api/reports/gst/hsn' }[type];
    const r = await api(`${apiPath}?from_date=${filters.from_date||''}&to_date=${filters.to_date||''}`);
    if(!r.success) return toast('Export failed', 'error');
    
    const data = r.data;
    if(!data.length) return toast('No data to export', 'warn');
    
    // Convert to CSV
    const headers = Object.keys(data[0]).join(',');
    const csv = [headers, ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GST_${type.toUpperCase()}_Report_${new Date().toLocaleDateString()}.csv`;
    a.click();
    toast('Report exported to CSV');
};

window.toggleTopProducts = function(channel) {
    const list = window.cachedTopProducts || [];
    const filtered = channel === 'all' ? list : list.filter(p => p.order_type === channel);
    
    document.querySelectorAll('#view-reports .tab-item').forEach(b => b.classList.remove('active'));
    const targeted = { 'all': 'btn-top-all', 'POS': 'btn-top-pos', 'Ecommerce': 'btn-top-online' }[channel];
    const btn = document.getElementById(targeted);
    if(btn) btn.classList.add('active');

    document.getElementById('topProductsBody').innerHTML = filtered.map(p => `
        <tr>
            <td><div style="display:flex;align-items:center;gap:10px">🕶️ <b>${p.product_name}</b></div></td>
            <td><code class="id-tag">${p.sku || 'N/A'}</code></td>
            <td>${p.order_type === 'POS' ? '<span class="badge" style="background:#e3f2fd;color:#1e88e5">🏬 Showroom</span>' : '<span class="badge" style="background:#f1f8e9;color:#558b2f">🌐 Online</span>'}</td>
            <td><b style="color:#555">${p.sold_qty}</b></td>
            <td><b class="text-accent">${fmt(p.total_rev)}</b></td>
        </tr>
    `).join('') || `<tr><td colspan="5" style="text-align:center;padding:60px;color:#888">No data found for ${channel} channel</td></tr>`;
};


window.runReportFilter = function() {
    const filter = {
        period: document.getElementById('f-period').value,
        from_date: document.getElementById('f-from').value,
        to_date: document.getElementById('f-to').value
    };
    sessionStorage.setItem('report_filters', JSON.stringify(filter));
    load_reports();
};



/* ── MASTER DATA MANAGEMENT (Tabbed) ── */
window.load_master = async function(active = 'brands') {
    const el = document.getElementById('view-master');
    const tabs = [
        { id: 'brands', label: '🏷️ Brands' },
        { id: 'categories', label: '📂 Categories' },
        { id: 'genders', label: '🚻 Gender' },
        { id: 'frame_types', label: '📑 Frame Type' },
        { id: 'shapes', label: '📐 Shape' },
        { id: 'materials', label: '🧪 Materials' },
        { id: 'frame_colors', label: '🎨 Frame Color' },
        { id: 'lens_colors', label: '🕶️ Lens Color' },
        { id: 'lens_materials', label: '💠 Lens Material' }
    ];

    const currentTab = tabs.find(t => t.id === active) || tabs[0];
    const titleOnly = currentTab.label.split(' ')[1];

    el.innerHTML = `
    <div class="card">
        <div class="card-header" style="flex-direction:column; align-items:flex-start; gap:15px">
            <div style="display:flex; justify-content:space-between; width:100%; align-items:center">
                <h3>System Master Data</h3>
                <button class="btn btn-primary btn-sm" onclick="openAddMaster('${active}', '${titleOnly}')">+ Add New ${titleOnly}</button>
            </div>
            <div class="tab-bar master-tab-bar">
                ${tabs.map(t => `<button class="tab-item ${active === t.id ? 'active' : ''}" onclick="load_master('${t.id}')">${t.label}</button>`).join('')}
            </div>
        </div>
        <div class="table-container">
            <table>
                <thead id="masterHead">
                    <tr><th>Name</th><th>Slug</th>${active === 'brands' ? '<th>Logo</th><th>Hero</th>' : ''}${active === 'frame_colors' ? '<th>Preview</th>' : ''}<th>Status</th><th>Created</th><th style="text-align:right">Action</th></tr>
                </thead>
                <tbody id="masterBody">${skelRows(6)}</tbody>
            </table>
        </div>
    </div>`;

    // Fetch Data
    try {
        const d = await api(`/api/master/${active}`);
        const body = document.getElementById('masterBody');
        
        if (!d.success) {
            body.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--danger)">${d.error || 'Failed to load data'}</td></tr>`;
            return;
        }

        const data = d.data || [];
        if (data.length === 0) {
            body.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:60px;color:#888">
                <div style="font-size:2rem;margin-bottom:10px">📂</div>
                No <b>${titleOnly}</b> records found.<br>Click "Add New" to get started.</td></tr>`;
            return;
        }

        body.innerHTML = data.map(r => `
            <tr>
                <td><b>${r.name}</b></td>
                <td><code class="id-tag">${r.slug}</code></td>
                ${active === 'brands' ? `<td>${r.logo ? `<img src="${r.logo}" style="height:24px;width:auto;border-radius:4px">` : '—'}</td><td>${r.hero_url ? `<img src="${r.hero_url}" style="height:24px;width:auto;border-radius:4px">` : '—'}</td>` : ''}
                ${active === 'frame_colors' ? `<td><div style="width:24px;height:24px;border-radius:4px;background:${r.color_code || '#eee'};border:1px solid #ddd;box-shadow:inset 0 0 3px rgba(0,0,0,0.1)"></div></td>` : ''}
                <td>${badge(r.active_status ? 'Active' : 'Inactive')}</td>
                <td><span style="font-size:0.8rem;color:#666">${fmtDate(r.created_at)}</span></td>
                <td style="text-align:right">
                    <div style="display:flex; gap:8px; justify-content:flex-end">
                        <button class="btn btn-outline btn-sm btn-edit" onclick="openEditMaster('${active}', '${r.id}', '${titleOnly}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-outline btn-sm ${r.active_status ? 'btn-warn' : 'btn-success'}" onclick="toggleMasterStatus('${active}', '${r.id}')">
                            <i class="fas fa-${r.active_status ? 'ban' : 'check'}"></i> ${r.active_status ? 'Deactivate' : 'Activate'}
                        </button>
                        <button class="btn btn-outline btn-sm btn-delete" onclick="deleteMaster('${active}', '${r.id}', '${r.name}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>`).join('');

    } catch (err) {
        console.error('Master Tab Error:', err);
        document.getElementById('masterBody').innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--danger)">Connection Error: ${err.message}</td></tr>`;
    }
};

window.toggleMasterStatus = async function(table, id) {
    const r = await patchAPI(`/api/master/${table}/${id}/toggle`);
    if (r.success) {
        toast('Status updated');
        load_master(table);
    } else toast(r.error, 'error');
};

window.deleteMaster = async function(table, id, name) {
    if (!confirm(`Are you sure you want to PERMANENTLY delete "${name}"? This action cannot be undone.`)) return;
    const r = await api(`/api/master/${table}/${id}`, { method: 'DELETE' });
    if (r.success) {
        toast('Record deleted');
        load_master(table);
    } else toast(r.error, 'error');
};

window.openEditMaster = async function(table, id, title) {
    const d = await api(`/api/master/${table}`);
    const record = d.data.find(r => r.id === id);
    if (!record) return toast('Record not found', 'error');

    let specialFields = '';
    if (table === 'brands') {
        specialFields = `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px">
                <div class="form-row">
                    <label>Brand Logo</label>
                    <input type="hidden" id="m-logo" value="${record.logo || ''}">
                    <div id="logo-preview-box" class="media-preview-box" onclick="openMediaSelector('m-logo', 'logo-preview-box')" style="height:100px">
                        ${record.logo ? `<img src="${record.logo}" style="width:100%;height:100%;object-fit:contain">` : '<i class="fas fa-plus"></i><span>Select Logo</span>'}
                    </div>
                </div>
                <div class="form-row">
                    <label>Hero Media (Header/Cover)</label>
                    <input type="hidden" id="m-hero" value="${record.hero_url || ''}">
                    <div id="hero-preview-box" class="media-preview-box" onclick="openMediaSelector('m-hero', 'hero-preview-box')" style="height:100px">
                        ${record.hero_url ? `<img src="${record.hero_url}" style="width:100%;height:100%;object-fit:contain">` : '<i class="fas fa-image"></i><span>Select Hero</span>'}
                    </div>
                </div>
            </div>
            <div class="form-row"><label>Description</label><textarea id="m-desc" rows="2">${record.description || ''}</textarea></div>`;
    } else if (table === 'categories') {
        const catRes = await api(`/api/master/categories`);
        const catOpts = (catRes.data || []).filter(c => c.id !== id).map(c => `<option value="${c.id}" ${record.parent_category_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('');
        specialFields = `<div class="form-row"><label>Parent Category</label><select id="m-parent"><option value="">Root Category</option>${catOpts}</select></div>`;
    } else if (table === 'frame_colors') {
        specialFields = `<div class="form-row"><label>Color Hex Code</label><input id="m-hex" type="color" value="${record.color_code || '#000000'}" style="height:40px; width:100%"></div>`;
    }

    openModal(`Edit ${title}`, `
        <form onsubmit="handleMasterEditSave(event, '${table}', '${id}', '${title}')">
            <div class="form-row"><label>Name *</label><input id="m-name" required value="${record.name}"></div>
            ${specialFields}
            <div class="form-row"><label>Status</label><select id="m-status">
                <option value="true" ${record.active_status ? 'selected' : ''}>Active</option>
                <option value="false" ${!record.active_status ? 'selected' : ''}>Inactive</option>
            </select></div>
            <button class="btn btn-primary" type="submit" style="width:100%; margin-top:15px">Update ${title}</button>
        </form>`);
};

window.handleMasterEditSave = async function(e, table, id, title) {
    e.preventDefault();
    const body = {
        name: document.getElementById('m-name').value,
        active_status: document.getElementById('m-status').value === 'true'
    };

    if (table === 'brands') {
        body.logo = document.getElementById('m-logo').value;
        body.hero_url = document.getElementById('m-hero').value;
        body.description = document.getElementById('m-desc').value;
    } else if (table === 'categories') {
        body.parent_category_id = document.getElementById('m-parent').value || null;
    } else if (table === 'frame_colors') {
        body.color_code = document.getElementById('m-hex').value;
    }

    const r = await api(`/api/master/${table}/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    if (r.success) {
        closeModal();
        toast(`${title} updated!`);
        load_master(table);
    } else toast(r.error, 'error');
};


window.openAddMaster = async function(table, title) {
    let specialFields = '';
    if (table === 'brands') {
        specialFields = `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px">
                <div class="form-row">
                    <label>Brand Logo</label>
                    <input type="hidden" id="m-logo">
                    <div id="logo-preview-box" class="media-preview-box" onclick="openMediaSelector('m-logo', 'logo-preview-box')" style="height:100px">
                        <i class="fas fa-plus"></i>
                        <span>Select Logo</span>
                    </div>
                </div>
                <div class="form-row">
                    <label>Hero Media (Header/Cover)</label>
                    <input type="hidden" id="m-hero">
                    <div id="hero-preview-box" class="media-preview-box" onclick="openMediaSelector('m-hero', 'hero-preview-box')" style="height:100px">
                        <i class="fas fa-image"></i>
                        <span>Select Hero</span>
                    </div>
                </div>
            </div>
            <div class="form-row"><label>Description</label><textarea id="m-desc" rows="2"></textarea></div>`;
    } else if (table === 'categories') {
        const d = await api(`/api/master/categories`);
        const catOpts = (d.data || []).map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        specialFields = `<div class="form-row"><label>Parent Category</label><select id="m-parent"><option value="">Root Category</option>${catOpts}</select></div>`;
    } else if (table === 'frame_colors') {
        specialFields = `<div class="form-row"><label>Color Hex Code</label><input id="m-hex" type="color" value="#000000" style="height:40px; width:100%"></div>`;
    }

    openModal(`Add ${title}`, `
        <form onsubmit="submitMaster(event, '${table}', '${title}')">
            <div class="form-row"><label>Name *</label><input id="m-name" required placeholder="Name here..."></div>
            ${specialFields}
            <div class="form-row"><label>Status</label><select id="m-status"><option value="true">Active</option><option value="false">Inactive</option></select></div>
            <button class="btn btn-primary" type="submit" style="width:100%; margin-top:15px">Save ${title}</button>
        </form>`);
};

window.submitMaster = async function(e, table, title) {
    e.preventDefault();
    const body = {
        name: document.getElementById('m-name').value,
        active_status: document.getElementById('m-status').value === 'true'
    };

    if (table === 'brands') {
        body.logo = document.getElementById('m-logo').value;
        body.hero_url = document.getElementById('m-hero').value;
        body.description = document.getElementById('m-desc').value;
    } else if (table === 'categories') {
        body.parent_category_id = document.getElementById('m-parent').value || null;
    } else if (table === 'frame_colors') {
        body.color_code = document.getElementById('m-hex').value;
    }

    const r = await postAPI(`/api/master/${table}`, body);
    if (r.success) {
        closeModal();
        toast(`${title} saved!`);
        load_master(table);
    } else toast(r.error, 'error');
};

window.deactivateMaster = async function(table, id) {
    if (!confirm('Deactivate this record?')) return;
    const r = await api(`/api/master/${table}/${id}`, { method: 'DELETE' });
    if (r.success) {
        toast('Deactivated successfully');
        load_master(table);
    } else toast(r.error, 'error');
};


/* ── SYSTEM SETTINGS MODULE ── */
window.load_settings = async function(activeTab = 'general') {
    const el = document.getElementById('view-settings');
    el.innerHTML = `
    <div class="settings-layout">
        <aside class="settings-sidebar">
            <div class="settings-nav-item ${activeTab==='general'?'active':''}" onclick="load_settings('general')"><i class="fas fa-info-circle"></i> General</div>
            <div class="settings-nav-item ${activeTab==='gst'?'active':''}" onclick="load_settings('gst')"><i class="fas fa-file-invoice-dollar"></i> GST & Billing</div>
            <div class="settings-nav-item ${activeTab==='payment'?'active':''}" onclick="load_settings('payment')"><i class="fas fa-credit-card"></i> Payment</div>
            <div class="settings-nav-item ${activeTab==='shipping'?'active':''}" onclick="load_settings('shipping')"><i class="fas fa-truck"></i> Shipping</div>
            <div class="settings-nav-item ${activeTab==='notifications'?'active':''}" onclick="load_settings('notifications')"><i class="fas fa-bell"></i> Notifications</div>
            <div class="settings-nav-item ${activeTab==='preferences'?'active':''}" onclick="load_settings('preferences')"><i class="fas fa-sliders-h"></i> Preferences</div>
        </aside>
        <main class="settings-main" id="settings-area">
            <div class="loading">Loading configurations...</div>
        </main>
    </div>`;

    try {
        // Try to fetch settings, handle potential slash issues
        let res = await fetch('/api/settings', { credentials: 'include' });
        if (!res.ok) res = await fetch('/api/settings/', { credentials: 'include' });
        
        const r = await res.json();
        const settings = r.success ? r.data : {};
        renderSettingsTab(activeTab, settings);
    } catch (err) {
        console.error('Settings Error:', err);
        document.getElementById('settings-area').innerHTML = `
            <div class="loading" style="color:var(--danger)">
                <i class="fas fa-exclamation-triangle"></i><br>
                <b>Configuration Sync Failed</b><br>
                <small>${err.message}</small><br>
                <button class="btn btn-outline btn-sm" style="margin-top:10px" onclick="load_settings('${activeTab}')">Retry Connection</button>
            </div>`;
    }
};

function renderSettingsTab(tab, allSettings) {
    const area = document.getElementById('settings-area');
    let html = '';

    const get = (key, field) => allSettings[key]?.[field] || '';
    const isChecked = (key, field) => allSettings[key]?.[field] ? 'checked' : '';

    if (tab === 'general') {
        html = `
        <div class="settings-card">
            <div class="card-header"><h3>General Settings</h3><p>Manage your core business identification details.</p></div>
            <form id="form-settings" onsubmit="handleSettingsSave(event, 'general_settings')">
                <div class="form-grid">
                    <div class="form-group" style="grid-column: 1/-1">
                        <label>Business Logo</label>
                        <input type="hidden" id="biz-logo" name="logo_url" value="${get('general_settings','logo_url')}">
                        <div id="biz-logo-preview" class="media-preview-box ${get('general_settings','logo_url')?'has-image':''}" style="width:100%; height:120px" onclick="openMediaSelector('biz-logo', 'biz-logo-preview')">
                            ${get('general_settings','logo_url') ? `<img src="${get('general_settings','logo_url')}" style="width:100%; height:100%; object-fit:contain">` : '<i class="fas fa-plus"></i><span>Upload Logo</span>'}
                        </div>
                    </div>
                    <div class="form-group"><label>Business Name</label><input name="business_name" value="${get('general_settings','business_name')}" required></div>
                    <div class="form-group"><label>Legal Entity Name</label><input name="legal_name" value="${get('general_settings','legal_name')}" placeholder="e.g. BlinkOpticals Pvt Ltd"></div>
                    <div class="form-group"><label>Support Mobile</label><input name="mobile" value="${get('general_settings','mobile')}"></div>
                    <div class="form-group"><label>Public Email</label><input name="email" value="${get('general_settings','email')}"></div>
                    <div class="form-group" style="grid-column:1/-1"><label>Official Address</label><textarea name="address">${get('general_settings','address')}</textarea></div>
                    <div class="form-group"><label>City</label><input name="city" value="${get('general_settings','city')}"></div>
                    <div class="form-group"><label>State</label><input name="state" value="${get('general_settings','state')}"></div>
                    <div class="form-group"><label>Website URL</label><input name="website" value="${get('general_settings','website')}" placeholder="https://"></div>
                </div>
                <div class="settings-actions"><button type="submit" class="btn btn-primary">Save Changes</button></div>
            </form>
        </div>`;
    } else if (tab === 'gst') {
        html = `
        <div class="settings-card">
            <div class="card-header"><h3>GST & Billing</h3><p>Manage tax compliance and invoice numbering.</p></div>
            <form id="form-settings" onsubmit="handleSettingsSave(event, 'gst_settings')">
                <div class="form-grid">
                    <div class="form-group"><label>Registered Company Name</label><input name="company_name" value="${get('gst_settings','company_name')}"></div>
                    <div class="form-group"><label>GSTIN</label><input name="gstin" value="${get('gst_settings','gstin')}" placeholder="27XXXXX0000X1Z1"></div>
                    <div class="form-group"><label>Invoice Prefix</label><input name="invoice_prefix" value="${get('gst_settings','invoice_prefix')}" placeholder="BO/"></div>
                    <div class="form-group"><label>Tax Structure</label>
                        <select name="tax_type">
                            <option value="inclusive" ${get('gst_settings','tax_type')==='inclusive'?'selected':''}>Inclusive of Tax</option>
                            <option value="exclusive" ${get('gst_settings','tax_type')==='exclusive'?'selected':''}>Exclusive of Tax</option>
                        </select>
                    </div>
                    <div class="form-group" style="grid-column:1/-1"><label>Invoice Terms & Conditions</label><textarea name="terms" rows="3">${get('gst_settings','terms') || '1. Goods once sold will not be taken back.\n2. Warranty as per manufacturer norms.\n3. Subject to local jurisdiction.'}</textarea></div>
                    <div class="form-group" style="grid-column:1/-1"><label>Bank Details (for Invoices)</label><textarea name="bank_info" rows="3" placeholder="Acc Name, A/C No, IFSC...">${get('gst_settings','bank_info')}</textarea></div>
                </div>
                <div class="settings-actions"><button type="submit" class="btn btn-primary">Save Billing Info</button></div>
            </form>
        </div>
        
        <div class="settings-card" style="margin-top:24px">
            <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
                <div><h3>Tax Rules (GST)</h3><p>Define percentage-based tax rules for products and categories.</p></div>
                <button class="btn btn-outline btn-sm" onclick="openTaxRuleModal()">+ Add Rule</button>
            </div>
            <div id="tax-rules-list" class="settings-table-wrap">
                <div class="loading">Loading rules...</div>
            </div>
        </div>`;
        setTimeout(renderTaxRulesList, 100);
    } else if (tab === 'payment') {
        html = `
        <div class="settings-card">
            <div class="card-header"><h3>Razorpay Gateway</h3><p>Connect your Razorpay account for online payments.</p></div>
            <form id="form-settings" onsubmit="handleSettingsSave(event, 'payment_settings')">
                <div class="form-grid">
                    <div class="form-group"><label>Razorpay Key ID</label><input name="rzp_key" value="${get('payment_settings','rzp_key')}"></div>
                    <div class="form-group"><label>Razorpay Secret</label><input type="password" name="rzp_secret" value="${get('payment_settings','rzp_secret')}"></div>
                    <div class="form-group"><label>Payment Mode</label>
                        <select name="mode">
                            <option value="test" ${get('payment_settings','mode')==='test'?'selected':''}>Test Mode</option>
                            <option value="live" ${get('payment_settings','mode')==='live'?'selected':''}>Live Mode</option>
                        </select>
                    </div>
                </div>
                <hr>
                <div class="settings-toggle">
                    <div><strong>Enable Cash on Delivery (COD)</strong><p>Allow customers to pay at showroom/delivery.</p></div>
                    <label class="switch"><input type="checkbox" name="enable_cod" ${isChecked('payment_settings','enable_cod')}><span class="slider round"></span></label>
                </div>
                <div class="settings-actions"><button type="submit" class="btn btn-primary">Save Changes</button></div>
            </form>
        </div>`;
    } else if (tab === 'shipping') {
         html = `
        <div class="settings-card">
            <div class="card-header"><h3>Shiprocket Integration</h3><p>Manage shipping rates and logistics.</p></div>
            <form id="form-settings" onsubmit="handleSettingsSave(event, 'shipping_settings')">
                <div class="form-grid">
                    <div class="form-group"><label>Shiprocket Email</label><input name="email" value="${get('shipping_settings','email')}"></div>
                    <div class="form-group"><label>Shiprocket Password</label><input type="password" name="password" value="${get('shipping_settings','password')}"></div>
                    <div class="form-group"><label>Default Pickup Pin</label><input name="pickup_pin" value="${get('shipping_settings','pickup_pin')}"></div>
                    <div class="form-group"><label>Carrier Preference</label>
                        <select name="carrier">
                            <option value="cheapest" ${get('shipping_settings','carrier')==='cheapest'?'selected':''}>Cheapest Available</option>
                            <option value="fastest" ${get('shipping_settings','carrier')==='fastest'?'selected':''}>Fastest Delivery</option>
                        </select>
                    </div>
                </div>
                <hr style="margin:24px 0; opacity:.1">
                <div class="settings-toggle">
                    <div><strong>Enable Real-time Tracking</strong><p>Send tracking links to customers automatically.</p></div>
                    <label class="switch"><input type="checkbox" name="enable_tracking" ${isChecked('shipping_settings','enable_tracking')}><span class="slider round"></span></label>
                </div>
                <div class="settings-actions"><button type="submit" class="btn btn-primary">Save Changes</button></div>
            </form>
        </div>`;
    } else if (tab === 'notifications') {
        html = `
        <div class="settings-card">
            <div class="card-header"><h3>Automation & Notifications</h3><p>Configure how and when your customers are notified.</p></div>
            <form id="form-settings" onsubmit="handleSettingsSave(event, 'notification_settings')">
                <div class="settings-toggle">
                    <div><strong>WhatsApp Notifications</strong><p>Send order updates via WhatsApp Business API.</p></div>
                    <label class="switch"><input type="checkbox" name="whatsapp_enabled" ${isChecked('notification_settings','whatsapp_enabled')}><span class="slider round"></span></label>
                </div>
                <div class="settings-toggle">
                    <div><strong>Email Notifications</strong><p>Send invoices and reports via SMTP.</p></div>
                    <label class="switch"><input type="checkbox" name="email_enabled" ${isChecked('notification_settings','email_enabled')}><span class="slider round"></span></label>
                </div>
                
                <div style="margin-top:24px">
                    <div class="form-group"><label>Order Confirmation (SMS/WhatsApp)</label>
                        <textarea name="order_msg" style="height:80px">${get('notification_settings','order_msg') || 'Hi {name}, your order {id} for {amount} is confirmed! Thank you for choosing BlinkOpticals.'}</textarea>
                    </div>
                    <div class="form-group" style="margin-top:15px"><label>Appointment Reminder</label>
                        <textarea name="remind_msg" style="height:80px">${get('notification_settings','remind_msg') || 'Hi {name}, this is a reminder for your eye test at {showroom} on {date}. See you there!'}</textarea>
                    </div>
                </div>
                <div class="settings-actions"><button type="submit" class="btn btn-primary">Update Notifications</button></div>
            </form>
        </div>`;
    } else if (tab === 'preferences') {
        html = `
        <div class="settings-card">
            <div class="card-header"><h3>System Preferences</h3><p>Customize the look and behavioral logic of your ERP.</p></div>
            <form id="form-settings" onsubmit="handleSettingsSave(event, 'preferences')">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Base Currency</label>
                        <select name="currency">
                            <option value="INR" ${get('preferences','currency')==='INR'?'selected':''}>INR (₹) - Indian Rupee</option>
                            <option value="USD" ${get('preferences','currency')==='USD'?'selected':''}>USD ($) - US Dollar</option>
                            <option value="AED" ${get('preferences','currency')==='AED'?'selected':''}>AED - UAE Dirham</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Date Format</label>
                        <select name="date_format">
                            <option value="DD/MM/YYYY" ${get('preferences','date_format')==='DD/MM/YYYY'?'selected':''}>DD/MM/YYYY</option>
                            <option value="MM/DD/YYYY" ${get('preferences','date_format')==='MM/DD/YYYY'?'selected':''}>MM/DD/YYYY</option>
                            <option value="YYYY-MM-DD" ${get('preferences','date_format')==='YYYY-MM-DD'?'selected':''}>YYYY-MM-DD</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Timezone</label>
                        <select name="timezone">
                            <option value="Asia/Kolkata" ${get('preferences','timezone')==='Asia/Kolkata'?'selected':''}>India (IST) - GMT+5:30</option>
                            <option value="Asia/Dubai" ${get('preferences','timezone')==='Asia/Dubai'?'selected':''}>Dubai - GMT+4:00</option>
                            <option value="UTC" ${get('preferences','timezone')==='UTC'?'selected':''}>Universal Coordinated Time (UTC)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Low Stock Alert Threshold</label>
                        <input type="number" name="low_stock_threshold" value="${get('preferences','low_stock_threshold') || 5}">
                    </div>
                    <div class="form-group">
                        <label>Items Per Page</label>
                        <select name="page_limit">
                            <option value="10" ${get('preferences','page_limit')==='10'?'selected':''}>10 records</option>
                            <option value="25" ${get('preferences','page_limit')==='25'?'selected':''}>25 records</option>
                            <option value="50" ${get('preferences','page_limit')==='50'?'selected':''}>50 records</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Default Sales Channel</label>
                        <select name="default_channel">
                            <option value="POS" ${get('preferences','default_channel')==='POS'?'selected':''}>POS (Showroom)</option>
                            <option value="Ecommerce" ${get('preferences','default_channel')==='Ecommerce'?'selected':''}>Ecommerce (Online)</option>
                        </select>
                    </div>
                </div>
                <hr style="margin:24px 0; opacity:.1">
                <div class="settings-toggle">
                    <div><strong>Dark Mode Interface</strong><p>Switch to a dark aesthetic for reduced eye strain.</p></div>
                    <label class="switch"><input type="checkbox" name="dark_mode" ${isChecked('preferences','dark_mode')}><span class="slider round"></span></label>
                </div>
                <div class="settings-toggle">
                    <div><strong>Auto-print Invoices</strong><p>Automatically open print dialog after successful POS checkout.</p></div>
                    <label class="switch"><input type="checkbox" name="auto_print" ${isChecked('preferences','auto_print')}><span class="slider round"></span></label>
                </div>
                <div class="settings-actions"><button type="submit" class="btn btn-primary">Save Preferences</button></div>
            </form>
        </div>`;
    } else {
        html = `
        <div class="settings-card">
            <div class="card-header"><h3>Module Config</h3></div>
            <div class="loading">This subsection is under active synchronization...</div>
        </div>`;
    }

    area.innerHTML = html;
}

window.renderTaxRulesList = async function() {
    const list = document.getElementById('tax-rules-list');
    const r = await api('/api/tax/rules');
    if(!r.success) return;
    
    list.innerHTML = `
    <table class="erp-table">
        <thead>
            <tr><th>Tax Name</th><th>Percentage</th><th>Applicable On</th><th>Status</th><th style="text-align:right">Action</th></tr>
        </thead>
        <tbody>
            ${r.data.map(t => {
                let targetName = '';
                if(t.applicable_on === 'category' && t.category_name) targetName = `<div style="font-size:0.75rem; color:var(--muted); margin-top:3px;"><i class="fas fa-folder-open" style="margin-right:4px;"></i>${t.category_name}</div>`;
                if(t.applicable_on === 'product' && t.product_name) targetName = `<div style="font-size:0.75rem; color:var(--muted); margin-top:3px;"><i class="fas fa-box" style="margin-right:4px;"></i>${t.product_name}</div>`;
                
                return `
                <tr>
                    <td><strong>${t.tax_name}</strong></td>
                    <td>${t.tax_percentage}%</td>
                    <td>
                        <span class="badge badge-gray">${t.applicable_on}</span>
                        ${targetName}
                    </td>
                    <td>${badge(t.active_status ? 'Active' : 'Inactive')}</td>
                    <td style="text-align:right">
                        <div style="display:flex; justify-content:flex-end; gap:6px;">
                            <button class="btn btn-outline btn-sm" onclick="editTaxRule('${t.id}', '${(t.tax_name||'').replace(/'/g, "\\'")}',' ${t.tax_percentage}', '${t.applicable_on}', '${t.mapped_category_id||''}')">
                                <i class="fas fa-pencil-alt"></i> Edit
                            </button>
                            <button class="btn btn-outline btn-sm" onclick="toggleTaxRule('${t.id}')">
                                <i class="fas ${t.active_status ? 'fa-ban' : 'fa-check'}"></i> ${t.active_status ? 'Deactivate' : 'Activate'}
                            </button>
                            <button class="btn btn-outline btn-sm text-red" onclick="deleteTaxRule('${t.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
            }).join('') || '<tr><td colspan="5" style="text-align:center">No tax rules defined</td></tr>'}
        </tbody>
    </table>`;
};

window.toggleTaxRule = async function(id) {
    if(!confirm('Are you sure you want to change the status of this tax rule?')) return;
    const r = await api(`/api/tax/rules/${id}/status`, { method: 'PUT' });
    if(r.success) {
        toast(`Tax rule ${r.active_status ? 'activated' : 'deactivated'} successfully`, 'success');
        renderTaxRulesList();
    } else toast(r.error, 'error');
};

window.deleteTaxRule = async function(id) {
    if(!confirm('Delete this tax rule? This action cannot be undone.')) return;
    const r = await api(`/api/tax/rules/${id}`, { method: 'DELETE' });
    if(r.success) {
        toast('Tax rule deleted successfully', 'success');
        renderTaxRulesList();
    } else toast(r.error, 'error');
};

window.editTaxRule = function(id, tax_name, tax_percentage, applicable_on, mapped_id = '') {
    openModal('Edit Tax Rule', `
        <form id="form-edit-tax-rule" onsubmit="handleTaxRuleUpdate(event, '${id}')">
            <div class="form-group">
                <label>Tax Name</label>
                <input name="tax_name" value="${tax_name.trim()}" required>
            </div>
            <div class="form-group">
                <label>Tax Percentage (%)</label>
                <input type="number" step="0.01" name="tax_percentage" value="${parseFloat(tax_percentage).toFixed(2)}" required>
            </div>
            <div class="form-group">
                <label>Applicable On</label>
                <select name="applicable_on" id="edit-applicable-on" onchange="handleEditTaxTargetToggle(this, '')">
                    <option value="product" ${applicable_on==='product'?'selected':''}>Global (All Products)</option>
                    <option value="category" ${applicable_on==='category'?'selected':''}>Specific Category</option>
                    <option value="lens" ${applicable_on==='lens'?'selected':''}>Lens Type</option>
                </select>
            </div>
            <div id="edit-tax-target-selection" style="margin-top:10px;"></div>
            <div style="margin-top:20px; display:flex; gap:10px">
                <button type="submit" class="btn btn-primary" style="flex:1">Save Changes</button>
                <button type="button" class="btn btn-outline" style="flex:1" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `);
    // Auto-populate the target dropdown if already set
    setTimeout(() => {
        const sel = document.getElementById('edit-applicable-on');
        if(sel && (applicable_on === 'category' || applicable_on === 'lens')) {
            handleEditTaxTargetToggle(sel, mapped_id);
        }
    }, 50);
};

window.handleEditTaxTargetToggle = async function(select, mapped_id = '') {
    const container = document.getElementById('edit-tax-target-selection');
    const val = select.value;

    if(val === 'category') {
        container.innerHTML = `<label>Select Category</label><select name="category_id"><option>Loading...</option></select>`;
        try {
            const r = await api('/api/master/categories');
            if(r.success && r.data && r.data.length > 0) {
                container.innerHTML = `
                    <div class="form-group">
                        <label>Select Category</label>
                        <select name="category_id">
                            <option value="">-- Choose Category --</option>
                            ${r.data.map(c => `<option value="${c.id}" ${c.id === mapped_id ? 'selected' : ''}>${c.name}</option>`).join('')}
                        </select>
                    </div>`;
            } else {
                container.innerHTML = `<p style="color:#666;font-size:0.8rem;"><i class="fas fa-info-circle"></i> No categories found. Create them in Master Data first.</p>`;
            }
        } catch(err) {
            container.innerHTML = `<p style="color:red;font-size:0.8rem;">Network error loading categories.</p>`;
        }
    } else if(val === 'lens') {
        container.innerHTML = `
            <div class="form-group">
                <label>Select Lens Type</label>
                <select name="lens_id">
                    <option value="single_vision">Single Vision</option>
                    <option value="bifocal">Bifocal</option>
                    <option value="progressive">Progressive</option>
                    <option value="contact_lens">Contact Lens</option>
                </select>
            </div>`;
    } else {
        container.innerHTML = '';
    }
};

window.handleTaxRuleUpdate = async function(e, id) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd);
    
    // 1. Update the tax rule base fields
    const r = await api(`/api/tax/rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            tax_name: data.tax_name, 
            tax_percentage: data.tax_percentage, 
            applicable_on: data.applicable_on 
        })
    });
    
    if(!r.success) { toast(r.error, 'error'); return; }
    
    // 2. If Category selected, persist the category mapping
    if(data.applicable_on === 'category' && data.category_id) {
        await postAPI('/api/tax/map/category', { 
            category_id: data.category_id, 
            tax_rule_id: parseInt(id)
        });
    }
    
    toast('Tax rule updated successfully', 'success');
    closeModal();
    await renderTaxRulesList();
};

window.openTaxRuleModal = function() {
    openModal('Create New Tax Rule', `
        <form id="form-tax-rule" onsubmit="handleTaxRuleSave(event)">
            <div class="form-group"><label>Tax Name</label><input name="tax_name" placeholder="e.g. GST 18%" required></div>
            <div class="form-group"><label>Tax Percentage (%)</label><input type="number" step="0.01" name="tax_percentage" placeholder="18.00" required></div>
            <div class="form-group"><label>Applicable On</label>
                <select name="applicable_on" onchange="handleTaxTargetToggle(this)">
                    <option value="product">Global (All Products)</option>
                    <option value="category">Specific Category</option>
                    <option value="lens">Lens Type</option>
                </select>
            </div>
            <div id="tax-target-selection" style="margin-top:15px; display:none;">
                <!-- Dynamic Content Here -->
            </div>
            <div style="margin-top:20px; display:flex; gap:10px">
                <button type="submit" class="btn btn-primary" style="flex:1">Create Rule</button>
                <button type="button" class="btn btn-outline" style="flex:1" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `);
};

window.handleTaxTargetToggle = async function(select) {
    const container = document.getElementById('tax-target-selection');
    const val = select.value;
    
    if (val === 'category') {
        container.style.display = 'block';
        container.innerHTML = `<label>Select Category</label><select name="category_id" required><option value="">Loading categories...</option></select>`;
        
        try {
            // Using authenticated master API for robust DB connection
            const r = await api('/api/master/categories');
            if (r.success && r.data && r.data.length > 0) {
                container.innerHTML = `
                    <label>Select Category</label>
                    <select name="category_id" required>
                        <option value="">-- Choose Category --</option>
                        ${r.data.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                    </select>`;
            } else if (r.success && (!r.data || r.data.length === 0)) {
                container.innerHTML = `<p style="color:#666; font-size:0.8rem; margin-top:5px"><i class="fas fa-info-circle"></i> No categories found in database. Create them in Master Data first.</p>`;
            } else {
                container.innerHTML = `<p style="color:red; font-size:0.8rem; margin-top:5px">Failed to load categories: ${r.error || 'Unknown error'}</p>`;
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
            container.innerHTML = `<p style="color:red; font-size:0.8rem; margin-top:5px">Network error. Please try again.</p>`;
        }
    } else if (val === 'lens') {
        container.style.display = 'block';
        container.innerHTML = `
            <label>Select Lens Type</label>
            <select name="lens_id" required>
                <option value="single_vision">Single Vision</option>
                <option value="bifocal">Bifocal</option>
                <option value="progressive">Progressive</option>
                <option value="contact_lens">Contact Lens</option>
            </select>`;
    } else {
        container.style.display = 'none';
        container.innerHTML = '';
    }
};

window.handleTaxRuleSave = async function(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd);
    
    // 1. Create the Tax Rule
    const r = await postAPI('/api/tax/rules', data);
    if(r.success) {
        const taxRuleId = r.data.id;
        
        // 2. If applicable on Category, map it
        if (data.applicable_on === 'category' && data.category_id) {
            await postAPI('/api/tax/map/category', { 
                category_id: data.category_id, 
                tax_rule_id: taxRuleId 
            });
        }
        
        toast('Tax rule created and mapped');
        closeModal();
        renderTaxRulesList();
    } else {
        toast(r.error, 'error');
    }
};

window.handleSettingsSave = async function(e, key) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const fd = new FormData(e.target);
    const data = {};
    fd.forEach((v, k) => {
        if(e.target.elements[k].type === 'checkbox') data[k] = e.target.elements[k].checked;
        else data[k] = v;
    });

    const r = await postAPI('/api/settings', { key, value: data });
    if (r.success) {
        toast('Configuration saved successfully');
        if (key === 'preferences') {
            if (data.dark_mode) document.body.classList.add('dark-mode');
            else document.body.classList.remove('dark-mode');
            window.SYSTEM_PREFS = data;
        }
    } else {
        toast(r.error || 'Update failed', 'error');
    }
    btn.disabled = false;
    btn.textContent = 'Save Changes';
};

/* ── REUSABLE MEDIA SELECTOR FLOW ── */
window.openMediaSelector = function(inputId, previewId, mode = 'single') {
    const selectorId = 'media-selector-modal';
    if(document.getElementById(selectorId)) document.getElementById(selectorId).remove();

    const div = document.createElement('div');
    div.id = selectorId;
    div.className = 'media-selector-overlay';
    div.dataset.mode = mode;
    div.innerHTML = `
        <div class="media-selector-content">
            <div class="selector-header" style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap: 15px;">
                    <h3 style="margin:0;">Select Media Asset</h3>
                    <label class="btn btn-primary btn-sm" style="cursor:pointer; margin:0;">
                        <i class="fas fa-upload"></i> Upload
                        <input type="file" multiple accept="image/*,video/*" style="display:none" onchange="handleSelectorMediaUpload(this, '${inputId}', '${previewId}', '${mode}')">
                    </label>
                </div>
                <div style="flex:1; max-width:300px; margin-left:20px;">
                    <input type="text" id="media-search" onkeyup="filterMediaByName()" placeholder="Search by file name..." style="width:100%; border-radius:15px; padding:6px 15px; border:1px solid var(--border); font-size:0.85rem; outline:none; background:var(--bg)">
                </div>
                <button onclick="this.closest('.media-selector-overlay').remove()">✕</button>
            </div>
            <div class="selector-body">
                <aside class="selector-sidebar">
                    <div class="folder-item active" data-folder="unorganized" onclick="filterSelector('all')">All</div>
                    <div class="folder-item" data-folder="Brand" onclick="filterSelector('Brand')">Brands</div>
                    <div class="folder-item" data-folder="Products" onclick="filterSelector('Products')">Products</div>
                </aside>
                <main class="selector-grid-wrap">
                    <div id="selector-grid" class="media-grid-small"></div>
                </main>
            </div>
        </div>
    `;
    document.body.appendChild(div);
    renderSelectorGrid('all', inputId, previewId, mode);
};

window.handleSelectorMediaUpload = async function(input, inputId, previewId, mode = 'single') {
    const files = input.files;
    if(!files.length) return;
    
    const activeFolder = document.querySelector('#media-selector-modal .folder-item.active');
    const folder = activeFolder ? activeFolder.dataset.folder : 'unorganized';

    toast(`Uploading ${files.length} file(s)...`, 'info');
    let uploadSuccess = false;

    for(let file of files) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder_id', folder); 
        fd.append('business_id', window.BIZ || 'biz_blink_001');
        
        try {
            const res = await fetch('/api/media/upload', {
                method: 'POST',
                body: fd,
                credentials: 'include'
            });
            const r = await res.json();

            if (res.ok && r.success) {
                uploadSuccess = true;
            } else {
                console.error('Upload fail for file:', file.name, r.error);
                toast(`Fail: ${file.name} - ${r.error || 'Server error'}`, 'error');
            }
        } catch(e) {
            console.error('Upload Fetch Error:', e);
            toast(`Connection error for ${file.name}`, 'error');
        }
    }

    if (uploadSuccess) {
        toast('Media sync complete!', 'success');
        renderSelectorGrid(folder === 'unorganized' ? 'all' : folder, inputId, previewId, mode);
    } else {
        toast('Upload failed or partially failed.', 'error');
    }
};

window.filterSelector = function(folder) {
    // Update Active Class UI
    document.querySelectorAll('#media-selector-modal .folder-item').forEach(el => {
        el.classList.remove('active');
        if(el.textContent.trim().toLowerCase() === folder.toLowerCase()) el.classList.add('active');
        if(folder === 'all' && el.textContent.trim().toLowerCase() === 'all') el.classList.add('active');
    });
    
    // Get the input/preview IDs from the current modal state or pass them
    const modal = document.getElementById('media-selector-modal');
    if (window._currentMediaTarget) {
        renderSelectorGrid(folder, window._currentMediaTarget.inputId, window._currentMediaTarget.previewId, window._currentMediaTarget.mode);
    }
};

async function renderSelectorGrid(folder, inputId, previewId, mode = 'single') {
    window._currentMediaTarget = { inputId, previewId, mode }; // Store for filter
    const grid = document.getElementById('selector-grid');
    const bizId = window.BIZ || 'biz_blink_001';
    const r = await api(`/api/media?business_id=${bizId}${folder!=='all'?'&folder_id='+folder:''}`);
    if(!r.success) return;

    grid.innerHTML = (r.data || []).map(m => `
        <div class="selector-card" onclick="selectMediaAsset('${m.file_url}', '${inputId}', '${previewId}', '${mode}')" data-filename="${(m.file_name||'').toLowerCase()}">
            ${m.file_url.includes('.mp4') ? `<video src="${m.file_url}" muted style="width:100%; height:calc(100% - 24px); object-fit:contain; background:#f9f9f9"></video>` : `<img src="${m.file_url}" style="height:calc(100% - 24px); object-fit:contain; background:#f9f9f9">`}
            <div class="hover-overlay"><i class="fas fa-check-circle"></i></div>
            <div class="file-name" title="${m.file_name}" style="position:absolute; bottom:0; padding:4px 8px; font-size:0.65rem; color:#555; background:#fff; width:100%; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; border-top:1px solid #eee;">
                ${m.file_name}
            </div>
        </div>
    `).join('') || '<div style="padding:40px; color:#888; text-align:center">Empty Library</div>';
}

window.filterMediaByName = function() {
    const q = document.getElementById('media-search').value.toLowerCase();
    document.querySelectorAll('#selector-grid .selector-card').forEach(card => {
        const name = card.dataset.filename || '';
        card.style.display = name.includes(q) ? 'block' : 'none';
    });
}

window.selectMediaAsset = function(url, inputId, previewId, mode = 'single') {
    if (mode === 'append') {
        const input = document.getElementById(inputId);
        let arr = input.value ? input.value.split(',') : [];
        if (!arr.includes(url)) {
            arr.push(url);
            input.value = arr.join(',');
            const box = document.getElementById(previewId);
            if(box) {
                box.innerHTML += `
                    <div style="position:relative; width:80px; height:80px; border-radius:8px; overflow:hidden; border:1px solid var(--border); flex-shrink:0;">
                        <img src="${url}" style="width:100%;height:100%;object-fit:cover">
                        <button type="button" onclick="this.parentElement.remove(); updateGalleryInput('${inputId}', '${previewId}')" style="position:absolute;top:2px;right:2px;background:red;color:white;border:none;border-radius:50%;width:20px;height:20px;font-size:10px;cursor:pointer">✕</button>
                    </div>
                `;
            }
        }
        document.querySelector('.media-selector-overlay')?.remove();
        toast('Media added to gallery');
    } else {
        document.getElementById(inputId).value = url;
        const box = document.getElementById(previewId);
        if(box) {
            box.innerHTML = url.includes('.mp4') 
                ? `<video src="${url}" style="width:100%;height:100%;object-fit:contain" controls></video>`
                : `<img src="${url}" style="width:100%;height:100%;object-fit:contain">`;
            box.classList.add('has-image');
        }
        const overlay = document.querySelector('.media-selector-overlay');
        if(overlay) overlay.remove();
        toast('Media selected');
    }
};

window.updateGalleryInput = function(inputId, previewId) {
    const box = document.getElementById(previewId);
    if (!box) return;
    const imgs = Array.from(box.querySelectorAll('img')).map(img => img.src);
    document.getElementById(inputId).value = imgs.join(',');
};

/* ── GST INVOICE GENERATION ── */
window.printOrderInvoice = async function(orderId) {
    const r = await api(`/api/invoice/${orderId}`);
    if (!r.success) return toast(r.error, 'error');
    
    const d = r.invoice_data;
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    
    const isInterState = d.business.state !== d.customer.address; // Simple check for demo

    const itemsHtml = d.items.map((it, idx) => `
        <tr>
            <td style="text-align:center">${idx + 1}</td>
            <td><strong>${it.product_name}</strong></td>
            <td style="text-align:center">${it.hsn_code || '9004'}</td>
            <td style="text-align:center">${it.qty}</td>
            <td style="text-align:right">${fmt(it.price_at_order)}</td>
            <td style="text-align:right">${it.tax_percentage}%</td>
            <td style="text-align:right">${fmt(it.tax_amount)}</td>
            <td style="text-align:right">${fmt( (it.price_at_order * it.qty) + parseFloat(it.tax_amount||0) )}</td>
        </tr>
    `).join('');

    const taxSummaryHtml = isInterState ? `
        <div class="tax-row"><span>IGST Total</span><span>${fmt(d.totals.tax_total)}</span></div>
    ` : `
        <div class="tax-row"><span>CGST Total</span><span>${fmt(d.totals.tax_total/2)}</span></div>
        <div class="tax-row"><span>SGST Total</span><span>${fmt(d.totals.tax_total/2)}</span></div>
    `;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Invoice - ${d.order.invoice_no}</title>
        <style>
            body { font-family: 'Inter', sans-serif; color: #111; padding: 40px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .biz-details h1 { margin: 0; color: #004B93; font-size: 24px; }
            .biz-details p { margin: 4px 0; font-size: 13px; color: #555; }
            .inv-meta { text-align: right; }
            .inv-meta h2 { margin: 0; font-size: 20px; }
            .section { display: flex; gap: 40px; margin-top: 30px; }
            .col { flex: 1; }
            .col h4 { margin-bottom: 8px; text-transform: uppercase; font-size: 11px; color: #888; border-bottom: 1px solid #eee; padding-bottom: 4px; }
            .col p { margin: 4px 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            th { background: #f9fafb; text-align: left; padding: 12px; font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 2px solid #eee; }
            td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
            .totals { margin-top: 30px; display: flex; justify-content: flex-end; }
            .totals-box { width: 300px; }
            .tax-row, .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
            .total-row { border-top: 2px solid #eee; margin-top: 8px; font-weight: 800; font-size: 18px; color: #000; }
            .footer { margin-top: 60px; padding-top: 20px; border-top: 1px dashed #ccc; font-size: 12px; color: #777; text-align: center; }
            @media print { body { padding: 20px; } }
        </style>
    </head>
    <body onload="window.print()">
        <div class="header">
            <div class="biz-details">
                <h1>${d.business.name}</h1>
                <p>${d.business.address}, ${d.business.city}, ${d.business.state}</p>
                <p>GSTIN: <strong>${d.business.gstin}</strong> | Ph: ${d.business.mobile}</p>
            </div>
            <div class="inv-meta">
                <h2>TAX INVOICE</h2>
                <p>#${d.order.invoice_no}</p>
                <p>Date: ${new Date(d.order.date).toLocaleDateString()}</p>
            </div>
        </div>

        <div class="section">
            <div class="col">
                <h4>Billed To</h4>
                <p><strong>${d.customer.name}</strong></p>
                <p>${d.customer.address || 'Cash Customer'}</p>
                <p>Ph: ${d.customer.mobile}</p>
            </div>
            <div class="col">
                <h4>Showroom</h4>
                <p><strong>${d.showroom.name}</strong></p>
                <p>${d.showroom.address}</p>
                <p>Contact: ${d.showroom.contact}</p>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width:40px">#</th>
                    <th>Product Description</th>
                    <th style="text-align:center">HSN</th>
                    <th style="text-align:center">Qty</th>
                    <th style="text-align:right">Price</th>
                    <th style="text-align:right">GST %</th>
                    <th style="text-align:right">Tax</th>
                    <th style="text-align:right">Total</th>
                </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
        </table>

        <div class="totals">
            <div class="totals-box">
                <div class="tax-row"><span>Subtotal (Excl. Tax)</span><span>${fmt(d.totals.subtotal - d.totals.tax_total)}</span></div>
                ${taxSummaryHtml}
                <div class="total-row"><span>Grand Total</span><span>${fmt(d.totals.grand_total)}</span></div>
                <p style="text-align:right; font-size:12px; color:#666; margin-top:10px">Amount in words: One Thousand Fifty Rupees Only</p>
            </div>
        </div>

        <div class="footer">
            <p><strong>Terms & Conditions:</strong> Goods once sold will not be taken back. Subject to Mumbai Jurisdiction. This is a computer generated invoice.</p>
            <p style="margin-top:20px">Thank you for choosing <strong>${d.business.name}</strong>!</p>
        </div>
    </body>
    </html>`;

    printWindow.document.write(html);
    printWindow.document.close();
};

/* ── COMMUNICATION & CAMPAIGNS: See advanced implementation below in this file ── */

/* ── STAFF MANAGEMENT ── */
/* ── STAFF MANAGEMENT ── */
window.load_staff = function() {
    const el = document.getElementById('view-staff');
    if (!el) return;

    el.innerHTML = `
    <div class="module-header glass" style="margin-bottom:32px">
        <div style="display:flex; align-items:center; gap:20px">
            <div style="width:60px; height:60px; background:rgba(0,75,147,0.1); border-radius:18px; display:flex; align-items:center; justify-content:center; color:var(--primary); font-size:1.8rem">
                <i class="fas fa-users-cog"></i>
            </div>
            <div>
                <h1 style="margin:0; font-size:1.8rem; letter-spacing:-0.5px">Team & Access Control</h1>
                <p style="margin:4px 0 0; color:#64748b; font-size:0.95rem">Manage enterprise roles, showroom assignments, and system security</p>
            </div>
        </div>
        <div style="display:flex; gap:12px">
            <button class="btn btn-outline" onclick="load_staff()" title="Refresh Registry"><i class="fas fa-sync-alt"></i></button>
            <button class="btn btn-primary" onclick="openAddStaffModal()" style="box-shadow: 0 10px 20px -5px rgba(0,75,147,0.3)">
                <i class="fas fa-plus"></i> Invite Team Member
            </button>
        </div>
    </div>

    <div id="staff-kpis" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:20px; margin-bottom:32px">
        <div class="kpi-card glass animate-in">
            <div class="kpi-info">
                <div class="kpi-label">Total Workforce</div>
                <div class="kpi-value text-primary" id="kpi-staff-total">—</div>
            </div>
            <div class="kpi-icon"><i class="fas fa-user-friends"></i></div>
        </div>
        <div class="kpi-card glass animate-in">
            <div class="kpi-info">
                <div class="kpi-label">Active Now</div>
                <div class="kpi-value text-green" id="kpi-staff-active">—</div>
            </div>
            <div class="kpi-icon"><i class="fas fa-user-check"></i></div>
        </div>
        <div class="kpi-card glass animate-in">
            <div class="kpi-info">
                <div class="kpi-label">Admin Seats</div>
                <div class="kpi-value text-warn" id="kpi-staff-admins">—</div>
            </div>
            <div class="kpi-icon"><i class="fas fa-user-shield"></i></div>
        </div>
    </div>

    <div class="card glass no-padding">
        <div class="card-body" style="padding:16px; display:flex; gap:16px; align-items:center; background:rgba(0,0,0,0.015); border-bottom:1px solid #eee">
            <div style="position:relative; flex:1">
                <i class="fas fa-search" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#94a3b8"></i>
                <input id="staff-q" class="filter-input" placeholder="Search by Name, Email or Mobile..." oninput="renderStaffListFiltered()" style="width:100%; padding-left:40px">
            </div>
            <div style="display:flex; gap:10px">
                <select id="staff-f-role" class="filter-input" onchange="renderStaffListFiltered()" style="width:160px">
                    <option value="all">All Roles</option>
                    <option value="Admin">Administrators</option>
                    <option value="Manager">Managers</option>
                    <option value="Optometrist">Optometrists</option>
                    <option value="Sales">Sales Executives</option>
                </select>
                <select id="staff-f-showroom" class="filter-input" onchange="renderStaffListFiltered()" style="width:160px">
                    <option value="all">All Showrooms</option>
                </select>
            </div>
        </div>
        <div class="table-container">
            <table class="modern-table">
                <thead>
                    <tr>
                        <th style="padding-left:24px">Staff Identity</th>
                        <th>Role & Access</th>
                        <th>Assigned Unit</th>
                        <th>Activity Pulse</th>
                        <th>Security</th>
                        <th style="text-align:right; padding-right:24px">Control</th>
                    </tr>
                </thead>
                <tbody id="staffList">${skelRows(6)}</tbody>
            </table>
        </div>
    </div>`;

    setTimeout(async () => {
        try {
            const bizId = window.BIZ || USER?.business_id;
            const r = await api(`/api/staff?business_id=${bizId}&t=${Date.now()}`);
            const sh = await api(`/api/showrooms?business_id=${bizId}&t=${Date.now()}`);
            
            if (r.success) {
                window._STAFF_DATA = r.data || [];
                // Update KPIs
                const kTotal = document.getElementById('kpi-staff-total');
                const kActive = document.getElementById('kpi-staff-active');
                const kAdmins = document.getElementById('kpi-staff-admins');
                
                if (kTotal) kTotal.innerText = r.data.length;
                if (kActive) kActive.innerText = r.data.filter(s => s?.active_status).length;
                if (kAdmins) kAdmins.innerText = r.data.filter(s => s?.role === 'Admin').length;
                
                // Update showroom filter
                if (sh.success) {
                    const sSel = document.getElementById('staff-f-showroom');
                    if (sSel) {
                        sSel.innerHTML = '<option value="all">All Showrooms</option>';
                        (sh.data || []).forEach(s => {
                            const opt = document.createElement('option');
                            opt.value = s.showroom_id;
                            opt.innerText = s.showroom_name;
                            sSel.appendChild(opt);
                        });
                    }
                }
                
                renderStaffListFiltered();
            } else {
                document.getElementById('staffList').innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--danger)">Error: ${r.error}</td></tr>`;
            }
        } catch (err) {
            console.error('[Staff Load Error]:', err);
            toast('Failed to sync team registry', 'error');
        }
    }, 10);
};

window.renderStaffListFiltered = function() {
    const qEl = document.getElementById('staff-q');
    const rEl = document.getElementById('staff-f-role');
    const sEl = document.getElementById('staff-f-showroom');
    const body = document.getElementById('staffList');
    
    if (!body) return;
    
    const q = (qEl?.value || '').toLowerCase();
    const role = rEl?.value || 'all';
    const sid = sEl?.value || 'all';
    
    let filtered = window._STAFF_DATA || [];
    
    if (q) {
        filtered = filtered.filter(s => 
            (s.name || '').toLowerCase().includes(q) || 
            (s.email || '').toLowerCase().includes(q) || 
            (s.mobile && s.mobile.includes(q))
        );
    }
    
    if (role !== 'all') filtered = filtered.filter(s => (s.role || '') === role);
    if (sid !== 'all') filtered = filtered.filter(s => (s.showroom_id || '') === sid);

    body.innerHTML = filtered.map(s => `
        <tr class="hover-row">
            <td style="padding-left:24px">
                <div style="display:flex; align-items:center; gap:14px">
                    <div class="user-ava-lg" style="background:rgba(0,75,147,0.1); color:var(--primary)">${(s.name || 'U')[0].toUpperCase()}</div>
                    <div>
                        <div style="font-weight:700; color:var(--primary); font-size:0.95rem">${s.name || 'Unknown Staff'}</div>
                        <div style="font-size:0.75rem; color:#64748b">${s.email || 'No Email'}</div>
                    </div>
                </div>
            </td>
            <td>
                <span class="badge" style="background:${getRoleBg(s.role)}; color:#fff">${s.role}</span>
            </td>
            <td>
                <div style="font-size:0.85rem; font-weight:600">${s.showroom_name || 'Global Access'}</div>
                <div style="font-size:0.7rem; color:#888">${s.showroom_id ? 'Showroom Bound' : 'Enterprise Wide'}</div>
            </td>
            <td>
                <div style="font-size:0.8rem"><i class="far fa-clock"></i> ${s.last_login ? fmtDate(s.last_login) : 'Never Joined'}</div>
                <div style="font-size:0.7rem; color:${s.last_login ? '#1fac63' : '#e74c3c'}">${s.last_login ? 'Active Member' : 'Pending Onboarding'}</div>
            </td>
            <td>
                ${badge(s.active_status ? 'Authorized' : 'Suspended')}
            </td>
            <td style="text-align:right; padding-right:24px">
                <div style="display:flex; gap:8px; justify-content:flex-end">
                    <button class="btn-icon" title="Edit Profile" onclick="editStaff('${s.user_id}')"><i class="fas fa-user-edit"></i></button>
                    <button class="btn-icon" title="Reset Credentials" onclick="resetStaffPwd('${s.user_id}')" style="color:var(--warn)"><i class="fas fa-key"></i></button>
                </div>
            </td>
        </tr>
    `).join('') || `<tr><td colspan="6" style="text-align:center; padding:100px; color:#888">
        <i class="fas fa-user-slash fa-3x" style="display:block; margin-bottom:16px; opacity:0.2"></i>
        No team members match your filters.
    </td></tr>`;
};

function getRoleBg(role) {
    if (role === 'Admin') return '#004B93';
    if (role === 'Manager') return '#1FAC63';
    if (role === 'Optometrist') return '#6366F1';
    if (role === 'Sales') return '#F59E0B'; // Amber for Sales
    return '#64748B';
}

window.openAddStaffModal = async function() {
    const sh = await api(`/api/showrooms?business_id=${BIZ}`);
    const showrooms = sh.data || [];
    
    openModal('Invite New Team Member', `
        <div style="padding:10px">
            <div style="background:rgba(0,75,147,0.03); padding:20px; border-radius:12px; margin-bottom:24px; border:1px solid rgba(0,75,147,0.1)">
                <div style="display:flex; gap:16px; align-items:center">
                    <div style="width:48px; height:48px; background:var(--primary); border-radius:12px; display:flex; align-items:center; justify-content:center; color:white; font-size:1.4rem">
                        <i class="fas fa-user-plus"></i>
                    </div>
                    <div>
                        <h4 style="margin:0; color:var(--primary)">Identity & Access</h4>
                        <p style="margin:2px 0 0; font-size:0.85rem; color:#64748b">Establish secure credentials for your new team member</p>
                    </div>
                </div>
            </div>

            <form id="form-staff-advanced" onsubmit="handleStaffSave(event)" style="display:grid; gap:20px">
                <div class="form-grid-2">
                    <div class="form-row">
                        <label>Legal Full Name *</label>
                        <input name="name" required placeholder="e.g. Rahul Sharma" style="height:45px">
                    </div>
                    <div class="form-row">
                        <label>Business Mobile</label>
                        <input name="mobile" placeholder="+91 ..." style="height:45px">
                    </div>
                </div>

                <div class="form-row">
                    <label>Corporate Email (Login ID) *</label>
                    <input type="email" name="email" required placeholder="name@blinkopticals.com" style="height:45px">
                </div>

                <div class="form-row">
                    <label>Initial Secure Password *</label>
                    <div style="position:relative">
                        <input type="password" name="password" id="staff-pwd" required style="height:45px; width:100%">
                        <i class="fas fa-eye" style="position:absolute; right:15px; top:15px; cursor:pointer; color:#888" onclick="togglePwdVisibility('staff-pwd')"></i>
                    </div>
                    <small style="color:#888; display:block; margin-top:5px"><i class="fas fa-info-circle"></i> Minimum 8 characters recommended</small>
                </div>

                <div class="form-grid-2" style="background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0">
                    <div class="form-row" style="margin-bottom:0">
                        <label>System Role *</label>
                        <select name="role" required style="height:45px; background:white">
                            <option value="Sales">Sales Executive</option>
                            <option value="Optometrist">Optometrist</option>
                            <option value="Manager">Branch Manager</option>
                            <option value="Admin">System Administrator</option>
                        </select>
                    </div>
                    <div class="form-row" style="margin-bottom:0">
                        <label>Showroom Assignment</label>
                        <select name="showroom_id" style="height:45px; background:white">
                            <option value="">Full Territory (Global)</option>
                            ${showrooms.map(s => `<option value="${s.showroom_id}">${s.showroom_name}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:10px; border-top:1px solid #eee; padding-top:20px">
                    <button type="button" class="btn btn-outline" onclick="closeModal()" style="height:45px; padding:0 30px">Discard</button>
                    <button type="submit" class="btn btn-primary" style="height:45px; padding:0 40px; box-shadow: 0 4px 12px rgba(0,75,147,0.2)">
                        <i class="fas fa-paper-plane" style="margin-right:8px"></i> Create & Authorize
                    </button>
                </div>
            </form>
        </div>
    `, 'md');
};

window.handleStaffSave = async function(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd);
    data.business_id = BIZ;
    
    // Simple validation
    if (data.password && data.password.length < 4) return toast('Password too weak', 'error');

    const isEdit = e.target.dataset.userId;
    const url = isEdit ? `/api/staff/${isEdit}` : '/api/staff';
    const method = isEdit ? 'PUT' : 'POST';

    const r = await api(url, { method, body: JSON.stringify(data) });
    if(r.success) {
        toast(isEdit ? 'Profile updated successfully' : 'Team member onboarded!');
        closeModal();
        load_staff();
    } else {
        toast(r.error || 'Identity operation failed', 'error');
    }
};

window.editStaff = async function(userId) {
    const s = (window._STAFF_DATA || []).find(x => x.user_id === userId);
    if (!s) return toast('User record not found', 'error');
    
    const sh = await api(`/api/showrooms?business_id=${BIZ}`);
    const showrooms = sh.data || [];

    openModal(`Edit Member: ${s.name}`, `
        <div style="padding:10px">
            <form id="form-staff-edit" data-user-id="${userId}" onsubmit="handleStaffSave(event)" style="display:grid; gap:20px">
                <div class="form-grid-2">
                    <div class="form-row">
                        <label>Real Name</label>
                        <input name="name" value="${s.name}" required style="height:45px">
                    </div>
                    <div class="form-row">
                        <label>Mobile Number</label>
                        <input name="mobile" value="${s.mobile || ''}" style="height:45px">
                    </div>
                </div>

                <div class="form-row">
                    <label>Email Address (Cannot be changed)</label>
                    <input type="email" value="${s.email}" disabled style="height:45px; background:#f1f5f9; color:#64748b; cursor:not-allowed">
                </div>

                <div class="form-grid-2">
                    <div class="form-row">
                        <label>Assigned Role</label>
                        <select name="role" style="height:45px">
                            <option value="Admin" ${s.role==='Admin'?'selected':''}>Administrator</option>
                            <option value="Manager" ${s.role==='Manager'?'selected':''}>Manager</option>
                            <option value="Optometrist" ${s.role==='Optometrist'?'selected':''}>Optometrist</option>
                            <option value="Sales" ${s.role==='Sales'?'selected':''}>Sales Executive</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <label>Assigned Showroom</label>
                        <select name="showroom_id" style="height:45px">
                            <option value="">Global Access</option>
                            ${showrooms.map(x => `<option value="${x.showroom_id}" ${s.showroom_id===x.showroom_id?'selected':''}>${x.showroom_name}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <label>Account Status</label>
                    <select name="active_status" style="height:45px">
                        <option value="true" ${s.active_status?'selected':''}>Active & Authorized</option>
                        <option value="false" ${!s.active_status?'selected':''}>Suspended / Disabled</option>
                    </select>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:10px; border-top:1px solid #eee; padding-top:20px">
                    <button type="button" class="btn btn-outline" onclick="closeModal()" style="height:45px; padding:0 30px">Cancel</button>
                    <button type="submit" class="btn btn-primary" style="height:45px; padding:0 40px"><i class="fas fa-save" style="margin-right:8px"></i> Update Profile</button>
                </div>
            </form>
        </div>
    `, 'md');
};

window.resetStaffPwd = function(userId) {
    const s = (window._STAFF_DATA || []).find(x => x.user_id === userId);
    if (!s) return;

    openModal(`Security: ${s.name}`, `
        <div style="padding:10px">
            <h4 style="margin:0 0 8px; color:var(--primary)"><i class="fas fa-shield-alt"></i> Reset Credentials</h4>
            <p style="font-size:0.85rem; color:#64748b; margin-bottom:24px">Manually rotate the password for this team member. The user will be required to use the new password for their next session.</p>
            
            <form onsubmit="handleMemberPwdReset(event, '${userId}')">
                <div class="form-row">
                    <label>New Temporary Password</label>
                    <div style="position:relative">
                        <input type="password" id="reset-pwd" required style="height:45px; width:100%" placeholder="••••••••">
                        <i class="fas fa-eye" style="position:absolute; right:15px; top:15px; cursor:pointer; color:#888" onclick="togglePwdVisibility('reset-pwd')"></i>
                    </div>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:24px">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Abandon</button>
                    <button type="submit" class="btn btn-primary" style="background:var(--warn); border-color:var(--warn)">Rotate Password</button>
                </div>
            </form>
        </div>
    `, 'sm');
};

window.handleMemberPwdReset = async function(e, userId) {
    e.preventDefault();
    const password = document.getElementById('reset-pwd').value;
    if (password.length < 4) return toast('Security too low', 'error');

    const r = await api(`/api/staff/${userId}/reset-password`, {
        method: 'PATCH',
        body: JSON.stringify({ password })
    });

    if (r.success) {
        toast('✅ Credentials rotated successfully');
        closeModal();
    } else toast(r.error, 'error');
};

window.togglePwdVisibility = function(id) {
    const input = document.getElementById(id);
    if (input.type === 'password') {
        input.type = 'text';
        event.target.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        event.target.classList.replace('fa-eye-slash', 'fa-eye');
    }
};

/* ── 2-STEP PRODUCT & ECOMMERCE FLOW ── */

window.load_products = async function() {
    const el = document.getElementById('view-products');
    const brands = await api('/api/master/brands');
    const genders = await api('/api/master/genders');
    
    const brandOpts = (brands.data || []).map(b => `<option value="${b.id}">${b.name}</option>`).join('');
    const genOpts = (genders.data || []).map(g => `<option value="${g.id}">${g.name}</option>`).join('');

    el.innerHTML = `
    <div class="card">
        <div class="card-header">
            <div>
                <h3 style="margin:0">Standard Product Entry</h3>
                <p style="font-size:0.8rem;color:var(--muted);margin:0">Manage physical inventory and basic product models</p>
            </div>
            <div style="display:flex; gap:10px; align-items:center">
                <button id="btn-bulk-delete" class="btn btn-danger btn-sm" style="display:none" onclick="bulkDeleteProducts()">
                    <i class="fas fa-trash"></i> Delete Selected (<span id="selected-prod-count">0</span>)
                </button>
                <button class="btn btn-outline" onclick="switchView('bulk_import')"><i class="fas fa-file-import"></i> Bulk Import</button>
                <button class="btn btn-primary" onclick="openQuickProductModal()">+ Fast New Entry</button>
            </div>
        </div>
        
        <div class="card-filters" style="display:flex; gap:15px; padding:20px; background:var(--bg-alt); border-bottom:1px solid var(--border); align-items:flex-end; flex-wrap:wrap">
            <div class="form-row" style="margin:0; width:150px"><label style="font-size:0.7rem">Search</label><input type="text" id="f-search" placeholder="Name/Model" style="height:35px" oninput="renderQuickProductList()"></div>
            <div class="form-row" style="margin:0; width:130px"><label style="font-size:0.7rem">Brand</label><select id="f-brand" style="height:35px" onchange="renderQuickProductList()"><option value="">All Brands</option>${brandOpts}</select></div>
            <div class="form-row" style="margin:0; width:110px"><label style="font-size:0.7rem">Gender</label><select id="f-gen" style="height:35px" onchange="renderQuickProductList()"><option value="">All</option>${genOpts}</select></div>
            <div class="form-row" style="margin:0; width:100px"><label style="font-size:0.7rem">Color</label><input type="text" id="f-color" placeholder="Code" style="height:35px" oninput="renderQuickProductList()"></div>
            <div class="form-row" style="margin:0; width:80px"><label style="font-size:0.7rem">Size</label><input type="text" id="f-size" placeholder="Code" style="height:35px" oninput="renderQuickProductList()"></div>
            <div class="form-row" style="margin:0; width:160px"><label style="font-size:0.7rem">Price Range</label>
                <div style="display:flex;gap:5px">
                    <input type="number" id="f-min" placeholder="Min" style="height:35px;width:75px" onchange="renderQuickProductList()">
                    <input type="number" id="f-max" placeholder="Max" style="height:35px;width:75px" onchange="renderQuickProductList()">
                </div>
            </div>
            <div class="form-row" style="margin:0; width:110px"><label style="font-size:0.7rem">Status</label>
                <select id="f-status" style="height:35px" onchange="renderQuickProductList()">
                    <option value="">All Status</option>
                    <option value="true">Published</option>
                    <option value="false">Unpublished</option>
                </select>
            </div>
            <button class="btn btn-outline btn-sm" onclick="clearProductFilters()" style="height:35px">Reset</button>
        </div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th style="width:40px"><input type="checkbox" id="prod-select-all" onchange="toggleProductSelectAll()"></th>
                        <th>UPC Code</th>
                        <th>Brand</th>
                        <th>Model No</th>
                        <th>Gender</th>
                        <th>Frame Type</th>
                        <th>Material</th>
                        <th>Color</th>
                        <th>Size</th>
                        <th>Stock</th>
                        <th>MRP</th>
                        <th>Status</th>
                        <th style="text-align:right">Actions</th>
                    </tr>
                </thead>
                <tbody id="quickProductList">${skelRows(8)}</tbody>
            </table>
        </div>
    </div>`;
    renderQuickProductList();
};

window.renderQuickProductList = async function() {
    const search = document.getElementById('f-search')?.value || '';
    const brand = document.getElementById('f-brand')?.value || '';
    const gen = document.getElementById('f-gen')?.value || '';
    const color = document.getElementById('f-color')?.value || '';
    const size = document.getElementById('f-size')?.value || '';
    const min = document.getElementById('f-min')?.value || '';
    const max = document.getElementById('f-max')?.value || '';
    const status = document.getElementById('f-status')?.value || '';
    
    let url = `/api/products?business_id=${BIZ}&include_inactive=true&search=${encodeURIComponent(search)}&brand_id=${brand}&gender_id=${gen}&color_code=${encodeURIComponent(color)}&size_code=${encodeURIComponent(size)}&min_price=${min}&max_price=${max}&is_published=${status}&_t=${Date.now()}`;
    const d = await api(url);
    const list = document.getElementById('quickProductList');
    if (!list) return;
    if (!d || !d.success) {
        list.innerHTML = `<tr><td colspan="13" style="text-align:center;padding:40px;color:var(--danger)">Failed to load products: ${(d && d.error) || 'Server error'}</td></tr>`;
        return;
    }
    const products = d.data || [];
    if (products.length === 0) {
        list.innerHTML = `<tr><td colspan="13" style="text-align:center;padding:50px;color:#999"><div style="font-size:2rem;margin-bottom:10px">📦</div>No products found. Try adjusting your filters or click + Quick Entry to add one.</td></tr>`;
        return;
    }
    list.innerHTML = products.map(p => `
        <tr data-id="${p.product_id}" style="font-size:0.85rem">
            <td><input type="checkbox" class="prod-check" data-id="${p.product_id}" onchange="updateProductSelection()"></td>
            <td style="color:var(--accent); font-weight:600">${p.upc_code || '-'}</td>
            <td>${p.brand_name || '-'}</td>
            <td style="font-weight:700">${p.model_no}</td>
            <td>${p.gender_name || p.gender || 'NA'}</td>
            <td>${p.joined_frame_type || p.frame_type || (p.frame_type_id ? `[${p.frame_type_id.slice(-4)}]` : '-')}</td>
            <td>${p.joined_material || p.material || (p.material_id ? `[${p.material_id.slice(-4)}]` : '-')}</td>
            <td>${p.color_code || '-'}</td>
            <td>${p.size_code || '-'}</td>
            <td>
                <span style="font-weight:700; color:${p.total_stock > 0 ? 'var(--secondary)' : 'var(--danger)'}">
                    ${p.total_stock || 0}
                </span>
            </td>
            <td style="font-weight:600">₹${p.mrp || 0}</td>
            <td>
                <span class="${p.is_published ? 'kpi-green' : 'badge-gray'}" style="padding:2px 8px; border-radius:12px; font-size:0.7rem">
                    ${p.is_published ? 'Published' : 'Unpublished'}
                </span>
            </td>
            <td style="text-align:right">
                <div style="display:flex; gap:8px; justify-content:flex-end">
                    <button class="btn-icon" onclick="openEditQuickProductModal('${p.product_id}')"><i class="fas fa-edit" title="Edit"></i></button>
                    <button class="btn-icon text-danger" onclick="deleteQuickProduct('${p.product_id}')"><i class="fas fa-trash" title="Delete"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.clearProductFilters = function() {
    ['f-search', 'f-brand', 'f-gen', 'f-color', 'f-size', 'f-min', 'f-max', 'f-status'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = '';
    });
    renderQuickProductList();
};

window.toggleProductSelectAll = function() {
    const isChecked = document.getElementById('prod-select-all').checked;
    document.querySelectorAll('.prod-check').forEach(cb => cb.checked = isChecked);
    updateProductSelection();
};

window.updateProductSelection = function() {
    const selected = document.querySelectorAll('.prod-check:checked');
    const btn = document.getElementById('btn-bulk-delete');
    const count = document.getElementById('selected-prod-count');
    
    if (selected.length > 0) {
        btn.style.display = 'flex';
        count.textContent = selected.length;
    } else {
        btn.style.display = 'none';
        document.getElementById('prod-select-all').checked = false;
    }
};

window.bulkDeleteProducts = async function() {
    const selected = Array.from(document.querySelectorAll('.prod-check:checked')).map(cb => cb.dataset.id);
    if (selected.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selected.length} products? This action cannot be undone.`)) return;
    
    toast(`Deleting ${selected.length} items...`);
    try {
        const r = await api('/api/products/bulk-delete', {
            method: 'POST',
            body: JSON.stringify({ ids: selected })
        });
        
        if (r.success) {
            toast('Products deleted successfully', 'success');
            renderQuickProductList();
        } else {
            toast(r.error || 'Delete failed', 'error');
        }
    } catch (err) {
        toast('Network error during bulk delete', 'error');
    }
};

window.openQuickProductModal = async function() {
    const [brands, showrooms, genders, frameTypes, materials, categories, shapes] = await Promise.all([
        api('/api/master/brands'),
        api('/api/showrooms'),
        api('/api/master/genders'),
        api('/api/master/frame_types'),
        api('/api/master/materials'),
        api('/api/master/categories'),
        api('/api/master/shapes')
    ]);
    
    const brandOpts = (brands.data || []).map(b => `<option value="${b.id}">${b.name}</option>`).join('');
    const showOpts = (showrooms.data || []).map(s => `<option value="${s.showroom_id}">${s.showroom_name}</option>`).join('');
    const genOpts = '<option value="">NA</option>' + (genders.data || []).map(g => `<option value="${g.id}">${g.name}</option>`).join('');
    const fOpts = '<option value="">NA</option>' + (frameTypes.data || []).map(f => `<option value="${f.id}">${f.name}</option>`).join('');
    const mOpts = '<option value="">NA</option>' + (materials.data || []).map(m => `<option value="${m.id}">${m.name}</option>`).join('');
    const catOpts = '<option value="">NA</option>' + (categories.data || []).map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    const shapeOpts = '<option value="">NA</option>' + (shapes.data || []).map(s => `<option value="${s.id}">${s.name}</option>`).join('');

    openModal('Quick Product Entry', `
        <form onsubmit="submitQuickProduct(event)">
            <div class="form-row">
                <label>PRODUCT NAME *</label>
                <input type="text" id="q-name" required placeholder="Brand Model...">
            </div>
            
            <div class="form-row" style="background:var(--bg-alt); padding:10px; border-radius:8px; border:1px dashed var(--border); margin-bottom:20px">
                <label style="font-weight:700; color:var(--primary)">Scan / Enter UPC Code</label>
                <div style="display:flex; gap:10px; margin-top:5px">
                    <input type="text" id="q-upc" placeholder="Enter UPC/EAN Code" style="flex:1">
                    <button type="button" class="btn btn-outline btn-sm" onclick="fetchUPCData('q-')" style="min-width:100px"><i class="fas fa-bolt"></i> Fetch</button>
                    <button type="button" class="btn btn-primary btn-sm" onclick="runAIClassify('q-')" style="min-width:120px; background:linear-gradient(135deg, #6e8efb, #a777e3); border:none"><i class="fas fa-brain"></i> AI Classify</button>
                </div>
                <p style="font-size:0.65rem; color:var(--muted); margin-top:5px">Fetch retrieves public data. AI Classify suggestions Category, Shape, Material, etc. based on name.</p>
            </div>

            <div class="form-grid-2">
                <div class="form-row"><label>Brand *</label><select id="q-brand" required>${brandOpts}</select></div>
                <div class="form-row"><label>Model No *</label><input id="q-model" required placeholder="e.g. RB3025"></div>
            </div>
            <div class="form-grid-2">
                <div class="form-row"><label>Color Code</label><input id="q-color" placeholder="e.g. 001/51"></div>
                <div class="form-row"><label>Size Code</label><input id="q-size" placeholder="e.g. 58-14"></div>
            </div>
            <div class="form-grid-2" id="q-ai-suggestion-zone" style="transition:all 0.3s ease">
                <div class="form-row"><label>Category</label><select id="q-cat">${catOpts}</select></div>
                <div class="form-row"><label>Shape</label><select id="q-shape">${shapeOpts}</select></div>
            </div>
            <div class="form-grid-2">
                <div class="form-row"><label>Frame Type</label><select id="q-type">${fOpts}</select></div>
                <div class="form-row"><label>Frame Material</label><select id="q-mat">${mOpts}</select></div>
            </div>
            <div class="form-grid-2">
                <div class="form-row"><label>Gender</label><select id="q-gen">${genOpts}</select></div>
                <div class="form-row"><label>Quantity</label><input type="number" id="q-qty" value="1" required></div>
            </div>
            <div class="form-row"><label>MRP (Price) *</label><input type="number" id="q-mrp" required></div>
            <div class="form-row"><label>Default Showroom</label><select id="q-showroom">${showOpts}</select></div>
            <p style="font-size:0.75rem;color:var(--muted);margin-bottom:15px">This will generate a unique SKU and add stock to inventory immediately.</p>
            <button class="btn btn-primary" style="width:100%" type="submit">Complete Entry</button>
        </form>
    `);
};

window.fetchUPCData = async function(prefix = 'q-') {
    const code = document.getElementById(prefix + 'upc').value.trim();
    if (!code) return toast('Please enter or scan a UPC code', 'error');

    toast('Searching product database...', 'info');
    const r = await api(`/api/products/fetch-upc/${code}`);
    
    if (r.success) {
        const p = r.product;
        toast(`Product Found via ${r.source.toUpperCase()}!`, 'success');

        if (r.source === 'internal') {
            if (p.brand_id) document.getElementById(prefix + 'brand').value = p.brand_id;
            if (p.model_no) document.getElementById(prefix + 'model').value = p.model_no;
            if (p.gender_id) document.getElementById(prefix + 'gen').value = p.gender_id || '';
            if (p.frame_type_id) document.getElementById(prefix + 'type').value = p.frame_type_id || '';
            if (p.material_id) document.getElementById(prefix + 'mat').value = p.material_id || '';
            if (p.mrp) document.getElementById(prefix + 'mrp').value = p.mrp;
            if (p.product_name) {
                const nameEl = document.getElementById(prefix + 'name');
                if (nameEl) nameEl.value = p.product_name;
            }
        } else {
            // Suggest brand if matched by name
            if (p.brand_name) {
                const brandSelect = document.getElementById(prefix + 'brand');
                const found = Array.from(brandSelect.options).find(o => o.text.toLowerCase() === p.brand_name.toLowerCase());
                if (found) brandSelect.value = found.value;
            }
            // Auto fill model/name
            if (p.product_name) {
                document.getElementById(prefix + 'model').value = p.product_name;
                const nameEl = document.getElementById(prefix + 'name');
                if (nameEl) nameEl.value = p.product_name;
            }
        }
    } else {
        toast(r.error || 'Product not found. Please enter details manually.', 'warning');
    }
};

window.runAIClassify = async function(prefix = 'q-') {
    const name = document.getElementById(prefix + 'model').value.trim();
    if (!name) return toast('Please enter a Product Name/Model first for AI to analyze', 'warning');

    const brandSelect = document.getElementById(prefix + 'brand');
    const brandName = brandSelect.options[brandSelect.selectedIndex]?.text || '';

    toast('AI is analyzing product classification...', 'info');
    const r = await api('/api/products/classify', {
        method: 'POST',
        body: JSON.stringify({ name, brand_name: brandName })
    });

    if (r.success) {
        const s = r.suggestions;
        toast('AI Suggestions Applied!', 'success');

        // Highlight the zones that AI touched
        const zone = document.getElementById(prefix + 'ai-suggestion-zone');
        if (zone) {
            zone.style.background = 'rgba(110, 142, 251, 0.1)';
            zone.style.padding = '5px';
            zone.style.borderRadius = '8px';
            setTimeout(() => { if(zone) zone.style.background = 'transparent'; }, 3000);
        }

        if (s.category_id) document.getElementById(prefix + 'cat').value = s.category_id;
        if (s.gender_id)   document.getElementById(prefix + 'gen').value = s.gender_id;
        if (s.shape_id)    document.getElementById(prefix + 'shape').value = s.shape_id;
        if (s.frame_type_id) document.getElementById(prefix + 'type').value = s.frame_type_id;
        if (s.material_id)   document.getElementById(prefix + 'mat').value = s.material_id;
        if (s.color_code && !document.getElementById(prefix + 'color').value) document.getElementById(prefix + 'color').value = s.color_code;
        
    } else {
        toast(r.error || 'AI classification failed', 'error');
    }
};

window.submitQuickProduct = async function(e) {
    e.preventDefault();
    const body = {
        product_name: document.getElementById('q-name').value,
        brand_id: document.getElementById('q-brand').value,
        model_no: document.getElementById('q-model').value,
        color_code: document.getElementById('q-color').value,
        size_code: document.getElementById('q-size').value,
        frame_type_id: document.getElementById('q-type').value,
        material_id: document.getElementById('q-mat').value,
        gender_id: document.getElementById('q-gen').value,
        qty: parseInt(document.getElementById('q-qty').value),
        mrp: parseFloat(document.getElementById('q-mrp').value),
        showroom_id: document.getElementById('q-showroom').value,
        upc_code: document.getElementById('q-upc').value.trim() || null,
        category_id: document.getElementById('q-cat').value || null,
        shape_id: document.getElementById('q-shape').value || null
    };

    const r = await postAPI('/api/products/quick-entry', body);
    if (r.success) {
        closeModal();
        toast('Product Entry Completed!');
        load_products();
    } else toast(r.error, 'error');
};

window.openEditQuickProductModal = async function(id) {
    try {
        toast('Loading product...', 'info');
        const r = await api(`/api/products/${id}`);
        if (!r || !r.success) return toast((r && r.error) || 'Failed to load product', 'error');
        const p = r.data;
        const v = (p.variants && p.variants.length > 0) ? p.variants[0] : {};

        // Fetch live master data for dropdowns in parallel
        const [brands, genders, showrooms, frameTypes, materials, categories, shapes] = await Promise.all([
            api('/api/master/brands'),
            api('/api/master/genders'),
            api('/api/showrooms'),
            api('/api/master/frame_types'),
            api('/api/master/materials'),
            api('/api/master/categories'),
            api('/api/master/shapes')
        ]);

        const brandOpts = `<option value="">-- Select Brand --</option>` +
            (brands.data || []).map(b =>
                `<option value="${b.id}" ${String(p.brand_id) === String(b.id) ? 'selected' : ''}>${b.name}</option>`
            ).join('');

        const genOpts = `<option value="">-- Select Gender --</option>` +
            (genders.data || []).map(g =>
                `<option value="${g.id}" ${String(p.gender_id) === String(g.id) ? 'selected' : ''}>${g.name}</option>`
            ).join('');

        const showOpts = `<option value="">-- Select Showroom --</option>` +
            (showrooms.data || []).map(s =>
                `<option value="${s.showroom_id}" ${String(v.showroom_id) === String(s.showroom_id) ? 'selected' : ''}>${s.showroom_name}</option>`
            ).join('');

        const fOpts = `<option value="">-- Select Frame Type --</option>` +
            (frameTypes.data || []).map(f =>
                `<option value="${f.id}" ${String(p.frame_type_id) === String(f.id) ? 'selected' : ''}>${f.name}</option>`
            ).join('');

        const mOpts = `<option value="">-- Select Frame Material --</option>` +
            (materials.data || []).map(m =>
                `<option value="${m.id}" ${String(p.material_id) === String(m.id) ? 'selected' : ''}>${m.name}</option>`
            ).join('');

        const catOpts = `<option value="">-- Select Category --</option>` +
            (categories.data || []).map(c =>
                `<option value="${c.id}" ${String(p.category_id) === String(c.id) ? 'selected' : ''}>${c.name}</option>`
            ).join('');

        const shapeOpts = `<option value="">-- Select Shape --</option>` +
            (shapes.data || []).map(s =>
                `<option value="${s.id}" ${String(p.shape_id) === String(s.id) ? 'selected' : ''}>${s.name}</option>`
            ).join('');

        document.getElementById('modal').className = 'modal';
        openModal('Edit Standard Product', `
            <form id="editQuickForm" class="standard-form">
                <div class="form-row">
                    <label>PRODUCT NAME *</label>
                    <input type="text" name="product_name" id="e-name" value="${p.product_name || ''}" required placeholder="Brand Model...">
                </div>

                <div class="form-row" style="background:var(--bg-alt); padding:10px; border-radius:8px; border:1px dashed var(--border); margin-bottom:20px">
                    <label style="font-weight:700; color:var(--primary)">UPC/EAN CODE</label>
                    <div style="display:flex; gap:10px; margin-top:5px">
                        <input type="text" name="upc_code" id="e-upc" value="${p.upc_code || ''}" placeholder="Scan/Enter UPC Code" style="flex:1">
                        <button type="button" class="btn btn-outline btn-sm" onclick="fetchUPCData('e-')" style="min-width:100px"><i class="fas fa-bolt"></i> Fetch</button>
                        <button type="button" class="btn btn-primary btn-sm" onclick="runAIClassify('e-')" style="min-width:120px; background:linear-gradient(135deg, #6e8efb, #a777e3); border:none"><i class="fas fa-brain"></i> AI Classify</button>
                    </div>
                </div>

                <div class="form-grid-2">
                    <div class="form-row"><label>BRAND *</label><select name="brand_id" id="e-brand" class="form-select">${brandOpts}</select></div>
                    <div class="form-row"><label>MODEL NO *</label><input type="text" name="model_no" id="e-model" value="${p.model_no || ''}" required></div>
                </div>
                <div class="form-grid-2">
                    <div class="form-row"><label>COLOR CODE</label><input type="text" name="color_code" id="e-color" value="${v.color_code || ''}" placeholder="e.g. 001/51"></div>
                    <div class="form-row"><label>SIZE CODE</label><input type="text" name="size_code" id="e-size" value="${v.size_code || ''}" placeholder="e.g. 58-14"></div>
                </div>
                <div class="form-grid-2" id="e-ai-suggestion-zone" style="transition:all 0.3s ease">
                    <div class="form-row"><label>CATEGORY</label><select name="category_id" id="e-cat" class="form-select">${catOpts}</select></div>
                    <div class="form-row"><label>SHAPE</label><select name="shape_id" id="e-shape" class="form-select">${shapeOpts}</select></div>
                </div>
                <div class="form-grid-2">
                    <div class="form-row"><label>FRAME TYPE</label><select name="frame_type_id" id="e-type" class="form-select">${fOpts}</select></div>
                    <div class="form-row"><label>FRAME MATERIAL</label><select name="material_id" id="e-mat" class="form-select">${mOpts}</select></div>
                </div>
                <div class="form-grid-2">
                    <div class="form-row"><label>GENDER</label><select name="gender_id" id="e-gen" class="form-select">${genOpts}</select></div>
                    <div class="form-row"><label>QUANTITY</label><input type="number" name="qty" id="e-qty" value="${v.total_stock || 0}" min="0"></div>
                </div>
                <div class="form-row"><label>MRP (PRICE) *</label><input type="number" step="0.01" name="mrp" id="e-mrp" value="${p.mrp || 0}" required></div>
                <div class="form-row"><label>DEFAULT SHOWROOM</label><select name="showroom_id" id="e-showroom" class="form-select">${showOpts}</select></div>
                <p style="font-size:0.75rem;color:var(--muted);margin-bottom:15px">⚠️ Updating Color/Size will affect the primary variant of this product.</p>
                <div style="display:flex; gap:12px; justify-content:flex-end; margin-top:20px">
                    <button class="btn btn-outline" type="button" onclick="closeModal()" style="min-width:100px">Cancel</button>
                    <button class="btn btn-primary" type="submit" style="min-width:180px">Update Product</button>
                </div>
            </form>
        `);

        document.getElementById('editQuickForm').onsubmit = async function(e) {
            e.preventDefault();
            const btn = e.target.querySelector('[type=submit]');
            btn.disabled = true;
            btn.textContent = 'Saving...';

            const body = Object.fromEntries(new FormData(e.target));
            if (body.mrp) body.mrp = parseFloat(body.mrp);
            if (body.qty !== undefined) body.qty = parseInt(body.qty);

            console.log('[EDIT] Submitting update for', id, ':', body);
            const res = await api(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(body) });
            console.log('[EDIT] Response:', res);

            btn.disabled = false;
            btn.textContent = 'Update Product';

            if (res.success) {
                toast('Product updated successfully');
                closeModal();
                renderQuickProductList();
            } else {
                toast(res.error || 'Update failed — check server logs', 'error');
            }
        };

    } catch (err) {
        console.error('[openEditQuickProductModal] Error:', err);
        toast('Error opening edit form: ' + err.message, 'error');
    }
};

window.deleteQuickProduct = async function(id) {
    if (!confirm('EXTREME CAUTION: This will permanently delete this product, all its color variants, and all associated inventory levels across showrooms. Continue?')) return;
    
    const r = await api(`/api/products/${id}`, { method: 'DELETE' });
    if (r.success) {
        toast('Product deleted successfully');
        renderQuickProductList();
    } else toast(r.error, 'error');
};

/* ── ECOMMERCE PRODUCTS PAGE ── */

window.CURRENT_ECOM_TAB = 'unpublished';
window.load_ecommerce = async function(tab = 'unpublished') {
    window.CURRENT_ECOM_TAB = tab;
    const viewEl = document.getElementById('view-ecommerce'); 
    
    const [brands, frameTypes] = await Promise.all([
        api('/api/master/brands'),
        api('/api/master/frame_types')
    ]);
    const bOpts = (brands.data || []).map(b => `<option value="${b.id}">${b.name}</option>`).join('');
    const fOpts = (frameTypes.data || []).map(f => `<option value="${f.id}">${f.name}</option>`).join('');

    viewEl.innerHTML = `
    <div class="card">
        <div class="card-header" style="flex-direction:column;align-items:flex-start;gap:15px">
            <div style="display:flex;justify-content:space-between;width:100%;align-items:center">
                <h3>Ecommerce Product Management</h3>
                <div id="ecom-bulk-actions"></div>
            </div>
            
            <div style="display:flex; flex-wrap:wrap; gap:10px; width:100%; align-items:center; background:var(--bg); padding:12px; border-radius:8px; border:1px solid var(--border)">
                <input type="text" placeholder="Search Model/Name..." class="filter-input" id="e-search" onkeyup="if(event.key==='Enter') renderEcommerceList()" style="width:200px">
                <select id="e-brand" class="filter-input" onchange="renderEcommerceList()"><option value="">All Brands</option>${bOpts}</select>
                <select id="e-fq" class="filter-input" onchange="renderEcommerceList()"><option value="">All Frame Types</option>${fOpts}</select>
                <input type="text" placeholder="Color" id="e-color" class="filter-input" style="width:100px" onkeyup="if(event.key==='Enter') renderEcommerceList()">
                <input type="text" placeholder="Size" id="e-size" class="filter-input" style="width:100px" onkeyup="if(event.key==='Enter') renderEcommerceList()">
                <input type="number" placeholder="Min ₹" id="e-min" class="filter-input" style="width:100px" onkeyup="if(event.key==='Enter') renderEcommerceList()">
                <input type="number" placeholder="Max ₹" id="e-max" class="filter-input" style="width:100px" onkeyup="if(event.key==='Enter') renderEcommerceList()">
                <button class="btn btn-primary btn-sm" onclick="renderEcommerceList()"><i class="fas fa-search"></i> Search</button>
            </div>

            <div class="tab-bar">
                <button class="tab-item ${tab==='unpublished'?'active':''}" onclick="load_ecommerce('unpublished')">Unpublished Products</button>
                <button class="tab-item ${tab==='published'?'active':''}" onclick="load_ecommerce('published')">Published Products</button>
            </div>
        </div>
        <div class="table-container">
            <table>
                <thead id="e-head"></thead>
                <tbody id="e-list">${skelRows(10)}</tbody>
            </table>
        </div>
    </div>`;
    
    const head = document.getElementById('e-head');
    const chkHtml = `<input type="checkbox" id="ecom-check-all" onclick="toggleEcomSelectAll()">`;
    if (tab === 'unpublished') {
        head.innerHTML = `<tr><th style="width:40px;">${chkHtml}</th><th>Brand</th><th>Model</th><th>Color/Size</th><th>MRP</th><th>Stock</th><th>Action</th></tr>`;
    } else {
        head.innerHTML = `<tr><th style="width:40px;">${chkHtml}</th><th>Product</th><th>Brand</th><th>Category</th><th>Selling Price</th><th>Stock</th><th>Action</th></tr>`;
    }
    
    renderEcommerceList(tab);
};

window.renderEcommerceList = async function(tabId) {
    const tab = tabId || window.CURRENT_ECOM_TAB;
    const search = document.getElementById('e-search')?.value || '';
    const brand = document.getElementById('e-brand')?.value || '';
    const type = document.getElementById('e-fq')?.value || '';
    const color = document.getElementById('e-color')?.value || '';
    const size = document.getElementById('e-size')?.value || '';
    const min = document.getElementById('e-min')?.value || '';
    const max = document.getElementById('e-max')?.value || '';

    const list = document.getElementById('e-list');
    if (list) list.innerHTML = skelRows(10); // loading animation

    let q = `?is_published=${tab==='published'}`;
    if (search) q += `&search=${encodeURIComponent(search)}`;
    if (brand) q += `&brand_id=${brand}`;
    if (type) q += `&frame_type_id=${type}`;
    if (color) q += `&color_code=${encodeURIComponent(color)}`;
    if (size) q += `&size_code=${encodeURIComponent(size)}`;
    if (min) q += `&min_price=${min}`;
    if (max) q += `&max_price=${max}`;

    const d = await api(`/api/products${q}`);
    if (!list || !d.success) return;

    if (d.data.length === 0) {
        list.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:60px;color:var(--muted)">No products found matching filters.</td></tr>`;
        return;
    }

    const bulkDiv = document.getElementById('ecom-bulk-actions');
    if (bulkDiv) {
        if (tab === 'unpublished') {
            bulkDiv.innerHTML = `<button class="btn btn-primary btn-sm" onclick="bulkTogglePublish(true)">🚀 Publish Selected</button>`;
        } else {
            bulkDiv.innerHTML = `<button class="btn btn-outline btn-sm text-red" onclick="bulkTogglePublish(false)">🚫 Unpublish Selected</button>`;
        }
    }

    list.innerHTML = d.data.map(p => {
        if (tab === 'unpublished') {
            return `<tr>
                <td><input type="checkbox" class="ecom-row-check" value="${p.product_id}"></td>
                <td><b>${p.brand_name}</b></td>
                <td>${p.model_no}</td>
                <td><span class="badge badge-gray">${p.color_code || 'NA'} / ${p.size_code || 'NA'}</span></td>
                <td>₹${p.mrp || 0}</td>
                <td>${p.total_stock || 0}</td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="editEcommerceProduct('${p.product_id}')">Edit & Publish</button>
                </td>
            </tr>`;
        } else {
            return `<tr>
                <td><input type="checkbox" class="ecom-row-check" value="${p.product_id}"></td>
                <td>
                    <div style="display:flex;gap:10px;align-items:center">
                        <div style="width:44px;height:44px;border-radius:6px;border:1px solid #eee;overflow:hidden;flex-shrink:0;background:#f9f9f9;display:flex;align-items:center;justify-content:center">
                            ${p.main_image 
                                ? `<img src="${p.main_image}" style="width:100%;height:100%;object-fit:cover">` 
                                : `<i class="fas fa-image" style="color:#ccc;font-size:1.2rem"></i>`
                            }
                        </div>
                        <div>
                            <div style="font-weight:700">${p.product_name}</div>
                            <div style="font-size:0.7rem;color:#888">${p.category_name}</div>
                        </div>
                    </div>
                </td>
                <td>${p.brand_name}</td>
                <td>${p.category_name}</td>
                <td class="kpi-green" style="font-weight:700">₹${p.selling_price || 0}</td>
                <td>${p.total_stock || 0}</td>
                <td>
                    <div style="display:flex;gap:5px">
                        <button class="btn btn-outline btn-sm" onclick="editEcommerceProduct('${p.product_id}')">Edit</button>
                        <button class="btn btn-outline btn-sm text-red" onclick="togglePublish('${p.product_id}', false)">Unpublish</button>
                    </div>
                </td>
            </tr>`;
        }
    }).join('');
}

window.toggleEcomSelectAll = function() {
    const mainCb = document.getElementById('ecom-check-all');
    const checkboxes = document.querySelectorAll('.ecom-row-check');
    checkboxes.forEach(cb => cb.checked = mainCb?.checked || false);
};

window.bulkTogglePublish = async function(status) {
    const checkboxes = document.querySelectorAll('.ecom-row-check:checked');
    if (checkboxes.length === 0) {
        return toast('Please select at least one product.', 'warn');
    }
    if (!confirm(`Are you sure you want to ${status ? 'publish' : 'unpublish'} ${checkboxes.length} products?`)) return;

    const btn = event.currentTarget || event.target;
    const ogHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    btn.disabled = true;

    let successCount = 0;
    for (let cb of checkboxes) {
        const id = cb.value;
        const res = await api(`/api/products/${id}/${status ? 'publish' : 'unpublish'}`, { method: 'PATCH' });
        if(res.success) successCount++;
    }

    btn.innerHTML = ogHtml;
    btn.disabled = false;

    toast(`Successfully ${status ? 'published' : 'unpublished'} ${successCount} out of ${checkboxes.length} selected.`, 'success');
    load_ecommerce(window.CURRENT_ECOM_TAB);
};

/* ── AI CONTENT GENERATION ── */

window.runAIGenerator = async function(id, onlySEO = false) {
    const btn = event.currentTarget;
    const oldHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AI working...';
    btn.disabled = true;

    try {
        const d = await api(`/api/products/${id}`);
        const p = d.data;
        
        const payload = {
            brand: p.brand_name,
            model: p.model_no,
            category: document.getElementById('p-cat').selectedOptions[0]?.text || p.category_name,
            gender: document.getElementById('p-gen').selectedOptions[0]?.text || '',
            shape: document.getElementById('p-shape').selectedOptions[0]?.text || '',
            material: document.getElementById('p-mat').selectedOptions[0]?.text || '',
            frame_type: document.getElementById('p-type').selectedOptions[0]?.text || '',
            color: p.color_code,
            lens_material: document.getElementById('p-lmat').selectedOptions[0]?.text || '',
            lens_color: document.getElementById('p-lcol').selectedOptions[0]?.text || ''
        };

        const r = await postAPI('/api/ai/generate-content', payload);
        if (r.success) {
            const ai = r.data;
            if (!onlySEO) {
                if (ai.product_name) document.getElementById('p-name').value = ai.product_name;
                if (ai.short_description) document.getElementById('p-short').value = ai.short_description;
                if (ai.full_description) document.getElementById('p-desc').value = ai.full_description;
            }
            if (ai.seo_title) document.getElementById('p-seo-t').value = ai.seo_title;
            if (ai.seo_description) document.getElementById('p-seo-d').value = ai.seo_description;
            if (ai.tags) document.getElementById('p-tags').value = ai.tags;
            
            toast('AI Content Generated!');
        } else toast(r.error, 'error');
    } catch (e) { toast('AI Generation failed', 'error'); }
    
    btn.innerHTML = oldHTML;
    btn.disabled = false;
};

window.submitAddVariant = async function(productId) {
    const color = document.getElementById('nv-color').value;
    const size = document.getElementById('nv-size').value;
    let sku = document.getElementById('nv-sku').value;
    
    if (!color || !size) return toast('Color and Size are required', 'error');
    
    if (!sku) {
        // Simple auto-sku logic if empty
        const d = await api(`/api/products/${productId}`);
        const p = d.data;
        sku = `${p.brand_name.toUpperCase()}-${p.model_no.toUpperCase()}-${color.toUpperCase()}-${size.toUpperCase()}`;
    }

    const r = await postAPI(`/api/products/${productId}/variants`, {
        color_code: color,
        size_code: size,
        sku: sku
    });

    if (r.success) {
        toast('Variant added');
        editEcommerceProduct(productId); // Refresh modal
    } else toast(r.error, 'error');
};

window.deleteVariant = async function(variantId, productId) {
    if (!confirm('Are you sure you want to delete this variant? This will not delete inventory records but will unlink them.')) return;
    
    const r = await api(`/api/products/variants/${variantId}`, { method: 'DELETE' });
    if (r.success) {
        toast('Variant deleted');
        editEcommerceProduct(productId);
    } else toast(r.error, 'error');
};

window.editEcommerceProduct = async function(id) {
    const d = await api(`/api/products/${id}`);
    if (!d.success) return toast(d.error, 'error');
    const p = d.data;

    const [cats, genders, types, shapes, mats, lensMats, lensColors] = await Promise.all([
        api('/api/master/categories'),
        api('/api/master/genders'),
        api('/api/master/frame_types'),
        api('/api/master/shapes'),
        api('/api/master/materials'),
        api('/api/master/lens_materials'),
        api('/api/master/lens_colors')
    ]);

    const catOpts = (cats.data || []).map(c => `<option value="${c.id}" ${p.category_id===c.id?'selected':''}>${c.name}</option>`).join('');
    const genOpts = (genders.data || []).map(g => `<option value="${g.id}" ${p.gender_id===g.id?'selected':''}>${g.name}</option>`).join('');
    const typeOpts = (types.data || []).map(t => `<option value="${t.id}" ${p.frame_type_id===t.id?'selected':''}>${t.name}</option>`).join('');
    const shapeOpts = (shapes.data || []).map(s => `<option value="${s.id}" ${p.shape_id===s.id?'selected':''}>${s.name}</option>`).join('');
    const matOpts = (mats.data || []).map(m => `<option value="${m.id}" ${p.material_id===m.id?'selected':''}>${m.name}</option>`).join('');
    const lensMatOpts = (lensMats.data || []).map(m => `<option value="${m.id}" ${p.lens_material_id===m.id?'selected':''}>${m.name}</option>`).join('');
    const lensColOpts = (lensColors.data || []).map(c => `<option value="${c.id}" ${p.lens_color_id===c.id?'selected':''}>${c.name}</option>`).join('');

    const defSeoTitle = p.seo_title || `${p.brand_name || ''} ${p.product_name || p.model_no || ''} – Premium Quality Eyewear`.trim();

    openModal(`Product Setup: ${(p.model_no && p.model_no !== 'null') ? p.model_no : (p.product_name || 'New Product')}`, `
        <div class="stepper" id="prod-stepper">
            <div class="step active" data-step="1" onclick="switchProdTab(1, 'p-basic')">
                <div class="step-circle">1</div>
                <div class="step-label">Basic</div>
            </div>
            <div class="step" data-step="2" onclick="switchProdTab(2, 'p-details')">
                <div class="step-circle">2</div>
                <div class="step-label">Specs</div>
            </div>
            <div class="step" data-step="3" onclick="switchProdTab(3, 'p-variants')">
                <div class="step-circle">3</div>
                <div class="step-label">Variants</div>
            </div>
            <div class="step" data-step="4" onclick="switchProdTab(4, 'p-media')">
                <div class="step-circle">4</div>
                <div class="step-label">Media</div>
            </div>
        </div>

        <form id="editProdForm" onsubmit="saveEcommerceProduct(event, '${id}')">
            <!-- STEP 1: BASIC INFO -->
            <div id="p-basic" class="prod-tab-content active">
                <div class="form-section-title"><i class="fas fa-info-circle"></i> Branding & Marketing</div>
                <div class="form-row">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                        <label style="margin:0">Ecommerce Display Name *</label>
                        <button class="btn btn-primary btn-sm" type="button" onclick="runAIGenerator('${id}')" style="background:var(--accent);border:none;border-radius:20px;padding:4px 12px">
                            <i class="fas fa-sparkles"></i> AI Generate
                        </button>
                    </div>
                    <input id="p-name" value="${p.product_name || ''}" required placeholder="e.g. Ray-Ban Aviator Classic">
                </div>
                
                <div class="form-grid-2">
                    <div class="form-row"><label>MRP (List Price)</label><input type="number" id="p-mrp" value="${p.mrp || 0}"></div>
                    <div class="form-row"><label>Selling Price *</label><input type="number" id="p-selling" value="${p.selling_price || 0}" required></div>
                </div>

                <div class="form-section-title"><i class="fas fa-align-left"></i> Storytelling</div>
                <div class="form-row"><label>Short Hook (One-liner)</label><input id="p-short" value="${p.short_description || ''}" placeholder="Brief catchy description"></div>
                <div class="form-row"><label>Detailed Description</label><textarea id="p-desc" rows="4" placeholder="Full product story, features, and benefits...">${p.description || ''}</textarea></div>
                
                <div class="step-footer">
                    <div style="color:var(--muted);font-size:0.75rem">Step 1 of 4</div>
                    <button class="btn btn-primary" type="button" onclick="switchProdTab(2, 'p-details')">Continue to Specs <i class="fas fa-arrow-right"></i></button>
                </div>
            </div>

            <!-- STEP 2: SPECIFICATIONS -->
            <div id="p-details" class="prod-tab-content">
                <div class="form-section-title"><i class="fas fa-tags"></i> Classification</div>
                <div class="form-grid-2">
                    <div class="form-row"><label>Category *</label><select id="p-cat" required>${catOpts}</select></div>
                    <div class="form-row"><label>Target Gender</label><select id="p-gen">${genOpts}</select></div>
                </div>

                <div class="form-section-title"><i class="fas fa-ruler-combined"></i> Frame & Lens Specs</div>
                <div class="form-grid-2">
                    <div class="form-row"><label>Frame Construction</label><select id="p-type">${typeOpts}</select></div>
                    <div class="form-row"><label>Frame Aesthetics (Shape)</label><select id="p-shape">${shapeOpts}</select></div>
                </div>
                <div class="form-grid-2">
                    <div class="form-row"><label>Frame Material</label><select id="p-mat">${matOpts}</select></div>
                    <div class="form-row"><label>Measurements (Size-Bridge-Temple)</label>
                        <div style="display:flex;gap:5px">
                            <input id="p-mw" placeholder="Lens" value="${p.lens_width || ''}" title="Lens Width">
                            <input id="p-mh" placeholder="Bridge" value="${p.bridge_size || ''}" title="Bridge Size">
                            <input id="p-ml" placeholder="Temple" value="${p.temple_length || ''}" title="Temple Length">
                        </div>
                    </div>
                </div>
                <div class="form-grid-2">
                    <div class="form-row"><label>Lens Composite</label><input id="p-lmat" value="${p.lens_composite || ''}" placeholder="e.g. TAC Polarized"></div>
                    <div class="form-row"><label>Lens Colorway</label><input id="p-lcol" value="${p.lens_colorway || ''}" placeholder="e.g. Solid Smoke"></div>
                </div>

                <div class="step-footer">
                    <button class="btn btn-outline" type="button" onclick="switchProdTab(1, 'p-basic')"><i class="fas fa-arrow-left"></i> Back</button>
                    <button class="btn btn-primary" type="button" onclick="switchProdTab(3, 'p-variants')">Go to Variants <i class="fas fa-arrow-right"></i></button>
                </div>
            </div>

            <!-- STEP 3: VARIANTS & STOCK -->
            <div id="p-variants" class="prod-tab-content">
                <div class="form-section-title"><i class="fas fa-layer-group"></i> Manage SKUs & Variations</div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                    <p style="margin:0;font-size:0.8rem;color:var(--muted)">Add different colors/sizes for this model.</p>
                    <button class="btn btn-primary btn-sm" type="button" onclick="openAddVariantModal('${id}')" style="border-radius:20px">+ New Variant</button>
                </div>

                <div class="table-container" style="background:var(--bg);border:1px solid var(--border);border-radius:12px">
                    <table style="font-size:0.8rem">
                        <thead>
                            <tr><th>Colorway</th><th>Size</th><th>Stock SKU</th><th>Action</th></tr>
                        </thead>
                        <tbody id="p-var-list">
                            ${p.variants.length > 0 ? p.variants.map(v => `
                                <tr>
                                    <td><span class="badge badge-gray">${v.color_code}</span></td>
                                    <td>${v.size_code}</td>
                                    <td><code class="id-tag">${v.sku}</code></td>
                                    <td>
                                        <button class="btn btn-outline btn-sm text-red" type="button" onclick="deleteVariant('${v.variant_id}', '${id}')" style="padding:4px 8px">
                                            <i class="fas fa-trash-alt"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('') : '<tr><td colspan="4" style="text-align:center;padding:20px;color:#999">No variants yet</td></tr>'}
                        </tbody>
                    </table>
                </div>
                
                <div class="step-footer">
                    <button class="btn btn-outline" type="button" onclick="switchProdTab(2, 'p-details')"><i class="fas fa-arrow-left"></i> Back</button>
                    <button class="btn btn-primary" type="button" onclick="switchProdTab(4, 'p-media')">Finalize Media <i class="fas fa-arrow-right"></i></button>
                </div>
            </div>

            <!-- STEP 4: MEDIA & SEO -->
            <div id="p-media" class="prod-tab-content">
                <div class="form-section-title"><i class="fas fa-image"></i> Visual Asset</div>
                <div class="form-row">
                    <label>Hero Image * (Main display image)</label>
                    <input type="hidden" id="p-img" value="${p.main_image || ''}">
                    <div id="p-img-preview" class="media-preview-box" style="height:160px;width:100%" onclick="openMediaSelector('p-img', 'p-img-preview')">
                        ${p.main_image ? `<img src="${p.main_image}" style="width:100%;height:100%;object-fit:contain">` : '<i class="fas fa-cloud-upload-alt fa-2x"></i><br><span>Select High-Res Image</span>'}
                    </div>
                </div>

                <div class="form-row" style="margin-top:15px">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
                        <label style="margin:0">Additional Images (Gallery)</label>
                        <button class="btn btn-outline btn-sm" type="button" onclick="openMediaSelector('p-add-img', 'p-add-img-preview', 'append')" style="padding:2px 8px;font-size:0.75rem">+ Add Asset</button>
                    </div>
                    <input type="hidden" id="p-add-img" value="${p.additional_images ? (Array.isArray(p.additional_images) ? p.additional_images.join(',') : p.additional_images) : ''}">
                    <div id="p-add-img-preview" style="display:flex; gap:10px; overflow-x:auto; padding:10px; background:var(--surface); border:1px solid var(--border); border-radius:8px; min-height:100px;">
                        ${(p.additional_images ? (Array.isArray(p.additional_images) ? p.additional_images : p.additional_images.split(',')).filter(Boolean) : []).map(url => `
                            <div style="position:relative; width:80px; height:80px; border-radius:8px; overflow:hidden; border:1px solid var(--border); flex-shrink:0;">
                                <img src="${url}" style="width:100%;height:100%;object-fit:cover">
                                <button type="button" onclick="this.parentElement.remove(); updateGalleryInput('p-add-img', 'p-add-img-preview')" style="position:absolute;top:2px;right:2px;background:red;color:white;border:none;border-radius:50%;width:20px;height:20px;font-size:10px;cursor:pointer">✕</button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="form-row" style="margin-top:15px">
                    <label>Product Video (Optional)</label>
                    <div style="display:flex; gap:10px">
                        <input id="p-video" value="${p.video_url || ''}" placeholder="Paste URL or select from library" style="flex:1">
                        <button class="btn btn-outline" type="button" onclick="openMediaSelector('p-video', null)">Browse Media</button>
                    </div>
                </div>

                <div class="form-section-title"><i class="fas fa-search-plus"></i> Search Engine Optimization</div>
                <div class="form-row">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                        <label style="margin:0">Meta SEO Title</label>
                        <button class="btn btn-outline btn-sm" type="button" onclick="runAIGenerator('${id}', true)" style="border-radius:20px;padding:3px 10px;font-size:0.7rem">
                            <i class="fas fa-keyboard"></i> Smart Suggest
                        </button>
                    </div>
                    <input id="p-seo-t" value="${defSeoTitle}" placeholder="SEO Title for Google">
                </div>
                <div class="form-row"><label>Meta Description</label><textarea id="p-seo-d" rows="2" placeholder="Describe this product for search results...">${p.seo_description || ''}</textarea></div>
                <div class="form-row"><label>Keywords / Tags (CSV)</label><input id="p-tags" value="${p.tags ? p.tags.join(',') : ''}" placeholder="eyeglasses, premium, rayban..."></div>

                <div class="step-footer">
                    <button class="btn btn-outline" type="button" onclick="switchProdTab(3, 'p-variants')"><i class="fas fa-arrow-left"></i> Back</button>
                    <div style="display:flex;gap:10px;flex:1;justify-content:flex-end">
                        <button class="btn btn-primary" type="submit" style="padding:10px 24px">Save & Sync</button>
                        ${!p.is_published ? `<button class="btn btn-success" type="button" onclick="togglePublish('${id}', true)">🚀 Go Live</button>` : ''}
                    </div>
                </div>
            </div>
        </form>
    `, 'large');
};

window.switchProdTab = function(stepNum, tabId) {
    // Tabs content visibility
    document.querySelectorAll('.prod-tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');

    // Stepper UI updates
    document.querySelectorAll('.stepper .step').forEach(s => {
        const sNum = parseInt(s.dataset.step);
        s.classList.remove('active', 'completed');
        if (sNum === stepNum) s.classList.add('active');
        else if (sNum < stepNum) s.classList.add('completed');
    });

    // Scroll modal to top
    const modal = document.getElementById('modal');
    if (modal) modal.scrollTop = 0;
};

window.saveEcommerceProduct = async function(e, id) {
    e.preventDefault();
    const body = {
        product_name: document.getElementById('p-name').value,
        selling_price: parseFloat(document.getElementById('p-selling').value) || null,
        mrp: parseFloat(document.getElementById('p-mrp').value) || null,
        short_description: document.getElementById('p-short').value,
        description: document.getElementById('p-desc').value,
        category_id: document.getElementById('p-cat').value,
        gender_id: document.getElementById('p-gen').value,
        frame_type_id: document.getElementById('p-type').value,
        shape_id: document.getElementById('p-shape').value,
        material_id: document.getElementById('p-mat').value,
        lens_composite: document.getElementById('p-lmat').value,
        lens_colorway: document.getElementById('p-lcol').value,
        lens_width: document.getElementById('p-mw').value,
        bridge_size: document.getElementById('p-mh').value,
        temple_length: document.getElementById('p-ml').value,
        main_image: document.getElementById('p-img').value,
        additional_images: document.getElementById('p-add-img') ? document.getElementById('p-add-img').value.split(',').filter(Boolean) : [],
        video_url: document.getElementById('p-video') ? document.getElementById('p-video').value : '',
        seo_title: document.getElementById('p-seo-t').value,
        seo_description: document.getElementById('p-seo-d').value,
        tags: document.getElementById('p-tags').value.split(',').map(t => t.trim()).filter(t => t),
    };

    const r = await api(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    if (r.success) {
        toast('Product information saved');
        if (document.getElementById('view-ecommerce')) load_ecommerce('unpublished');
        else renderQuickProductList();
    } else toast(r.error, 'error');
};

window.togglePublish = async function(id, status) {
    const endpoint = `/api/products/${id}/${status ? 'publish' : 'unpublish'}`;
    const r = await api(endpoint, { method: 'PATCH' });
    if (r.success) {
        toast(status ? 'Product Live on Website!' : 'Product Unpublished');
        closeModal();
        if (document.getElementById('view-ecommerce')) load_ecommerce(status ? 'published' : 'unpublished');
        else renderQuickProductList();
    } else toast(r.error, 'error');
};

/* ── VARIANT MANAGEMENT ── */

window.openAddVariantModal = function(id) {
    openModal('Add Product Variant', `
        <form id="addVariantForm" onsubmit="submitAddVariant(event, '${id}')">
            <div class="form-grid-2">
                <div class="form-row">
                    <label>Color Code / Name *</label>
                    <input name="color_code" placeholder="e.g. C1 / Matte Black" required>
                </div>
                <div class="form-row">
                    <label>Size Code *</label>
                    <input name="size_code" placeholder="e.g. 52-18-140" required>
                </div>
            </div>
            <div class="form-row">
                <label>SKU (Optional - Auto-generated if blank)</label>
                <input name="sku" placeholder="Leave blank for auto-generation">
            </div>
            <div style="margin-top:20px;display:flex;gap:10px">
                <button class="btn btn-outline" type="button" onclick="editEcommerceProduct('${id}')" style="flex:1">Cancel</button>
                <button class="btn btn-primary" type="submit" style="flex:2">Add Variant</button>
            </div>
        </form>
    `, 'small');
};

window.submitAddVariant = async function(e, id) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    
    const r = await postAPI(`/api/products/${id}/variants`, data);
    if (r.success) {
        toast('Variant added successfully');
        // Re-open product setup to Step 3
        await editEcommerceProduct(id);
        switchProdTab(3, 'p-variants');
    } else toast(r.error, 'error');
};

window.deleteVariant = async function(vid, pid) {
    if (!confirm('Are you sure you want to remove this variant? This will also remove its inventory data.')) return;
    
    const r = await api(`/api/products/variants/${vid}`, { method: 'DELETE' });
    if (r.success) {
        toast('Variant removed');
        // Refresh product setup modal
        await editEcommerceProduct(pid);
        switchProdTab(3, 'p-variants');
    } else toast(r.error, 'error');
};

window.runAIGenerator = async function(id, isSeo = false) {
    const nameEl = document.getElementById('p-name');
    const seoEl = document.getElementById('p-seo-t');
    const catEl = document.getElementById('p-cat');
    const brandLabel = document.querySelector('.modal-header span').textContent.split(': ')[1] || 'Blink Opticals';
    
    // Get text of selected category
    const catText = catEl.options[catEl.selectedIndex]?.text || '';
    
    toast('✨ AI generating ideas...', 'info');
    
    // Simulate thinking delay
    await new Promise(r => setTimeout(r, 800));

    if (!isSeo) {
        // Generate Ecommerce Name
        const currentName = nameEl.value;
        const suggestions = [
            `${brandLabel} | Premium ${catText} Frame`,
            `${brandLabel} ${currentName ? '- ' + currentName : ''} (Limited Edition)`,
            `Luxury ${catText} by ${brandLabel} | Classic Series`,
            `${brandLabel} Model ${currentName || 'Elite'} | Ultra-Lightweight`
        ];
        // Pick one or just set it
        nameEl.value = suggestions[0];
        toast('Display name updated');
    } else {
        // Generate SEO Title
        const suggestions = [
            `Buy ${brandLabel} ${catText} Online | Free Delivery – BlinkOpticals`,
            `${brandLabel} ${catText} Collection 2026 | Best Price in India`,
            `${brandLabel} Eyewear | Premium Quality ${catText} Frames`,
        ];
        seoEl.value = suggestions[0];
        toast('SEO title optimized for search');
    }
};


/* ── BULK PRODUCT IMPORT ── */

window.load_bulk_import = async function() {
    const showrooms = await api('/api/showrooms');
    const showOpts = (showrooms.data || []).map(s => `<option value="${s.showroom_id}">${s.showroom_name}</option>`).join('');

    const el = document.getElementById('view-bulk_import');
    el.innerHTML = `
    <div style="display:grid; grid-template-columns: 1fr 340px; gap:24px">
        <div class="card">
            <div class="card-header"><h3>Excel Bulk Import</h3></div>
            <div class="card-body" style="padding:30px">
                <div style="max-width:500px; margin:0 auto; text-align:center">
                    <div class="form-row" style="text-align:left">
                        <label>1. Select Target Showroom *</label>
                        <select id="imp-showroom" style="height:45px; font-size:1rem">${showOpts}</select>
                    </div>
                    
                    <div id="dropzone" style="border:2px dashed var(--border); border-radius:12px; padding:40px; cursor:pointer; background:var(--bg); transition:.2s">
                        <i class="fas fa-file-excel fa-3x" style="color:var(--accent); margin-bottom:15px"></i>
                        <h4>Upload Products Excel</h4>
                        <p style="color:#666; font-size:0.8rem">Click to browse or Drag & Drop .xlsx file here</p>
                        <input type="file" id="imp-file" hidden accept=".xlsx,.xls,.csv" onchange="handleBulkValidation()">
                    </div>
                </div>

                <div id="imp-preview-box" style="display:none; margin-top:30px; text-align:left">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px">
                        <h4 id="imp-count">Data Preview (0 Rows)</h4>
                        <div style="display:flex; gap:10px">
                            <button class="btn btn-outline" onclick="cancelBulkImport()">Cancel</button>
                            <button class="btn btn-primary" onclick="executeBulkImport()">Save Approved Rows</button>
                        </div>
                    </div>
                    <div class="table-container" style="max-height:400px; overflow-y:auto">
                        <table>
                            <thead><tr>
                                <th style="width:40px"><input type="checkbox" id="imp-select-all" onchange="toggleImportSelectAll()" checked></th>
                                <th>R.</th><th>Brand</th><th>Cat.</th><th>Model No</th><th>UPC Code</th><th>Type</th><th>Material</th><th>Qty</th><th>MRP</th><th>Status</th>
                            </tr></thead>
                            <tbody id="imp-preview-list"></tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>

        <div class="card">
            <div class="card-header"><h3>Download Template</h3></div>
            <div class="card-body" style="padding:20px">
                <p style="font-size:0.8rem; color:#666; margin-bottom:15px">Use our standard template to ensure all columns match the system requirements.</p>
                <button class="btn btn-primary" style="width:100%" onclick="toast('Downloading Master Template...'); window.location.href='/api/public/download-template'">
                    <i class="fas fa-download"></i> Download Master Template (v7)
                </button>
                
                <h3 style="font-size:0.85rem; margin:25px 0 10px">Recent Imports</h3>
                <div id="imp-log-list" style="font-size:0.75rem">${skelRows()}</div>
            </div>
        </div>
    </div>`;

    document.getElementById('dropzone').onclick = () => document.getElementById('imp-file').click();
    renderImportLogs();
};

window.handleBulkValidation = async function() {
    const file = document.getElementById('imp-file').files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('file', file);

    const r = await fetch('/api/products/bulk-validate', { method: 'POST', body: fd, credentials: 'include' }).then(res => res.json());
    if (r.success) {
        window.CURRENT_IMPORT_DATA = r.preview;
        document.getElementById('imp-preview-box').style.display = 'block';
        
        const summaryText = r.errorCount > 0 
            ? `<span style="color:var(--danger)">Found ${r.errorCount} Errors in ${r.total} Rows</span>`
            : `<span style="color:var(--secondary)">${r.total} Rows Valid & Ready</span>`;
            
        document.getElementById('imp-count').innerHTML = `Import Preview | ${summaryText}`;
        
        document.getElementById('imp-preview-list').innerHTML = r.preview.slice(0, 100).map((p, idx) => `
            <tr style="${p.isValid ? '' : 'background:rgba(255,0,0,0.03)'}">
                <td><input type="checkbox" class="row-check" data-idx="${idx}" ${p.isValid ? 'checked' : 'disabled'}></td>
                <td>${p._rowId}</td>
                <td style="${p.isValid ? '' : 'color:var(--danger); font-weight:600'}">${p['Brand'] || '-'}</td>
                <td><span style="font-size:0.75rem; color:var(--muted)">${p['Category'] || 'NA'}</span></td>
                <td>${p['Model No'] || '-'}</td>
                <td><span style="color:var(--accent); font-weight:600">${p['UPC Code'] || '-'}</span></td>
                <td>${p['Frame Type'] || '-'}</td>
                <td>${p['Frame Material'] || '-'}</td>
                <td>${p['Qty'] || 0}</td>
                <td>₹${p['MRP'] || 0}</td>
                <td>
                    ${p.isValid 
                        ? '<span class="kpi-green" style="padding:2px 8px; font-size:0.7rem">Ready</span>' 
                        : `<span style="color:var(--danger); font-size:0.7rem; font-weight:600"><i class="fas fa-exclamation-triangle"></i> ${p.errors}</span>`}
                </td>
            </tr>
        `).join('') + (r.preview.length > 100 ? `<tr><td colspan="10" style="text-align:center; padding:10px; color:var(--muted)">Showing first 100 rows for preview... Only selected valid rows will be imported.</td></tr>` : '');
    } else toast(r.error, 'error');
};

window.cancelBulkImport = function() {
    document.getElementById('imp-preview-box').style.display = 'none';
    document.getElementById('imp-file').value = '';
    window.CURRENT_IMPORT_DATA = null;
    document.getElementById('imp-preview-list').innerHTML = '';
};

window.toggleImportSelectAll = function() {
    const master = document.getElementById('imp-select-all').checked;
    document.querySelectorAll('.row-check:not([disabled])').forEach(cb => cb.checked = master);
};

window.executeBulkImport = async function() {
    const sid = document.getElementById('imp-showroom').value;
    if (!sid) return toast('Please select showroom', 'error');
    if (!window.CURRENT_IMPORT_DATA || window.CURRENT_IMPORT_DATA.length === 0) return toast('No data to import', 'error');

    const selectedIdx = Array.from(document.querySelectorAll('.row-check:checked')).map(cb => parseInt(cb.dataset.idx));
    if (selectedIdx.length === 0) return toast('No valid rows selected for import', 'warning');

    const confirmed = confirm(`Are you sure you want to import ${selectedIdx.length} approved records?`);
    if (!confirmed) return;

    const approvedRows = selectedIdx.map(idx => window.CURRENT_IMPORT_DATA[idx]);
    
    openModal('Importing Data...', `
        <div style="text-align:center; padding:30px">
            <h3 id="import-status-text" style="color:var(--text); margin-bottom:10px">Preparing to import...</h3>
            <div style="width:100%; height:12px; background:#eee; border-radius:6px; margin:20px 0; overflow:hidden">
                <div id="import-progress-bar" style="width:0%; height:100%; background:var(--secondary); transition:width 0.3s ease"></div>
            </div>
            <p id="import-percent" style="font-size:1.2rem; font-weight:700; color:var(--secondary)">0%</p>
            <p style="font-size:0.8rem; color:var(--muted); margin-top:10px">Please do not close this window.</p>
        </div>
    `);

    let totalImported = 0;
    let totalFailed   = 0;
    const allErrors   = [];
    const CHUNK_SIZE = 10;

    try {
        for (let i = 0; i < approvedRows.length; i += CHUNK_SIZE) {
            const chunk = approvedRows.slice(i, i + CHUNK_SIZE);
            
            const r = await fetch('/api/products/bulk-import-save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ showroom_id: sid, products: chunk }),
                credentials: 'include'
            }).then(res => res.json());

            if (!r.success) throw new Error(r.error || 'Import chunk failed');
            
            totalImported += r.imported_count || 0;
            totalFailed   += r.failed_count   || 0;
            allErrors.push(...(r.errors || []));
            
            const processed = Math.min(i + CHUNK_SIZE, approvedRows.length);
            const percentage = Math.round((processed / approvedRows.length) * 100);
            
            const statusEl = document.getElementById('import-status-text');
            const barEl = document.getElementById('import-progress-bar');
            const pctEl = document.getElementById('import-percent');
            
            if (statusEl) statusEl.innerText = `Processing ${processed} of ${approvedRows.length} records`;
            if (barEl) barEl.style.width = `${percentage}%`;
            if (pctEl) pctEl.innerText = `${percentage}%`;
        }

        const modalBody = document.querySelector('.modal-body');
        if (modalBody) {
            const errHtml = allErrors.length > 0 ? `
                <div style="margin-top:15px; max-height:150px; overflow-y:auto; text-align:left; background:#fff8f8; border-radius:8px; padding:10px; font-size:0.75rem">
                    <div style="font-weight:700; color:var(--danger); margin-bottom:6px">Failed Rows:</div>
                    ${allErrors.slice(0,20).map(e => `<div style="color:#c00; padding:2px 0">Row ${e.rowId}: ${e.reason}</div>`).join('')}
                    ${allErrors.length > 20 ? `<div style="color:#888">...and ${allErrors.length - 20} more</div>` : ''}
                </div>` : '';

            modalBody.innerHTML = `
                <div style="text-align:center; padding:20px">
                    <i class="fas fa-${totalFailed === 0 ? 'check-circle' : 'exclamation-circle'} fa-4x" style="color:${totalFailed === 0 ? 'var(--secondary)' : 'var(--warning)'}"></i>
                    <h2 style="margin:15px 0">Import ${totalFailed === 0 ? 'Successful' : 'Completed with Issues'}</h2>
                    <div class="kpi-grid" style="grid-template-columns:repeat(${totalFailed > 0 ? 3 : 2}, 1fr); margin-top:20px">
                        <div class="kpi-card"><div class="kpi-label">Processed</div><div class="kpi-value">${approvedRows.length}</div></div>
                        <div class="kpi-card"><div class="kpi-label" style="color:var(--secondary)">Imported</div><div class="kpi-value" style="color:var(--secondary)">${totalImported}</div></div>
                        ${totalFailed > 0 ? `<div class="kpi-card"><div class="kpi-label" style="color:var(--danger)">Failed</div><div class="kpi-value" style="color:var(--danger)">${totalFailed}</div></div>` : ''}
                    </div>
                    ${errHtml}
                    <button class="btn btn-primary" onclick="closeModal(); switchView('products')" style="margin-top:20px; width:100%">Go to Product List</button>
                </div>
            `;
        }
        
        const modalHeader = document.querySelector('.modal-header h4');
        if (modalHeader) modalHeader.innerText = 'Import Complete';
        
        document.getElementById('imp-preview-box').style.display = 'none';
        document.getElementById('imp-file').value = '';
        if (window.load_bulk_import) load_bulk_import();

    } catch (err) {
        closeModal();
        toast(err.message || 'Network error during import', 'error');
    }
};


async function renderImportLogs() {
    const r = await api('/api/products/import-logs');
    const list = document.getElementById('imp-log-list');
    if (!list) return;
    if (!r.success || !r.data || r.data.length === 0) {
        list.innerHTML = '<p style="color:#888; text-align:center; padding:20px">No recent imports found.</p>';
        return;
    }
    list.innerHTML = r.data.map(l => `
        <div style="padding:10px; border-bottom:1px solid var(--border)">
            <div style="display:flex; justify-content:space-between">
                <b>${l.file_name}</b>
                <span style="color:#888">${fmtDate(l.created_at)}</span>
            </div>
            <div style="color:#666; margin-top:3px">${l.success_rows} Success / ${l.failed_rows} Failed</div>
        </div>
    `).join('');
}




/* ── ACCOUNTING MODULE ── */

/* ── ACCOUNTING & FINANCE MODULE (ENTERPRISE GRADE) ── */

window.load_accounting = async function() {
    const el = document.getElementById('view-accounting');
    if (!el) return;

    // Fetch showrooms for the global filter
    const sh = await api('/api/showrooms');
    const shOpts = (sh.data || []).map(s => `<option value="${s.showroom_id}">${s.showroom_name}</option>`).join('');

    el.innerHTML = `
    <div class="module-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px">
        <div>
            <h2 style="margin:0; font-weight:800; letter-spacing:-0.5px">Accounting & Finance</h2>
            <p style="color:var(--muted); font-size:0.85rem">Real-time ledger, expense tracking and financial reporting</p>
        </div>
        <div class="module-actions" style="display:flex; gap:12px; align-items:center">
             <div class="filter-glass" style="display:flex; align-items:center; gap:8px; padding:6px 12px; background:var(--bg-alt); border-radius:12px; border:1px solid var(--border)">
                <i class="fas fa-store" style="color:var(--accent); font-size:0.8rem"></i>
                <select id="acc-global-showroom" style="border:none; background:transparent; font-size:0.85rem; font-weight:600; outline:none" onchange="refreshAccountingView()">
                    <option value="">Consolidated (All)</option>
                    ${shOpts}
                </select>
            </div>
            <button class="btn btn-primary" onclick="openQuickTransactionModal()"><i class="fas fa-plus"></i> New Transaction</button>
        </div>
    </div>

    <div class="tabs-header glass" style="padding:4px; border-radius:14px; background:rgba(0,0,0,0.03); display:inline-flex; gap:4px; margin-bottom:24px">
        <div class="tab-item active" onclick="switchAccountingTab(this, 'dash')"><i class="fas fa-grid-2"></i> Overview</div>
        <div class="tab-item" onclick="switchAccountingTab(this, 'ledger')"><i class="fas fa-book"></i> Ledger</div>
        <div class="tab-item" onclick="switchAccountingTab(this, 'exp')"><i class="fas fa-receipt"></i> Expenses</div>
        <div class="tab-item" onclick="switchAccountingTab(this, 'pay')"><i class="fas fa-wallet"></i> Payments</div>
        <div class="tab-item" onclick="switchAccountingTab(this, 'coa')"><i class="fas fa-sitemap"></i> Chart of Accounts</div>
        <div class="tab-item" onclick="switchAccountingTab(this, 'reports')"><i class="fas fa-file-chart-column"></i> Reports</div>
    </div>

    <div id="acc-tab-content" class="fade-in"></div>
    `;

    switchAccountingTab(el.querySelector('.tab-item.active'), 'dash');
};

window.refreshAccountingView = function() {
    const activeTab = document.querySelector('#view-accounting .tab-item.active');
    if (!activeTab) return;
    const tabKey = activeTab.getAttribute('onclick').match(/'([^']+)'/)[1];
    switchAccountingTab(activeTab, tabKey);
};

window.switchAccountingTab = function(el, tab) {
    if (el) {
        document.querySelectorAll('#view-accounting .tab-item').forEach(i => i.classList.remove('active'));
        el.classList.add('active');
    }
    const content = document.getElementById('acc-tab-content');
    if (!content) return;
    
    content.innerHTML = `<div style="padding:100px; text-align:center"><i class="fas fa-spinner fa-spin fa-3x" style="color:var(--accent); opacity:0.3"></i></div>`;
    
    const showroom_id = document.getElementById('acc-global-showroom')?.value || '';

    if (tab === 'dash') renderAccountingDashboard(showroom_id);
    else if (tab === 'ledger') renderAccountingLedger(showroom_id);
    else if (tab === 'exp') renderAccountingExpenses(showroom_id);
    else if (tab === 'pay') renderAccountingPayments(showroom_id);
    else if (tab === 'coa') renderAccountingCOA();
    else if (tab === 'reports') renderAccountingReports(showroom_id);
};

// ── DASHBOARD ─────────────────────────────────────────────────────────

async function renderAccountingDashboard(sid) {
    const r = await api(`/api/accounting/dashboard?showroom_id=${sid}`);
    const content = document.getElementById('acc-tab-content');
    if (!r.success) return content.innerHTML = `<div class="card">${r.error}</div>`;

    const d = r.data;
    content.innerHTML = `
    <div class="kpi-grid" style="grid-template-columns: repeat(4, 1fr); gap:20px">
        <div class="kpi-card glass">
            <div style="display:flex; justify-content:space-between; align-items:flex-start">
                <div>
                    <div class="kpi-label">Total Cash Inflow</div>
                    <div class="kpi-value">${fmt(d.total_income)}</div>
                </div>
                <div class="kpi-icon" style="background:rgba(16, 185, 129, 0.1); color:#10b981"><i class="fas fa-arrow-trend-up"></i></div>
            </div>
            <div class="kpi-trend text-green"><i class="fas fa-check-circle"></i> Real-time Sync</div>
        </div>
        <div class="kpi-card glass">
            <div style="display:flex; justify-content:space-between; align-items:flex-start">
                <div>
                    <div class="kpi-label">Total Outflow</div>
                    <div class="kpi-value text-red">${fmt(d.total_expense)}</div>
                </div>
                <div class="kpi-icon" style="background:rgba(239, 68, 68, 0.1); color:#ef4444"><i class="fas fa-receipt"></i></div>
            </div>
            <div class="kpi-trend text-red"><i class="fas fa-exclamation-circle"></i> Operational Costs</div>
        </div>
        <div class="kpi-card glass">
            <div style="display:flex; justify-content:space-between; align-items:flex-start">
                <div>
                    <div class="kpi-label">Outstanding Receivables</div>
                    <div class="kpi-value text-warn">${fmt(d.outstanding_receivables)}</div>
                </div>
                <div class="kpi-icon" style="background:rgba(245, 158, 11, 0.1); color:#f59e0b"><i class="fas fa-clock"></i></div>
            </div>
            <div class="kpi-trend text-warn">Pending from customers</div>
        </div>
        <div class="kpi-card glass" style="background:var(--accent); color:white">
            <div style="display:flex; justify-content:space-between; align-items:flex-start">
                <div>
                    <div class="kpi-label" style="color:rgba(255,255,255,0.7)">Net Liquidity</div>
                    <div class="kpi-value" style="color:white">${fmt(d.net_position)}</div>
                </div>
                <div class="kpi-icon" style="background:rgba(255,255,255,0.2); color:white"><i class="fas fa-vault"></i></div>
            </div>
            <div class="kpi-trend" style="color:rgba(255,255,255,0.8)">Available Balance</div>
        </div>
    </div>

    <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap:24px; margin-top:24px">
        <div class="card">
            <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
                <h3 style="margin:0">Recent Ledger Activity</h3>
                <button class="btn btn-outline btn-sm" onclick="switchAccountingTab(null, 'ledger')">View Full Ledger</button>
            </div>
            <div id="dash-recent-ledger" style="padding:10px">
                <div style="padding:40px; text-align:center"><i class="fas fa-spinner fa-spin"></i></div>
            </div>
        </div>
        <div class="card">
            <div class="card-header"><h3>Expense Distribution</h3></div>
            <div class="card-body" style="padding:20px; text-align:center; min-height:250px; display:flex; flex-direction:column; justify-content:center">
                <i class="fas fa-chart-pie fa-3x" style="color:var(--border); margin-bottom:15px"></i>
                <p style="color:var(--muted)">Interactive financial breakdown coming soon</p>
            </div>
        </div>
    </div>
    `;

    // Fetch minor recent ledger for the dashboard
    const lr = await api(`/api/accounting/transactions?showroom_id=${sid}&limit=5`);
    const lBox = document.getElementById('dash-recent-ledger');
    if (lr.success && lr.data.length > 0) {
        lBox.innerHTML = `
        <table class="table-sm">
            <thead><tr><th>Date</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
            <tbody>
                ${lr.data.slice(0, 5).map(t => `
                    <tr>
                        <td><small>${fmtDate(t.date)}</small></td>
                        <td><b style="font-size:0.8rem">${t.notes || t.reference_type}</b><br><small style="color:var(--muted)">${t.showroom_name || 'Global'}</small></td>
                        <td style="text-align:right; font-weight:700">${fmt(t.total_amount)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
    } else {
        lBox.innerHTML = `<div style="padding:40px; text-align:center; color:var(--muted)">No recent transactions found</div>`;
    }
}

// ── LEDGER / TRANSACTIONS ─────────────────────────────────────────────

async function renderAccountingLedger(sid) {
    const r = await api(`/api/accounting/transactions?showroom_id=${sid}`);
    const content = document.getElementById('acc-tab-content');
    if (!r.success) return content.innerHTML = `Error: ${r.error}`;

    content.innerHTML = `
    <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
            <h3 style="margin:0"><i class="fas fa-book-open"></i> Transaction Ledger</h3>
            <div style="display:flex; gap:10px">
                <button class="btn btn-outline btn-sm" onclick="toast('Exporting ledger...')"><i class="fas fa-download"></i> Export CSV</button>
            </div>
        </div>
        <div class="table-container">
            <table>
                <thead><tr><th>Date</th><th>Showroom</th><th>Ref Type</th><th>Notes</th><th>Double Entry Detail</th><th style="text-align:right">Total</th></tr></thead>
                <tbody>
                    ${r.data.map(t => `
                        <tr>
                            <td><div style="font-weight:600">${fmtDate(t.date)}</div><small style="color:var(--muted)">${new Date(t.created_at).toLocaleTimeString()}</small></td>
                            <td>${badge(t.showroom_name || 'Global')}</td>
                            <td><span class="id-tag" style="background:var(--bg-alt)">${t.reference_type.toUpperCase()}</span></td>
                            <td style="max-width:250px; font-size:0.85rem">${t.notes || '-'}</td>
                            <td style="padding:8px">
                                <div style="display:grid; grid-template-columns: 1fr 100px; gap:8px; font-size:0.75rem; border-left:2px solid var(--border); padding-left:10px">
                                    ${t.lines ? t.lines.map(l => `
                                        <span style="color:${l.debit_amount > 0 ? 'var(--text)' : 'var(--muted)'}">${l.account_name}</span>
                                        <b style="text-align:right">${l.debit_amount > 0 ? 'Dr '+fmt(l.debit_amount) : 'Cr '+fmt(l.credit_amount)}</b>
                                    `).join('') : '<span style="color:var(--danger)">Corrupt Entry</span>'}
                                </div>
                            </td>
                            <td style="text-align:right; font-weight:800; font-size:1rem; color:var(--accent)">${fmt(t.total_amount)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>`;
}

// ── EXPENSES ──────────────────────────────────────────────────────────

async function renderAccountingExpenses(sid) {
    const r = await api(`/api/accounting/expenses?showroom_id=${sid}`);
    const content = document.getElementById('acc-tab-content');
    
    content.innerHTML = `
    <div class="card" style="margin-bottom:20px; background:linear-gradient(135deg, var(--bg) 0%, var(--bg-alt) 100%)">
        <div style="display:flex; justify-content:space-between; align-items:center; padding:20px">
            <div>
                <h3 style="margin:0">Operational Expenses</h3>
                <p style="margin:0; font-size:0.8rem; color:var(--muted)">Logged costs across all branches</p>
            </div>
            <button class="btn btn-primary" onclick="openExpenseModal()"><i class="fas fa-plus"></i> Add Expense</button>
        </div>
    </div>
    <div class="card">
        <div class="table-container">
            <table>
                <thead><tr><th>Date</th><th>Showroom</th><th>Category</th><th>Payee</th><th>Ref / Mode</th><th style="text-align:right">Amount</th></tr></thead>
                <tbody>
                    ${(r.data && r.data.length > 0) ? r.data.map(e => `
                        <tr>
                            <td><b>${fmtDate(e.date)}</b></td>
                            <td>${badge(e.showroom_name || 'Global')}</td>
                            <td><span class="badge" style="background:var(--accent-light); color:var(--accent)">${e.account_name}</span></td>
                            <td><b>${e.payee || '-'}</b></td>
                            <td><small>${e.payment_mode} ${e.reference_no ? `(${e.reference_no})` : ''}</small></td>
                            <td style="text-align:right; font-weight:700; color:var(--danger); font-size:1rem">${fmt(e.amount)}</td>
                        </tr>
                    `).join('') : '<tr><td colspan="6" style="text-align:center; padding:60px; color:var(--muted)"><i class="fas fa-receipt fa-2x" style="opacity:0.2; margin-bottom:10px"></i><br>No expense records found.</td></tr>'}
                </tbody>
            </table>
        </div>
    </div>`;
}

window.openExpenseModal = async function() {
    const [accs, showrooms] = await Promise.all([
        api('/api/accounting/accounts'),
        api('/api/showrooms')
    ]);
    const expAccs = (accs.data || []).filter(a => a.account_type === 'expense');
    const accOpts = expAccs.map(a => `<option value="${a.account_id}">${a.account_name}</option>`).join('');
    const shOpts = (showrooms.data || []).map(s => `<option value="${s.showroom_id}">${s.showroom_name}</option>`).join('');

    openModal('Record Operational Expense', `
    <form id="expenseForm">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px">
             <div class="form-row">
                <label>Branch / Showroom *</label>
                <select name="showroom_id" required>${shOpts}</select>
            </div>
            <div class="form-row">
                <label>Expense Category *</label>
                <select name="account_id" required>${accOpts}</select>
            </div>
        </div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px">
            <div class="form-row">
                <label>Amount (₹) *</label>
                <input type="number" name="amount" required step="0.01" style="font-weight:700; font-size:1.1rem">
            </div>
            <div class="form-row">
                <label>Payee / Vendor</label>
                <input type="text" name="payee" placeholder="e.g. Electricity Board">
            </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px">
            <div class="form-row"><label>Date</label><input type="date" name="date" value="${new Date().toISOString().split('T')[0]}"></div>
            <div class="form-row">
                <label>Payment Mode</label>
                <select name="payment_mode">
                    <option>Cash</option><option>Bank Transfer</option><option>UPI</option><option>Card</option>
                </select>
            </div>
        </div>

        <div class="form-row">
            <label>Reference No / Invoice No</label>
            <input type="text" name="reference_no" placeholder="e.g. INV-2024-001">
        </div>

        <div class="form-row">
            <label>Notes</label>
            <textarea name="notes" rows="2" placeholder="Describe the purpose of this expense..."></textarea>
        </div>

        <button type="submit" class="btn btn-primary" style="width:100%; margin-top:10px; height:45px">Save Expense Record</button>
    </form>
    `);

    document.getElementById('expenseForm').onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        const r = await postAPI('/api/accounting/expenses', data);
        if (r.success) {
            toast('Expense recorded successfully', 'success');
            closeModal();
            refreshAccountingView();
        } else toast(r.error, 'error');
    };
};

// ── PAYMENTS ──────────────────────────────────────────────────────────

async function renderAccountingPayments(sid) {
    const r = await api(`/api/accounting/payments?showroom_id=${sid}`);
    const content = document.getElementById('acc-tab-content');
    
    content.innerHTML = `
    <div class="card" style="margin-bottom:20px">
        <div style="display:flex; justify-content:space-between; align-items:center; padding:20px">
            <div>
                <h3 style="margin:0">Cash Inflow & Outflow</h3>
                <p style="margin:0; font-size:0.8rem; color:var(--muted)">Log non-expense cash movements</p>
            </div>
            <button class="btn btn-primary" onclick="openAddPaymentModal()"><i class="fas fa-handshake"></i> Record Payment</button>
        </div>
    </div>
    <div class="card">
        <div class="table-container">
            <table>
                <thead><tr><th>Date</th><th>Showroom</th><th>Type</th><th>Account</th><th>Mode</th><th style="text-align:right">Amount</th></tr></thead>
                <tbody>
                    ${(r.data && r.data.length > 0) ? r.data.map(p => `
                        <tr>
                            <td>${fmtDate(p.date)}</td>
                            <td>${badge(p.showroom_name || 'Global')}</td>
                            <td><span class="badge ${p.payment_type === 'incoming' ? 'badge-green' : 'badge-red'}" style="padding:4px 10px">${p.payment_type.toUpperCase()}</span></td>
                            <td><b>${p.account_name}</b></td>
                            <td>${p.payment_mode}</td>
                            <td style="text-align:right; font-weight:800; font-size:1rem" class="${p.payment_type === 'incoming' ? 'text-green' : 'text-red'}">${fmt(p.amount)}</td>
                        </tr>
                    `).join('') : '<tr><td colspan="6" style="text-align:center; padding:60px; color:var(--muted)">No payment records.</td></tr>'}
                </tbody>
            </table>
        </div>
    </div>`;
}

window.openAddPaymentModal = async function() {
    const [accs, showrooms] = await Promise.all([
        api('/api/accounting/accounts'),
        api('/api/showrooms')
    ]);
    const bankAccs = (accs.data || []).filter(a => a.account_type === 'asset');
    const accOpts = bankAccs.map(a => `<option value="${a.account_id}">${a.account_name}</option>`).join('');
    const shOpts = (showrooms.data || []).map(s => `<option value="${s.showroom_id}">${s.showroom_name}</option>`).join('');

    openModal('Record Payment / Receipt', `
    <form id="paymentForm">
         <div class="form-row">
            <label>Branch / Showroom *</label>
            <select name="showroom_id" required>${shOpts}</select>
        </div>
        <div class="form-row">
            <label>Transaction Type *</label>
            <select name="payment_type">
                <option value="incoming">Receipt (Inward Cash/Bank)</option>
                <option value="outgoing">Payment (Outward Cash/Bank)</option>
            </select>
        </div>
        <div class="form-row">
            <label>Amount (₹) *</label>
            <input type="number" name="amount" required step="0.01" style="font-size:1.1rem; font-weight:700">
        </div>
        <div class="form-row">
            <label>Cash / Bank Account *</label>
            <select name="account_id" required>${accOpts}</select>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px">
             <div class="form-row"><label>Date</label><input type="date" name="date" value="${new Date().toISOString().split('T')[0]}"></div>
             <div class="form-row">
                <label>Mode</label>
                <select name="payment_mode">
                    <option>Cash</option><option>Bank Transfer</option><option>UPI</option><option>Card</option>
                </select>
            </div>
        </div>
        <div class="form-row"><label>Notes</label><textarea name="notes" placeholder="Reference details..."></textarea></div>
        <button type="submit" class="btn btn-primary" style="width:100%; margin-top:10px; height:45px">Process Transaction</button>
    </form>
    `);

    document.getElementById('paymentForm').onsubmit = async (e) => {
        e.preventDefault();
        const r = await postAPI('/api/accounting/payments', Object.fromEntries(new FormData(e.target)));
        if (r.success) { toast('Transaction processed', 'success'); closeModal(); refreshAccountingView(); }
        else toast(r.error, 'error');
    };
};

// ── CHART OF ACCOUNTS (COA) ───────────────────────────────────────────

async function renderAccountingCOA() {
    const r = await api('/api/accounting/accounts');
    const content = document.getElementById('acc-tab-content');
    
    content.innerHTML = `
    <div class="card" style="margin-bottom:24px">
        <div style="display:flex; justify-content:space-between; align-items:center; padding:20px">
            <div>
                <h3 style="margin:0">Financial Architecture</h3>
                <p style="margin:0; font-size:0.8rem; color:var(--muted)">Manage your general ledger categories</p>
            </div>
            <button class="btn btn-primary" onclick="openAddAccountModal()"><i class="fas fa-folder-plus"></i> New Ledger Head</button>
        </div>
    </div>
    <div class="card">
        <div class="table-container">
            <table>
                <thead><tr><th>Code</th><th>Account Name</th><th>Account Type</th><th>Creation Date</th><th>Status</th><th style="text-align:right">Action</th></tr></thead>
                <tbody>
                    ${(r.data && r.data.length > 0) ? r.data.map(a => `
                        <tr>
                            <td style="width:100px"><span class="id-tag" style="background:var(--bg-alt); width:100%">${a.code || '-'}</span></td>
                            <td style="font-weight:700; color:var(--accent)">${a.account_name}</td>
                            <td><span class="badge" style="background:#eee; text-transform:uppercase; font-size:0.7rem">${a.account_type}</span></td>
                            <td><small>${fmtDate(a.created_at)}</small></td>
                            <td>${a.active_status ? '<span class="kpi-green" style="padding:2px 8px; border-radius:10px; font-size:0.7rem">Active</span>' : '<span class="badge-gray">Inactive</span>'}</td>
                            <td style="text-align:right"><button class="btn-icon" onclick="toast('Delete/Edit coming soon')"><i class="fas fa-ellipsis-v"></i></button></td>
                        </tr>
                    `).join('') : '<tr><td colspan="6" style="text-align:center; padding:40px">No accounts found.</td></tr>'}
                </tbody>
            </table>
        </div>
    </div>`;
}

window.openAddAccountModal = function() {
    openModal('Define New Ledger Account', `
    <form id="accountForm">
        <div class="form-row">
            <label>Legal Account Name *</label>
            <input type="text" name="account_name" required placeholder="e.g. HDFC Current Account">
        </div>
        <div class="form-row">
            <label>Reporting Classification *</label>
            <select name="account_type">
                <option value="asset">Asset (Cash, Bank, Inventory)</option>
                <option value="liability">Liability (Loans, Payables)</option>
                <option value="income">System Income / Revenue</option>
                <option value="expense">Operational Expense</option>
            </select>
        </div>
        <div class="form-row">
            <label>GL Code (Internal Reference)</label>
            <input type="text" name="code" placeholder="e.g. 100-200">
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%; margin-top:20px; height:45px">Establish Account</button>
    </form>
    `);

    document.getElementById('accountForm').onsubmit = async (e) => {
        e.preventDefault();
        const r = await postAPI('/api/accounting/accounts', Object.fromEntries(new FormData(e.target)));
        if (r.success) { toast('Ledger account established', 'success'); closeModal(); refreshAccountingView(); }
        else toast(r.error, 'error');
    };
};

// ── REPORTS (P&L, BALANCE SHEET) ──────────────────────────────────────

async function renderAccountingReports(sid) {
    const content = document.getElementById('acc-tab-content');
    content.innerHTML = `
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px">
        <div class="card" style="padding:30px; text-align:center; border:1px solid var(--border); transition:0.3s" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
            <div style="font-size:3rem; margin-bottom:15px">📈</div>
            <h3 style="margin-bottom:8px">Profit & Loss (Income Statement)</h3>
            <p style="color:var(--muted); font-size:0.85rem; margin-bottom:20px">Comprehensive breakdown of revenue vs expenses for the selected branch/period.</p>
            <div style="display:flex; gap:10px; justify-content:center">
                <input type="date" id="pl-from" class="btn btn-outline btn-sm" value="${new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]}">
                <input type="date" id="pl-to" class="btn btn-outline btn-sm" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <button class="btn btn-primary" style="margin-top:20px; width:100%" onclick="viewPLReportDetailed()">Generate Detailed P&L</button>
        </div>
        
        <div class="card" style="padding:30px; text-align:center; opacity:0.7">
            <div style="font-size:3rem; margin-bottom:15px">🏦</div>
            <h3 style="margin-bottom:8px">Balance Sheet</h3>
            <p style="color:var(--muted); font-size:0.85rem">Real-time status of Assets and Liabilities. (Coming in Phase 2)</p>
            <button class="btn btn-outline" style="margin-top:20px; width:100%" disabled>Establishing Ledger Balances...</button>
        </div>
    </div>`;
}

window.viewPLReportDetailed = async function() {
    const from = document.getElementById('pl-from').value;
    const to = document.getElementById('pl-to').value;
    const sid = document.getElementById('acc-global-showroom').value;
    
    const r = await api(`/api/accounting/reports/pl?start_date=${from}&end_date=${to}&showroom_id=${sid}`);
    if (!r.success) return toast(r.error, 'error');
    const pl = r.data;

    openModal('Profit & Loss Statement (Detailed)', `
    <div class="pl-statement" style="padding:10px">
        <div style="text-align:center; margin-bottom:20px">
            <h2 style="margin:0">BLINK OPTICALS</h2>
            <p style="color:var(--muted)">Financial Statement for period ${fmtDate(from)} to ${fmtDate(to)}</p>
        </div>

        <table style="width:100%; border-collapse:collapse">
            <thead>
                <tr style="border-bottom:2px solid var(--text); font-weight:800">
                    <th style="text-align:left; padding:10px">PARTICULARS</th>
                    <th style="text-align:right; padding:10px">AMOUNT (₹)</th>
                </tr>
            </thead>
            <tbody>
                <tr class="pl-header"><td colspan="2" style="background:#f0f9ff; padding:8px 10px; font-weight:700">INCOME</td></tr>
                ${pl.income.map(i => `<tr><td style="padding:8px 10px; border-bottom:1px solid #eee">${i.name}</td><td style="text-align:right; padding:8px 10px; border-bottom:1px solid #eee">₹${fmt(i.amount)}</td></tr>`).join('')}
            </tbody>
        </table>
    </div>
    `, 'lg');
};

window.load_reports = function() {
    const el = document.getElementById('view-reports');
    if (!el) return;

    el.innerHTML = `
    <div style="margin-bottom:32px">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:28px">
            <div>
                <h1 style="margin:0; font-size:2.2rem; font-weight:900; letter-spacing:-1.2px; color:#1e293b">Enterprise Analytics</h1>
                <p style="margin:6px 0 0; color:#64748b; font-size:.95rem; font-weight:500">Real-time performance metrics and financial auditing</p>
            </div>
            <div style="display:flex; gap:12px">
                <button class="btn btn-outline" onclick="exportReportData('xlsx')" style="background:#fff; border-radius:12px; height:46px; padding:0 20px">
                    <i class="fas fa-file-export" style="color:var(--primary)"></i>&nbsp; Export Intelligence
                </button>
                <button class="btn btn-primary" onclick="window.print()" style="border-radius:12px; height:46px; padding:0 22px; box-shadow:0 8px 20px rgba(16,185,129,0.2)">
                    <i class="fas fa-print"></i>&nbsp; Print Statement
                </button>
            </div>
        </div>

        <div style="background:rgba(255,255,255,0.7); backdrop-filter:blur(10px); border:1px solid #e2e8f0; border-radius:18px; padding:20px; display:flex; gap:20px; align-items:center; box-shadow:0 4px 15px rgba(0,0,0,0.02)">
            <div style="display:flex; gap:8px; background:#f1f5f9; border-radius:12px; padding:4px" id="rpt-tabs">
                <button class="rpt-tab-btn active" data-tab="financial" onclick="switchReportTab(this, 'financial')">Financials</button>
                <button class="rpt-tab-btn" data-tab="inventory" onclick="switchReportTab(this, 'inventory')">Inventory</button>
                <button class="rpt-tab-btn" data-tab="customers" onclick="switchReportTab(this, 'customers')">Customers</button>
                <button class="rpt-tab-btn" data-tab="gst" onclick="switchReportTab(this, 'gst')">GST Compliance</button>
                <button class="rpt-tab-btn" data-tab="purchase" onclick="switchReportTab(this, 'purchase')">Procurement</button>
            </div>
            
            <div style="height:24px; width:1px; background:#e2e8f0"></div>

            <div style="flex:1; display:flex; gap:12px; align-items:center">
                <div style="position:relative; flex:1">
                    <i class="fas fa-store" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:.85rem"></i>
                    <select id="rpt-showroom" class="form-control" style="padding-left:38px; border-radius:10px; height:42px" onchange="refreshCurrentReport()">
                        <option value="all">Consolidated (All Showrooms)</option>
                    </select>
                </div>
                <div style="display:flex; align-items:center; gap:8px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:0 12px; height:42px">
                    <input type="date" id="rpt-from" style="border:none; background:none; font-size:.85rem; font-weight:600; color:#334155; outline:none" onchange="refreshCurrentReport()">
                    <span style="color:#cbd5e1">→</span>
                    <input type="date" id="rpt-to" style="border:none; background:none; font-size:.85rem; font-weight:600; color:#334155; outline:none" onchange="refreshCurrentReport()">
                </div>
            </div>
        </div>
    </div>

    <div id="report-content" style="min-height:500px"></div>

    <style>
        .rpt-tab-btn { background:none; border:none; padding:8px 18px; border-radius:9px; font-size:.88rem; font-weight:700; color:#64748b; cursor:pointer; transition:all .2s; }
        .rpt-tab-btn:hover { color:#1e293b; background:rgba(255,255,255,0.5); }
        .rpt-tab-btn.active { background:#fff; color:var(--primary); box-shadow:0 4px 10px rgba(0,0,0,0.05); }
        
        .analytic-card { background:#fff; border:1px solid #e2e8f0; border-radius:24px; padding:30px; box-shadow:0 10px 25px rgba(0,0,0,0.03); transition:all .3s ease; }
        .analytic-card:hover { transform:translateY(-5px); box-shadow:0 20px 40px rgba(0,0,0,0.06); }
        
        .kpi-row { display:grid; grid-template-columns:repeat(4, 1fr); gap:24px; margin-bottom:30px; }
        .kpi-box { background:#fff; border:1px solid #e2e8f0; border-radius:22px; padding:24px; display:flex; flex-direction:column; position:relative; overflow:hidden; }
        .kpi-box::after { content:''; position:absolute; right:-20px; bottom:-20px; width:100px; height:100px; background:var(--primary); opacity:0.03; border-radius:50%; }
        .kpi-box .label { font-size:.78rem; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:12px; }
        .kpi-box .val { font-size:1.75rem; font-weight:900; letter-spacing:-0.5px; color:#1e293b; }
        .kpi-box .trend { margin-top:12px; font-size:.75rem; font-weight:700; display:flex; align-items:center; gap:5px; }
        .trend.up { color:#10b981; } .trend.down { color:#ef4444; }
    </style>
    `;
    
    // Set default dates (current month)
    const now = new Date();
    document.getElementById('rpt-from').value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    document.getElementById('rpt-to').value = now.toISOString().split('T')[0];

    // Load showrooms
    api('/api/showrooms').then(sh => {
        if (sh.success) {
            document.getElementById('rpt-showroom').innerHTML = '<option value="all">Consolidated (All Showrooms)</option>' + 
                sh.data.map(s => `<option value="${s.showroom_id}">${s.showroom_name}</option>`).join('');
        }
    });

    switchReportTab(null, 'financial');
};


window.switchReportTab = function(el, tab) {
    if (!el) {
        el = document.querySelector(`.rpt-tab-btn[data-tab="${tab}"]`);
    }
    if (el) {
        document.querySelectorAll('.rpt-tab-btn').forEach(i => i.classList.remove('active'));
        el.classList.add('active');
    }
    window.CURRENT_REPORT_TAB = tab;
    refreshCurrentReport();
};


window.refreshCurrentReport = async function() {
    const tab = window.CURRENT_REPORT_TAB;
    const content = document.getElementById('report-content');
    const sid = document.getElementById('rpt-showroom').value;
    const from = document.getElementById('rpt-from').value;
    const to = document.getElementById('rpt-to').value;

    content.innerHTML = `<div style="padding:100px; text-align:center"><i class="fas fa-spinner fa-spin fa-3x" style="color:var(--accent)"></i><p style="margin-top:20px; color:var(--muted)">Generating advanced analytics...</p></div>`;

    if (tab === 'financial') renderFinancialReport(sid, from, to);
    else if (tab === 'inventory') renderInventoryReport(sid);
    else if (tab === 'customers') renderCustomerReport();
    else if (tab === 'gst') renderGSTReport(from, to);
    else if (tab === 'purchase') renderPurchaseReport(from, to);
};

async function renderFinancialReport(sid, from, to) {
    const r = await api(`/api/reports/financial-dashboard?showroom_id=${sid}&from_date=${from}&to_date=${to}`);
    const content = document.getElementById('report-content');
    if (!r.success) return content.innerHTML = `Error: ${r.error}`;

    const s = r.data || {};
    const summ = s.summary || { revenue: 0, expense: 0, profit: 0, aov: 0, total_orders: 0 };
    
    content.innerHTML = `
    <div class="kpi-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom:24px">
        <div class="kpi-card glass">
            <div class="kpi-label">Revenue</div>
            <div class="kpi-value text-accent">${fmt(summ.revenue)}</div>
            <div class="sub">${summ.total_orders} orders recorded</div>
        </div>
        <div class="kpi-card glass">
            <div class="kpi-label">Total Expenses</div>
            <div class="kpi-value text-red">${fmt(summ.expense)}</div>
            <div class="sub">Operational costs</div>
        </div>
        <div class="kpi-card glass">
            <div class="kpi-label">Net Profit</div>
            <div class="kpi-value ${summ.profit >= 0 ? 'text-green' : 'text-red'}">${fmt(summ.profit)}</div>
            <div class="sub">After all deductions</div>
        </div>
        <div class="kpi-card glass">
            <div class="kpi-label">Avg Order Value</div>
            <div class="kpi-value text-warn">${fmt(summ.aov)}</div>
            <div class="sub">Earnings per customer</div>
        </div>
    </div>
    <div style="display:grid; grid-template-columns: 2fr 1fr; gap:24px; margin-bottom:24px">
        <div class="card">
            <div class="card-header"><h3>Growth Trend</h3></div>
            <div id="fin-chart-revenue" style="height:350px; display:flex; align-items:center; justify-content:center; color:#888">
                ${(s.trends && s.trends.length > 0) ? '' : 'No trend data available for this range'}
            </div>
        </div>
        <div class="card">
            <div class="card-header"><h3>Expense Distribution</h3></div>
            <div id="fin-chart-expenses" style="height:350px; display:flex; align-items:center; justify-content:center; color:#888">
                ${(s.expenses && s.expenses.length > 0) ? '' : 'No expense data found'}
            </div>
        </div>
    </div>
    
    <div class="card">
        <div class="card-header"><h3>Showroom Performance Breakdown</h3></div>
        <div class="table-container">
            <table>
                <thead><tr><th>Showroom Name</th><th>Orders</th><th>Total Revenue</th><th>AOV</th><th>Contribution</th></tr></thead>
                <tbody>
                    ${s.showrooms.map(sh => `
                        <tr>
                            <td><b>${sh.showroom_name}</b></td>
                            <td>${sh.orders}</td>
                            <td><b class="text-accent">${fmt(sh.revenue)}</b></td>
                            <td>${fmt(sh.orders > 0 ? sh.revenue / sh.orders : 0)}</td>
                            <td>${summ.revenue > 0 ? ((sh.revenue / summ.revenue) * 100).toFixed(1) : 0}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>`;
    
    if (s.trends && s.trends.length > 0) renderRevenueChart(s.trends);
    if (s.expenses && s.expenses.length > 0) renderExpenseDonut(s.expenses);
}

async function renderInventoryReport(sid) {
    const r = await api(`/api/reports/inventory?showroom_id=${sid}`);
    const content = document.getElementById('report-content');
    if (!r.success) return content.innerHTML = r.error;

    const d = r.data;
    content.innerHTML = `
    <div class="kpi-grid" style="grid-template-columns: repeat(2, 1fr); margin-bottom:24px">
        <div class="kpi-card glass"><div class="kpi-label">Total SKUs Managed</div><div class="kpi-value text-accent">${d.summary.total_skus}</div></div>
        <div class="kpi-card glass"><div class="kpi-label">Stock Units in Hand</div><div class="kpi-value text-green">${d.summary.total_qty}</div></div>
    </div>
    
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px; margin-bottom:24px">
        <div class="card">
            <div class="card-header"><h3>⚠️ Critical Low Stock</h3></div>
            <div class="table-container">
                <table>
                    <thead><tr><th>Product Name</th><th>Available</th></tr></thead>
                    <tbody>
                        ${d.low_stock.map(i => `<tr><td><b>${i.product_name}</b><div style="font-size:.75rem; color:#888">${i.showroom_name}</div></td><td><span class="badge badge-red">${i.available_qty}</span></td></tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        <div class="card">
            <div class="card-header"><h3>Showroom Distribution</h3></div>
            <div class="table-container">
                <table>
                    <thead><tr><th>Location</th><th>SKUs</th><th>Total Qty</th></tr></thead>
                    <tbody>
                        ${d.distribution.map(s => `<tr><td><b>${s.showroom_name}</b></td><td>${s.skus}</td><td><b class="text-accent">${s.qty}</b></td></tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;
}

async function renderCustomerReport() {
    const r = await api('/api/reports/customers');
    const content = document.getElementById('report-content');
    if (!r.success) return;

    const d = r.data;
    content.innerHTML = `
    <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom:24px">
        <div class="kpi-card glass"><div class="kpi-label">Total Database</div><div class="kpi-value text-accent">${d.status.total}</div></div>
        <div class="kpi-card glass"><div class="kpi-label">New (Last 30 Days)</div><div class="kpi-value text-green">${d.status.new_30d}</div></div>
        <div class="kpi-card glass"><div class="kpi-label">Active Transacting</div><div class="kpi-value text-warn">${d.status.transacting}</div></div>
    </div>
    <div class="card">
        <div class="card-header"><h3>💎 Top Customers (By Lifetime Value)</h3></div>
        <div class="table-container">
            <table>
                <thead><tr><th>Customer Name</th><th>Mobile</th><th>Orders</th><th>Total Spent</th></tr></thead>
                <tbody>
                    ${d.top_customers.map(c => `<tr><td><b>${c.name}</b></td><td>${c.mobile}</td><td>${c.orders}</td><td><b class="text-green">${fmt(c.ltv)}</b></td></tr>`).join('')}
                </tbody>
            </table>
        </div>
    </div>`;
}

async function renderGSTReport(from, to) {
    const r = await api(`/api/reports/gst/summary?from_date=${from}&to_date=${to}`);
    const content = document.getElementById('report-content');
    if (!r.success) return;

    content.innerHTML = `
    <div class="card">
        <div class="card-header"><h3>Tax Liability Summary (GST)</h3></div>
        <div class="table-container">
            <table>
                <thead><tr><th>Tax Rate</th><th>Taxable Value</th><th>CGST</th><th>SGST</th><th>IGST</th><th>Total Tax</th></tr></thead>
                <tbody>
                    ${r.data.map(t => `
                        <tr>
                            <td><b>${t.gst_rate}%</b></td>
                            <td>${fmt(t.total_taxable)}</td>
                            <td>${fmt(t.cgst)}</td>
                            <td>${fmt(t.sgst)}</td>
                            <td>${fmt(t.igst)}</td>
                            <td class="text-accent"><b>${fmt(t.total_gst)}</b></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>`;
}

async function renderPurchaseReport(from, to) {
    const r = await api(`/api/reports/purchase?from_date=${from}&to_date=${to}`);
    const content = document.getElementById('report-content');
    if (!r.success) return;

    const d = r.data;
    content.innerHTML = `
    <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom:24px">
        <div class="kpi-card glass"><div class="kpi-label">Procurement Volume</div><div class="kpi-value text-accent">${d.summary.total_pos}</div><div class="sub">Orders issued</div></div>
        <div class="kpi-card glass"><div class="kpi-label">Total Acquisition Cost</div><div class="kpi-value text-red">${fmt(d.summary.total_spend)}</div><div class="sub">Billed value</div></div>
        <div class="kpi-card glass"><div class="kpi-label">Open Pipeline</div><div class="kpi-value text-warn">${d.summary.pending_delivery}</div><div class="sub">Awaiting stock in</div></div>
    </div>
    <div class="card">
        <div class="card-header"><h3>🏢 Top Suppliers (By Procurement Value)</h3></div>
        <div class="table-container">
            <table>
                <thead><tr><th>Supplier Name</th><th>PO Count</th><th>Total Spend</th><th>Market Share</th></tr></thead>
                <tbody>
                    ${d.top_suppliers.map(s => `<tr><td><b>${s.supplier_name}</b></td><td>${s.po_count}</td><td><b class="text-accent">${fmt(s.spend)}</b></td><td>${d.summary.total_spend > 0 ? ((s.spend / d.summary.total_spend) * 100).toFixed(1) : 0}%</td></tr>`).join('')}
                </tbody>
            </table>
        </div>
    </div>`;
}

window.exportReportData = function(format) {
    const tab = window.CURRENT_REPORT_TAB;
    toast(`Exporting ${tab} report as ${format.toUpperCase()}...`, 'info');
    // Implement CSV logic for tabular data
    const table = document.querySelector('#report-content table');
    if (!table) return toast('No data table found to export', 'warn');
    
    let csv = [];
    const rows = table.querySelectorAll('tr');
    for (const row of rows) {
        const cols = Array.from(row.querySelectorAll('th, td')).map(c => '"' + c.innerText.replace(/"/g, '""') + '"');
        csv.push(cols.join(','));
    }
    
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tab}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
};

function renderRevenueChart(data) {
    const options = {
        series: [{ name: 'Revenue', data: data.map(d => parseFloat(d.revenue)) }],
        chart: { type: 'area', height: 350, toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'Inter, sans-serif' },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3, colors: ['#004B93'] },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1, stops: [0, 90, 100] } },
        xaxis: { categories: data.map(d => fmtDate(d.date)), labels: { style: { colors: '#888' } } },
        yaxis: { labels: { formatter: (v) => '₹'+v.toLocaleString() } },
        tooltip: { theme: 'dark' },
        colors: ['#004B93']
    };
    const chart = new ApexCharts(document.querySelector("#fin-chart-revenue"), options);
    chart.render();
}

function renderExpenseDonut(data) {
    const options = {
        series: data.map(d => parseFloat(d.amount)),
        labels: data.map(d => d.category),
        chart: { type: 'donut', height: 350 },
        colors: ['#004B93', '#1FAC63', '#F0A026', '#E74C3C', '#9B59B6'],
        legend: { position: 'bottom' },
        plotOptions: { pie: { donut: { size: '65%', labels: { show: true, total: { show: true, label: 'Expenses' } } } } }
    };
    const chart = new ApexCharts(document.querySelector("#fin-chart-expenses"), options);
    chart.render();
}

window.exportFinancialPDF = function() {
    toast('Generating PDF... please wait', 'info');
    setTimeout(() => { window.print(); }, 1000); // Simple print for demo
};


/* ══════════════════════════════════════════════════════════════════════════
   ADVANCED COMMUNICATION & CAMPAIGNS HUB
   ══════════════════════════════════════════════════════════════════════════ */

window.load_comm = function(targetId = 'view-comm') {
    const campaignsView = document.getElementById('view-campaigns');
    if (campaignsView && targetId === 'view-comm') campaignsView.innerHTML = '';

    const el = document.getElementById(targetId);
    if (!el) return;

    el.innerHTML = `
    <div style="margin-bottom:28px">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
            <div>
                <h1 style="margin:0; font-size:1.85rem; font-weight:900; letter-spacing:-1px">Communication Hub</h1>
                <p style="margin:5px 0 0; color:var(--muted); font-size:.87rem">Multi-channel broadcast engine &mdash; WhatsApp, SMS &amp; Email</p>
            </div>
            <div style="display:flex; gap:10px" id="comm-header-actions"></div>
        </div>
        <div style="display:flex; gap:4px; background:var(--bg); border:1px solid var(--border); border-radius:14px; padding:5px; width:fit-content" id="comm-tabs">
            <button class="comm-tab-btn active" data-tab="campaigns" onclick="switchCommTab(this,'campaigns')"><i class="fas fa-bullhorn"></i>&nbsp;Campaigns</button>
            <button class="comm-tab-btn" data-tab="groups" onclick="switchCommTab(this,'groups')"><i class="fas fa-layer-group"></i>&nbsp;Segments</button>
            <button class="comm-tab-btn" data-tab="templates" onclick="switchCommTab(this,'templates')"><i class="fas fa-file-code"></i>&nbsp;Templates</button>
            <button class="comm-tab-btn" data-tab="alerts" onclick="switchCommTab(this,'alerts')"><i class="fas fa-bell"></i>&nbsp;System Alerts</button>
            <button class="comm-tab-btn" data-tab="history" onclick="switchCommTab(this,'history')"><i class="fas fa-stream"></i>&nbsp;Log History</button>
        </div>
    </div>
    <div id="comm-tab-content"></div>
    <style>
        .comm-tab-btn{background:none;border:none;padding:8px 16px;border-radius:10px;font-size:.82rem;font-weight:600;color:var(--muted);cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;transition:all .2s}
        .comm-tab-btn:hover{background:var(--surface);color:var(--text)}
        .comm-tab-btn.active{background:var(--surface);color:var(--accent);box-shadow:0 2px 8px rgba(0,0,0,.08)}
        .camp-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:20px;transition:all .25s;position:relative;overflow:hidden}
        .camp-card:hover{transform:translateY(-3px);box-shadow:0 12px 28px rgba(0,0,0,.08);border-color:#ccc}
        .camp-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px}
        .camp-card.ch-whatsapp::before{background:linear-gradient(90deg,#25D366,#1ebe57)}
        .camp-card.ch-sms::before{background:linear-gradient(90deg,#f59e0b,#f97316)}
        .camp-card.ch-email::before{background:linear-gradient(90deg,#3b82f6,#6366f1)}
        .kpi-mini{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px 22px;display:flex;align-items:center;gap:16px}
        .kpi-mini-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0}
        .comm-empty{text-align:center;padding:80px 40px;border:2px dashed var(--border);border-radius:16px}
    </style>
    `;

    switchCommTab(el.querySelector('.comm-tab-btn'), 'campaigns');
};

window.switchCommTab = function(el, tab) {
    document.querySelectorAll('#comm-tabs .comm-tab-btn').forEach(i => i.classList.remove('active'));
    if (el) el.classList.add('active');

    const content = document.getElementById('comm-tab-content');
    if (!content) return;
    content.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;padding:80px;gap:14px;color:var(--muted)">
        <i class="fas fa-spinner fa-spin fa-lg"></i>&nbsp;<span style="font-size:.9rem">Loading...</span>
    </div>`;

    const hdrEl = document.getElementById('comm-header-actions');
    if (hdrEl) hdrEl.innerHTML = '';

    window.COMM_ACTIVE_TAB = tab;
    if (tab === 'campaigns') _renderCampaigns();
    else if (tab === 'groups')    _renderGroups();
    else if (tab === 'templates') _renderTemplates();
    else if (tab === 'alerts')    _renderSystemAlerts();
    else if (tab === 'history')   _renderCommLogs();
};

// ── Reusable error banner ─────────────────────────────────────────────────────
function commError(msg) {
    const content = document.getElementById('comm-tab-content');
    if (!content) return;
    content.innerHTML = `
    <div class="card" style="border-left:4px solid var(--danger);padding:24px;display:flex;align-items:start;gap:16px;border-radius:16px">
        <div style="width:40px;height:40px;background:rgba(239,68,68,.1);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <i class="fas fa-exclamation-circle" style="color:var(--danger);font-size:1.1rem"></i>
        </div>
        <div>
            <div style="font-weight:700;margin-bottom:4px">Failed to load data</div>
            <div style="color:var(--muted);font-size:.85rem;margin-bottom:12px">${msg || 'Server error — check console for details'}</div>
            <button class="btn btn-outline btn-sm" onclick="switchCommTab(null, window.COMM_ACTIVE_TAB||'campaigns')">
                <i class="fas fa-redo"></i> Retry
            </button>
        </div>
    </div>`;
}

// ── CAMPAIGNS ─────────────────────────────────────────────────────────────────
async function _renderCampaigns() {
    const content = document.getElementById('comm-tab-content');
    const hdr = document.getElementById('comm-header-actions');

    let listRes;
    try { listRes = await api('/api/comm/campaigns'); }
    catch(e) { return commError('Network error: ' + e.message); }
    if (!listRes.success) return commError(listRes.error);

    const list = listRes.data || [];

    if (hdr) hdr.innerHTML = `
        <button class="btn btn-outline" onclick="_renderCampaigns()" style="border-radius:10px">
            <i class="fas fa-sync"></i> Refresh
        </button>
        <button class="btn btn-primary" onclick="openNewCampaignModal()" style="border-radius:10px;box-shadow:0 4px 14px rgba(16,185,129,.3)">
            <i class="fas fa-rocket"></i> New Campaign
        </button>`;

    const chIcon = ch => {
        if (ch === 'WhatsApp') return '<i class="fab fa-whatsapp" style="color:#25D366;font-size:1rem"></i>';
        if (ch === 'Email')    return '<i class="fas fa-envelope-open-text" style="color:#3b82f6;font-size:1rem"></i>';
        return '<i class="fas fa-comment-sms" style="color:#f59e0b;font-size:1rem"></i>';
    };
    const chCls = ch => ch === 'WhatsApp' ? 'ch-whatsapp' : ch === 'Email' ? 'ch-email' : 'ch-sms';
    const statusDot = s => {
        const col = s === 'Running' ? '#10b981' : s === 'Completed' ? '#3b82f6' : '#94a3b8';
        const pulse = s === 'Running' ? 'box-shadow:0 0 0 3px rgba(16,185,129,.2)' : '';
        return `<span style="display:inline-flex;align-items:center;gap:5px;font-size:.75rem;font-weight:700;color:${col}">
            <span style="width:7px;height:7px;border-radius:50%;background:${col};${pulse}"></span>${(s||'Draft').toUpperCase()}
        </span>`;
    };

    const totalSent   = list.reduce((a,c)=>a+(c.total_sent||0),0);
    const totalDel    = list.reduce((a,c)=>a+(c.total_delivered||0),0);
    const running     = list.filter(c=>c.status==='Running').length;
    const drafts      = list.filter(c=>(!c.status||c.status==='Draft')).length;

    content.innerHTML = `
    <!-- KPI Bar -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px">
        <div class="kpi-mini">
            <div class="kpi-mini-icon" style="background:rgba(16,185,129,.1);color:var(--accent)"><i class="fas fa-bullhorn"></i></div>
            <div><div style="font-size:.7rem;text-transform:uppercase;letter-spacing:1px;color:var(--muted);font-weight:700">Total</div>
            <div style="font-size:1.7rem;font-weight:900;line-height:1">${list.length}</div></div>
        </div>
        <div class="kpi-mini">
            <div class="kpi-mini-icon" style="background:rgba(16,185,129,.1);color:#10b981"><i class="fas fa-play-circle"></i></div>
            <div><div style="font-size:.7rem;text-transform:uppercase;letter-spacing:1px;color:var(--muted);font-weight:700">Running</div>
            <div style="font-size:1.7rem;font-weight:900;line-height:1">${running}</div></div>
        </div>
        <div class="kpi-mini">
            <div class="kpi-mini-icon" style="background:rgba(245,158,11,.1);color:#f59e0b"><i class="fas fa-pen-nib"></i></div>
            <div><div style="font-size:.7rem;text-transform:uppercase;letter-spacing:1px;color:var(--muted);font-weight:700">Drafts</div>
            <div style="font-size:1.7rem;font-weight:900;line-height:1">${drafts}</div></div>
        </div>
        <div class="kpi-mini">
            <div class="kpi-mini-icon" style="background:rgba(99,102,241,.1);color:#6366f1"><i class="fas fa-paper-plane"></i></div>
            <div><div style="font-size:.7rem;text-transform:uppercase;letter-spacing:1px;color:var(--muted);font-weight:700">Messages Sent</div>
            <div style="font-size:1.7rem;font-weight:900;line-height:1">${totalSent.toLocaleString()}</div></div>
        </div>
    </div>

    ${list.length === 0 ? `
    <div class="comm-empty">
        <div style="width:72px;height:72px;background:var(--accent-dim);color:var(--accent);border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:2rem;margin:0 auto 20px">
            <i class="fas fa-bullhorn"></i>
        </div>
        <h3 style="margin:0 0 8px;font-size:1.2rem">No campaigns yet</h3>
        <p style="color:var(--muted);font-size:.9rem;margin:0 0 20px">Create your first WhatsApp, Email or SMS campaign to engage customers</p>
        <button class="btn btn-primary" onclick="openNewCampaignModal()" style="border-radius:10px;padding:10px 24px">
            <i class="fas fa-rocket"></i> Create First Campaign
        </button>
    </div>` : `
    <!-- Filter Bar -->
    <div style="display:flex;gap:12px;margin-bottom:20px;align-items:center">
        <div style="position:relative;flex:1">
            <i class="fas fa-search" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--muted)"></i>
            <input id="camp-search-q" class="filter-input" placeholder="Search campaigns..." style="padding-left:40px;width:100%;border-radius:10px" oninput="filterCampaignCards()">
        </div>
        <select id="camp-ch-filter" class="filter-input" style="width:155px;border-radius:10px" onchange="filterCampaignCards()">
            <option value="">All Channels</option>
            <option>WhatsApp</option><option>Email</option><option>SMS</option>
        </select>
        <select id="camp-st-filter" class="filter-input" style="width:155px;border-radius:10px" onchange="filterCampaignCards()">
            <option value="">All Status</option>
            <option>Draft</option><option>Running</option><option>Completed</option>
        </select>
        <span style="font-size:.82rem;color:var(--muted);white-space:nowrap"><b id="camp-count">${list.length}</b> campaign${list.length!==1?'s':''}</span>
    </div>
    <!-- Cards -->
    <div id="camp-cards-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px">
        ${list.map(c => {
            const sent = c.total_sent || 0;
            const del  = c.total_delivered || 0;
            const rate = sent > 0 ? Math.round((del/sent)*100) : 0;
            return `
        <div class="camp-card ${chCls(c.channel)}" data-name="${(c.name||'').toLowerCase()}" data-channel="${c.channel||''}" data-status="${c.status||'Draft'}">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:14px">
                <div style="display:flex;align-items:center;gap:7px">${chIcon(c.channel)}<span style="font-size:.75rem;font-weight:700;color:${c.channel==='WhatsApp'?'#25D366':c.channel==='Email'?'#3b82f6':'#f59e0b'}">${c.channel}</span></div>
                ${statusDot(c.status||'Draft')}
            </div>
            <h4 style="margin:0 0 5px;font-size:1rem;font-weight:800">${c.name}</h4>
            <p style="font-size:.8rem;color:var(--muted);margin:0 0 16px;display:flex;align-items:center;gap:5px">
                <i class="fas fa-users" style="opacity:.6"></i>${c.group_name||'All Customers'}
                &nbsp;·&nbsp;<i class="fas fa-tag" style="opacity:.6"></i>${c.type||'Promotional'}
            </p>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px">
                <div style="background:var(--bg);border-radius:10px;padding:10px;text-align:center">
                    <div style="font-size:1.1rem;font-weight:800">${sent.toLocaleString()}</div>
                    <div style="font-size:.67rem;color:var(--muted);text-transform:uppercase;letter-spacing:.5px">Sent</div>
                </div>
                <div style="background:var(--bg);border-radius:10px;padding:10px;text-align:center">
                    <div style="font-size:1.1rem;font-weight:800;color:#10b981">${del.toLocaleString()}</div>
                    <div style="font-size:.67rem;color:var(--muted);text-transform:uppercase;letter-spacing:.5px">Delivered</div>
                </div>
                <div style="background:var(--bg);border-radius:10px;padding:10px;text-align:center">
                    <div style="font-size:1.1rem;font-weight:800;color:#6366f1">${rate}%</div>
                    <div style="font-size:.67rem;color:var(--muted);text-transform:uppercase;letter-spacing:.5px">Rate</div>
                </div>
            </div>
            ${sent > 0 ? `<div style="height:4px;background:var(--border);border-radius:2px;margin-bottom:14px;overflow:hidden">
                <div style="height:100%;width:${Math.min(rate,100)}%;background:linear-gradient(90deg,var(--accent),#6366f1);border-radius:2px"></div>
            </div>` : '<div style="margin-bottom:14px"></div>'}
            <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border);padding-top:14px">
                <div style="font-size:.75rem;color:var(--muted)">${c.created_at?fmtDate(c.created_at):'Draft'}</div>
                <div style="display:flex;gap:8px">
                    ${(!c.status||c.status==='Draft')?`<button class="btn btn-primary btn-sm" onclick="executeCampaign('${c.campaign_id}')" style="border-radius:8px"><i class="fas fa-play"></i> Launch</button>`:''}
                    ${(c.status==='Completed'||sent>0)?`<button class="btn btn-outline btn-sm" onclick="viewCampaignStats('${c.campaign_id}')" style="border-radius:8px"><i class="fas fa-chart-bar"></i> Stats</button>`:''}
                    <button class="btn btn-outline btn-sm" onclick="deleteCampaign('${c.campaign_id}')" style="border-radius:8px;color:var(--danger);border-color:rgba(239,68,68,.3)" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        </div>`;
        }).join('')}
    </div>`}`;
}

window.filterCampaignCards = function() {
    const q  = (document.getElementById('camp-search-q')?.value || '').toLowerCase();
    const ch = document.getElementById('camp-ch-filter')?.value || '';
    const st = document.getElementById('camp-st-filter')?.value || '';
    let n = 0;
    document.querySelectorAll('#camp-cards-grid .camp-card').forEach(card => {
        const ok = (!q||card.dataset.name.includes(q))&&(!ch||card.dataset.channel===ch)&&(!st||card.dataset.status===st);
        card.style.display = ok ? '' : 'none';
        if (ok) n++;
    });
    const el = document.getElementById('camp-count');
    if (el) el.textContent = n;
};

window.deleteCampaign = async function(id) {
    if (!confirm('Delete this campaign? This cannot be undone.')) return;
    const r = await api(`/api/comm/campaigns/${id}`, { method: 'DELETE' });
    if (r.success) { toast('Campaign deleted'); _renderCampaigns(); }
    else toast(r.error || 'Failed to delete campaign', 'error');
};

// ── GROUPS / SEGMENTS ─────────────────────────────────────────────────────────
async function _renderGroups() {
    let r;
    try { r = await api('/api/comm/groups'); }
    catch(e) { return commError('Network error: ' + e.message); }
    if (!r.success) return commError(r.error);

    const content = document.getElementById('comm-tab-content');
    const list    = r.data || [];

    // Built-in smart segments (always shown for reference)
    const smartPresets = [
        { name: 'All Customers',         desc: 'Every customer in your database',        icon: '👥', color: '#004B93' },
        { name: 'High Value (₹10k+)',     desc: 'Customers who spent over ₹10,000',       icon: '💎', color: '#1FAC63' },
        { name: 'Inactive (90+ days)',     desc: 'No purchase in 90+ days — win-back',     icon: '😴', color: '#F0A026' },
        { name: 'New Customers (30 days)', desc: 'First purchase within last 30 days',     icon: '🌟', color: '#9B59B6' },
    ];

    content.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <div>
            <h2 style="margin:0;font-size:1.3rem">Customer Segments</h2>
            <p style="margin:4px 0 0;color:var(--muted);font-size:.85rem">Target the right audience for every campaign</p>
        </div>
        <button class="btn btn-outline" onclick="openNewGroupModal()">
            <i class="fas fa-plus"></i> Create Segment
        </button>
    </div>

    <div class="card" style="margin-bottom:24px">
        <div class="card-header" style="padding:14px 16px;border-bottom:1px solid var(--border)">
            <h3 style="margin:0;font-size:1rem"><i class="fas fa-magic" style="color:var(--accent)"></i> Smart Presets (Auto-Targeting)</h3>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:0;border-top:1px solid var(--border)">
            ${smartPresets.map(p => `
            <div style="padding:16px;border-right:1px solid var(--border)">
                <div style="font-size:1.5rem;margin-bottom:8px">${p.icon}</div>
                <div style="font-weight:600;font-size:.9rem">${p.name}</div>
                <div style="font-size:.78rem;color:#888;margin-top:4px">${p.desc}</div>
            </div>`).join('')}
        </div>
    </div>

    <div class="card">
        <div class="card-header" style="padding:14px 16px;border-bottom:1px solid var(--border)">
            <h3 style="margin:0;font-size:1rem">Custom Segments</h3>
        </div>
        <div class="table-container">
            <table>
                <thead><tr>
                    <th>Segment Name</th><th>Type</th><th>Description</th><th>Created</th><th>Actions</th>
                </tr></thead>
                <tbody>
                    ${list.length > 0 ? list.map(g => `
                    <tr>
                        <td><b>${g.name}</b></td>
                        <td><span class="badge ${g.is_manual ? 'badge-blue' : 'badge-green'}">${g.is_manual ? 'Manual' : 'Smart Rule'}</span></td>
                        <td style="color:#888;font-size:.85rem">${g.description || '—'}</td>
                        <td>${fmtDate(g.created_at)}</td>
                        <td>
                            <button class="btn btn-outline btn-sm" onclick="viewGroupMembers('${g.group_id}','${g.name}')">
                                <i class="fas fa-users"></i> Members
                            </button>
                        </td>
                    </tr>`) .join('') : `
                    <tr><td colspan="5" style="text-align:center;padding:40px;color:#888">
                        <i class="fas fa-users" style="opacity:.3;font-size:2rem;display:block;margin-bottom:8px"></i>
                        No custom segments yet. Create one to target specific customers.
                    </td></tr>`}
                </tbody>
            </table>
        </div>
    </div>`;
}

// ── TEMPLATES ─────────────────────────────────────────────────────────────────
async function _renderTemplates() {
    let r;
    try { r = await api('/api/comm/templates'); }
    catch(e) { return commError('Network error: ' + e.message); }
    if (!r.success) return commError(r.error);

    const content = document.getElementById('comm-tab-content');
    const list    = r.data || [];

    const iconFor = ch => {
        if (ch === 'WhatsApp') return '<i class="fab fa-whatsapp" style="color:#25D366"></i>';
        if (ch === 'Email')    return '<i class="fas fa-envelope" style="color:#004B93"></i>';
        return '<i class="fas fa-sms" style="color:#F0A026"></i>';
    };

    content.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <div>
            <h2 style="margin:0;font-size:1.3rem">Message Templates</h2>
            <p style="margin:4px 0 0;color:var(--muted);font-size:.85rem">Reusable messages with dynamic variables for personalization</p>
        </div>
        <button class="btn btn-primary" onclick="openNewTemplateModal()">
            <i class="fas fa-plus"></i> Create Template
        </button>
    </div>

    <div class="card" style="margin-bottom:20px;background:linear-gradient(135deg,#004B93 0%,#0066CC 100%);color:#fff;padding:16px 20px">
        <div style="display:flex;align-items:start;gap:12px">
            <i class="fas fa-info-circle fa-lg" style="margin-top:2px;opacity:.8"></i>
            <div>
                <b>Template Variables</b>
                <div style="font-size:.82rem;opacity:.85;margin-top:4px">
                    Use <code style="background:rgba(255,255,255,.2);padding:2px 6px;border-radius:4px">{{name}}</code>
                    <code style="background:rgba(255,255,255,.2);padding:2px 6px;border-radius:4px">{{mobile}}</code>
                    <code style="background:rgba(255,255,255,.2);padding:2px 6px;border-radius:4px">{{email}}</code>
                    <code style="background:rgba(255,255,255,.2);padding:2px 6px;border-radius:4px">{{product}}</code>
                    to personalize at send time
                </div>
            </div>
        </div>
    </div>

    ${list.length === 0 ? `
    <div class="card" style="text-align:center;padding:60px 40px;border:2px dashed var(--border)">
        <i class="fas fa-file-alt fa-3x" style="color:var(--accent);opacity:.4;margin-bottom:16px"></i>
        <h3 style="color:var(--muted);font-weight:500">No templates yet</h3>
        <p style="color:#888">Create reusable message templates for your campaigns.</p>
        <button class="btn btn-primary" style="margin-top:16px" onclick="openNewTemplateModal()">+ Create First Template</button>
    </div>` : `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px">
        ${list.map(t => `
        <div class="card" style="border-top:3px solid ${t.channel === 'WhatsApp' ? '#25D366' : t.channel === 'Email' ? '#004B93' : '#F0A026'}">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">
                <div style="display:flex;align-items:center;gap:8px">
                    ${iconFor(t.channel)}
                    <b style="font-size:.95rem">${t.template_name}</b>
                </div>
                <span class="badge badge-gray">${t.channel}</span>
            </div>
            <div style="background:var(--bg);border-radius:8px;padding:12px;font-size:.82rem;color:#666;line-height:1.6;min-height:60px">
                ${(t.message_content || '').substring(0, 120)}${t.message_content && t.message_content.length > 120 ? '...' : ''}
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:12px;gap:8px">
                <button class="btn btn-outline btn-sm" onclick="previewTemplate('${t.id}')">
                    <i class="fas fa-eye"></i> Preview
                </button>
            </div>
        </div>
        `).join('')}
    </div>`}`;
}

// ── LOGS ─────────────────────────────────────────────────────────────────────
async function _renderCommLogs() {
    let r;
    try { r = await api('/api/comm/logs'); }
    catch(e) { return commError('Network error: ' + e.message); }
    if (!r.success) return commError(r.error);

    const content = document.getElementById('comm-tab-content');
    const list    = r.data || [];

    content.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <div>
            <h2 style="margin:0;font-size:1.3rem">Message Log</h2>
            <p style="margin:4px 0 0;color:var(--muted);font-size:.85rem">Last 100 messages sent across all campaigns</p>
        </div>
        <div style="font-size:.82rem;color:#888">
            <i class="fas fa-circle" style="color:#1FAC63"></i> Delivered &nbsp;
            <i class="fas fa-circle" style="color:#F0A026"></i> Sent &nbsp;
            <i class="fas fa-circle" style="color:#ef4444"></i> Failed
        </div>
    </div>
    <div class="card">
        <div class="table-container">
            <table>
                <thead><tr>
                    <th>Time</th><th>Campaign</th><th>Customer</th><th>Contact</th><th>Channel</th><th>Status</th>
                </tr></thead>
                <tbody>
                    ${list.length > 0 ? list.map(l => `
                    <tr>
                        <td style="font-size:.8rem;color:#888;white-space:nowrap">${new Date(l.sent_at).toLocaleString('en-IN')}</td>
                        <td style="font-size:.85rem"><b>${l.campaign_name || '—'}</b></td>
                        <td><b>${l.customer_name || '—'}</b></td>
                        <td style="font-size:.82rem;font-family:monospace">${l.mobile || l.email || '—'}</td>
                        <td>${l.channel ? `<span class="badge badge-gray">${l.channel}</span>` : '—'}</td>
                        <td>${badge(l.status || 'sent')}</td>
                    </tr>`) .join('') : `
                    <tr><td colspan="6" style="text-align:center;padding:60px;color:#888">
                        <i class="fas fa-history" style="opacity:.3;font-size:2rem;display:block;margin-bottom:8px"></i>
                        No messages sent yet. Run a campaign to see activity here.
                    </td></tr>`}
                </tbody>
            </table>
        </div>
    </div>`;
}

async function _renderSystemAlerts() {
    let r;
    try { r = await api('/api/comm/notifications'); }
    catch(e) { return commError('Network error: ' + e.message); }
    if (!r.success) return commError(r.error);

    const content = document.getElementById('comm-tab-content');
    const list    = r.data || [];

    content.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <div>
            <h2 style="margin:0;font-size:1.3rem">Internal System Alerts</h2>
            <p style="margin:4px 0 0;color:var(--muted);font-size:.85rem">Real-time notifications for transfers, inventory, and operations</p>
        </div>
        <button class="btn btn-outline btn-sm" onclick="switchCommTab(null, 'alerts')"><i class="fas fa-sync"></i> Refresh</button>
    </div>

    <div class="card">
        <div class="table-container">
            <table>
                <thead><tr><th>Time</th><th>Type</th><th>Title</th><th>Message</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                    ${list.length > 0 ? list.map(n => `
                    <tr style="${n.status === 'unread' ? 'background:rgba(0,75,147,0.02)' : ''}">
                        <td style="font-size:0.8rem; color:#888">${new Date(n.created_at).toLocaleString()}</td>
                        <td><span class="badge ${n.type==='transfer'?'badge-blue':'badge-gray'}">${n.type.toUpperCase()}</span></td>
                        <td><b style="${n.status==='unread'?'color:var(--primary)':''}">${n.title}</b></td>
                        <td style="font-size:0.85rem; color:#666">${n.message}</td>
                        <td>${badge(n.status)}</td>
                        <td>
                            ${n.status === 'unread' ? `
                                <button class="btn btn-outline btn-sm" onclick="markNotifRead('${n.notification_id}')">Mark Read</button>
                            ` : '—'}
                        </td>
                    </tr>`).join('') : `<tr><td colspan="6" style="text-align:center; padding:60px; color:#888">No active system alerts.</td></tr>`}
                </tbody>
            </table>
        </div>
    </div>`;
}

window.markNotifRead = async function(id) {
    const r = await api(`/api/comm/notifications/${id}/read`, { method: 'PATCH' });
    if (r.success) _renderSystemAlerts();
};


// ── ACTIONS & MODALS ─────────────────────────────────────────────────────────

window.executeCampaign = async function(id) {
    if (!confirm('This will send messages to all customers in the selected segment. Continue?')) return;
    toast('⚡ Executing campaign...', 'info');
    let r;
    try { r = await postAPI(`/api/comm/campaigns/${id}/execute`); }
    catch(e) { return toast('Network error: ' + e.message, 'error'); }
    if (r.success) {
        toast(`✅ ${r.processed_counts} messages queued successfully!`);
        _renderCampaigns();
    } else toast(r.error, 'error');
};

window.viewCampaignStats = async function(id) {
    toast('Loading campaign stats...', 'info');
    const r = await api('/api/comm/logs');
    const logs = (r.data || []).filter(l => l.campaign_id === id);
    const sent = logs.length;
    const delivered = logs.filter(l => l.status === 'delivered').length;
    const failed    = logs.filter(l => l.status === 'failed').length;

    openModal('Campaign Statistics', `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px">
        <div class="kpi-card glass" style="padding:20px;text-align:center">
            <div style="font-size:2rem;font-weight:800;color:var(--accent)">${sent}</div>
            <div style="font-size:.8rem;color:#888">Total Sent</div>
        </div>
        <div class="kpi-card glass" style="padding:20px;text-align:center">
            <div style="font-size:2rem;font-weight:800;color:#1FAC63">${delivered}</div>
            <div style="font-size:.8rem;color:#888">Delivered</div>
        </div>
        <div class="kpi-card glass" style="padding:20px;text-align:center">
            <div style="font-size:2rem;font-weight:800;color:#ef4444">${failed}</div>
            <div style="font-size:.8rem;color:#888">Failed</div>
        </div>
    </div>
    <p style="text-align:center;color:#888;font-size:.85rem">Delivery rate: <b>${sent > 0 ? Math.round((delivered/sent)*100) : 0}%</b></p>
    `);
};

window.viewGroupMembers = async function(groupId, groupName) {
    toast('Loading members...', 'info');
    const r = await api(`/api/comm/groups/${groupId}/members`);
    const members = r.data || [];
    openModal(`Members — ${groupName}`, `
    <div class="table-container" style="max-height:400px;overflow-y:auto">
        <table>
            <thead><tr><th>Name</th><th>Mobile</th><th>Email</th></tr></thead>
            <tbody>
                ${members.length > 0 ? members.map(m => `
                <tr>
                    <td><b>${m.name}</b></td>
                    <td>${m.mobile || '—'}</td>
                    <td>${m.email || '—'}</td>
                </tr>`).join('') : '<tr><td colspan="3" style="text-align:center;padding:30px;color:#888">No members in this segment</td></tr>'}
            </tbody>
        </table>
    </div>
    <p style="margin-top:12px;color:#888;font-size:.82rem;text-align:center">${members.length} member${members.length !== 1 ? 's' : ''}</p>
    `);
};

window.openNewCampaignModal = async function() {
    toast('Loading...', 'info');
    const [gRes, tRes, pRes] = await Promise.all([
        api('/api/comm/groups'),
        api('/api/comm/templates'),
        api('/api/products?limit=100')
    ]);

    const groups    = gRes.data    || [];
    const templates = tRes.data    || [];
    const products  = pRes.data    || [];

    const gOpts = groups.map(g    => `<option value="${g.group_id}">${g.name}</option>`).join('');
    const tOpts = templates.map(t => `<option value="${t.id}">${t.template_name} (${t.channel})</option>`).join('');
    const pOpts = products.map(p  => `<option value="${p.product_id}">${p.product_name}</option>`).join('');

    openModal('🚀 Launch New Campaign', `
    <form id="campaignForm" style="display:flex;flex-direction:column;gap:14px">
        <div class="form-row">
            <label>Campaign Name *</label>
            <input type="text" name="name" required placeholder="e.g. Diwali Special Offer">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
            <div class="form-row">
                <label>Channel *</label>
                <select name="channel">
                    <option>WhatsApp</option>
                    <option>Email</option>
                    <option>SMS</option>
                </select>
            </div>
            <div class="form-row">
                <label>Campaign Type</label>
                <select name="type">
                    <option>Promotional</option>
                    <option>Marketing</option>
                    <option>Engagement</option>
                </select>
            </div>
        </div>
        <div class="form-row">
            <label>Target Segment *</label>
            <select name="group_id">
                <option value="">— All Customers (no filter) —</option>
                ${gOpts || '<option disabled>No segments created yet</option>'}
            </select>
        </div>
        <div class="form-row">
            <label>Message Template</label>
            <select name="template_id">
                <option value="">— Select template (optional) —</option>
                ${tOpts || '<option disabled>No templates yet</option>'}
            </select>
        </div>
        ${products.length > 0 ? `
        <div class="form-row">
            <label>Attach Products <small style="color:#888">(optional — for catalogue sharing)</small></label>
            <select name="product_ids" multiple style="height:100px">
                ${pOpts}
            </select>
            <small style="color:#888;margin-top:4px;display:block"><i class="fas fa-info-circle"></i> Hold Ctrl / Cmd to select multiple</small>
        </div>` : ''}
        <div class="form-row">
            <label>Schedule For <small style="color:#888">(leave blank to save as draft)</small></label>
            <input type="datetime-local" name="scheduled_for">
        </div>
        <button type="submit" class="btn btn-primary" style="margin-top:6px">
            <i class="fas fa-paper-plane"></i> Create Campaign
        </button>
    </form>
    `);

    document.getElementById('campaignForm').onsubmit = async (e) => {
        e.preventDefault();
        const fd   = new FormData(e.target);
        const data = Object.fromEntries(fd);
        data.metadata = { product_ids: fd.getAll('product_ids') };
        delete data.product_ids;

        const r = await postAPI('/api/comm/campaigns', data);
        if (r.success) {
            toast('✅ Campaign created successfully');
            closeModal();
            _renderCampaigns();
        } else toast(r.error || 'Failed to create campaign', 'error');
    };
};

window.openNewGroupModal = function() {
    openModal('Create Customer Segment', `
    <form id="groupForm" style="display:flex;flex-direction:column;gap:14px">
        <div class="form-row">
            <label>Segment Name *</label>
            <input type="text" name="name" required placeholder="e.g. High Value Buyers">
        </div>
        <div class="form-row">
            <label>Description</label>
            <textarea name="description" placeholder="Who belongs to this segment?" rows="2"></textarea>
        </div>
        <div class="form-row">
            <label>Type</label>
            <select name="is_manual" onchange="document.getElementById('manual-info').style.display=this.value==='true'?'block':'none'">
                <option value="false">Smart Rule (auto-generated based on behavior)</option>
                <option value="true">Manual List (you pick the customers)</option>
            </select>
            <div id="manual-info" style="display:none;margin-top:8px;padding:10px;background:var(--bg);border-radius:8px;font-size:.82rem;color:#888">
                <i class="fas fa-info-circle"></i> After creating the segment, you can add customers from the Customer section.
            </div>
        </div>
        <button type="submit" class="btn btn-primary">
            <i class="fas fa-plus"></i> Create Segment
        </button>
    </form>
    `);

    document.getElementById('groupForm').onsubmit = async (e) => {
        e.preventDefault();
        const r = await postAPI('/api/comm/groups', Object.fromEntries(new FormData(e.target)));
        if (r.success) {
            toast('✅ Segment created');
            closeModal();
            _renderGroups();
        } else toast(r.error || 'Failed to create segment', 'error');
    };
};

window.openNewTemplateModal = function() {
    openModal('Create Message Template', `
    <form id="templateForm" style="display:flex;flex-direction:column;gap:14px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
            <div class="form-row">
                <label>Template Name *</label>
                <input type="text" name="template_name" required placeholder="e.g. Welcome Message">
            </div>
            <div class="form-row">
                <label>Channel</label>
                <select name="channel">
                    <option>WhatsApp</option>
                    <option>Email</option>
                    <option>SMS</option>
                </select>
            </div>
        </div>
        <div class="form-row">
            <label>Message Content *</label>
            <textarea name="message_content" rows="6" required
                placeholder="Hi {{name}},&#10;&#10;Check out our latest collection at BlinkOpticals! 🕶️&#10;&#10;Use code BLINK10 for 10% off your next purchase.&#10;&#10;Shop: https://blinkopticals.com"></textarea>
        </div>
        <div style="padding:12px;background:var(--bg);border-radius:8px;font-size:.82rem">
            <b>Available variables:</b>
            <code style="margin-left:8px;background:rgba(0,75,147,.1);padding:2px 6px;border-radius:4px">{{name}}</code>
            <code style="margin-left:4px;background:rgba(0,75,147,.1);padding:2px 6px;border-radius:4px">{{mobile}}</code>
            <code style="margin-left:4px;background:rgba(0,75,147,.1);padding:2px 6px;border-radius:4px">{{email}}</code>
            <code style="margin-left:4px;background:rgba(0,75,147,.1);padding:2px 6px;border-radius:4px">{{product}}</code>
        </div>
        <button type="submit" class="btn btn-primary">
            <i class="fas fa-save"></i> Save Template
        </button>
    </form>
    `);

    document.getElementById('templateForm').onsubmit = async (e) => {
        e.preventDefault();
        const r = await postAPI('/api/comm/templates', Object.fromEntries(new FormData(e.target)));
        if (r.success) {
            toast('✅ Template saved');
            closeModal();
            _renderTemplates();
        } else toast(r.error || 'Failed to save template', 'error');
    };
};

window.previewTemplate = async function(id) {
    const r = await api('/api/comm/templates');
    const t = (r.data || []).find(x => String(x.id) === String(id));
    if (!t) return toast('Template not found', 'error');

    const preview = t.message_content
        .replace(/{{name}}/gi, 'Rahul Sharma')
        .replace(/{{mobile}}/gi, '9876543210')
        .replace(/{{email}}/gi, 'rahul@example.com');

    openModal(`Preview — ${t.template_name}`, `
    <div style="background:${t.channel === 'WhatsApp' ? '#ECF9F1' : '#f8f9fa'};border-radius:16px;padding:20px;border:1px solid #ddd;font-family:monospace;white-space:pre-wrap;line-height:1.7;font-size:.9rem">
${preview}
    </div>
    <p style="margin-top:12px;color:#888;font-size:.82rem;text-align:center">Preview with sample data: Rahul Sharma · 9876543210</p>
    `);
};

window.load_campaigns = function() { 
    const commView = document.getElementById('view-comm');
    if (commView) commView.innerHTML = ''; // Prevent duplicate IDs in DOM
    load_comm('view-campaigns'); 
};

/* ── PURCHASE & VENDOR MODULE ── */
window.load_purchase = async function() {
    const el = document.getElementById('view-purchase');
    if (!el) return;
    
    // Initial UI skeleton
    el.innerHTML = `
    <div class="reports-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
        <div>
            <h2 style="margin:0; font-size:1.6rem; color:var(--primary)">Purchase & Vendor Management</h2>
            <p style="margin:0; color:#64748b; font-size:0.85rem">Centralized procurement and supplier relations</p>
        </div>
        <div style="display:flex; gap:10px">
            <button class="btn btn-outline" onclick="load_purchase()">
                <i class="fas fa-sync-alt"></i> Refresh
            </button>
            <button class="btn btn-primary" onclick="openNewPOModal()">
                <i class="fas fa-plus"></i> Create Purchase Order
            </button>
        </div>
    </div>

    <!-- KPI Dashboard -->
    <div id="purchase-stats" class="stats-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:20px; margin-bottom:25px">
        <div class="stat-card glass"><div class="label">Pending Orders</div><div class="value" id="stat-pur-pending">0</div></div>
        <div class="stat-card glass"><div class="label">Received (Month)</div><div class="value" id="stat-pur-received">0</div></div>
        <div class="stat-card glass"><div class="label">Active Vendors</div><div class="value" id="stat-pur-vendors">0</div></div>
    </div>

    <div class="tabs-header" style="background:#fff; border-radius:12px 12px 0 0; padding:10px 15px 0; border-bottom:1px solid #eee">
        <div class="tab-item active" data-tab="po" onclick="switchPurchaseTab(this, 'po')">
            <i class="fas fa-file-invoice" style="margin-right:8px"></i> Purchase Orders
        </div>
        <div class="tab-item" data-tab="vendors" onclick="switchPurchaseTab(this, 'vendors')">
            <i class="fas fa-truck" style="margin-right:8px"></i> Vendors
        </div>
    </div>
    
    <div id="pur-tab-content" style="background:#fff; padding:20px; border-radius:0 0 12px 12px; box-shadow:var(--shadow-sm)">
        <div style="padding:60px; text-align:center"><i class="fas fa-spinner fa-spin fa-2x"></i></div>
    </div>
    `;

    // Fetch and update Stats
    const statsRes = await api('/api/purchase/orders');
    const vendorRes = await api('/api/purchase/vendors');
    
    if(statsRes.success && vendorRes.success) {
        const pending = statsRes.data.filter(o => o.status !== 'Received').length;
        const received = statsRes.data.filter(o => o.status === 'Received').length;
        document.getElementById('stat-pur-pending').innerText = pending;
        document.getElementById('stat-pur-received').innerText = received;
        document.getElementById('stat-pur-vendors').innerText = vendorRes.data.length;
    }

    switchPurchaseTab(el.querySelector('.tab-item.active'), 'po');
};

window.switchPurchaseTab = function(el, tab) {
    if (el) {
        document.querySelectorAll('#view-purchase .tab-item').forEach(i => i.classList.remove('active'));
        el.classList.add('active');
    }
    const content = document.getElementById('pur-tab-content');
    if (!content) return;
    
    if (tab === 'po') renderPurchaseOrders();
    if (tab === 'vendors') renderVendors();
};

async function renderPurchaseOrders() {
    const r = await api('/api/purchase/orders');
    const content = document.getElementById('pur-tab-content');
    if (!r.success) return content.innerHTML = `<div class="error-state">Failed to load POs: ${r.error}</div>`;

    content.innerHTML = `
    <div class="table-container">
        <table>
            <thead>
                <tr style="background:#f8fafc">
                    <th>PO Number</th>
                    <th>Date</th>
                    <th>Vendor</th>
                    <th>Delivery Status</th>
                    <th style="text-align:right">Total Amount</th>
                    <th style="text-align:right">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${r.data.map(o => `
                    <tr style="border-bottom:1px solid #f1f5f9">
                        <td><small class="text-mono" style="background:#f1f5f9; padding:2px 4px; border-radius:4px">${o.purchase_id}</small></td>
                        <td><small style="color:#64748b">${fmtDate(o.order_date)}</small></td>
                        <td>
                            <div style="font-weight:600; color:#0f172a">${o.vendor_name}</div>
                        </td>
                        <td>${badge(o.status)}</td>
                        <td style="text-align:right; font-weight:700; color:var(--primary)">${fmt(o.total_amount)}</td>
                        <td style="text-align:right">
                            <div style="display:flex; justify-content:flex-end; gap:6px">
                                ${o.status !== 'Received' ? `
                                    <button class="btn btn-primary btn-sm" onclick="receiveStock('${o.purchase_id}')">
                                        <i class="fas fa-box-open"></i> Receive
                                    </button>
                                ` : `
                                    <button class="btn btn-outline btn-sm" disabled style="opacity:0.6"><i class="fas fa-check-double"></i> Received</button>
                                `}
                                <button class="btn btn-outline btn-sm" title="View Print Copy" onclick="printPO('${o.purchase_id}')">
                                    <i class="fas fa-print"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('') || '<tr><td colspan="6" style="text-align:center; padding:60px; color:#94a3b8">No purchase orders found. Start by creating a new request.</td></tr>'}
            </tbody>
        </table>
    </div>`;
}

window.openNewPOModal = async function() {
    const vRes = await api('/api/purchase/vendors');
    const sRes = await api('/api/showrooms');
    const vendors = vRes.data || [];
    const showrooms = sRes.data || [];

    if(!vendors.length) return toast('Please register a vendor first', 'warn');

    openModal('Create New Purchase Order', `
        <div style="padding:10px">
            <form id="poForm">
                <div class="form-row" style="display:grid; grid-template-columns:1.5fr 1fr; gap:20px; margin-bottom:20px">
                    <div class="form-group">
                        <label>Select Vendor *</label>
                        <select name="vendor_id" class="form-control" required>
                            <option value="">-- Choose Vendor --</option>
                            ${vendors.map(v => `<option value="${v.vendor_id}">${v.name} (${v.gstin || 'No GSTIN'})</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Delivery Showroom *</label>
                        <select name="showroom_id" class="form-control" required>
                            ${showrooms.map(s => `<option value="${s.showroom_id}">${s.showroom_name}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div class="po-items-container" style="border:1px solid #e2e8f0; border-radius:12px; overflow:hidden">
                    <div style="background:#f8fafc; padding:12px; border-bottom:1px solid #e2e8f0; font-weight:700; font-size:0.8rem; text-transform:uppercase; letter-spacing:0.5px">
                        Order Items
                    </div>
                    <div id="po-items-list" style="padding:15px; max-height:300px; overflow-y:auto">
                        <!-- Initial Row -->
                    </div>
                    <div style="padding:15px; background:#f8fafc; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center">
                        <button type="button" class="btn btn-outline btn-sm" onclick="addPORow()">
                            <i class="fas fa-plus"></i> Add Another Item
                        </button>
                        <div style="text-align:right">
                            <small style="color:#64748b">Estimated Total:</small>
                            <div id="po-grand-total" style="font-size:1.2rem; font-weight:800; color:var(--primary)">₹ 0</div>
                        </div>
                    </div>
                </div>

                <div class="form-group mt-3">
                    <label>Internal Notes (Optional)</label>
                    <textarea name="notes" class="form-control" placeholder="Add any special instructions..." rows="2"></textarea>
                </div>

                <button type="submit" class="btn btn-primary w-100 mt-4" style="padding:12px">
                    <i class="fas fa-file-signature"></i> Finalize & Create Purchase Order
                </button>
            </form>
        </div>
    `, 'lg');

    // Add first row
    addPORow();

    document.getElementById('poForm').onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd);
        
        const items = Array.from(document.querySelectorAll('.po-row')).map(row => ({
            product_id: row.querySelector('.prod-id').value,
            variant_id: row.querySelector('.prod-vid').value,
            qty: parseInt(row.querySelector('.prod-qty').value),
            cost: parseFloat(row.querySelector('.prod-cost').value)
        })).filter(i => i.product_id && i.qty > 0);

        if(!items.length) return toast('Please add at least one valid item', 'error');

        const r = await postAPI('/api/purchase/orders', { ...data, items });
        if (r.success) {
            toast('Purchase Order created successfully', 'success');
            closeModal();
            load_purchase(); // Refresh dashboard
        } else toast(r.error, 'error');
    };
};

window.addPORow = function() {
    const list = document.getElementById('po-items-list');
    const div = document.createElement('div');
    div.className = 'po-row';
    div.style = 'display:grid; grid-template-columns: 2fr 1fr 1fr 0.2fr; gap:12px; margin-bottom:12px; align-items:end';
    
    const rowId = 'row-' + Date.now();
    div.id = rowId;

    div.innerHTML = `
        <div class="form-group" style="position:relative">
            <label style="font-size:0.7rem">Product Search</label>
            <input type="text" class="form-control prod-search" placeholder="Type SKU or Name..." onkeyup="searchProductForPO(this, '${rowId}')">
            <input type="hidden" class="prod-id">
            <input type="hidden" class="prod-vid">
            <div class="search-results-po" style="position:absolute; top:100%; left:0; right:0; z-index:100; background:#fff; border:1px solid #ddd; border-radius:8px; display:none; max-height:200px; overflow-y:auto; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1)"></div>
        </div>
        <div class="form-group">
            <label style="font-size:0.7rem">Quantity</label>
            <input type="number" class="form-control prod-qty" value="1" min="1" onchange="calcPOTotal()">
        </div>
        <div class="form-group">
            <label style="font-size:0.7rem">Unit Cost (₹)</label>
            <input type="number" class="form-control prod-cost" placeholder="0" step="0.01" onchange="calcPOTotal()">
        </div>
        <button type="button" class="btn btn-outline text-red" style="border:none; padding:10px" onclick="document.getElementById('${rowId}').remove(); calcPOTotal()">
            <i class="fas fa-trash-alt"></i>
        </button>
    `;
    list.appendChild(div);
};

window.searchProductForPO = async function(input, rowId) {
    const q = input.value;
    const resultsBox = input.parentElement.querySelector('.search-results-po');
    if(q.length < 2) {
        resultsBox.style.display = 'none';
        return;
    }

    const r = await api(`/api/inventory?q=${q}`);
    if(r.success && r.data.length) {
        resultsBox.innerHTML = r.data.map(p => `
            <div onclick="selectProductForPO('${rowId}', '${p.product_id}', '${p.variant_id}', '${p.product_name}', '${p.sku}', ${p.base_price || 0})" 
                 style="padding:10px; border-bottom:1px solid #f1f5f9; cursor:pointer; font-size:0.8rem" class="search-item-hover">
                <div style="font-weight:700">${p.product_name}</div>
                <div style="color:#64748b">${p.sku} | Cost: ₹${p.base_price || 0}</div>
            </div>
        `).join('');
        resultsBox.style.display = 'block';
    } else {
        resultsBox.style.display = 'none';
    }
};

window.selectProductForPO = function(rowId, pid, vid, name, sku, cost) {
    const row = document.getElementById(rowId);
    row.querySelector('.prod-search').value = `${name} (${sku})`;
    row.querySelector('.prod-id').value = pid;
    row.querySelector('.prod-vid').value = vid;
    row.querySelector('.prod-cost').value = cost;
    row.querySelector('.search-results-po').style.display = 'none';
    calcPOTotal();
};

window.calcPOTotal = function() {
    let grand = 0;
    document.querySelectorAll('.po-row').forEach(row => {
        const q = parseInt(row.querySelector('.prod-qty').value) || 0;
        const c = parseFloat(row.querySelector('.prod-cost').value) || 0;
        grand += (q * c);
    });
    document.getElementById('po-grand-total').innerText = fmt(grand);
};


window.openAddVendorModal = function() {
    openModal('Register New Vendor', `

    <div style="padding:10px">
        <form id="vendorForm">
            <div class="form-group mb-3">
                <label>Vendor / Company Name *</label>
                <input type="text" name="name" class="form-control" required placeholder="Enter supplier name...">
            </div>
            <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:15px">
                <div class="form-group">
                    <label>Contact Person</label>
                    <input type="text" name="contact_person" class="form-control" placeholder="Primary contact name">
                </div>
                <div class="form-group">
                    <label>GSTIN</label>
                    <input type="text" name="gstin" class="form-control" placeholder="Tax Registration Number">
                </div>
            </div>
            <div class="form-row mt-3" style="display:grid; grid-template-columns:1fr 1fr; gap:15px">
                <div class="form-group">
                    <label>Mobile Number *</label>
                    <input type="text" name="mobile" class="form-control" required placeholder="+91 ...">
                </div>
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" name="email" class="form-control" placeholder="email@supplier.com">
                </div>
            </div>
            <div class="form-group mt-3">
                <label>Registered Address</label>
                <textarea name="address" class="form-control" rows="3" placeholder="Full business address..."></textarea>
            </div>
            <button type="submit" class="btn btn-primary w-100 mt-4" style="padding:12px">
                <i class="fas fa-save"></i> Register Vendor
            </button>
        </form>
    </div>
    `);

    document.getElementById('vendorForm').onsubmit = async (e) => {
        e.preventDefault();
        const r = await postAPI('/api/purchase/vendors', Object.fromEntries(new FormData(e.target)));
        if (r.success) { toast('Vendor registered successfully'); closeModal(); renderVendors(); }
        else toast(r.error, 'error');
    };
};

window.printPO = function(id) {
    toast('Generating print copy...', 'info');
    window.open(`/api/purchase/orders/${id}/print`, '_blank');
};

// ══════════════════════════════════════════════════════════════════════
//  POS ORDER MODE — Optical Booking Flow (Frame + Lens + Prescription)
// ══════════════════════════════════════════════════════════════════════

window._posMode = 'direct'; // 'direct' | 'order'

window.togglePosMode = function() {
    const btn = document.getElementById('pos-mode-toggle');
    if (window._posMode === 'direct') {
        window._posMode = 'order';
        if (btn) { btn.style.background = '#10b981'; btn.innerHTML = '🔬 POS Order Mode ON'; }
        toast('POS Order Mode: Select a frame then click "🔬 POS Order" to book', 'info');
    } else {
        window._posMode = 'direct';
        if (btn) { btn.style.background = '#f59e0b'; btn.innerHTML = '🔬 POS Order'; }
        toast('Switched back to POS Direct mode', 'info');
    }
};

// Called when user clicks "Add to Cart" in POS Order mode
window.addToPosAndMaybeOrder = function(productId, variantId, productName, price, mrp, variantLabel) {
    if (window._posMode === 'order') {
        openPosOrderForm({ productId, variantId, productName, price, mrp, variantLabel });
    } else {
        if (typeof addToPos === 'function') addToPos(productId, variantId, productName, price, mrp, variantLabel);
    }
};

window.openPosOrderForm = function(frame) {
    const f = frame || {};
    const payMethods = ['Cash','UPI / QR Scan','Credit Card','Debit Card','Cheque'];
    const lensTypes  = ['Single Vision','Bifocal','Progressive','Executive Bifocal','Anti-Reflective','Photochromic','Polarized','Blue Light'];

    openModal('🔬 New Optical Order — Frame + Prescription', `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">

            <!-- LEFT: Frame + Lens Info -->
            <div>
                <!-- FRAME PICKER -->
                <div style="font-size:0.7rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Frame Details</div>
                <input type="hidden" id="rxo-frame-pid" value="${f.productId||''}">
                <input type="hidden" id="rxo-frame-vid" value="${f.variantId||''}">
                <input type="hidden" id="rxo-frame-name" value="${f.productName||''}">
                <input type="hidden" id="rxo-frame-mrp" value="${f.mrp||0}">
                <input type="hidden" id="rxo-frame-price" value="${f.price||f.selling_price||0}">
                <div style="margin-bottom:8px;position:relative;">
                    <label style="font-size:0.75rem;font-weight:700;">Search Frame from Stock *</label>
                    <input class="filter-input" style="width:100%;" id="rxo-frame-search"
                        placeholder="Type model no. or name..." oninput="rxoPickFrame(this.value)" autocomplete="off"
                        value="${f.productName||''}">
                    <div id="rxo-frame-results" style="position:absolute;z-index:9999;background:#fff;border:1px solid var(--border);border-radius:8px;width:100%;max-height:200px;overflow-y:auto;display:none;box-shadow:0 8px 24px rgba(0,0,0,0.12);"></div>
                </div>
                <div id="rxo-frame-selected" style="display:${f.productId?'block':'none'};background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px;margin-bottom:8px;">
                    <div style="font-size:0.72rem;color:#059669;font-weight:700;margin-bottom:4px;">✅ Frame Selected</div>
                    <div id="rxo-frame-label" style="font-weight:700;font-size:0.9rem;">${f.productName||''}</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px;">
                        <div style="background:#fff;padding:8px;border-radius:6px;border:1px solid #d1fae5;">
                            <div style="font-size:0.68rem;color:#888;margin-bottom:2px;">MRP (₹)</div>
                            <div id="rxo-frame-mrp-display" style="font-weight:900;color:#111;font-size:1rem;">${f.mrp?fmt(f.mrp):'—'}</div>
                        </div>
                        <div style="background:#fff;padding:8px;border-radius:6px;border:1px solid #d1fae5;">
                            <div style="font-size:0.68rem;color:#888;margin-bottom:2px;">Selling Price (₹)</div>
                            <div id="rxo-frame-price-display" style="font-weight:900;color:var(--accent);font-size:1rem;">${f.price?fmt(f.price):'—'}</div>
                        </div>
                    </div>
                    <div style="margin-top:8px;">
                        <label style="font-size:0.7rem;color:#888;">Variant</label>
                        <select id="rxo-frame-variant" class="filter-input" style="width:100%;margin-top:3px;font-size:0.82rem;" onchange="rxoApplyVariant(this)">
                            <option value="">— select variant —</option>
                        </select>
                    </div>
                    <div id="rxo-frame-stock" style="font-size:0.75rem;margin-top:6px;font-weight:600;"></div>
                </div>

                <!-- LENS PICKER -->
                <div style="font-size:0.7rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin:14px 0 8px;">Lens Info</div>
                <input type="hidden" id="rxo-lens-pid" value="">
                <input type="hidden" id="rxo-lens-vid" value="">
                <input type="hidden" id="rxo-lens-type" value="">
                <input type="hidden" id="rxo-lens-price" value="0">
                <div style="margin-bottom:8px;position:relative;">
                    <label style="font-size:0.75rem;font-weight:700;">Search Lens from Stock *</label>
                    <input class="filter-input" style="width:100%;" id="rxo-lens-search"
                        placeholder="Type lens name or model..." oninput="rxoPickLens(this.value)" autocomplete="off">
                    <div id="rxo-lens-results" style="position:absolute;z-index:9999;background:#fff;border:1px solid var(--border);border-radius:8px;width:100%;max-height:180px;overflow-y:auto;display:none;box-shadow:0 8px 24px rgba(0,0,0,0.12);"></div>
                </div>
                <div id="rxo-lens-selected" style="display:none;background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:10px;margin-bottom:8px;">
                    <div style="font-size:0.72rem;color:#3b82f6;font-weight:700;margin-bottom:4px;">✅ Lens Selected</div>
                    <div id="rxo-lens-label" style="font-weight:700;font-size:0.9rem;"></div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px;">
                        <div style="background:#fff;padding:8px;border-radius:6px;border:1px solid #bfdbfe;">
                            <div style="font-size:0.68rem;color:#888;margin-bottom:2px;">Lens Type</div>
                            <div id="rxo-lens-type-display" style="font-size:0.82rem;font-weight:600;">—</div>
                        </div>
                        <div style="background:#fff;padding:8px;border-radius:6px;border:1px solid #bfdbfe;">
                            <div style="font-size:0.68rem;color:#888;margin-bottom:2px;">Lens Price (₹)</div>
                            <div id="rxo-lens-price-display" style="font-weight:900;color:var(--accent);font-size:1rem;">—</div>
                        </div>
                    </div>
                    <div id="rxo-lens-stock" style="font-size:0.75rem;margin-top:6px;font-weight:600;"></div>
                </div>

                <!-- PAYMENT -->
                <div style="font-size:0.7rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin:14px 0 8px;">Payment</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
                    <div>
                        <label style="font-size:0.75rem;font-weight:700;">Advance Amount (₹)</label>
                        <input type="number" class="filter-input" style="width:100%" id="rxo-advance" value="0" placeholder="0" oninput="rxoCalcTotal()">
                    </div>
                    <div>
                        <label style="font-size:0.75rem;font-weight:700;">Payment Mode</label>
                        <select class="filter-input" style="width:100%" id="rxo-pay-mode">
                            ${payMethods.map(m=>`<option>${m}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border-radius:12px;padding:12px;margin-top:8px;">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <div><div style="font-size:0.7rem;opacity:.8;">Frame</div><div id="rxo-total-frame" style="font-size:1.1rem;font-weight:900;">₹0</div></div>
                        <div><div style="font-size:0.7rem;opacity:.8;">Lens</div><div id="rxo-total-lens" style="font-size:1.1rem;font-weight:900;">₹0</div></div>
                        <div><div style="font-size:0.7rem;opacity:.8;">Total</div><div id="rxo-total-amt" style="font-size:1.1rem;font-weight:900;">₹0</div></div>
                        <div><div style="font-size:0.7rem;opacity:.8;">Balance Due</div><div id="rxo-balance" style="font-size:1.1rem;font-weight:900;color:#fcd34d;">₹0</div></div>
                    </div>
                </div>
            </div>

            <!-- RIGHT: Prescription -->
            <div>
                <div style="font-size:0.7rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Prescription (Rx)</div>
                <table style="width:100%;border-collapse:collapse;font-size:0.8rem;">
                    <thead>
                        <tr style="background:#f8fafc;">
                            <th style="padding:8px;text-align:left;">Eye</th>
                            <th style="padding:8px;">SPH</th><th style="padding:8px;">CYL</th>
                            <th style="padding:8px;">AXIS</th><th style="padding:8px;">ADD</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding:8px;font-weight:700;">Right (OD)</td>
                            <td><input type="number" step="0.25" class="filter-input" style="width:70px" id="rxo-r-sph" placeholder="0.00"></td>
                            <td><input type="number" step="0.25" class="filter-input" style="width:70px" id="rxo-r-cyl" placeholder="0.00"></td>
                            <td><input type="number" class="filter-input" style="width:70px" id="rxo-r-axis" placeholder="0"></td>
                            <td><input type="number" step="0.25" class="filter-input" style="width:70px" id="rxo-r-add" placeholder="0.00"></td>
                        </tr>
                        <tr>
                            <td style="padding:8px;font-weight:700;">Left (OS)</td>
                            <td><input type="number" step="0.25" class="filter-input" style="width:70px" id="rxo-l-sph" placeholder="0.00"></td>
                            <td><input type="number" step="0.25" class="filter-input" style="width:70px" id="rxo-l-cyl" placeholder="0.00"></td>
                            <td><input type="number" class="filter-input" style="width:70px" id="rxo-l-axis" placeholder="0"></td>
                            <td><input type="number" step="0.25" class="filter-input" style="width:70px" id="rxo-l-add" placeholder="0.00"></td>
                        </tr>
                    </tbody>
                </table>
                <div style="margin-top:12px;">
                    <label style="font-size:0.75rem;font-weight:700;">Rx Presets</label>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">
                        <button type="button" class="btn btn-outline btn-sm" onclick="rxoPreset('distance')">Distance</button>
                        <button type="button" class="btn btn-outline btn-sm" onclick="rxoPreset('reading')">Reading</button>
                        <button type="button" class="btn btn-outline btn-sm" onclick="rxoPreset('progressive')">Progressive</button>
                        <button type="button" class="btn btn-outline btn-sm" onclick="rxoPreset('clear')">Clear</button>
                    </div>
                </div>
                <div style="margin-top:14px;">
                    <label style="font-size:0.75rem;font-weight:700;">Special Notes / Instructions</label>
                    <textarea class="filter-input" style="width:100%;height:70px;resize:none;" id="rxo-notes" placeholder="e.g. AR coating, UV protection..."></textarea>
                </div>
                <div style="margin-top:12px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:12px;">
                    <div style="font-size:0.72rem;color:#0369a1;font-weight:700;margin-bottom:6px;">👤 Customer</div>
                    <div style="font-weight:700;">${window.posCustomer?.name || 'No customer selected'}</div>
                    <div style="font-size:0.8rem;color:#666;">${window.posCustomer?.mobile || ''}</div>
                </div>
                <div style="margin-top:12px;">
                    <label style="font-size:0.75rem;font-weight:700;">Expected Delivery Date</label>
                    <input type="date" class="filter-input" style="width:100%" id="rxo-delivery-date">
                </div>
                <button class="btn btn-primary w-100" style="margin-top:16px;padding:14px;font-size:1rem;" onclick="submitPosOrderOptical()">
                    🔬 Confirm Order & Record Payment
                </button>
            </div>

        </div>`, { wide: true });

    setTimeout(rxoCalcTotal, 100);
};

window.submitPosOrderOptical = async function() {
    if (!posCustomer?.id) return toast('Please select a customer first (back to POS → select customer)', 'error');

    const g = id => document.getElementById(id)?.value || '';
    const framePid = g('rxo-frame-pid') || null;
    const frameVid = g('rxo-frame-vid') || null;
    const frameMrp = parseFloat(g('rxo-frame-mrp')  || 0);
    const framePrice = parseFloat(g('rxo-frame-price') || frameMrp);
    if (!framePid && !g('rxo-frame-name')) return toast('Frame details are required', 'error');
    if (frameMrp <= 0 && framePrice <= 0) return toast('Frame price must be greater than 0', 'error');

    const payload = {
        business_id:      BIZ,
        customer_id:      posCustomer.id,
        showroom_id:      document.getElementById('globalShowroom')?.value || null,
        frame_product_id: framePid || `custom_${Date.now()}`,
        frame_variant_id: frameVid,
        frame_mrp:        frameMrp || framePrice,
        frame_price:      framePrice,
        lens_type:        g('rxo-lens-type'),
        lens_price:       parseFloat(g('rxo-lens-price') || 0),
        right_sph:        g('rxo-r-sph'), right_cyl:  g('rxo-r-cyl'),  right_axis: g('rxo-r-axis'), right_add: g('rxo-r-add'),
        left_sph:         g('rxo-l-sph'), left_cyl:   g('rxo-l-cyl'),  left_axis:  g('rxo-l-axis'), left_add:  g('rxo-l-add'),
        pd:               g('rxo-pd'),
        notes:            g('rxo-notes'),
        advance_amount:   parseFloat(g('rxo-advance') || 0),
        payment_mode:     g('rxo-pay-mode') || 'Cash',
        delivery_date:    g('rxo-delivery-date')
    };

    const r = await postAPI('/api/orders/pos-order', payload);
    if (!r.success) return toast(r.error || 'Order creation failed', 'error');

    closeModal();
    toast(`✅ Order Booked! ${r.booking_no} | Balance: ${fmt(r.balance_amount)}`, 'success');

    // Show booking confirmation modal
    openModal('🔬 Order Booked Successfully!', `
        <div style="text-align:center;padding:20px 0;">
            <div style="font-size:3rem;margin-bottom:12px;">✅</div>
            <div style="font-size:1.4rem;font-weight:800;color:var(--accent);margin-bottom:8px;">${r.booking_no}</div>
            <div style="font-size:0.9rem;color:#666;margin-bottom:16px;">Booking confirmed for ${posCustomer.name}</div>
            <div style="background:var(--bg);border-radius:10px;padding:16px;text-align:left;">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span>Total Amount</span><b>${fmt(r.total_amount)}</b></div>
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#10b981;"><span>Advance Paid</span><b>${fmt(r.advance_paid)}</b></div>
                <div style="display:flex;justify-content:space-between;color:#ef4444;font-weight:800;font-size:1.05rem;"><span>Balance on Delivery</span><b>${fmt(r.balance_amount)}</b></div>
            </div>
        </div>
        <div style="display:flex;gap:10px;margin-top:20px;">
            <button class="btn btn-outline" style="flex:1;" onclick="printPosInvoice('${r.order_id}')">🖨 Print Booking Slip</button>
            <button class="btn btn-primary" style="flex:1;" onclick="closeModal(); switchView('pos_order');">📋 View in POS Orders</button>

        </div>
    `);

    // Clear cart + reset POS mode
    posCart = []; posCustomer = null; window.appliedCoupon = null;
    if (typeof updatePosCart === 'function') updatePosCart();
    window._posMode = 'direct';
    const btn = document.getElementById('pos-mode-toggle');
    if (btn) { btn.style.background = '#f59e0b'; btn.innerHTML = '🔬 POS Order'; }
};

// ── Deliver Order (final payment + complete) ──
window.deliverPosOrder = function(orderId, balanceDue) {
    const payMethods = ['Cash','UPI / QR Scan','Credit Card','Debit Card','Cheque'];
    openModal('🚚 Deliver Order — Final Payment', `
        <div style="text-align:center;margin-bottom:20px;background:var(--bg);padding:16px;border-radius:10px;">
            <div style="font-size:0.8rem;color:#888;">Balance Due from Customer</div>
            <div style="font-size:2.5rem;font-weight:900;color:#ef4444;">${fmt(balanceDue)}</div>
        </div>
        <div class="form-row" style="margin-bottom:12px;">
            <label style="font-size:0.75rem;font-weight:700;">Final Amount Received (₹)</label>
            <input type="number" id="del-final-amt" class="filter-input" style="width:100%;font-size:1.1rem;" value="${balanceDue}" placeholder="0">
        </div>
        <div class="form-row" style="margin-bottom:20px;">
            <label style="font-size:0.75rem;font-weight:700;">Payment Mode</label>
            <select id="del-pay-mode" class="filter-input" style="width:100%;">
                ${payMethods.map(m=>`<option>${m}</option>`).join('')}
            </select>
        </div>
        <button class="btn btn-primary" style="width:100%;height:52px;font-size:1rem;font-weight:800;border-radius:12px;background:#10b981;border-color:#10b981;"
            onclick="confirmDeliverPosOrder('${orderId}')">
            ✅ Confirm Delivery & Generate Final Invoice
        </button>
    `);
};

window.confirmDeliverPosOrder = async function(orderId) {
    const finalAmt = parseFloat(document.getElementById('del-final-amt')?.value || 0);
    const payMode  = document.getElementById('del-pay-mode')?.value || 'Cash';

    const r = await postAPI(`/api/orders/${orderId}/deliver`, {
        final_amount_paid: finalAmt,
        payment_mode: payMode,
        business_id: BIZ
    });
    if (!r.success) return toast(r.error || 'Delivery failed', 'error');

    closeModal();
    toast(`🎉 Delivered! Final Invoice: ${r.invoice_number}`, 'success');

    // Refresh whichever view is currently active
    const activeView = document.querySelector('.nav-item.active')?.dataset?.view;
    if (activeView === 'pos_order') load_pos_order();
    else load_orders();

    // Auto-print final invoice
    setTimeout(() => printPosInvoice(orderId), 800);
};





