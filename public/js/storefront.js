/**
 * BlinkOpticals Storefront SPA
 * Premium E-Commerce Implementation
 */

// ─── STATE MANAGEMENT ───
const State = {
    cart: JSON.parse(localStorage.getItem('cart') || '[]'),
    products: [],
    viewingProduct: null,
    cookiesAccepted: localStorage.getItem('cookiesAccepted') === 'true',
    customerToken: localStorage.getItem('customerToken') || null,
    customerProfile: JSON.parse(localStorage.getItem('customerProfile') || 'null'),
    tmpLoginMobile: '',
    wishlist: [],
    masterData: {
        brands: [], categories: [], genders: [], types: [], shapes: [], colors: []
    },
    cmsData: {
        home: null
    },
    coupons: [],
    businessSettings: {
        general_settings: {},
        gst_settings: { gst_rate: 18, cgst: 9, sgst: 9 }
    },
    checkoutState: {
        appliedCoupon: null,
        gstPercent: 18,
        shippingCost: 0
    }
};

const formatPrice = (price) => '₹' + Math.round(parseFloat(price || 0)).toLocaleString('en-IN');

// ─── ROUTER ───
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', initStorefront);

async function initStorefront() {
    initCookieBanner();
    updateCartCount();
    await populateMegaMenus();
    await Promise.all([
        fetchCatalog(),
        fetchCMS('home'),
        fetchCoupons(),
        fetchSettings()
    ]);
    if(State.customerToken) await fetchWishlist();
    router();
}

async function fetchCMS(slug) {
    try {
        const res = await fetch(`/api/public/cms/page/${slug}`).then(r => r.json());
        if (res.success) {
            State.cmsData[slug] = res.data;
        }
    } catch (e) { console.error(`CMS Fetch Error [${slug}]`, e); }
}

async function populateMegaMenus() {
    try {
        const endpoints = [
            { key: 'brands', url: '/api/public/brands', selector1: '.mega-menu-brands-list', selector2: '.mega-menu-brands-list-2' },
            { key: 'categories', url: '/api/public/categories', selector: '.mega-menu-cats-list' },
            { key: 'genders', url: '/api/public/genders', selector: '.mega-menu-genders-list' },
            { key: 'types', url: '/api/public/frame_types', selector: '.mega-menu-types-list' },
            { key: 'shapes', url: '/api/public/shapes', selector: '.mega-menu-shapes-list' },
            { key: 'colors', url: '/api/public/frame_colors', selector: '.mega-menu-colors-list' }
        ];

        const mapper = (item, type) => {
            const name = item.name || 'Unnamed';
            const slug = item.slug || item.id || '#';
            return `<li><a href="#/shop?${type}=${slug}">${name}</a></li>`;
        };

        const results = await Promise.all(endpoints.map(e => fetch(e.url).then(r => r.json()).catch(() => ({ success: false }))));

        endpoints.forEach((e, i) => {
            const res = results[i];
            if (res.success && res.data && res.data.length > 0) {
                State.masterData[e.key] = res.data; // Store for filters
                if (e.key === 'brands') {
                    const list1 = document.querySelector(e.selector1);
                    const list2 = document.querySelector(e.selector2);
                    const splitAt = Math.ceil(res.data.length / 2);
                    if (list1) list1.innerHTML = res.data.slice(0, splitAt).map(b => mapper(b, 'brand')).join('');
                    if (list2) list2.innerHTML = res.data.slice(splitAt).map(b => mapper(b, 'brand')).join('');
                } else {
                    const list = document.querySelector(e.selector);
                    const paramMap = { categories: 'category', genders: 'gender', types: 'type', shapes: 'shape', colors: 'color' };
                    if (list) list.innerHTML = res.data.map(item => mapper(item, paramMap[e.key])).join('');
                }
            }
        });
    } catch(err) { console.error("MegaMenu Sync Error:", err); }
}

async function fetchCatalog() {
    // Attempt to fetch from DB, or fallback to dummy if empty
    try {
        const res = await fetch('/api/public/catalog-public').then(r => r.json());
        if(res.success && res.data && res.data.length > 0) {
            State.products = res.data;
            refreshCartMetadata();
        } else {
            State.products = [];
            console.warn('Catalog empty or fetch failed');
        }
    } catch(e) { console.error('Fetch Error', e); }
}

function refreshCartMetadata() {
    if(!State.cart || State.cart.length === 0) return;
    let changed = false;
    State.cart.forEach(item => {
        const p = State.products.find(x => x.id === item.id);
        if(p) {
            // Update metadata that might be missing or updated
            const actualMrp = parseFloat(p.mrp || p.price || 0);
            if(item.offer_name !== p.offer_name) { item.offer_name = p.offer_name; changed = true; }
            if(item.mrp !== p.mrp) { item.mrp = p.mrp; changed = true; }
            if(item.original_price !== actualMrp) { item.original_price = actualMrp; changed = true; }
        }
    });
    if(changed) saveCart();
}

async function fetchSettings() {
    try {
        const res = await fetch('/api/public/settings-public').then(r => r.json());
        if(res.success) {
            State.businessSettings = res.data;
        }
    } catch(e) { console.error('Settings Fetch Error', e); }
}

async function fetchCoupons() {
    try {
        const res = await fetch('/api/public/coupons-public').then(r => r.json());
        if(res.success) {
            State.coupons = res.data;
        }
    } catch(e) { console.error('Coupon Fetch Error', e); }
}

function router() {
    const hash = window.location.hash || '#/';
    const app = document.getElementById('store-app');
    window.scrollTo({top:0, behavior:'smooth'});

    // Update Active Nav Links
    document.querySelectorAll('.nav-links a').forEach(a => {
        if(a.getAttribute('href') === hash) a.classList.add('active');
        else a.classList.remove('active');
    });

    if (hash === '#/') renderHome(app);
    else if (hash.startsWith('#/shop')) {
        const params = new URLSearchParams(hash.split('?')[1] || '');
        renderShop(app, params);
    }
    else if (hash.startsWith('#/product/')) renderProduct(app, hash.split('/')[2]);
    else if (hash === '#/checkout') renderCheckout(app);
    else if (hash.startsWith('#/account')) renderAccount(app);
    else if (hash === '#/wishlist') renderWishlist(app);
    else renderHome(app);

    // Update Meta Title from CMS if on Home
    if (hash === '#/' && State.cmsData.home?.seo?.seo_title) {
        document.title = State.cmsData.home.seo.seo_title;
    } else {
        document.title = "Blink Opticals | Premium Eyewear";
    }
    
    // Trigger scroll animations after render
    setTimeout(observeReveals, 100);
}

// ─── RENDERING ───
function renderHome(app) {
    const homeCMS = State.cmsData.home;
    const sections = homeCMS?.sections || [];

    let sectionsHtml = '';

    if (sections.length > 0) {
        sectionsHtml = sections.map(s => renderCMSSection(s)).join('');
    } else {
        // Fallback Layout (Original Modernized Sections)
        sectionsHtml = `
            <div class="hero reveal" style="background: linear-gradient(to right, rgba(0,0,0,0.6), rgba(0,0,0,0.2)), url('https://images.unsplash.com/photo-1577803645773-f96470509666?w=1600&q=80') center/cover; position:relative; min-height:90vh; padding: 80px 4%; display:flex; align-items:center;">
                <div class="hero-content" style="max-width:700px; color:#fff;">
                    <div style="text-transform:uppercase; font-size:0.9rem; font-weight:700; letter-spacing:4px; margin-bottom:25px; color:var(--accent); font-family:var(--font-alt);">Established 1995</div>
                    <h1 style="font-size: clamp(3rem, 10vw, 5.5rem); letter-spacing:-3px; margin:0 0 25px 0; font-weight:800; line-height:0.95; font-family:var(--font-alt);">Redefining Your Perspective.</h1>
                    <p style="font-size: 1.25rem; color:rgba(255,255,255,0.85); line-height:1.6; margin-bottom:45px; font-weight:400; max-width:550px;">Experience the pinnacle of optical engineering combined with avant-garde styling from Milan's finest designers.</p>
                    <div style="display:flex; gap:20px; flex-wrap:wrap;">
                        <a href="#/shop" class="btn-lux">Explore Catalog <i class="fas fa-arrow-right"></i></a>
                        <a href="#/shop" class="btn-lux btn-outline" style="color:#fff; border-color:#fff;">The Designer Edit</a>
                    </div>
                </div>
            </div>

            <div class="brand-strip-wrapper reveal">
                <div class="brand-strip-track">
                    ${(() => {
                        const brands = State.masterData.brands && State.masterData.brands.length > 0 ? State.masterData.brands : [
                            { name: 'GUCCI', slug: 'gucci' }, { name: 'PRADA', slug: 'prada' }, { name: 'RAY-BAN', slug: 'ray-ban' },
                            { name: 'OAKLEY', slug: 'oakley' }, { name: 'VERSACE', slug: 'versace' }, { name: 'BURBERRY', slug: 'burberry' },
                            { name: 'CHLOE', slug: 'chloe' }, { name: 'MONTBLANC', slug: 'montblanc' }
                        ];
                        return [...brands, ...brands].map(b => `
                            <div class="brand-item" onclick="window.location.hash='#/shop?brand=${b.slug || b.id}'">
                                ${b.logo ? `<img src="${b.logo}" alt="${b.name}">` : `<span>${b.name}</span>`}
                            </div>
                        `).join('');
                    })()}
                </div>
            </div>

            <div class="container section reveal" id="new-arrivals">
                <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:40px;">
                    <div>
                        <h2 class="section-title" style="margin:0; text-align:left;">New Arrivals</h2>
                        <p style="color:var(--text-sec); margin-top:5px;">Freshly curated styles from the latest designer seasons.</p>
                    </div>
                    <a href="#/shop" style="font-weight:600; color:var(--accent); text-decoration:none; text-transform:uppercase; font-size:0.75rem; letter-spacing:1px;">Shop All New →</a>
                </div>
                <div class="product-grid">
                    ${State.products.slice(0, 8).map((p, i) => buildProductCard(p, i)).join('')}
                </div>
            </div>

            <section class="container gender-section reveal">
                <div style="margin-bottom:40px;">
                    <h2 class="section-title">Shop By Gender</h2>
                    <p style="color:var(--text-sec);">Find the perfect pair curated for every perspective.</p>
                </div>
                <div class="gender-grid">
                    <div class="gender-card" onclick="window.location.hash='#/shop?gender=man'">
                        <img src="/img/banners/men.png" alt="Men's Eyewear">
                        <div class="gender-overlay"><h3>Men</h3><p>Sophisticated & Bold</p></div>
                    </div>
                    <div class="gender-card" onclick="window.location.hash='#/shop?gender=woman'">
                        <img src="/img/banners/women.png" alt="Women's Eyewear">
                        <div class="gender-overlay"><h3>Women</h3><p>Elegant & Artistic</p></div>
                    </div>
                    <div class="gender-card" onclick="window.location.hash='#/shop?gender=kids'">
                        <img src="/img/banners/kids.png" alt="Kids' Eyewear">
                        <div class="gender-overlay"><h3>Kids</h3><p>Vibrant & Durable</p></div>
                    </div>
                    <div class="gender-card" onclick="window.location.hash='#/shop?gender=unisex'">
                        <img src="/img/banners/unisex.png" alt="Unisex Eyewear">
                        <div class="gender-overlay"><h3>Unisex</h3><p>Versatile & Modern</p></div>
                    </div>
                </div>
            </section>
            
            <div class="container section" id="trending">
                <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:40px;" class="reveal">
                    <div>
                        <h2 class="section-title" style="margin:0; text-align:left;">Trending Now</h2>
                        <p style="color:var(--text-sec); margin-top:5px;">Most loved styles this week.</p>
                    </div>
                    <a href="#/shop" style="font-weight:600; color:var(--accent); text-decoration:none; text-transform:uppercase; font-size:0.75rem; letter-spacing:1px;">View all →</a>
                </div>
                <div class="product-grid">
                    ${State.products.slice(8, 12).map((p, i) => buildProductCard(p, i)).join('')}
                </div>
            </div>

            <section class="container shape-section reveal">
                <h2 class="section-title">Shop By Shape</h2>
                <p style="color:var(--text-sec); margin-top:5px;">Find frames that perfectly complement your features.</p>
                <div class="shape-grid">
                    ${['aviator', 'round', 'cat-eye', 'square', 'wayfarer', 'rectangle'].map(s => `
                        <div class="shape-card" onclick="window.location.hash='#/shop?shape=${s}'">
                            <img src="/img/shapes/${s}.png" alt="${s}">
                            <h4>${s.charAt(0).toUpperCase() + s.slice(1)}</h4>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    app.innerHTML = `
        <div class="home-view">
            ${sectionsHtml}
        </div>
    `;
}

function renderCMSSection(s) {
    const c = s.content_json || {};
    
    if (s.section_type === 'hero') {
        const slides = c.slides || (c.image ? [c] : []);
        return renderHeroCarousel(slides, c.speed, c.effect);
    }

    if (s.section_type === 'brand_slider') {
        return renderBrandSlider(c.brands || [], c.speed);
    }

    if (s.section_type === 'grid') {
        return renderInteractiveGrid(c);
    }

    if (s.section_type === 'banner') {
        return `
        <div class="container section">
            <div class="promo-banner" style="background-image: url('${c.image}'); min-height:400px; background-size:cover; background-position:center; border-radius:30px; display:flex; align-items:center; padding:60px; position:relative; overflow:hidden;">
                 <div style="position:relative; z-index:2; max-width:500px;">
                    <h2 class="section-title" style="color:white; text-align:left; margin-bottom:10px;">${c.title || ''}</h2>
                    <p style="color:white; opacity:0.9; font-size:1.15rem;">${c.subtitle || ''}</p>
                    ${c.button_link ? `<a href="${c.button_link}" class="btn-lux" style="margin-top:30px; background:white; color:black;">${c.button_text || 'Explore'}</a>` : ''}
                 </div>
                 <div style="position:absolute; top:0; left:0; width:100%; height:100%; background:linear-gradient(to right, rgba(0,0,0,0.7), transparent); z-index:1;"></div>
            </div>
        </div>`;
    }

    if (s.section_type === 'text') {
        return `
        <section class="container section">
            <h2 class="section-title">${c.title || ''}</h2>
            <div class="rich-text-content" style="line-height:1.9; color:var(--text-sec); font-size:1.1rem; max-width:800px;">
                ${c.body || ''}
            </div>
        </section>`;
    }

    if (s.section_type === 'product') {
        const count = c.limit || 8;
        const filter = c.filter || 'all';
        const rows = c.rows || 1;
        const scroll = c.scroll_speed || 0;
        let products = [...State.products];
        
        // Advanced Filter Strategy
        if (filter === 'new') products = [...products].reverse();
        else if (filter === 'trending') products = products.filter(p => (p.price > 10000 || p.is_hot));
        else if (filter === 'category' && c.category) {
            const cat = c.category.toLowerCase();
            products = products.filter(p => 
                (p.category && p.category.toLowerCase().includes(cat)) || 
                (p.type && p.type.toLowerCase().includes(cat)) ||
                (p.name && p.name.toLowerCase().includes(cat))
            );
        }

        const displayed = products.slice(0, count);
        const sectionId = 'prod-' + Math.random().toString(36).substr(2, 9);
        
        // Mode Selection: Grid vs Slider
        const gridClass = scroll > 0 ? 'product-slider-mode' : 'product-grid';
        const innerHtml = displayed.map((p, i) => buildProductCard(p, i)).join('');

        return `
        <section class="container section reveal" id="${sectionId}">
            <style>
                #${sectionId} .product-grid {
                    grid-template-rows: repeat(${rows}, auto);
                }
                #${sectionId} .product-slider-mode {
                    display: flex;
                    gap: 30px;
                    overflow: hidden;
                    padding: 10px 0;
                }
                #${sectionId} .product-slider-track {
                    display: flex;
                    gap: 30px;
                    animation: prodScroll ${scroll}ms linear infinite;
                }
                @keyframes prodScroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                #${sectionId} .product-slider-mode:hover .product-slider-track {
                    animation-play-state: paused;
                }
            </style>
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:40px;">
                <div>
                    <h2 class="section-title" style="margin:0; text-align:left;">${c.title || 'Curated Products'}</h2>
                    <p style="color:var(--text-sec); margin-top:5px;">${c.subtitle || ''}</p>
                </div>
                <a href="#/shop${c.category ? '?category='+c.category : ''}" style="font-weight:600; color:var(--accent); text-decoration:none; text-transform:uppercase; font-size:0.75rem; letter-spacing:1px;">View Full Collection →</a>
            </div>
            
            <div class="${gridClass}">
                ${scroll > 0 ? `
                    <div class="product-slider-track">
                        ${innerHtml} ${innerHtml}
                    </div>
                ` : innerHtml}
            </div>
        </section>`;
    }

    return `<!-- Section ${s.section_type} Render Not Implemented -->`;
}

function renderShop(app, params = new URLSearchParams()) {
    // 1. Filtering Logic
    let filtered = [...State.products];
    
    // Apply filters from URL params
    const activeFilters = {};
    for (const [key, value] of params.entries()) {
        activeFilters[key] = value;
        if (key === 'brand') filtered = filtered.filter(p => p.brand?.toLowerCase().replace(/ /g, '-') === value);
        if (key === 'category') filtered = filtered.filter(p => p.category?.toLowerCase().replace(/ /g, '-') === value);
        if (key === 'gender') filtered = filtered.filter(p => p.gender?.toLowerCase().replace(/ /g, '-') === value);
        if (key === 'type') filtered = filtered.filter(p => p.type?.toLowerCase().replace(/ /g, '-') === value);
        if (key === 'shape') filtered = filtered.filter(p => p.shape?.toLowerCase().replace(/ /g, '-') === value);
        if (key === 'color') filtered = filtered.filter(p => p.color?.toLowerCase().replace(/ /g, '-') === value);
        if (key === 'price') {
            const [min, max] = value.split('-').map(v => v === 'plus' ? Infinity : Number(v));
            filtered = filtered.filter(p => p.price >= min && p.price <= max);
        }
    }

    // 2. Identify Brand Banner if filtered
    const activeBrandSlug = params.get('brand');
    const brandData = activeBrandSlug ? State.masterData.brands.find(b => b.slug === activeBrandSlug) : null;
    const bannerUrl = brandData?.hero_url;

    app.innerHTML = `
        ${bannerUrl ? `
            <div class="brand-hero reveal" style="background: url('${bannerUrl}') center/cover; height:450px; position:relative; width:100%; display:flex; align-items:center; justify-content:center; margin-bottom:60px; overflow:hidden;">
            </div>
        ` : `
            <div class="container section">
                <div style="text-align:center; margin-bottom:80px;" class="reveal">
                    <h1 style="font-size:3.5rem; letter-spacing:-2px; margin-bottom:15px;">Visionary Collections</h1>
                    <p style="color:var(--text-sec); font-size:1.1rem;">Discover frames engineered for performance and styled for luxury.</p>
                </div>
            </div>
        `}
        
        <div class="container" style="margin-top:${bannerUrl ? '0' : '-40px'}; padding-bottom:80px;">
            <div class="plp-layout">
                <aside class="plp-sidebar reveal delay-1" style="position:sticky; top:120px; height:fit-content;">
                    <div style="border-bottom:1px solid var(--border); padding-bottom:15px; margin-bottom:25px; display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0; font-size:1.1rem;">Filters</h3>
                        <button style="background:none; border:none; color:var(--accent); font-size:0.8rem; font-weight:700; cursor:pointer;" onclick="window.location.hash='#/shop'">Reset</button>
                    </div>

                    <!-- PRICE FILTER -->
                    <div class="filter-group" style="margin-bottom:30px;">
                        <h4 style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:15px; color:var(--text); font-weight:800;">Budget Range</h4>
                        <div style="display:flex; flex-direction:column; gap:10px;">
                            ${[
                                { label: 'Under ₹5,000', val: '0-5000' },
                                { label: '₹5,000 - ₹10,000', val: '5000-10000' },
                                { label: '₹10,000 - ₹20,000', val: '10000-20000' },
                                { label: '₹20,000 & Above', val: '20000-999999' }
                            ].map(range => {
                                const isActive = activeFilters['price'] === range.val;
                                
                                // Robust URL generation
                                const currentHash = window.location.hash.split('?')[0];
                                const searchParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
                                searchParams.set('price', range.val);
                                const link = `${currentHash}?${searchParams.toString()}`;

                                return `
                                    <a href="${link}" style="text-decoration:none; color:${isActive ? 'var(--accent)' : 'var(--text-sec)'}; font-size:0.95rem; font-weight:${isActive ? '700' : '400'}; display:flex; align-items:center; gap:10px;">
                                        <div style="width:16px; height:16px; border:1px solid ${isActive ? 'var(--accent)' : '#ddd'}; border-radius:4px; display:flex; align-items:center; justify-content:center;">
                                            ${isActive ? '<i class="fas fa-check" style="font-size:0.6rem; color:var(--accent);"></i>' : ''}
                                        </div>
                                        ${range.label}
                                    </a>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    ${['categories', 'brands', 'genders', 'types'].map(key => {
                        const titleMap = { categories: 'Shop By Category', brands: 'Designer Brands', genders: 'Gender', types: 'Frame Type' };
                        const paramMap = { categories: 'category', brands: 'brand', genders: 'gender', types: 'type' };
                        const data = State.masterData[key] || [];
                        if (data.length === 0) return '';
                        
                        return `
                            <div class="filter-group" style="margin-bottom:30px;">
                                <h4 style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:15px; color:var(--text); font-weight:800;">${titleMap[key]}</h4>
                                <div style="display:flex; flex-direction:column; gap:10px;">
                                    ${data.map(item => {
                                        const slug = item.slug || item.name.toLowerCase().replace(/ /g, '-');
                                        const isActive = activeFilters[paramMap[key]] === slug;
                                        
                                        // Robust URL generation
                                        const currentHash = window.location.hash.split('?')[0];
                                        const searchParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
                                        searchParams.set(paramMap[key], slug);
                                        const link = `${currentHash}?${searchParams.toString()}`;

                                        return `
                                            <a href="${link}" style="text-decoration:none; color:${isActive ? 'var(--accent)' : 'var(--text-sec)'}; font-size:0.9rem; font-weight:${isActive ? '700' : '400'}; display:flex; align-items:center; gap:8px;">
                                                <div style="width:6px; height:6px; border-radius:50%; background:${isActive ? 'var(--accent)' : 'transparent'}; border:1px solid ${isActive ? 'var(--accent)' : '#ddd'}"></div>
                                                ${item.name}
                                            </a>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </aside>
                
                <main class="plp-main">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;" class="reveal">
                        <div style="font-size:0.9rem; color:var(--text-sec);">${filtered.length} Masterpieces</div>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span style="font-size:0.8rem; font-weight:700; color:var(--text-sec);">SORT BY:</span>
                            <select style="border:none; background:none; font-family:var(--font-main); font-weight:700; font-size:0.85rem; cursor:pointer; outline:none;">
                                <option>Featured</option>
                                <option>Newest First</option>
                                <option>Price: Low to High</option>
                                <option>Price: High to Low</option>
                            </select>
                        </div>
                    </div>
                    <div class="product-grid">
                        ${filtered.length > 0 ? 
                            filtered.map((p, i) => buildProductCard(p, i)).join('') : 
                            `<div style="grid-column:1/-1; text-align:center; padding:100px 0; color:var(--text-sec);">
                                <i class="fas fa-search" style="font-size:3rem; opacity:0.1; margin-bottom:20px;"></i>
                                <p>No products match your refined criteria.</p>
                                <a href="#/shop" style="color:var(--accent); font-weight:700; text-decoration:none;">Clear All Filters</a>
                             </div>`
                        }
                    </div>
                </main>
            </div>
        </div>

        <!-- OTHER BRANDS SECTION (AUTO-SCROLL) -->
        <div class="similar-products section reveal" style="margin-top:100px; padding-top:80px; border-top:1px solid #f0f0f0; padding-left:0; padding-right:0;">
            <div class="container" style="margin-bottom:40px;">
                <span style="font-size:0.75rem; font-weight:800; color:var(--accent); text-transform:uppercase; letter-spacing:2px; margin-bottom:15px; display:block;">LUXURY DISCOVERY</span>
                <h2 style="font-size:2.8rem; letter-spacing:-2px; margin:0; font-weight:800;">Featured from Other Brands</h2>
            </div>
            
            <div class="similar-carousel-wrapper">
                <div class="similar-carousel-track">
                    ${(() => {
                        const activeBrand = params.get('brand');
                        const others = State.products.filter(x => !activeBrand || x.brand?.toLowerCase().replace(/ /g, '-') !== activeBrand).slice(0, 8);
                        // Double for infinite scroll effect
                        return [...others, ...others].map((sp, idx) => buildProductCard(sp, idx)).join('');
                    })()}
                </div>
            </div>
        </div>
    `;
}

function renderProduct(app, id) {
    const p = State.products.find(x => x.id === id) || State.products[0];
    State.viewingProduct = p;

    let additionalImgs = [];
    if (p.additional_images) {
        try {
            additionalImgs = typeof p.additional_images === 'string' ? JSON.parse(p.additional_images) : p.additional_images;
        } catch(e) {
            console.error("PDP Image parse error", e);
        }
    }
    const allImages = [p.image, ...(Array.isArray(additionalImgs) ? additionalImgs : [])].filter(Boolean);
    // Robust Price Logic for PDP
    const mrpVal = parseFloat(p.mrp || 0);
    const basePrc = parseFloat(p.price || 0);
    let finalPrc = basePrc;
    let savings = 0;

    if (p.offer_discount) {
        const disc = parseFloat(p.offer_discount);
        const oType = (p.offer_type || '').toLowerCase();
        if (oType.includes('percentage')) finalPrc = basePrc - (basePrc * (disc / 100));
        else if (oType.includes('flat')) finalPrc = basePrc - disc;
    }

    let displayMrp = mrpVal > basePrc ? mrpVal : (finalPrc < basePrc ? basePrc : mrpVal);
    if (displayMrp > finalPrc) {
        savings = Math.round(((displayMrp - finalPrc) / displayMrp) * 100);
    }

    app.innerHTML = `
        <div class="container section" style="padding-top:20px;">
            <nav style="margin-bottom:30px; font-size:0.75rem; color:var(--text-sec); display:flex; align-items:center; gap:8px;">
                <a href="#/" style="color:inherit; text-decoration:none;">Home</a> 
                <span style="opacity:0.5">/</span>
                <a href="#/shop" style="color:inherit; text-decoration:none;">Sunglasses</a> 
                <span style="opacity:0.5">/</span>
                <span style="color:var(--text); font-weight:700;">${p.name}</span>
            </nav>
            
            <div class="pdp-layout">
                <!-- LEFT: 2x2 IMAGE GRID -->
                <div class="pdp-gallery reveal">
                    ${allImages.map(img => `
                        <div class="pdp-gallery-item" onclick="openLightbox('${img}')" style="cursor:zoom-in;">
                            <img src="${img}" alt="${p.name}">
                        </div>
                    `).join('')}
                </div>

                <!-- LIGHTBOX / ZOOM MODAL -->
                <div id="pdp-lightbox" class="lightbox-overlay" onclick="closeLightbox(event)">
                    <span class="lightbox-close">&times;</span>
                    <div class="lightbox-content-wrapper" onclick="event.stopPropagation()">
                        <img id="lightbox-img" src="" class="zoomable" onclick="toggleZoom(event)">
                        <div class="lightbox-hint">Click image to Zoom In/Out</div>
                    </div>
                </div>

                <style>
                    .lightbox-overlay {
                        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                        background: rgba(255,255,255,0.98); z-index: 10000;
                        display: none; align-items: center; justify-content: center;
                        cursor: crosshair; backdrop-filter: blur(10px);
                    }
                    .lightbox-overlay.show { display: flex; }
                    .lightbox-close {
                        position: absolute; top: 30px; right: 40px; font-size: 3rem;
                        cursor: pointer; color: #000; transition: 0.3s; z-index: 10001;
                    }
                    .lightbox-content-wrapper {
                        max-width: 90vw; max-height: 90vh; display: flex; flex-direction: column; align-items: center;
                    }
                    .lightbox-img { max-width: 100%; max-height: 80vh; object-fit: contain; box-shadow: 0 30px 60px rgba(0,0,0,0.1); transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); cursor: zoom-in; }
                    .zoomable { transition: transform 0.4s ease; cursor: zoom-in; max-width: 80vw; max-height: 80vh; }
                    .zoomable.zoomed { transform: scale(2); cursor: zoom-out; }
                    .lightbox-hint { margin-top: 20px; font-size: 0.75rem; color: #999; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
                </style>
                
                <!-- RIGHT: STICKY PRODUCT INTEL -->
                <div class="pdp-details reveal">
                    <div style="margin-bottom:15px; color:var(--accent); font-weight:800; font-size:0.8rem; letter-spacing:1px; text-transform:uppercase;">${p.brand} EDITION</div>
                    <h1 style="line-height:1.1; margin-bottom:20px;">${p.name}</h1>
                    
                    <div style="display:flex; gap:10px; margin-bottom:30px;">
                        <span class="pdp-chip">${p.shape || 'Universal'}</span>
                        <span class="pdp-chip">${p.gender || 'Unisex'}</span>
                        <span class="pdp-chip" style="background:#e6f7f7; color:#008080; border:1px solid #b2e0e0;">POLARIZED</span>
                    </div>

                    <div style="margin-bottom:30px;">
                        <!-- Comprehensive Pricing Block -->
                        <div style="display:flex; align-items:center; gap:20px; flex-wrap:wrap; margin-bottom:15px;">
                            <div style="display:flex; flex-direction:column; gap:4px;">
                                <div style="display:flex; align-items:baseline; gap:12px;">
                                    <span style="font-size:2.8rem; font-weight:900; font-family:var(--font-alt); color:#111;">${formatPrice(finalPrc)}</span>
                                    ${displayMrp > finalPrc ? `
                                        <span style="font-size:1.2rem; color:#999; text-decoration:line-through; font-weight:500;">${formatPrice(displayMrp)}</span>
                                    ` : ''}
                                </div>
                                <div style="font-size:0.75rem; color:var(--text-sec); font-weight:600; text-transform:uppercase; letter-spacing:1px;">MRP Inclusive of all taxes</div>
                            </div>
                        </div>

                        <!-- Combined Marketing & Coupon Section -->
                        <div style="display:flex; flex-direction:column; gap:15px; background:linear-gradient(135deg, #fdfdfd 0%, #f7f7f7 100%); border:1px solid #eee; padding:20px; border-radius:20px; box-shadow: 0 10px 30px rgba(0,0,0,0.02);">
                            
                            <!-- 1. Automatic Applied Offer -->
                            ${p.offer_name ? `
                                <div style="display:flex; align-items:center; gap:15px;">
                                    <div style="width:42px; height:42px; background:#000; color:#fff; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
                                        <i class="fas fa-bolt"></i>
                                    </div>
                                    <div>
                                        <div style="font-size:0.65rem; font-weight:800; color:#999; text-transform:uppercase; letter-spacing:1.5px;">Applied Discount</div>
                                        <div style="font-size:1rem; font-weight:700; color:#111;">${p.offer_name} — SAVE ${savings}% TODAY</div>
                                    </div>
                                </div>
                            ` : ''}

                            <!-- 2. Available Storewide Coupons -->
                            ${State.coupons && State.coupons.length > 0 ? `
                                <div style="${p.offer_name ? 'border-top:1px solid #eee; padding-top:15px;' : ''}">
                                    <div style="font-size:0.65rem; font-weight:800; color:#999; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:12px;">Available Coupons</div>
                                    <div style="display:flex; flex-wrap:wrap; gap:10px;">
                                        ${State.coupons.map(c => `
                                            <div class="pdp-coupon-label" 
                                                 title="Click to Copy"
                                                 style="display:flex; align-items:center; gap:10px; background:#fff; border:1.5px dashed var(--accent); padding:8px 14px; border-radius:12px; cursor:pointer;" 
                                                 onclick="navigator.clipboard.writeText('${c.code}'); alert('Coupon ${c.code} copied to clipboard!')">
                                                <i class="fas fa-ticket-alt" style="color:var(--accent); font-size:0.9rem;"></i>
                                                <span style="font-size:0.9rem; font-weight:800; color:var(--accent);">${c.code}</span>
                                                <div style="height:12px; width:1px; background:#eee;"></div>
                                                <span style="font-size:0.75rem; font-weight:700; color:#444;">GET ${c.discount_value}${c.discount_type==='Percentage'?'%':' OFF'}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}

                            ${!p.offer_name && (!State.coupons || State.coupons.length === 0) ? `
                                <div style="font-size:0.85rem; color:#999; font-style:italic;">No active promotions for this item.</div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <p style="font-size:1.05rem; line-height:1.6; color:var(--text-sec); margin-bottom:40px; padding-bottom:30px; border-bottom:1px solid #eee;">${p.short_desc || ''}</p>

                    <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:40px;">
                        <div style="display:flex; gap:12px;">
                            <button class="btn-lux" style="flex:2; height:64px; border-radius:8px; text-transform:uppercase; font-weight:900; letter-spacing:2px; font-size:0.95rem;" onclick="addToCart('${p.id}')">Add to Shopping Bag</button>
                            <button class="btn-lux btn-outline" style="flex:1; height:64px; border-radius:8px; text-transform:uppercase; font-weight:900; display:flex; align-items:center; justify-content:center; gap:10px; font-size:0.85rem;" onclick="window.startVTO('${p.image}')">
                                <i class="fas fa-play-circle" style="font-size:1.2rem;"></i> AI Try On
                            </button>
                        </div>
                        <button class="btn-lux" style="width:100%; height:64px; border-radius:8px; background:var(--accent); border-color:var(--accent); text-transform:uppercase; font-weight:900; letter-spacing:2px; font-size:0.95rem;" onclick="buyNow('${p.id}')">Secure Checkout</button>
                    </div>

                    <div style="display:flex; align-items:center; gap:20px; margin-bottom:0;">
                        <span style="font-size:0.75rem; font-weight:800; color:#aaa; text-transform:uppercase; letter-spacing:1px;">Share selection:</span>
                        <div style="display:flex; gap:15px;">
                            <a href="javascript:void(0)" onclick="shareProduct('whatsapp', '${p.id}')" style="width:36px; height:36px; border-radius:50%; background:#25D366; color:#fff; display:flex; align-items:center; justify-content:center; text-decoration:none; transition:0.3s;" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='none'"><i class="fab fa-whatsapp"></i></a>
                            <a href="javascript:void(0)" onclick="shareProduct('facebook', '${p.id}')" style="width:36px; height:36px; border-radius:50%; background:#1877F2; color:#fff; display:flex; align-items:center; justify-content:center; text-decoration:none; transition:0.3s;" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='none'"><i class="fab fa-facebook-f"></i></a>
                            <a href="javascript:void(0)" onclick="shareProduct('instagram', '${p.id}')" style="width:36px; height:36px; border-radius:50%; background:linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%); color:#fff; display:flex; align-items:center; justify-content:center; text-decoration:none; transition:0.3s;" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='none'"><i class="fab fa-instagram"></i></a>
                        </div>
                    </div>

                    <!-- PDP TABS SECTION MOVED INSIDE DETAILS -->
                    <div class="pdp-modern-tabs" style="margin-top:40px; border-top:1px solid #f0f0f0;">
                        <h4 style="font-size: 1.1rem; font-weight: 800; letter-spacing: -0.5px; margin-top: 30px; margin-bottom: 20px;">Product Details</h4>
                        <div class="pdp-tabs-nav">
                            <button class="pdp-tab-trigger active" onclick="switchPDPTab(event, 'tab-details')">Details</button>
                            <button class="pdp-tab-trigger" onclick="switchPDPTab(event, 'tab-description')">Description</button>
                            <button class="pdp-tab-trigger" onclick="switchPDPTab(event, 'tab-brand')">Brand</button>
                        </div>
                        
                        <div class="pdp-tab-panel active" id="tab-details">
                            <div class="specs-clean-grid">
                                <div class="spec-row">
                                    <div class="spec-cell"><span>SKU</span><strong>${p.sku || p.id}</strong></div>
                                    <div class="spec-cell"><span>Model No</span><strong>${p.model_no || '--'}</strong></div>
                                </div>
                                <div class="spec-row">
                                    <div class="spec-cell"><span>Color Code</span><strong>${p.color_code || '--'}</strong></div>
                                    <div class="spec-cell"><span>Size Code</span><strong>${p.size_code || '--'}</strong></div>
                                </div>
                                <div class="spec-row">
                                    <div class="spec-cell"><span>Category</span><strong>${p.category || '--'}</strong></div>
                                    <div class="spec-cell"><span>Gender</span><strong>${p.gender || '--'}</strong></div>
                                </div>
                                <div class="spec-row">
                                    <div class="spec-cell"><span>Frame Type</span><strong>${p.type || '--'}</strong></div>
                                    <div class="spec-cell"><span>Frame Shape</span><strong>${p.shape || '--'}</strong></div>
                                </div>
                                <div class="spec-row">
                                    <div class="spec-cell"><span>Frame Material</span><strong>${p.material || '--'}</strong></div>
                                    <div class="spec-cell"><span>Bridge Width</span><strong>${p.bridge_size || '--'}mm</strong></div>
                                </div>
                                <div class="spec-row">
                                    <div class="spec-cell"><span>Temple Width</span><strong>${p.temple_length || '--'}mm</strong></div>
                                    <div class="spec-cell"><span>Lens Material</span><strong>${p.lens_composite || '--'}</strong></div>
                                </div>
                                <div class="spec-row">
                                    <div class="spec-cell"><span>Lens Color</span><strong>${p.lens_colorway || '--'}</strong></div>
                                    <div class="spec-cell"><span>Lens Width</span><strong>${p.lens_width || '--'}mm</strong></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="pdp-tab-panel" id="tab-description">
                            <div style="padding:30px 0;">
                                <h4 class="detail-label" style="font-size:0.6rem; color:#999; margin-bottom:10px;">Short Description</h4>
                                <p class="detail-text" style="font-size:0.9rem; font-weight:600; color:#111; margin-bottom:25px;">${p.short_desc || 'No highlights available.'}</p>
                                
                                <h4 class="detail-label" style="font-size:0.6rem; color:#999; margin-bottom:10px;">Detailed Description</h4>
                                <p class="detail-text" style="font-size:0.85rem; line-height:1.7; margin-bottom:25px;">${p.desc || 'No detailed narrative available for this product.'}</p>
                                
                                <h4 class="detail-label" style="font-size:0.6rem; color:#999; margin-bottom:10px;">Product Tags</h4>
                                <div style="display:flex; flex-wrap:wrap; gap:8px;">
                                    ${(p.tags && Array.isArray(p.tags) && p.tags.length > 0) ? p.tags.map(t => `<span class="modern-tag" style="padding:4px 12px; font-size:0.7rem;">${t}</span>`).join('') : '<span style="color:#aaa; font-size:0.75rem;">Default Collection</span>'}
                                </div>
                            </div>
                        </div>
                        
                        <div class="pdp-tab-panel" id="tab-brand">
                            <div style="padding:40px 0; display:flex; flex-direction:column; align-items:center; text-align:center; gap:20px;">
                                <div class="brand-logo-frame" style="width:120px; height:120px; padding:20px; border-radius:50%;">
                                    <img src="${p.brand_logo || 'https://placehold.co/200x200?text=' + p.brand}" alt="${p.brand}" style="max-width:100%; object-fit:contain;">
                                </div>
                                <div>
                                    <h3 style="margin:0; font-size:1.4rem; font-weight:800; letter-spacing:-0.5px;">${p.brand}</h3>
                                    <p style="font-size:0.8rem; color:#888; margin-top:5px; text-transform:uppercase; letter-spacing:1px;">Official Collection</p>
                                    <a href="#/shop?brand=${p.brand.toLowerCase().replace(/ /g, '-')}" style="display:inline-block; margin-top:15px; color:#000; font-weight:800; text-transform:uppercase; font-size:0.65rem; letter-spacing:1px; text-decoration:none; border-bottom:1px solid #000; padding-bottom:2px;">View Brand Store</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <style>
                        .pdp-modern-tabs { background: #fff; width: 100%; }
                        .pdp-tabs-nav { display: flex; justify-content: flex-start; gap: 30px; border-bottom: 1px solid #f0f0f0; }
                        .pdp-tab-trigger { 
                            background: none; border: none; padding: 15px 0; font-family: inherit; font-size: 0.7rem; font-weight: 700; 
                            color: #999; cursor: pointer; position: relative; text-transform: uppercase; letter-spacing: 1px;
                            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                        }
                        .pdp-tab-trigger:hover { color: #555; }
                        .pdp-tab-trigger.active { color: #000; }
                        .pdp-tab-trigger.active::after { 
                            content: ''; position: absolute; bottom: -1px; left: 0; width: 100%; height: 2px; background: #000; 
                        }
                        .pdp-tab-panel { display: none; }
                        .pdp-tab-panel.active { display: block; animation: luxeFadeIn 0.6s ease both; }
                        .specs-clean-grid { margin-top: 10px; width:100%; }
                        .spec-row { display: flex; border-bottom: 1px solid #f8f8f8; }
                        .spec-cell { flex: 1; padding: 15px 0; display: flex; flex-direction: column; gap: 4px; }
                        .spec-cell:first-child { padding-right: 20px; border-right: 1px solid #f8f8f8; }
                        .spec-cell:last-child { padding-left: 20px; }
                        .spec-cell span { font-size: 0.65rem; color: #aaa; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
                        .spec-cell strong { font-size: 0.8rem; color: #111; font-weight: 600; }
                        .detail-text { color: #555; line-height: 1.6; font-size: 0.9rem; }
                        
                        /* VERTICAL KPI STYLING */
                        .pdp-trust-vertical { margin-top: 50px; padding: 40px 0; border-top: 1px solid #f0f0f0; text-align: center; }
                        .trust-grid-2x2 { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px; }
                        .trust-item-v { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; }
                        .trust-item-v i { width: 48px; height: 48px; background: #f9f9f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: #000; flex-shrink: 0; }
                        .trust-info-v h5 { margin: 0; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; line-height: 1.2; }
                        .trust-info-v span { font-size: 0.75rem; color: #888; margin-top: 6px; display: block; line-height: 1.3; }
                    </style>

                    <!-- TRUST KPI BADGES SECTION -->
                    <div class="pdp-trust-vertical">
                        <h4 style="font-size: 1.1rem; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 5px;">Why Blink Opticals ?</h4>
                        <div class="trust-grid-2x2">
                            <div class="trust-item-v">
                                <i class="fas fa-certificate"></i>
                                <div class="trust-info-v">
                                    <h5>Latest Collection</h5>
                                    <span>100% Authentic</span>
                                </div>
                            </div>
                            <div class="trust-item-v">
                                <i class="fas fa-shield-alt"></i>
                                <div class="trust-info-v">
                                    <h5>Authenticity</h5>
                                    <span>Guaranteed Quality</span>
                                </div>
                            </div>
                            <div class="trust-item-v">
                                <i class="fas fa-shipping-fast"></i>
                                <div class="trust-info-v">
                                    <h5>Shipping</h5>
                                    <span>Free Across India</span>
                                </div>
                            </div>
                            <div class="trust-item-v">
                                <i class="fas fa-tools"></i>
                                <div class="trust-info-v">
                                    <h5>Dedicated Service</h5>
                                    <span>Free Adjustments</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .modern-tag { padding: 8px 20px; border: 1px solid #eee; border-radius: 4px; font-size: 0.8rem; color: #666; font-weight: 600; transition: 0.3s; }
                .modern-tag:hover { background: #000; color: #fff; border-color: #000; }
                .brand-logo-frame { 
                    width: 200px; height: 200px; background: #fff; border: 1px solid #f0f0f0; border-radius: 0; 
                    display: flex; align-items: center; justify-content: center; padding: 40px; box-shadow: 0 10px 40px rgba(0,0,0,0.02);
                }
                .brand-logo-frame img { max-width: 100%; max-height: 100%; object-fit: contain; }
                @keyframes luxeFadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
            </style>

            <!-- SIMILAR PRODUCTS SECTION -->
            <div class="similar-products section reveal" style="margin-top:100px; padding-top:80px; border-top:1px solid #f0f0f0; padding-left:0; padding-right:0;">
                <div class="container" style="margin-bottom:40px;">
                    <span style="font-size:0.75rem; font-weight:800; color:var(--accent); text-transform:uppercase; letter-spacing:2px; margin-bottom:15px; display:block;">CURATED SELECTION</span>
                    <h2 style="font-size:2.8rem; letter-spacing:-2px; margin:0; font-weight:800;">Similarly Crafted</h2>
                </div>
                
                <div class="similar-carousel-wrapper">
                    <div class="similar-carousel-track">
                        ${(() => {
                            const sims = State.products.filter(x => x.id !== p.id && (x.category === p.category || x.brand === p.brand)).slice(0, 8);
                            // Double for infinite scroll effect
                            return [...sims, ...sims].map((sp, idx) => buildProductCard(sp, idx)).join('');
                        })()}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderCheckout(app) {
    if(State.cart.length === 0) { window.location.hash = '#/shop'; return; }
    if(!State.customerToken) { window.openAuthModal(); return; }

    const hasEyeglasses = State.cart.some(i => i.category === 'Eyeglasses');
    const p = State.customerProfile;

    app.innerHTML = `
        <div class="container section">
            <nav style="margin-bottom:30px; font-size:0.8rem; color:var(--text-sec); display:flex; align-items:center; gap:8px;">
                <a href="#/shop" style="color:inherit; text-decoration:none;"><i class="fas fa-arrow-left"></i> Back to Shopping</a>
            </nav>
            
            <div class="checkout-layout">
                <!-- LEFT: FORMS -->
                <div class="reveal">
                    <!-- 1. Shipping Address -->
                    <div class="checkout-section">
                        <h2 style="font-size:1.4rem; color:var(--text); margin-bottom:25px; display:flex; align-items:center;">
                            <i class="fas fa-truck" style="margin-right:15px; color:var(--accent);"></i> Shipping Details
                        </h2>
                        
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                            <div>
                                <label class="lux-label">FIRST NAME</label>
                                <input type="text" id="chk-first-name" class="lux-input" value="${p?.full_name?.split(' ')[0] || ''}">
                            </div>
                            <div>
                                <label class="lux-label">LAST NAME</label>
                                <input type="text" id="chk-last-name" class="lux-input" value="${p?.full_name?.split(' ')[1] || ''}">
                            </div>
                        </div>

                        <div style="margin-top:20px;">
                            <label class="lux-label">COMPLETE SHIPPING ADDRESS</label>
                            <textarea id="chk-address" class="lux-input" rows="2" placeholder="House No, Street name, Landmark..."></textarea>
                        </div>
                        
                        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:15px; margin-top:15px;">
                            <div>
                                <label class="lux-label">CITY</label>
                                <input type="text" id="chk-city" class="lux-input" placeholder="City">
                            </div>
                            <div>
                                <label class="lux-label">STATE</label>
                                <select id="chk-state" class="lux-input" style="padding:0 15px;">
                                    <option value="">Select State</option>
                                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                                    <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                                    <option value="Assam">Assam</option>
                                    <option value="Bihar">Bihar</option>
                                    <option value="Chhattisgarh">Chhattisgarh</option>
                                    <option value="Goa">Goa</option>
                                    <option value="Gujarat">Gujarat</option>
                                    <option value="Haryana">Haryana</option>
                                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                                    <option value="Jharkhand">Jharkhand</option>
                                    <option value="Karnataka">Karnataka</option>
                                    <option value="Kerala">Kerala</option>
                                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                                    <option value="Maharashtra">Maharashtra</option>
                                    <option value="Manipur">Manipur</option>
                                    <option value="Meghalaya">Meghalaya</option>
                                    <option value="Mizoram">Mizoram</option>
                                    <option value="Nagaland">Nagaland</option>
                                    <option value="Odisha">Odisha</option>
                                    <option value="Punjab">Punjab</option>
                                    <option value="Rajasthan">Rajasthan</option>
                                    <option value="Sikkim">Sikkim</option>
                                    <option value="Tamil Nadu">Tamil Nadu</option>
                                    <option value="Telangana">Telangana</option>
                                    <option value="Tripura">Tripura</option>
                                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                                    <option value="Uttarakhand">Uttarakhand</option>
                                    <option value="West Bengal">West Bengal</option>
                                    <option value="Delhi">Delhi</option>
                                    <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                                    <option value="Ladakh">Ladakh</option>
                                    <option value="Chandigarh">Chandigarh</option>
                                    <option value="Puducherry">Puducherry</option>
                                </select>
                            </div>
                            <div>
                                <label class="lux-label">PINCODE</label>
                                <input type="text" id="chk-pincode" class="lux-input" placeholder="6 Digits" maxlength="6">
                            </div>
                        </div>

                        <div style="margin-top:20px;">
                            <label class="lux-label">CONTACT MOBILE</label>
                            <input type="text" id="chk-mobile" class="lux-input" value="${p?.mobile || ''}">
                        </div>
                    </div>

                    <!-- 2. Billing Address -->
                    <div class="checkout-section" style="margin-top:20px;">
                        <h2 style="font-size:1.4rem; color:var(--text); margin-bottom:25px; display:flex; align-items:center;">
                            <i class="fas fa-file-invoice" style="margin-right:15px; color:var(--accent);"></i> Billing Information
                        </h2>
                        
                        <div class="billing-sync-wrap">
                            <input type="checkbox" id="billing-same" checked onchange="window.toggleBilling()">
                            <label for="billing-same">Same as Shipping Address</label>
                        </div>

                        <div id="billing-form-wrap" style="display:none; margin-top:25px;">
                            <div style="margin-top:20px;">
                                <label class="lux-label">COMPLETE BILLING ADDRESS</label>
                                <textarea id="chk-bill-address" class="lux-input" rows="2" placeholder="House No, Street name, Landmark..."></textarea>
                            </div>
                            
                            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:15px; margin-top:20px;">
                                <div>
                                    <label class="lux-label">CITY</label>
                                    <input type="text" id="chk-bill-city" class="lux-input" placeholder="City">
                                </div>
                                <div>
                                    <label class="lux-label">STATE</label>
                                    <select id="chk-bill-state" class="lux-input" style="padding:0 15px;">
                                        <option value="">Select State</option>
                                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                                        <option value="Gujarat" selected>Gujarat</option>
                                        <option value="Maharashtra">Maharashtra</option>
                                        <option value="Delhi">Delhi</option>
                                        <option value="Karnataka">Karnataka</option>
                                        <option value="Tamil Nadu">Tamil Nadu</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="lux-label">PINCODE</label>
                                    <input type="text" id="chk-bill-pincode" class="lux-input" placeholder="6 Digits" maxlength="6">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 3. Prescription -->
                    ${hasEyeglasses ? `
                    <div class="checkout-section">
                        <h3><i class="fas fa-glasses"></i> Prescription Details</h3>
                        <p style="font-size:0.9rem; color:#666; margin-bottom:20px;">Upload your vision details for precision crafting.</p>
                        <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px;">
                            <label class="address-toggle-btn" style="background:#fcfcfc; margin-bottom:0;"><input type="radio" name="rx-mode" value="upload" checked> <span style="margin-left:8px;">Upload File</span></label>
                            <label class="address-toggle-btn" style="background:#fcfcfc; margin-bottom:0;"><input type="radio" name="rx-mode" value="later"> <span style="margin-left:8px;">Share later via WhatsApp</span></label>
                        </div>
                        <div id="rx-file-zone">
                            <div style="border:2px dashed #eee; padding:30px; text-align:center; border-radius:15px; cursor:pointer;" onclick="document.getElementById('rx-file-input').click()">
                                <i class="fas fa-upload" style="font-size:1.5rem; color:#ccc; margin-bottom:10px;"></i>
                                <div id="rx-filename" style="font-size:0.8rem; font-weight:700; color:#888;">Select Image or PDF</div>
                                <input type="file" id="rx-file-input" style="display:none;" onchange="document.getElementById('rx-filename').innerText = this.files[0].name; this.parentElement.style.borderColor='var(--accent)'">
                            </div>
                        </div>
                    </div>` : ''}

                    <!-- 4. Payment -->
                    <div class="checkout-section">
                        <h3><i class="fas fa-shield-alt"></i> Payment Method</h3>
                        <div style="border:2px solid var(--primary); background:rgba(0,75,147,0.03); padding:20px; border-radius:15px; display:flex; align-items:center; gap:15px;">
                            <i class="fas fa-check-circle" style="color:var(--primary); font-size:1.4rem;"></i>
                            <div style="flex:1;">
                                <div style="font-weight:800; color:#111;">Razorpay Secure Checkout</div>
                                <div style="font-size:0.7rem; color:#999; text-transform:uppercase; letter-spacing:1px; margin-top:4px;">Cards, UPI, Netbanking, Wallets</div>
                            </div>
                            <img src="https://razorpay.com/assets/razorpay-glyph.svg" style="height:25px; opacity:0.8;">
                        </div>
                    </div>
                </div>

                <!-- RIGHT: SUMMARY -->
                <div class="reveal delay-1">
                    <div class="checkout-summary-card">
                        <h3 style="margin-top:0; margin-bottom:30px; font-weight:800;">Order Summary</h3>
                        
                        <div style="display:flex; flex-direction:column; gap:20px; margin-bottom:30px; padding-bottom:30px; border-bottom:1px solid #eee;">
                            ${State.cart.map(c => `
                                <div style="display:flex; gap:15px; align-items:center;">
                                    <div style="position:relative;">
                                        <img src="${c.image}" style="width:64px; height:64px; object-fit:cover; border-radius:12px; background:#f9f9f9; border:1px solid #eee;">
                                        <span style="position:absolute; top:-8px; right:-8px; background:#000; color:#fff; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:800;">${c.qty}</span>
                                    </div>
                                    <div style="flex:1;">
                                        <div style="font-weight:700; font-size:0.9rem; color:#111;">${c.name}</div>
                                        <div style="font-size:0.75rem; color:#999;">Unit: ${formatPrice(c.price)}</div>
                                    </div>
                                    <div style="font-weight:700; font-size:0.95rem;">${formatPrice(c.price * c.qty)}</div>
                                </div>
                            `).join('')}
                        </div>

                        <!-- Manual Coupon -->
                        <div class="input-block">
                            <label>Apply Promo Code</label>
                            <div class="promo-apply-box">
                                <input type="text" id="chk-coupon-input" placeholder="ENTER CODE">
                                <button class="promo-apply-btn" onclick="window.applyCouponManual()">Apply</button>
                            </div>
                            <div id="coupon-status-msg" style="margin-top:10px; font-size:0.75rem; font-weight:700;"></div>
                        </div>

                        <!-- Applied Coupon View -->
                        <div id="active-coupon-area" style="display:none;" class="coupon-active">
                             <div style="display:flex; align-items:center; gap:10px;">
                                <i class="fas fa-ticket-alt" style="color:#1e7e4e;"></i>
                                <span id="active-coupon-name"></span>
                             </div>
                             <i class="fas fa-times-circle coupon-remove" onclick="window.removeCoupon()"></i>
                        </div>

                        <div style="margin-top:30px;" id="checkout-summary-target">
                            <!-- Summary injected by JS -->
                        </div>

                        <button class="btn-lux" style="width:100%; height:64px; border-radius:16px; margin-top:30px; font-size:1.1rem; box-shadow:0 10px 40px rgba(0,0,0,0.15);" id="pay-btn" onclick="window.processCheckout()">Complete Secure Payment</button>
                        
                        <div style="margin-top:25px; display:flex; justify-content:center; gap:20px; opacity:0.5;">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" style="height:12px;">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" style="height:18px;">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" style="height:15px;">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Initial Summary Build
    window.updateCheckoutSummary();
}

window.updateCheckoutSummary = function() {
    const gstRules = State.businessSettings?.gst_settings || { gst_rate: 18, cgst: 9, sgst: 9 };
    const general = State.businessSettings?.general_settings || { tax_type: 'inclusive' };
    
    // Economics
    const totalMRP = State.cart.reduce((sum, item) => sum + ((item.original_price || item.mrp || item.price) * item.qty), 0);
    const subtotal = State.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const autoSavings = totalMRP - subtotal;
    
    let couponDiscount = 0;
    const coupon = State.checkoutState.appliedCoupon;
    if (coupon) {
        if (coupon.discount_type === 'Percentage') couponDiscount = Math.round((subtotal * coupon.discount_value) / 100);
        else couponDiscount = coupon.discount_value;
    }
    
    const finalTotal = subtotal - couponDiscount;
    
    // Tax Calculation (Inclusive logic: GST is part of the discounted price)
    const gstRate = gstRules.gst_rate || 18;
    const netPayable = totalMRP - autoSavings - couponDiscount;
    const totalTax = Math.round(netPayable - (netPayable / (1 + (gstRate / 100))));
    const cgst = Math.round(totalTax / 2);
    const sgst = cgst; // Ensure they are always identical
    const taxableValue = netPayable - (cgst + sgst);

    const payBtn = document.getElementById('pay-btn');
    const activeArea = document.getElementById('active-coupon-area');
    const activeName = document.getElementById('active-coupon-name');

    if (payBtn) payBtn.innerText = `Complete Payment of ${formatPrice(netPayable)}`;
    
    // Unique Offer Names from Cart
    const offerNames = [...new Set(State.cart.filter(i => i.offer_name).map(i => i.offer_name))];
    let offerLabel = 'Auto Applied Discounts';
    if (offerNames.length > 0) offerLabel = `Offer (${offerNames.join(', ')})`;
    else if (autoSavings > 0) offerLabel = 'Promotional Savings';

    // Advanced Price Breakup HTML
    let summaryHtml = `
        <div class="summary-row" style="margin-bottom:20px;">
            <span style="font-weight:700; color:#111;">Detailed Price Breakup</span>
        </div>
        <div class="summary-row">
            <span>Items Total (MRP)</span>
            <span>${formatPrice(totalMRP)}</span>
        </div>
        <div class="summary-row" style="color:#1e7e4e; font-size:0.85rem;">
            <span>${offerLabel}</span>
            <span>-${formatPrice(autoSavings)}</span>
        </div>
    `;
    
    if (couponDiscount > 0) {
        summaryHtml += `<div class="summary-row" style="color:#1e7e4e; font-size:0.85rem;"><span>Coupon (${coupon.code})</span><span>-${formatPrice(couponDiscount)}</span></div>`;
        if (activeArea) {
            activeArea.style.display = 'flex';
            activeName.innerText = coupon.code;
        }
    } else {
        if (activeArea) activeArea.style.display = 'none';
    }

    summaryHtml += `
        <div class="summary-row" style="border-top:1px solid #eee; margin-top:10px; padding-top:10px; color:#666;">
            <span>Taxable Value (Net)</span>
            <span>${formatPrice(taxableValue)}</span>
        </div>
        <div class="summary-row" style="font-size:0.85rem; color:#888;">
            <span>CGST (${gstRate/2}%) <small>Included</small></span>
            <span>${formatPrice(cgst)}</span>
        </div>
        <div class="summary-row" style="font-size:0.85rem; color:#888;">
            <span>SGST (${gstRate/2}%) <small>Included</small></span>
            <span>${formatPrice(sgst)}</span>
        </div>
    `;

    summaryHtml += `<div class="summary-row" style="color:var(--accent); font-weight:700; margin-top:10px;"><span>Shipping</span><span>FREE</span></div>`;
    summaryHtml += `<div class="summary-row total" style="border-top:2px solid #000; padding-top:20px; margin-top:15px;"><span>Net Payable</span><span>${formatPrice(netPayable)}</span></div>`;
    summaryHtml += `<div style="text-align:right; font-size:0.7rem; color:#999; margin-top:5px;">(Inclusive of all taxes)</div>`;
    
    const target = document.getElementById('checkout-summary-target');
    if (target) target.innerHTML = summaryHtml;
};

window.applyCouponManual = function() {
    const input = document.getElementById('chk-coupon-input');
    const msg = document.getElementById('coupon-status-msg');
    const code = input.value.trim().toUpperCase();
    
    if(!code) return;
    
    const subtotal = State.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const valid = State.coupons.find(c => c.code === code);
    
    if (valid) {
        if (valid.min_order_value && subtotal < valid.min_order_value) {
            msg.style.color = 'red';
            msg.innerText = `Minimum order ${formatPrice(valid.min_order_value)} required.`;
            return;
        }
        State.checkoutState.appliedCoupon = valid;
        msg.style.color = '#1e7e4e';
        msg.innerText = 'PROMO APPLIED!';
        input.value = '';
        window.updateCheckoutSummary();
    } else {
        msg.style.color = 'red';
        msg.innerText = 'Invalid or expired coupon.';
    }
};

window.removeCoupon = function() {
    State.checkoutState.appliedCoupon = null;
    window.updateCheckoutSummary();
    document.getElementById('coupon-status-msg').innerText = '';
};

window.copyShippingToBilling = function() {
    const icon = document.getElementById('billing-sync-icon');
    const isSame = icon.classList.contains('fa-check-square');
    
    if (isSame) {
        icon.classList.remove('fa-check-square', 'fas');
        icon.classList.add('fa-square', 'far');
        document.getElementById('billing-address-container').style.opacity = '1';
        document.getElementById('billing-address-container').style.pointerEvents = 'all';
    } else {
        icon.classList.add('fa-check-square', 'fas');
        icon.classList.remove('fa-square', 'far');
        document.getElementById('billing-address-container').style.opacity = '0.3';
        document.getElementById('billing-address-container').style.pointerEvents = 'none';
        document.getElementById('chk-billing-address').value = document.getElementById('chk-address').value;
    }
};

// ─── ACCOUNT UI ───
async function renderAccount(app) {
    if (!State.customerToken) {
        // Redundant if called as a page, but for safety:
        window.openAuthModal();
        return;
    } else {
        // Fetch fresh orders
        let orders = [];
        try {
            const res = await fetch('/api/store-account/orders', {
                headers: { 'Authorization': 'Bearer ' + State.customerToken }
            });
            const data = await res.json();
            if(data.success) orders = data.data;
        } catch(e) {}

        const p = State.customerProfile || { full_name: 'Customer' };
        app.innerHTML = `
            <div class="container section">
                <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:40px; border-bottom:1px solid var(--border); padding-bottom:20px;" class="reveal">
                    <div>
                        <h1 style="margin:0; font-size:2.5rem; letter-spacing:-1px;">Welcome, ${p.full_name}</h1>
                        <p style="color:var(--text-sec); margin:5px 0 0;">Manage your orders, profile, and active prescriptions.</p>
                    </div>
                    <button class="btn-lux btn-outline" style="padding:10px 20px; font-size:0.8rem;" onclick="window.logoutAccount()">Sign Out</button>
                </div>
                
                <div class="pdp-layout" style="gap:40px; margin-top:20px;">
                    <aside style="width:250px;" class="reveal delay-1">
                        <div style="display:flex; flex-direction:column; gap:10px;">
                            <button class="btn-lux" style="justify-content:flex-start; text-align:left; width:100%;">Dashboard</button>
                            <button class="btn-lux btn-outline" style="justify-content:flex-start; text-align:left; border:none; box-shadow:none; width:100%;">Orders</button>
                            <button class="btn-lux btn-outline" style="justify-content:flex-start; text-align:left; border:none; box-shadow:none; width:100%;">Addresses</button>
                            <button class="btn-lux btn-outline" style="justify-content:flex-start; text-align:left; border:none; box-shadow:none; width:100%;">Prescription</button>
                            <button class="btn-lux btn-outline" style="justify-content:flex-start; text-align:left; border:none; box-shadow:none; width:100%;">Loyalty</button>
                        </div>
                    </aside>
                    
                    <main class="reveal delay-2">
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:40px;">
                            <div style="background:var(--surface); padding:25px; border-radius:15px; text-align:center;">
                                <div style="font-size:2rem; font-weight:800;">${orders.length}</div>
                                <div style="color:var(--text-sec); font-size:0.9rem;">Active Orders</div>
                            </div>
                            <div style="background:var(--surface); padding:25px; border-radius:15px; text-align:center;">
                                <div style="font-size:2rem; font-weight:800; color:var(--accent);">450</div>
                                <div style="color:var(--text-sec); font-size:0.9rem;">Loyalty Points</div>
                            </div>
                        </div>

                        <h3 style="margin-top:0">Recent Orders</h3>
                        <div style="border:1px solid var(--border); border-radius:15px; padding:30px; text-align:center; color:var(--text-sec);">
                            ${orders.length === 0 ? `
                                You haven't placed any orders yet.
                                <br><br>
                                <a href="#/shop" class="btn-lux" style="font-size:0.8rem; padding:10px 20px;">Start Shopping</a>
                            ` : `
                                <div style="display:flex; flex-direction:column; gap:15px;">
                                    ${orders.map(o => `
                                        <div style="display:flex; justify-content:space-between; padding:15px; background:var(--surface); border-radius:10px; align-items:center;">
                                            <div>
                                                <div style="font-weight:700; color:var(--text); text-align:left;">#${o.order_id}</div>
                                                <div style="font-size:0.8rem;">${new Date(o.order_date).toLocaleDateString()}</div>
                                            </div>
                                            <div style="font-weight:700; color:var(--primary);">${formatPrice(o.total_amount)}</div>
                                            <div style="padding:5px 15px; background:rgba(0,0,0,0.05); border-radius:50px; font-size:0.8rem;">${o.status.toUpperCase()}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            `}
                        </div>
                    </main>
                </div>
            </div>
        `;
    }
}

// ─── AUTHENTICATION LOGIC ───
window.handleUserIconClick = function() {
    if(State.customerToken) window.location.hash = '#/account';
    else window.openAuthModal();
};

window.openAuthModal = function() {
    const container = document.getElementById('auth-modal-content');
    container.innerHTML = `
        <div class="auth-container">
            <div class="auth-side">
                <img src="/img/auth_banner.png" alt="Boutique Interior">
            </div>
            <div class="auth-form-side">
                <div style="text-align:center; margin-bottom:30px;">
                    <img src="/admin/img/logo.png" alt="Blink Opticals" style="height:45px; width:auto; filter:brightness(1);">
                </div>
                
                <div class="auth-tabs">
                    <div class="auth-tab active" id="tab-login" onclick="window.switchAuthTab('login')">Login</div>
                    <div class="auth-tab" id="tab-signup" onclick="window.switchAuthTab('signup')">Sign Up</div>
                </div>

                <!-- LOGIN FORM -->
                <div id="auth-login-zone">
                    <div class="auth-input-group">
                        <div class="auth-icon-box"><i class="fas fa-at"></i></div>
                        <input type="email" id="login-email" placeholder="Email Address">
                    </div>
                    <div class="auth-input-group">
                        <div class="auth-icon-box"><i class="fas fa-key"></i></div>
                        <input type="password" id="login-pass" placeholder="Password">
                    </div>
                    <div class="auth-check-group" style="justify-content:space-between;">
                        <label style="display:flex; align-items:center; gap:8px;"><input type="checkbox"> Remember me</label>
                        <a href="javascript:void(0)" style="color:var(--hover); text-decoration:none;">Forgot Password?</a>
                    </div>
                    <button class="btn-lux" style="width:100%; margin-top:20px;" onclick="window.handleAuth('login')">Login In</button>
                </div>

                <!-- SIGNUP FORM -->
                <div id="auth-signup-zone" style="display:none;">
                    <div class="auth-input-group">
                        <div class="auth-icon-box"><i class="fas fa-at"></i></div>
                        <input type="email" id="signup-email" placeholder="Email Address">
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:5px;">
                        <div class="auth-input-group">
                            <div class="auth-icon-box"><i class="fas fa-user"></i></div>
                            <input type="text" id="signup-first" placeholder="First Name">
                        </div>
                        <div class="auth-input-group">
                            <div class="auth-icon-box"><i class="fas fa-user"></i></div>
                            <input type="text" id="signup-last" placeholder="Last Name">
                        </div>
                    </div>
                    <div class="auth-input-group">
                        <div class="auth-icon-box"><i class="fas fa-key"></i></div>
                        <input type="password" id="signup-pass" placeholder="Password">
                    </div>
                    <div class="auth-input-group">
                        <div class="auth-icon-box"><i class="fas fa-key"></i></div>
                        <input type="password" id="signup-confirm" placeholder="Confirm Password">
                    </div>
                    
                    <label class="auth-check-group"><input type="checkbox" checked> Subscribe to our newsletter</label>
                    <label class="auth-check-group"><input type="checkbox" checked> I accept the Terms of Service and Privacy Policy</label>
                    
                    <button class="btn-lux" style="width:100%; margin-top:20px;" onclick="window.handleAuth('signup')">Sign Up</button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('auth-overlay').classList.add('active');
    document.getElementById('auth-modal-popup').classList.add('active');
    document.getElementById('store-app').classList.add('blur-background');
    document.querySelector('.store-nav').classList.add('blur-background');
};

window.closeAuthModal = function() {
    document.getElementById('auth-overlay').classList.remove('active');
    document.getElementById('auth-modal-popup').classList.remove('active');
    document.getElementById('store-app').classList.remove('blur-background');
    document.querySelector('.store-nav').classList.remove('blur-background');
};

window.switchAuthTab = function(type) {
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + type).classList.add('active');
    
    document.getElementById('auth-login-zone').style.display = type === 'login' ? 'block' : 'none';
    document.getElementById('auth-signup-zone').style.display = type === 'signup' ? 'block' : 'none';
};

window.handleAuth = async function(mode) {
    const email = document.getElementById(mode + '-email').value;
    const pass = document.getElementById(mode + '-pass').value;
    
    if(!email || !pass) return alert("Please fill all fields.");

    // Simple Dev Mock Login/Signup
    // In production, this would call the /api/auth routes
    State.customerToken = 'auth_' + Math.random().toString(36).substr(2);
    State.customerProfile = { 
        full_name: mode === 'signup' ? document.getElementById('signup-first').value + ' ' + document.getElementById('signup-last').value : 'Luxury Patron',
        email: email
    };
    
    localStorage.setItem('customerToken', State.customerToken);
    localStorage.setItem('customerProfile', JSON.stringify(State.customerProfile));
    
    window.closeAuthModal();
    
    // If we were in checkout, re-trigger checkout logic
    if(window.location.hash === '#/checkout') {
        renderCheckout(document.getElementById('store-app'));
    } else {
        window.location.hash = '#/account';
        router();
    }
};

window.logoutAccount = function() {
    State.customerToken = null;
    State.customerProfile = null;
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerProfile');
    router();
};

// ─── WISHLIST LOGIC ───
async function fetchWishlist() {
    try {
        const res = await fetch('/api/store-account/wishlist', {
            headers: { 'Authorization': 'Bearer ' + State.customerToken }
        });
        const data = await res.json();
        if(data.success) State.wishlist = data.data;
    } catch(e) {}
}

window.toggleWishlist = async function(id) {
    if(!State.customerToken) {
        alert("Please login to save products to your wishlist.");
        window.location.hash = '#/account';
        return;
    }
    
    // Optimistic UI Update
    let adding = !State.wishlist.includes(id);
    if(adding) {
        State.wishlist.push(id);
    } else {
        State.wishlist = State.wishlist.filter(x => x !== id);
    }
    
    // Update PLP Grid Icons
    const gridBtn = document.getElementById('wish-btn-' + id);
    if(gridBtn) {
        if(adding) { gridBtn.classList.add('active'); gridBtn.innerHTML = '<i class="fas fa-heart"></i>'; gridBtn.style.color = 'var(--accent)'; }
        else { gridBtn.classList.remove('active'); gridBtn.innerHTML = '<i class="far fa-heart"></i>'; gridBtn.style.color = '#aaa'; }
    }
    
    // Update PDP Buttons
    const pdpBtn = document.getElementById('pdp-wish-btn-' + id);
    if(pdpBtn) {
        pdpBtn.innerHTML = `<i class="${adding ? 'fas' : 'far'} fa-heart" style="color:${adding ? 'var(--accent)' : 'inherit'}"></i>`;
    }
    
    // Re-render target hash if in wishlist view
    if(window.location.hash === '#/wishlist') renderWishlist(document.getElementById('store-app'));
    
    // Perform Backend Sync
    await fetch('/api/store-account/wishlist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + State.customerToken },
        body: JSON.stringify({ product_id: id })
    });
};

function renderWishlist(app) {
    if(!State.customerToken) {
        window.location.hash = '#/account';
        return;
    }
    
    const wProducts = State.products.filter(p => State.wishlist.includes(p.id));
    
    app.innerHTML = `
        <div class="container section">
            <h1 style="text-align:center; font-size:2.5rem; letter-spacing:-1px; margin-bottom:10px;" class="reveal">My Wishlist</h1>
            <p style="text-align:center; color:var(--text-sec); margin-bottom:60px;" class="reveal delay-1">${wProducts.length} items saved</p>
            
            ${wProducts.length === 0 ? `
                <div style="text-align:center; color:var(--text-sec); padding:40px; background:var(--surface); border-radius:20px;" class="reveal delay-2">
                    <div style="font-size:3rem; margin-bottom:20px; color:#ddd;"><i class="far fa-heart"></i></div>
                    Your wishlist is elegantly empty.<br><br>
                    <a href="#/shop" class="btn-lux" style="font-size:0.8rem; padding:10px 20px;">Discover Collection</a>
                </div>
            ` : `
                <div class="product-grid reveal delay-2">
                    ${wProducts.map((p, i) => buildProductCard(p, i)).join('')}
                </div>
            `}
        </div>
    `;
}

// ─── CART LOGIC ───
function buildProductCard(p, index) {
    const delayS = (index % 8) * 0.1;
    const isInWishlist = State.wishlist.includes(p.id);
    const wishIcon = isInWishlist ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
    
    // Robust Price Parsing
    const mrpVal = parseFloat(p.mrp || 0);
    const basePrc = parseFloat(p.price || 0);
    
    // Apply Marketing Offer if exists
    let finalPrc = basePrc;
    let promoLabel = null;
    
    if (p.offer_discount) {
        const disc = parseFloat(p.offer_discount);
        const oType = (p.offer_type || '').toLowerCase();
        
        if (oType.includes('percentage')) {
            finalPrc = basePrc - (basePrc * (disc / 100));
        } else if (oType.includes('flat')) {
            finalPrc = basePrc - disc;
        }
        promoLabel = p.offer_name || 'SPECIAL OFFER';
    }

    // Calculate Discount Percent (for display)
    let displayMrp = mrpVal > basePrc ? mrpVal : (finalPrc < basePrc ? basePrc : mrpVal);
    let discountPercent = 0;
    if (displayMrp > finalPrc) {
        discountPercent = Math.round(((displayMrp - finalPrc) / displayMrp) * 100);
    }
    
    // Determine Labels from Tags or Discount
    let labelHtml = '';
    const tags = Array.isArray(p.tags) ? p.tags : (typeof p.tags === 'string' ? p.tags.split(',') : []);
    
    if (promoLabel) {
        labelHtml = `<div class="product-label sale"><i class="fas fa-tag"></i> ${promoLabel}</div>`;
    } else if (discountPercent > 0) {
        labelHtml = `<div class="product-label sale"><i class="fas fa-bolt"></i> SALE ${discountPercent}% OFF</div>`;
    } else if (tags.some(t => t.toLowerCase().includes('new'))) {
        labelHtml = `<div class="product-label new">NEW ARRIVAL</div>`;
    } else if (tags.some(t => t.toLowerCase().includes('trending') || t.toLowerCase().includes('best'))) {
        labelHtml = `<div class="product-label hot"><i class="fas fa-fire"></i> BEST SELLER</div>`;
    }

    // Determine secondary image for hover flip
    let image2 = null;
    if (p.additional_images) {
        try {
            const gallery = typeof p.additional_images === 'string' ? JSON.parse(p.additional_images) : p.additional_images;
            if (Array.isArray(gallery) && gallery.length > 0) image2 = gallery[0];
        } catch(e) {}
    }
    
    return `
        <div class="product-card reveal" onclick="window.location.hash='#/product/${p.id}'" style="animation-delay: ${delayS}s">
            ${labelHtml}
            
            <div class="product-card-actions-top">
                <button id="wish-btn-${p.id}" class="card-action-btn ${isInWishlist ? 'active' : ''}" onclick="event.stopPropagation(); window.toggleWishlist('${p.id}')" title="Add to Wishlist">
                    ${wishIcon}
                </button>
                <button class="card-action-btn" onclick="event.stopPropagation(); window.toggleCompare('${p.id}')" title="Compare Product">
                    <i class="fas fa-exchange-alt"></i>
                </button>
            </div>
            
            <div class="product-img-wrapper ${image2 ? 'has-secondary' : ''}">
                <img src="${p.image}" class="product-img product-img-primary" loading="lazy" alt="${p.name}">
                ${image2 ? `<img src="${image2}" class="product-img product-img-secondary" loading="lazy" alt="${p.name} alternate">` : ''}
                
                <div class="product-offer-badge">
                    <i class="fas fa-tag"></i> Coupons Available
                </div>

                <button class="vto-corner-btn" onclick="event.stopPropagation(); window.startVTO('${p.image}')" title="Virtual Try-On">
                    <i class="fas fa-camera"></i>
                </button>
                
                <div class="product-hover-actions">
                    <button class="quick-btn quick-btn-cart" onclick="event.stopPropagation(); window.addToCart('${p.id}')">Add to Cart</button>
                    <button class="quick-btn quick-btn-buy" onclick="event.stopPropagation(); window.addToCart('${p.id}'); window.location.hash='#/checkout';">Buy Now</button>
                </div>
            </div>
            
            <div class="product-info">
                <h3 class="product-name">${p.name}</h3>
                <div class="product-price-row">
                    <div class="price-stack">
                        ${displayMrp > finalPrc ? `<span class="price-tag-label">${promoLabel ? 'Offer Price' : 'Special Price'}</span>` : ''}
                        <div class="product-price">${formatPrice(finalPrc)}</div>
                    </div>
                    ${displayMrp > finalPrc ? `
                        <div class="price-stack">
                            <span class="price-tag-label">Regular Price</span>
                            <div class="product-mrp">${formatPrice(displayMrp)}</div>
                        </div>
                        <div class="product-savings-badge">${discountPercent}% OFF</div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

window.toggleCompare = function(id) {
    alert("Product added to comparison list.");
};


window.addToCart = function(id) {
    const p = State.products.find(x => x.id === id);
    if(!p) return;
    
    // Calculate actual price with current offer
    const basePrc = parseFloat(p.price || 0);
    let finalPrc = basePrc;
    if (p.offer_discount) {
        const disc = parseFloat(p.offer_discount);
        const oType = (p.offer_type || '').toLowerCase();
        if (oType.includes('percentage')) finalPrc = basePrc - (basePrc * (disc / 100));
        else if (oType.includes('flat')) finalPrc = basePrc - disc;
    }
    const roundedPrice = Math.round(finalPrc);
    const actualMrp = parseFloat(p.mrp || p.price || 0);
    
    const itemToStore = { 
        ...p, 
        price: roundedPrice, 
        original_price: actualMrp,
        qty: 1 
    };
    
    const existing = State.cart.find(x => x.id === id);
    if(existing) {
        // Sync all latest product properties
        Object.assign(existing, p);
        existing.qty += 1;
        existing.price = roundedPrice;
        existing.original_price = actualMrp;
    } else {
        State.cart.push(itemToStore);
    }
    
    saveCart();
    updateCartCount();
    openCartSidebar();
};

window.buyNow = function(id) {
    const p = State.products.find(x => x.id === id);
    if(!p) return;
    
    // Calculate actual price with current offer
    const basePrc = parseFloat(p.price || 0);
    let finalPrc = basePrc;
    if (p.offer_discount) {
        const disc = parseFloat(p.offer_discount);
        const oType = (p.offer_type || '').toLowerCase();
        if (oType.includes('percentage')) finalPrc = basePrc - (basePrc * (disc / 100));
        else if (oType.includes('flat')) finalPrc = basePrc - disc;
    }
    const roundedPrice = Math.round(finalPrc);
    const actualMrp = parseFloat(p.mrp || p.price || 0);
    
    const existing = State.cart.find(x => x.id === id);
    if(!existing) {
        State.cart.push({
            ...p, 
            price: roundedPrice, 
            original_price: actualMrp,
            qty: 1
        });
    } else {
        Object.assign(existing, p);
        existing.qty = 1;
        existing.price = roundedPrice;
        existing.original_price = actualMrp;
    }
    
    saveCart();
    updateCartCount();
    window.location.hash = '#/checkout';
};

window.shareProduct = function(platform, id) {
    const p = State.products.find(x => x.id === id);
    if(!p) return;
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this ${p.name} at BlinkOpticals!`);
    
    let shareUrl = '';
    switch(platform) {
        case 'whatsapp': shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`; break;
        case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
        case 'instagram': 
            navigator.clipboard.writeText(window.location.href);
            alert("Product link copied! Ready to share on Instagram.");
            return;
    }
    if(shareUrl) window.open(shareUrl, '_blank');
};

window.removeFromCart = function(id) {
    State.cart = State.cart.filter(x => x.id !== id);
    saveCart();
    renderCartSidebar();
    updateCartCount();
};

window.updateQty = function(id, delta) {
    const item = State.cart.find(x => x.id === id);
    if(item) {
        item.qty += delta;
        if(item.qty <= 0) window.removeFromCart(id);
        else {
            saveCart();
            renderCartSidebar();
        }
    }
};

function saveCart() { localStorage.setItem('cart', JSON.stringify(State.cart)); }
function updateCartCount() {
    const count = State.cart.reduce((sum, item) => sum + item.qty, 0);
    const badge = document.getElementById('cart-badge');
    if(badge) {
        badge.innerText = count;
        badge.style.display = count > 0 ? 'block' : 'none';
        badge.style.animation = 'none';
        setTimeout(() => badge.style.animation = 'fadeUp 0.3s', 10);
    }
}

// ─── UI INTERACTIONS ───
window.openCartSidebar = function() {
    document.getElementById('cart-overlay').classList.add('active');
    document.getElementById('cart-sidebar').classList.add('active');
    renderCartSidebar();
};
window.closeCartSidebar = function() {
    document.getElementById('cart-overlay').classList.remove('active');
    document.getElementById('cart-sidebar').classList.remove('active');
};

window.toggleMobileMenu = function() {
    document.getElementById('mobile-menu-overlay').classList.toggle('active');
    document.getElementById('mobile-menu-drawer').classList.toggle('active');
};

function renderCartSidebar() {
    const itemsContainer = document.getElementById('cart-items-container');
    const totalContainer = document.getElementById('cart-total-container');
    
    if(State.cart.length === 0) {
        itemsContainer.innerHTML = `<div style="text-align:center; padding:50px 20px; color:var(--text-sec);">Your cart is elegantly empty.</div>`;
        totalContainer.innerHTML = '';
        return;
    }
    
    let total = 0;
    itemsContainer.innerHTML = State.cart.map(c => {
        total += c.price * c.qty;
        return `
            <div class="cart-item">
                <img src="${c.image}">
                <div class="cart-item-info">
                    <div class="cart-item-title">${c.name}</div>
                    <div class="cart-item-price">${formatPrice(c.price)}</div>
                    <div class="cart-controls">
                        <button onclick="updateQty('${c.id}', -1)">-</button>
                        <span style="font-size:0.9rem; font-weight:600;">${c.qty}</span>
                        <button onclick="updateQty('${c.id}', 1)">+</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    totalContainer.innerHTML = `
        <div class="cart-total"><span>Subtotal</span><span>${formatPrice(total)}</span></div>
        <button class="btn-lux" style="width:100%; border-radius:12px;" onclick="closeCartSidebar(); window.location.hash='#/checkout';">Proceed to Checkout</button>
    `;
}

window.toggleBilling = function() {
    const checked = document.getElementById('billing-same').checked;
    const wrap = document.getElementById('billing-form-wrap');
    if(wrap) wrap.style.display = checked ? 'none' : 'block';
};

window.processCheckout = async function() {
    // 1. Collect Shipping
    const addr = document.getElementById('chk-address').value.trim();
    const city = document.getElementById('chk-city').value.trim();
    const state = document.getElementById('chk-state').value;
    const pin = document.getElementById('chk-pincode').value.trim();
    const mobile = document.getElementById('chk-mobile').value.trim();
    
    if(!addr || !city || !state || !pin || !mobile) {
        return alert('Please complete all shipping details (Address, City, State, Pincode).');
    }
    
    // 2. Collect Billing
    const isSame = document.getElementById('billing-same').checked;
    let bAddr = addr, bCity = city, bState = state, bPin = pin;
    
    if(!isSame) {
        bAddr = document.getElementById('chk-bill-address').value.trim();
        bCity = document.getElementById('chk-bill-city').value.trim();
        bState = document.getElementById('chk-bill-state').value;
        bPin = document.getElementById('chk-bill-pincode').value.trim();
        if(!bAddr || !bCity || !bState || !bPin) {
            return alert('Please complete all billing address fields.');
        }
    }
    
    const fullShipping = `${addr}, ${city}, ${state} - ${pin}`;
    const fullBilling = `${bAddr}, ${bCity}, ${bState} - ${bPin}`;

    const payBtn = document.getElementById('pay-btn');
    
    // Economics
    const subtotal = State.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const coupon = State.checkoutState.appliedCoupon;
    let discount = 0;
    if (coupon) {
        if (coupon.discount_type === 'Percentage') discount = Math.round((subtotal * coupon.discount_value) / 100);
        else discount = coupon.discount_value;
    }
    const finalTotal = subtotal - discount;

    payBtn.disabled = true;
    payBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Securely...';
    
    try {
        // 1. Create Order in Backend
        const res = await fetch('/api/store-account/orders/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + State.customerToken },
            body: JSON.stringify({
                cart: State.cart,
                address: fullShipping,
                billingAddress: fullBilling,
                mobile,
                coupon_code: coupon ? coupon.code : null,
                discount_amount: discount,
                total_amount: finalTotal,
                prescription: { mode: document.querySelector('input[name="rx-mode"]:checked')?.value || 'none' }
            })
        });
        const orderData = await res.json();
        
        if(!orderData.success) throw new Error(orderData.error);

        // 2. Razorpay Implementation
        const options = {
            "key": "rzp_test_placeholder", 
            "amount": finalTotal * 100,
            "currency": "INR",
            "name": "Blink Opticals",
            "description": "Premium Vision Products Checkout",
            "handler": async function (response) {
                await fetch('/api/store-account/orders/verify-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + State.customerToken },
                    body: JSON.stringify({ order_id: orderData.order_id, payment_id: response.razorpay_payment_id })
                });
                renderSuccessScreen();
            },
            "prefill": {
                "name": State.customerProfile?.full_name,
                "contact": mobile
            },
            "theme": { "color": "#000000" } 
        };
        
        const rzp = new Razorpay(options);
        rzp.open();
        
        payBtn.disabled = false;
        payBtn.innerText = 'Complete Secure Payment';

    } catch(e) {
        alert("Checkout Error: " + e.message);
        payBtn.disabled = false;
        payBtn.innerText = 'Retry Payment';
    }
};

function renderSuccessScreen() {
    const app = document.getElementById('store-app');
    State.cart = [];
    saveCart();
    updateCartCount();
    
    app.innerHTML = `
        <div class="container section text-center" style="min-height:75vh; display:flex; flex-direction:column; align-items:center; justify-content:center;">
            <div id="lottie-success" style="width:200px; height:200px;"></div>
            <h1 class="reveal" style="font-size:3rem; letter-spacing:-2px; margin-top:20px;">Excellence Delivered.</h1>
            <p class="reveal delay-1" style="color:var(--text-sec); margin-bottom:40px; font-size:1.1rem; max-width:500px;">Your premium order has been confirmed. A receipt and WhatsApp tracking link have been dispatched to your mobile.</p>
            <div class="reveal delay-2" style="display:flex; gap:20px;">
                <a href="#/shop" class="btn-lux">Continue Discovery</a>
                <a href="#/account" class="btn-lux btn-outline">Track Your Order</a>
            </div>
        </div>
    `;
    
    // Load Lottie
    if(window.lottie) {
        lottie.loadAnimation({
            container: document.getElementById('lottie-success'),
            renderer: 'svg',
            loop: false,
            autoplay: true,
            path: 'https://assets5.lottiefiles.com/packages/lf20_ebv8nkhp.json'
        });
    }
}

// ─── UTILS ───
function observeReveals() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                entry.target.style.opacity = '1';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.reveal').forEach(el => {
        el.style.animationPlayState = 'paused';
        observer.observe(el);
    });
}

function initCookieBanner() {
    if(!State.cookiesAccepted) {
        document.getElementById('cookie-banner').classList.add('show');
    }
}
window.acceptCookies = function() {
    localStorage.setItem('cookiesAccepted', 'true');
    State.cookiesAccepted = true;
    document.getElementById('cookie-banner').classList.remove('show');
};

window.switchPDPTab = function(evt, tabId) {
    const contents = document.querySelectorAll('.pdp-tab-panel');
    contents.forEach(c => c.classList.remove('active'));
    const buttons = document.querySelectorAll('.pdp-tab-trigger');
    buttons.forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    evt.currentTarget.classList.add('active');
};

window.openLightbox = function(url) {
    const lightbox = document.getElementById('pdp-lightbox');
    const img = document.getElementById('lightbox-img');
    img.src = url;
    img.classList.remove('zoomed');
    lightbox.classList.add('show');
    document.body.style.overflow = 'hidden';
};

window.closeLightbox = function(evt) {
    const lightbox = document.getElementById('pdp-lightbox');
    lightbox.classList.remove('show');
    document.body.style.overflow = 'auto';
};

window.toggleZoom = function(evt) {
    evt.target.classList.toggle('zoomed');
};
/* ── HERO CAROUSEL ── */
function renderHeroCarousel(slides, speed, effect) {
    if (!slides || slides.length === 0) return '';
    
    setTimeout(() => initHeroCarouselAutoPlay(speed), 500);
    // Single slide - Keep it clean
    if (slides.length === 1) {
        const s = slides[0];
        const overlay = s.overlay_color || '#000000';
        const alignFlex = s.align === 'center' ? 'center' : s.align === 'right' ? 'flex-end' : 'flex-start';
        return `
        <div class="hero reveal" style="background: linear-gradient(to ${s.align==='right'?'left':'right'}, ${overlay}cc 0%, ${overlay}33 100%), url('${s.image || ''}') center/cover; position:relative; min-height:85vh; padding: 80px 4%; display:flex; align-items:center; justify-content:${alignFlex};">
            <div class="hero-content" style="max-width:800px; color:${s.text_color || '#fff'}; text-align:${s.align};">
                ${s.title ? `<h1 style="font-size: clamp(3rem, 10vw, 5.5rem); letter-spacing:-3px; margin:0 0 25px 0; font-weight:800; line-height:0.95; font-family:var(--font-alt); color:${s.text_color || '#fff'}; margin-left:${s.align==='left'?'0':'auto'}; margin-right:${s.align==='right'?'0':'auto'};">${s.title}</h1>` : ''}
                ${s.subtitle ? `<p style="font-size: 1.25rem; color:${s.text_color || '#fff'}; opacity:0.9; line-height:1.6; margin-bottom:45px; font-weight:400; max-width:600px; margin-left:${s.align==='left'?'0':'auto'}; margin-right:${s.align==='right'?'0':'auto'};">${s.subtitle}</p>` : ''}
                <div style="display:flex; gap:20px; flex-wrap:wrap; justify-content:${alignFlex};">
                    ${s.button_link ? `<a href="${s.button_link}" class="btn-lux" style="background:${s.accent_color || 'var(--accent)'}; border-color:${s.accent_color || 'var(--accent)'}; color:#fff;">${s.button_text || 'Explore'} <i class="fas fa-arrow-right"></i></a>` : ''}
                </div>
            </div>
        </div>`;
    }

    // Multiple slides
    const slidesHtml = slides.map((s, i) => {
        const overlay = s.overlay_color || '#000000';
        const alignFlex = s.align === 'center' ? 'center' : s.align === 'right' ? 'flex-end' : 'flex-start';
        
        return `
        <div class="hero-slide ${i === 0 ? 'active' : ''}" style="background: linear-gradient(to ${s.align==='right'?'left':'right'}, ${overlay}cc 0%, ${overlay}33 60%, transparent 100%), url('${s.image || ''}') center/cover;">
            <div class="container" style="height:100%; display:flex; align-items:center; justify-content:${alignFlex};">
                <div class="hero-content" style="max-width:800px; color:${s.text_color || '#fff'}; text-align:${s.align};">
                    <h1 style="font-size: clamp(2.5rem, 8vw, 4.5rem); letter-spacing:-2px; margin:0 0 25px 0; font-weight:800; line-height:1; font-family:var(--font-alt); color:${s.text_color || '#fff'}; margin-left:${s.align==='left'?'0':'auto'}; margin-right:${s.align==='right'?'0':'auto'};">${s.title || ''}</h1>
                    <p style="font-size: 1.15rem; opacity:0.9; line-height:1.6; margin-bottom:45px; font-weight:400; max-width:600px; margin-left:${s.align==='left'?'0':'auto'}; margin-right:${s.align==='right'?'0':'auto'};">${s.subtitle || ''}</p>
                    <div style="display:flex; gap:20px; flex-wrap:wrap; justify-content:${alignFlex};">
                        ${s.button_link ? `<a href="${s.button_link}" class="btn-lux" style="background:${s.accent_color || 'var(--accent)'}; border-color:${s.accent_color || 'var(--accent)'}; color:#fff;">${s.button_text || 'Discover Now'} <i class="fas fa-arrow-right"></i></a>` : ''}
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');

    const dotsHtml = slides.map((_, i) => `<div class="carousel-dot ${i === 0 ? 'active' : ''}" onclick="goToHeroSlide(${i})"></div>`).join('');

    // Start auto-play timer after a short delay
    setTimeout(() => initHeroCarouselAutoPlay(), 2000);

    return `
    <div id="hero-carousel" class="hero-carousel ${effect || 'zoom'} reveal" style="position:relative; width:100%; height:90vh; overflow:hidden;">
        <div class="hero-carousel-inner">
            ${slidesHtml}
        </div>
        <div class="carousel-dots">
            ${dotsHtml}
        </div>
    </div>`;
}

let heroCarouselIndex = 0;
let heroCarouselTimer = null;

window.moveHeroSlide = (n) => {
    const slides = document.querySelectorAll('.hero-slide');
    if (!slides.length) return;
    
    heroCarouselIndex += n;
    if (heroCarouselIndex >= slides.length) heroCarouselIndex = 0;
    if (heroCarouselIndex < 0) heroCarouselIndex = slides.length - 1;
    
    updateHeroCarouselUI();
};

window.goToHeroSlide = (n) => {
    heroCarouselIndex = n;
    updateHeroCarouselUI();
};

function updateHeroCarouselUI() {
    const slides = document.querySelectorAll('.hero-slide');
    const dots   = document.querySelectorAll('.carousel-dot');
    
    slides.forEach((s, i) => {
        if (i === heroCarouselIndex) s.classList.add('active');
        else s.classList.remove('active');
    });
    
    dots.forEach((d, i) => {
        if (i === heroCarouselIndex) d.classList.add('active');
        else d.classList.remove('active');
    });

    // Reset auto-play timer on manual interaction
    initHeroCarouselAutoPlay();
}

function initHeroCarouselAutoPlay(speed) {
    const interval = (speed || 6) * 1000;
    if (heroCarouselTimer) clearInterval(heroCarouselTimer);
    heroCarouselTimer = setInterval(() => moveHeroSlide(1), interval);
}

/* ── BRAND SLIDER ── */
function renderBrandSlider(brands, speed) {
    if (!brands || brands.length === 0) return '';
    
    // Multiply items for smooth infinite marquee
    const items = [...brands, ...brands, ...brands, ...brands];
    const duration = speed || 40;
    
    const itemsHtml = items.map(b => `
        <div class="brand-logo">
            <a href="${b.link || '#'}" ${b.link ? '' : 'onclick="return false"'} title="${b.name || ''}">
                ${b.image ? `<img src="${b.image}" alt="${b.name || 'Brand'}">` : `<span>${b.name}</span>`}
            </a>
        </div>
    `).join('');

    return `
    <div class="brand-slider-wrapper section reveal">
        <div class="brand-slider-track" style="animation-duration: ${duration}s">
            ${itemsHtml}
        </div>
    </div>`;
}

/* ── INTERACTIVE LUXURY GRID ── */
function renderInteractiveGrid(content) {
    const items = content.items || [];
    const columns = content.columns || 4;
    const rowHeight = content.row_height || 300;
    const shape = content.shape || 'rounded';
    const fit = content.fit || 'contain';
    const blendMode = content.blend === 'on' ? 'blend-multiply' : '';
    const bg = content.bg_color || 'transparent';
    const overlay = content.overlay || 'hover';
    const sectionId = 'grid-' + Math.random().toString(36).substr(2, 9);

    const itemsHtml = items.map(item => `
        <div class="grid-card span-${item.span || '1x1'} ${shape} overlay-${overlay} fit-${fit} ${blendMode}" onclick="window.location.hash='${item.link || '#'}'">
            <img src="${item.image}" alt="${item.title}">
            <div class="grid-overlay">
                <h3>${item.title}</h3>
                <p>${item.subtitle || ''}</p>
            </div>
        </div>
    `).join('');

    return `
    <section class="section reveal" style="background-color: ${bg};" id="${sectionId}">
        <style>
            #${sectionId} .luxury-grid {
                grid-auto-rows: ${rowHeight}px;
            }
            #${sectionId} .grid-card {
                min-height: ${rowHeight}px;
                aspect-ratio: auto; /* Avoid conflict with grid-auto-rows */
            }
            #${sectionId} .grid-card.square, #${sectionId} .grid-card.rounded {
                aspect-ratio: 1/1;
            }
            #${sectionId} .fit-cover img { object-fit: cover; padding: 0; height: 100%; width: 100%; }
            #${sectionId} .fit-contain img { object-fit: contain; padding: 25px; height: 100%; width: 100%; }
            #${sectionId} .blend-multiply img { mix-blend-mode: multiply; filter: brightness(1.05) contrast(1.1); }
            @media (max-width: 768px) {
                #${sectionId} .luxury-grid {
                    grid-template-columns: repeat(${Math.min(2, columns)}, 1fr);
                    grid-auto-rows: auto;
                }
            }
        </style>
        <div class="container">
            <div style="margin-bottom:40px; text-align:center;">
                <h2 class="section-title">${content.title || ''}</h2>
                <p style="color:var(--text-sec);">${content.subtitle || ''}</p>
            </div>
            <div class="luxury-grid">
                ${itemsHtml}
            </div>
        </div>
    </section>`;
}
