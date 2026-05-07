'use strict';
/**
 * erp-cms.js — Website CMS Module
 * Manage Pages, Sections, SEO, and Content
 */

window.cmsState = {
    pages: [],
    currentPage: null,
    currentSections: [],
    categories: []
};

/* ── MAIN VIEW ── */
window.load_cms = async function() {
    const el = document.getElementById('view-cms');
    if (!el) return;

    el.innerHTML = `
    <div class="card" style="margin-bottom:20px; border-radius:16px;">
        <div class="card-body" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h2 style="margin:0; font-size:1.4rem; font-weight:800;">Website CMS</h2>
                <p style="margin:5px 0 0; color:var(--muted); font-size:0.85rem;">Manage your storefront pages, banners, and layout sections.</p>
            </div>
            <button class="btn btn-primary" onclick="openPageEditor()">
                <i class="fas fa-plus"></i> Create New Page
            </button>
        </div>
    </div>

    <div class="card" style="border-radius:16px;">
        <div class="table-container">
            <table style="width:100%;">
                <thead>
                    <tr>
                        <th style="width:250px;">Page Name</th>
                        <th style="width:150px;">Slug</th>
                        <th style="width:120px;">Type</th>
                        <th style="width:120px;">Status</th>
                        <th style="width:180px;">Last Updated</th>
                        <th style="text-align:right;">Actions</th>
                    </tr>
                </thead>
                <tbody id="cms-page-list">
                    <tr><td colspan="6" style="text-align:center; padding:40px;"><div class="spinner"></div></td></tr>
                </tbody>
            </table>
        </div>
    </div>`;

    fetchCMSPages();
    fetchCMSCategories();
};

async function fetchCMSCategories() {
    try {
        const res = await api('/api/public/categories');
        if (res.success) window.cmsState.categories = res.data;
    } catch(e) {}
}

async function fetchCMSPages() {
    try {
        const res = await api('/api/cms/pages');
        if (res.success) {
            window.cmsState.pages = res.data;
            renderPageList(res.data);
        } else {
            toast(res.error || 'Failed to load pages', 'error');
        }
    } catch (e) {
        toast('Network error', 'error');
    }
}

function renderPageList(pages) {
    const tbody = document.getElementById('cms-page-list');
    if (!tbody) return;

    if (!pages || pages.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:60px; color:var(--muted);">No pages found. Create your first page to get started.</td></tr>`;
        return;
    }

    tbody.innerHTML = pages.map(p => `
        <tr>
            <td>
                <div style="font-weight:700; color:var(--text);">${p.page_name}</div>
                <div style="font-size:0.7rem; color:var(--muted); margin-top:2px;">ID: ${p.id}</div>
            </td>
            <td><code style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:0.8rem;">/${p.slug}</code></td>
            <td><span style="text-transform:capitalize;">${p.page_type}</span></td>
            <td>
                <span class="badge ${p.status === 'published' ? 'badge-green' : 'badge-gray'}">
                    ${p.status.toUpperCase()}
                </span>
            </td>
            <td style="font-size:0.85rem; color:var(--muted);">${new Date(p.updated_at || p.created_at).toLocaleString()}</td>
            <td style="text-align:right;">
                <div style="display:flex; gap:8px; justify-content:flex-end;">
                    <button class="btn btn-outline btn-sm" onclick="openPageEditor('${p.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="previewPage('${p.slug}')" title="View Public Page">
                        <i class="fas fa-external-link-alt"></i>
                    </button>
                    ${p.slug !== 'home' ? `
                    <button class="btn btn-outline btn-sm" style="color:var(--danger); border-color:rgba(239, 68, 68, 0.2);" onclick="deleteCMSPage('${p.id}')">
                        <i class="fas fa-trash"></i>
                    </button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

/* ── PAGE EDITOR ── */
window.openPageEditor = async function(pageId) {
    let page = { page_name: '', slug: '', page_type: 'custom', status: 'draft', seo: {} };
    let sections = [];

    if (pageId) {
        const res = await api(`/api/cms/pages/${pageId}`);
        if (res.success) {
            page = res.data;
            sections = res.data.sections || [];
            window.cmsState.currentPage = page;
            window.cmsState.currentSections = sections;
        }
    }

    const modalHtml = `
    <div style="display:grid; grid-template-columns: 350px 1fr; gap:24px; max-height:80vh; overflow:hidden;">
        <!-- Left Column: Settings -->
        <div style="border-right:1px solid var(--border); padding-right:24px; display:flex; flex-direction:column; gap:20px; overflow-y:auto;">
            <div class="form-row">
                <label>Page Name</label>
                <input id="cms-page-name" class="filter-input" style="width:100%;" value="${page.page_name}" placeholder="e.g. Terms of Service">
            </div>
            <div class="form-row">
                <label>URL Slug</label>
                <div style="display:flex; align-items:center; gap:5px; background:#f8fafc; border:1px solid var(--border); border-radius:8px; padding:0 10px;">
                    <span style="color:var(--muted); font-size:0.85rem; font-weight:600;">/</span>
                    <input id="cms-page-slug" class="filter-input" style="border:none; background:transparent; padding:0; height:38px; width:100%;" 
                        value="${page.slug}" placeholder="terms-and-conditions" ${page.slug === 'home' ? 'readonly' : ''}>
                </div>
            </div>
            <div class="form-row">
                <label>Page Type</label>
                <select id="cms-page-type" class="filter-input" style="width:100%;" ${page.slug === 'home' ? 'disabled' : ''}>
                    <option value="custom" ${page.page_type === 'custom' ? 'selected' : ''}>Custom Landing Page</option>
                    <option value="home" ${page.page_type === 'home' ? 'selected' : ''}>Homepage</option>
                    <option value="policy" ${page.page_type === 'policy' ? 'selected' : ''}>Policy / Legal</option>
                </select>
            </div>
            <div class="form-row">
                <label>Publish Status</label>
                <select id="cms-page-status" class="filter-input" style="width:100%;">
                    <option value="draft" ${page.status === 'draft' ? 'selected' : ''}>Draft (Hidden)</option>
                    <option value="published" ${page.status === 'published' ? 'selected' : ''}>Published (Active)</option>
                    <option value="archived" ${page.status === 'archived' ? 'selected' : ''}>Archived</option>
                </select>
            </div>

            <hr style="border:none; border-top:1px dashed var(--border); margin:5px 0;">
            
            <div style="font-weight:800; font-size:0.75rem; color:var(--muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:-10px;">SEO Metadata</div>
            
            <div class="form-row">
                <label>SEO Title</label>
                <input id="cms-seo-title" class="filter-input" style="width:100%; font-size:0.85rem;" value="${page.seo?.seo_title || ''}" placeholder="Page Title (60-70 chars)">
            </div>
            <div class="form-row">
                <label>SEO Description</label>
                <textarea id="cms-seo-desc" class="filter-input" style="width:100%; height:80px; font-size:0.85rem;" placeholder="Search engine meta description...">${page.seo?.seo_description || ''}</textarea>
            </div>
            
            <div style="margin-top:auto; padding-top:20px; display:flex; flex-direction:column; gap:10px;">
                <button class="btn btn-primary" style="width:100%;" onclick="saveCMSPage('${pageId || ''}')">
                    <i class="fas fa-save"></i> ${pageId ? 'Update Page Settings' : 'Create Page'}
                </button>
            </div>
        </div>

        <!-- Right Column: Sections -->
        <div style="display:flex; flex-direction:column; gap:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3 style="margin:0; font-size:1.1rem;"><i class="fas fa-layer-group" style="color:var(--accent);"></i> Content Sections</h3>
                ${pageId ? `<button class="btn btn-outline btn-sm" onclick="openSectionEditor('${pageId}', '')">
                    <i class="fas fa-plus"></i> Add Section
                </button>` : `<span style="font-size:0.85rem; color:var(--muted);">Save page first to add sections.</span>`}
            </div>

            <div id="cms-section-list" style="flex:1; overflow-y:auto; background:#f8fafc; border-radius:12px; border:1px solid var(--border); padding:16px; display:flex; flex-direction:column; gap:12px;">
                ${pageId ? renderSections(sections) : `
                <div style="text-align:center; padding:60px 20px; color:var(--muted);">
                    <i class="fas fa-puzzle-piece" style="font-size:3rem; opacity:0.2; margin-bottom:15px; display:block;"></i>
                    <p>Once you create the page, you can start adding interactive sections like Hero Banners, Image Grids, and more.</p>
                </div>`}
            </div>
        </div>
    </div>`;

    openModal(pageId ? `Edit Page: ${page.page_name}` : 'Create New Page', modalHtml, 'modal-xl');
};

function renderSections(sections) {
    if (!sections || sections.length === 0) {
        return `<div style="text-align:center; padding:40px; color:var(--muted); font-size:0.9rem;">No sections added yet.</div>`;
    }

    return sections.map((s, idx) => `
        <div class="cms-section-card" style="background:#fff; border:1px solid var(--border); border-radius:10px; padding:12px 16px; display:flex; align-items:center; gap:15px;">
            <div style="color:var(--muted); cursor:grab;"><i class="fas fa-grip-vertical"></i></div>
            <div style="width:36px; height:36px; background:var(--accent-dim); color:var(--accent); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1rem;">
                <i class="${getSectionIcon(s.section_type)}"></i>
            </div>
            <div style="flex:1;">
                <div style="font-weight:700; font-size:0.9rem; text-transform:capitalize;">${s.section_type.replace(/_/g, ' ')}</div>
                <div style="font-size:0.75rem; color:var(--muted);">${s.status.toUpperCase()} • Order: ${s.section_order}</div>
            </div>
            <div style="display:flex; gap:6px;">
                <button class="btn btn-outline btn-sm" style="padding:4px 10px;" onclick="openSectionEditor('${s.page_id}', '${s.id}')">
                    <i class="fas fa-cog"></i> Config
                </button>
                <button class="btn btn-outline btn-sm" style="padding:4px 8px; color:var(--danger); border-color:rgba(239, 68, 68, 0.1);" onclick="deleteCMSSection('${s.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function getSectionIcon(type) {
    const icons = {
        hero: 'fas fa-image',
        banner: 'fas fa-ad',
        grid: 'fas fa-th-large',
        text: 'fas fa-font',
        product: 'fas fa-shopping-bag',
        html: 'fas fa-code'
    };
    return icons[type] || 'fas fa-cube';
}

/* ── SAVE/DELETE PAGE ── */
window.saveCMSPage = async function(id) {
    const data = {
        page_name: document.getElementById('cms-page-name').value,
        slug: document.getElementById('cms-page-slug').value,
        page_type: document.getElementById('cms-page-type').value,
        status: document.getElementById('cms-page-status').value,
        seo: {
            seo_title: document.getElementById('cms-seo-title').value,
            seo_description: document.getElementById('cms-seo-desc').value
        }
    };

    if (!data.page_name || !data.slug) return toast('Name and Slug are required', 'error');

    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/cms/pages/${id}` : '/api/cms/pages';
        const res = await (method === 'POST' ? postAPI(url, data) : putAPI(url, data));
        
        if (res.success) {
            toast(id ? 'Page updated!' : 'Page created!', 'success');
            if (!id) openPageEditor(res.data.id); // Reload with sections enabled
            else fetchCMSPages();
        } else {
            toast(res.error || 'Operation failed', 'error');
        }
    } catch (e) {
        toast('Network error', 'error');
    }
};

window.deleteCMSPage = async function(id) {
    if (!confirm('Permanent delete this page and all its sections?')) return;
    try {
        const res = await api(`/api/cms/pages/${id}`, { method: 'DELETE' });
        if (res.success) {
            toast('Page deleted', 'success');
            fetchCMSPages();
        }
    } catch (e) {}
};

/* ── SECTION EDITOR ── */
window.openSectionEditor = async function(pageId, sectionId) {
    let section = { section_type: 'hero', section_order: 0, content_json: {}, status: 'published' };
    
    if (sectionId) {
        // Find in local state
        section = window.cmsState.currentSections.find(s => s.id === sectionId) || section;
    } else {
        // Auto order
        section.section_order = window.cmsState.currentSections.length * 10;
    }

    const modalHtml = `
    <div style="display:flex; flex-direction:column; gap:20px; max-height:75vh; overflow-y:auto; padding:5px;">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
            <div class="form-row">
                <label>Section Type</label>
                <select id="sec-type" class="filter-input" style="width:100%;" onchange="updateSectionConfigUI(this.value)">
                    <option value="hero" ${section.section_type === 'hero' ? 'selected' : ''}>Full Width Hero</option>
                    <option value="banner" ${section.section_type === 'banner' ? 'selected' : ''}>Promotional Banner</option>
                    <option value="grid" ${section.section_type === 'grid' ? 'selected' : ''}>Interactive Grid (Shop By...)</option>
                    <option value="text" ${section.section_type === 'text' ? 'selected' : ''}>Rich Text Block</option>
                    <option value="product" ${section.section_type === 'product' ? 'selected' : ''}>Product Slider</option>
                    <option value="brand_slider" ${section.section_type === 'brand_slider' ? 'selected' : ''}>Brand Logo Slider</option>
                </select>
            </div>
            <div class="form-row">
                <label>Order (Weight)</label>
                <input id="sec-order" type="number" class="filter-input" style="width:100%;" value="${section.section_order}">
            </div>
        </div>

        <div id="section-config-container" style="background:#f8fafc; border:1px solid var(--border); border-radius:12px; padding:20px;">
            <!-- Dynamic UI based on type -->
            ${renderSectionTypeFields(section.section_type, section.content_json)}
        </div>

        <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:10px;">
            <button class="btn btn-outline" onclick="closeModal(); openPageEditor('${pageId}')">Cancel</button>
            <button class="btn btn-primary" onclick="saveCMSSection('${pageId}', '${sectionId || ''}')">
                <i class="fas fa-check"></i> Save Section
            </button>
        </div>
    </div>`;

    openModal(sectionId ? 'Configure Section' : 'Add New Section', modalHtml, 'modal-lg');
};

function renderSectionTypeFields(type, content) {
    if (type === 'hero') {
        const slides = content.slides || (content.image ? [{
            image: content.image,
            title: content.title,
            subtitle: content.subtitle,
            button_text: content.button_text,
            button_link: content.button_link,
            align: 'left',
            text_color: '#ffffff',
            overlay_color: '#000000',
            accent_color: '#ec691f'
        }] : []);

        return `
        <div style="display:flex; flex-direction:column; gap:20px;">
            <div class="form-row">
                <div class="form-group" style="flex:1;">
                    <label>Autoplay Speed (seconds)</label>
                    <input type="number" id="hero-speed" class="filter-input" value="${content.speed || 6}" min="1" max="20">
                </div>
                <div class="form-group" style="flex:1;">
                    <label>Transition Effect</label>
                    <select id="hero-effect" class="filter-input">
                        <option value="fade" ${content.effect === 'fade' ? 'selected' : ''}>Luxury Fade</option>
                        <option value="zoom" ${content.effect === 'zoom' ? 'selected' : ''}>Ken Burns Zoom</option>
                        <option value="slide" ${content.effect === 'slide' ? 'selected' : ''}>Horizontal Slide</option>
                    </select>
                </div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <h4 style="margin:0; font-size:0.9rem;">Carousel Slides</h4>
                <button class="btn btn-outline btn-sm" onclick="addHeroSlide()">
                    <i class="fas fa-plus"></i> Add Slide
                </button>
            </div>
            <div id="hero-slides-container" style="display:flex; flex-direction:column; gap:15px;">
                ${slides.map((s, i) => renderHeroSlideItem(i, s)).join('')}
            </div>
            ${slides.length === 0 ? `<div id="no-slides-msg" style="text-align:center; padding:30px; background:#fff; border-radius:12px; border:1px dashed var(--border); color:var(--muted);">No slides added. Click "Add Slide" to begin.</div>` : ''}
        </div>`;
    }

    if (type === 'banner') {
        return `
        <div style="display:flex; flex-direction:column; gap:15px;">
            <div class="form-row">
                <label>Background Image</label>
                <div style="display:flex; gap:12px; align-items:center;">
                    <div id="sec-img-preview" style="width:120px; height:80px; background:#e2e8f0; border-radius:8px; display:flex; align-items:center; justify-content:center; overflow:hidden; border:1px solid var(--border);">
                        ${content.image ? `<img src="${content.image}" style="width:100%; height:100%; object-fit:cover;">` : '<i class="fas fa-image" style="color:#94a3b8; font-size:1.5rem;"></i>'}
                    </div>
                    <div style="flex:1;">
                        <input id="sec-img-url" class="filter-input" style="width:100%; margin-bottom:8px;" value="${content.image || ''}" readonly placeholder="Select from library...">
                        <button class="btn btn-outline btn-sm" onclick="window.openMediaSelector('sec-img-url', 'sec-img-preview', 'cms')">
                            <i class="fas fa-images"></i> Select Image
                        </button>
                    </div>
                </div>
            </div>
            <div class="form-row">
                <label>Main Heading</label>
                <input id="sec-title" class="filter-input" style="width:100%;" value="${content.title || ''}">
            </div>
            <div class="form-row">
                <label>Sub-heading / Text</label>
                <input id="sec-subtitle" class="filter-input" style="width:100%;" value="${content.subtitle || ''}">
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                <div class="form-row">
                    <label>Button Text</label>
                    <input id="sec-btn-text" class="filter-input" style="width:100%;" value="${content.button_text || ''}">
                </div>
                <div class="form-row">
                    <label>Button Link</label>
                    <input id="sec-btn-link" class="filter-input" style="width:100%;" value="${content.button_link || ''}">
                </div>
            </div>
        </div>`;
    }
    
    if (type === 'brand_slider') {
        const brands = content.brands || [];
        return `
        <div style="display:flex; flex-direction:column; gap:15px;">
            <div class="form-row">
                <div class="form-group">
                    <label>Scroll Speed (seconds to complete full loop)</label>
                    <input type="number" id="brand-speed" class="filter-input" value="${content.speed || 40}" min="5" max="120">
                </div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h4 style="margin:0; font-size:0.9rem;">Brand Logos</h4>
                <button class="btn btn-outline btn-sm" onclick="addBrandItem()">
                    <i class="fas fa-plus"></i> Add Brand
                </button>
            </div>
            <div id="brand-items-container" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:15px;">
                ${brands.map((b, i) => renderBrandItem(i, b)).join('')}
            </div>
            ${brands.length === 0 ? `<div id="no-brands-msg" style="text-align:center; padding:30px; background:#fff; border-radius:12px; border:1px dashed var(--border); color:var(--muted);">No brands added.</div>` : ''}
        </div>`;
    }

    if (type === 'grid') {
        const items = content.items || [];
        return `
        <div style="display:flex; flex-direction:column; gap:20px;">
            <div class="form-row">
                <div class="form-group">
                    <label>Grid Title</label>
                    <input type="text" id="grid-title" class="filter-input" value="${content.title || ''}" placeholder="e.g. Shop By Gender">
                </div>
                <div class="form-group">
                    <label>Grid Subtitle</label>
                    <input type="text" id="grid-subtitle" class="filter-input" value="${content.subtitle || ''}" placeholder="e.g. Find the perfect pair...">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group" style="flex:1;">
                    <label>Columns</label>
                    <input type="number" id="grid-cols" class="filter-input" value="${content.columns || 4}" min="1" max="6">
                </div>
                <div class="form-group" style="flex:1;">
                    <label>Row Height (px)</label>
                    <input type="number" id="grid-row-h" class="filter-input" value="${content.row_height || 300}" min="100" max="800">
                </div>
                <div class="form-group" style="flex:1;">
                    <label>Box Shape</label>
                    <select id="grid-shape" class="filter-input">
                        <option value="square" ${content.shape === 'square' ? 'selected' : ''}>Square</option>
                        <option value="rounded" ${content.shape === 'rounded' ? 'selected' : ''}>Rounded (Modern)</option>
                        <option value="circle" ${content.shape === 'circle' ? 'selected' : ''}>Circular / Oval</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group" style="flex:1;">
                    <label>Image Fit</label>
                    <select id="grid-fit" class="filter-input">
                        <option value="contain" ${content.fit === 'contain' ? 'selected' : ''}>Contain (Logo/Product)</option>
                        <option value="cover" ${content.fit === 'cover' ? 'selected' : ''}>Cover (Lifestyle/Photo)</option>
                    </select>
                </div>
                <div class="form-group" style="flex:1;">
                    <label>Image Blending (Multiply)</label>
                    <select id="grid-blend" class="filter-input">
                        <option value="on" ${content.blend === 'on' ? 'selected' : ''}>Enable (Removes Gray BG)</option>
                        <option value="off" ${content.blend !== 'on' ? 'selected' : ''}>Disable (Natural Colors)</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group" style="flex:1;">
                    <label>Background Color</label>
                    <input type="color" id="grid-bg" class="filter-input" style="height:38px; padding:2px;" value="${content.bg_color || '#ffffff'}">
                </div>
                <div class="form-group" style="flex:1;">
                    <label>Overlay Effect</label>
                    <select id="grid-overlay" class="filter-input">
                        <option value="hover" ${content.overlay === 'hover' ? 'selected' : ''}>Show on Hover</option>
                        <option value="always" ${content.overlay === 'always' ? 'selected' : ''}>Always Visible</option>
                        <option value="none" ${content.overlay === 'none' ? 'selected' : ''}>No Overlay</option>
                    </select>
                </div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h4 style="margin:0; font-size:0.9rem;">Grid Items</h4>
                <button class="btn btn-outline btn-sm" onclick="addGridItem()">
                    <i class="fas fa-plus"></i> Add Grid Item
                </button>
            </div>
            <div id="grid-items-container" style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                ${items.map((item, i) => renderGridItem(i, item)).join('')}
            </div>
            ${items.length === 0 ? `<div id="no-grid-msg" style="text-align:center; padding:30px; background:#fff; border-radius:12px; border:1px dashed var(--border); color:var(--muted);">No items added. Click "Add Grid Item" to begin.</div>` : ''}
        </div>`;
    }

    if (type === 'product') {
        return `
        <div class="form-row">
            <div class="form-group">
                <label>Section Title</label>
                <input type="text" id="prod-title" class="filter-input" value="${content.title || ''}" placeholder="e.g. New Arrivals">
            </div>
            <div class="form-group">
                <label>Subtitle</label>
                <input type="text" id="prod-subtitle" class="filter-input" value="${content.subtitle || ''}">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Product Limit</label>
                <input type="number" id="prod-limit" class="filter-input" value="${content.limit || 8}" min="1" max="50">
            </div>
            <div class="form-group">
                <label>Rows (Vertical)</label>
                <input type="number" id="prod-rows" class="filter-input" value="${content.rows || 1}" min="1" max="3">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Autoscroll Speed (ms)</label>
                <input type="number" id="prod-scroll" class="filter-input" value="${content.scroll_speed || 0}" step="500" placeholder="0 to disable">
            </div>
            <div class="form-group">
                <label>Filter Strategy</label>
                <select id="prod-filter" class="filter-input" onchange="document.getElementById('category-filter-wrap').style.display = (this.value === 'category' ? 'block' : 'none')">
                    <option value="new" ${content.filter === 'new' ? 'selected' : ''}>New Arrivals</option>
                    <option value="trending" ${content.filter === 'trending' ? 'selected' : ''}>Trending Now</option>
                    <option value="category" ${content.filter === 'category' ? 'selected' : ''}>By Category</option>
                    <option value="all" ${content.filter === 'all' ? 'selected' : ''}>Random Catalog</option>
                </select>
            </div>
        </div>
        <div id="category-filter-wrap" class="form-row" style="display: ${content.filter === 'category' ? 'block' : 'none'};">
            <div class="form-group">
                <label>Select Category</label>
                <select id="prod-cat" class="filter-input">
                    <option value="">-- Choose Category --</option>
                    ${window.cmsState.categories.map(c => `
                        <option value="${c.name}" ${content.category === c.name ? 'selected' : ''}>${c.name}</option>
                    `).join('')}
                </select>
            </div>
        </div>`;
    }

    if (type === 'text') {
        return `
        <div class="form-row">
            <label>Title</label>
            <input id="sec-title" class="filter-input" style="width:100%;" value="${content.title || ''}">
        </div>
        <div class="form-row">
            <label>Detailed Content (HTML Supported)</label>
            <textarea id="sec-body" class="filter-input" style="width:100%; height:150px;">${content.body || ''}</textarea>
        </div>`;
    }

    return `<div style="padding:20px; text-align:center; color:var(--muted);">Configuration for <b>${type}</b> coming soon or is managed via specialized JSON interface.</div>`;
}

window.updateSectionConfigUI = function(type) {
    const container = document.getElementById('section-config-container');
    if (container) container.innerHTML = renderSectionTypeFields(type, {});
};

window.saveCMSSection = async function(pageId, sectionId) {
    const type = document.getElementById('sec-type').value;
    const order = parseInt(document.getElementById('sec-order').value || 0);
    
    // Gather content based on type
    const content = {};
    if (type === 'hero') {
        content.speed = parseInt(document.getElementById('hero-speed').value);
        content.effect = document.getElementById('hero-effect').value;
        const slides = [];
        document.querySelectorAll('.cms-slide-item').forEach(el => {
            slides.push({
                image: el.querySelector('.slide-url').value,
                title: el.querySelector('.slide-title').value,
                subtitle: el.querySelector('.slide-subtitle').value,
                button_text: el.querySelector('.slide-btn-text').value,
                button_link: el.querySelector('.slide-btn-link').value,
                align: el.querySelector('.slide-align').value,
                text_color: el.querySelector('.slide-text-color').value,
                overlay_color: el.querySelector('.slide-overlay-color').value,
                accent_color: el.querySelector('.slide-accent-color').value
            });
        });
        content.slides = slides;
    } else if (type === 'brand_slider') {
        content.speed = parseInt(document.getElementById('brand-speed').value);
        const brands = [];
        document.querySelectorAll('.cms-brand-item').forEach(el => {
            brands.push({
                image: el.querySelector('.brand-url').value,
                link: el.querySelector('.brand-link').value,
                name: el.querySelector('.brand-name').value
            });
        });
        content.brands = brands;
    } else if (type === 'grid') {
        content.title = document.getElementById('grid-title').value;
        content.subtitle = document.getElementById('grid-subtitle').value;
        content.columns = parseInt(document.getElementById('grid-cols').value);
        content.row_height = parseInt(document.getElementById('grid-row-h').value);
        content.shape = document.getElementById('grid-shape').value;
        content.fit = document.getElementById('grid-fit').value;
        content.blend = document.getElementById('grid-blend').value;
        content.bg_color = document.getElementById('grid-bg').value;
        content.overlay = document.getElementById('grid-overlay').value;
        
        const items = [];
        document.querySelectorAll('.cms-grid-item').forEach(el => {
            items.push({
                image: el.querySelector('.grid-url').value,
                title: el.querySelector('.grid-title').value,
                subtitle: el.querySelector('.grid-subtitle').value,
                link: el.querySelector('.grid-link').value,
                span: el.querySelector('.grid-span').value
            });
        });
        content.items = items;
    } else if (type === 'product') {
        content.title = document.getElementById('prod-title').value;
        content.subtitle = document.getElementById('prod-subtitle').value;
        content.limit = parseInt(document.getElementById('prod-limit').value);
        content.rows = parseInt(document.getElementById('prod-rows').value);
        content.scroll_speed = parseInt(document.getElementById('prod-scroll').value);
        content.filter = document.getElementById('prod-filter').value;
        content.category = document.getElementById('prod-cat').value;
    } else if (type === 'banner') {
        content.image = document.getElementById('sec-img-url').value;
        content.title = document.getElementById('sec-title').value;
        content.subtitle = document.getElementById('sec-subtitle').value;
        content.button_text = document.getElementById('sec-btn-text').value;
        content.button_link = document.getElementById('sec-btn-link').value;
    } else if (type === 'text') {
        content.title = document.getElementById('sec-title').value;
        content.body = document.getElementById('sec-body').value;
    }

    const data = {
        section_type: type,
        section_order: order,
        content_json: content,
        status: 'published'
    };

    try {
        const method = sectionId ? 'PUT' : 'POST';
        const url = sectionId ? `/api/cms/sections/${sectionId}` : `/api/cms/pages/${pageId}/sections`;
        const res = await (method === 'POST' ? postAPI(url, data) : putAPI(url, data));
        
        if (res.success) {
            toast('Section saved!', 'success');
            closeModal();
            openPageEditor(pageId); // Back to page editor
        } else {
            toast(res.error || 'Save failed', 'error');
        }
    } catch (e) {
        toast('Network error', 'error');
    }
};

window.deleteCMSSection = async function(id) {
    if (!confirm('Remove this section?')) return;
    try {
        const res = await api(`/api/cms/sections/${id}`, { method: 'DELETE' });
        if (res.success) {
            toast('Section removed', 'success');
            if (window.cmsState.currentPage) openPageEditor(window.cmsState.currentPage.id);
        }
    } catch (e) {}
};

window.previewPage = function(slug) {
    window.open(`/${slug === 'home' ? '' : slug}`, '_blank');
};

/* ── HERO SLIDE HELPERS ── */
window.renderHeroSlideItem = function(index, slide) {
    return `
    <div class="cms-slide-item" data-index="${index}" style="background:#fff; border:1px solid var(--border); border-radius:12px; padding:20px; margin-bottom:15px; position:relative; box-shadow:0 4px 12px rgba(0,0,0,0.03);">
        <button class="btn btn-outline btn-sm" style="position:absolute; top:12px; right:12px; color:var(--danger); border-color:transparent; padding:4px 8px;" onclick="removeHeroSlide(this)">
            <i class="fas fa-trash-alt"></i>
        </button>
        <div style="display:grid; grid-template-columns: 160px 1fr; gap:24px;">
            <div class="form-row">
                <label>Slide Image</label>
                <div id="slide-preview-${index}" onclick="window.openMediaSelector('slide-url-${index}', 'slide-preview-${index}', 'cms')" style="width:100%; height:120px; background:#f8fafc; border-radius:10px; border:2px dashed #e2e8f0; display:flex; align-items:center; justify-content:center; cursor:pointer; overflow:hidden; transition:0.2s;">
                    ${slide.image ? `<img src="${slide.image}" style="width:100%; height:100%; object-fit:cover;">` : '<div style="text-align:center;"><i class="fas fa-plus" style="font-size:1.5rem; color:#cbd5e1; display:block; margin-bottom:5px;"></i><span style="font-size:0.6rem; color:#94a3b8; font-weight:700; text-transform:uppercase;">Select</span></div>'}
                </div>
                <input type="hidden" id="slide-url-${index}" class="slide-url" value="${slide.image || ''}">
            </div>
            <div style="display:flex; flex-direction:column; gap:12px;">
                <div class="form-row">
                    <label>Main Heading</label>
                    <input class="slide-title filter-input" style="width:100%; font-weight:700;" value="${slide.title || ''}" placeholder="Enter Bold Title">
                </div>
                <div class="form-row">
                    <label>Sub Heading / Caption</label>
                    <input class="slide-subtitle filter-input" style="width:100%;" value="${slide.subtitle || ''}" placeholder="Enter slide description...">
                </div>
            </div>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1.5fr 1fr; gap:15px; margin-top:20px;">
            <div class="form-row">
                <label>Button Text</label>
                <input class="slide-btn-text filter-input" style="width:100%;" value="${slide.button_text || ''}" placeholder="e.g. Shop Now">
            </div>
            <div class="form-row">
                <label>Button Link</label>
                <input class="slide-btn-link filter-input" style="width:100%;" value="${slide.button_link || ''}" placeholder="e.g. /#/shop?brand=gucci">
            </div>
            <div class="form-row">
                <label>Content Alignment</label>
                <select class="slide-align filter-input" style="width:100%;">
                    <option value="left" ${slide.align==='left'?'selected':''}>Left Aligned</option>
                    <option value="center" ${slide.align==='center'?'selected':''}>Center Aligned</option>
                    <option value="right" ${slide.align==='right'?'selected':''}>Right Aligned</option>
                </select>
            </div>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:20px; margin-top:15px; padding-top:15px; border-top:1px dashed #eee;">
             <div class="form-row">
                <label style="display:flex; justify-content:space-between;">Text Color <span style="font-size:0.6rem; opacity:0.5;">${slide.text_color || '#FFFFFF'}</span></label>
                <input type="color" class="slide-text-color" style="width:100%; height:34px; border:1px solid #ddd; padding:2px; background:#fff; border-radius:6px; cursor:pointer;" value="${slide.text_color || '#ffffff'}">
            </div>
            <div class="form-row">
                <label style="display:flex; justify-content:space-between;">Overlay Tint <span style="font-size:0.6rem; opacity:0.5;">${slide.overlay_color || '#000000'}</span></label>
                <input type="color" class="slide-overlay-color" style="width:100%; height:34px; border:1px solid #ddd; padding:2px; background:#fff; border-radius:6px; cursor:pointer;" value="${slide.overlay_color || '#000000'}">
            </div>
             <div class="form-row">
                <label style="display:flex; justify-content:space-between;">Accent/Button <span style="font-size:0.6rem; opacity:0.5;">${slide.accent_color || '#EC691F'}</span></label>
                <input type="color" class="slide-accent-color" style="width:100%; height:34px; border:1px solid #ddd; padding:2px; background:#fff; border-radius:6px; cursor:pointer;" value="${slide.accent_color || '#ec691f'}">
            </div>
        </div>
    </div>
    `;
};

window.addHeroSlide = function() {
    const container = document.getElementById('hero-slides-container');
    const msg = document.getElementById('no-slides-msg');
    if (msg) msg.remove();
    
    const index = container.querySelectorAll('.cms-slide-item').length;
    const div = document.createElement('div');
    div.innerHTML = renderHeroSlideItem(index, { align: 'left', text_color: '#ffffff', overlay_color: '#000000', accent_color: '#ec691f' });
    container.appendChild(div.firstElementChild);
};

window.removeHeroSlide = function(btn) {
    if (!confirm('Remove this slide?')) return;
    btn.closest('.cms-slide-item').remove();
    const container = document.getElementById('hero-slides-container');
    if (container.querySelectorAll('.cms-slide-item').length === 0) {
        container.parentElement.innerHTML += `<div id="no-slides-msg" style="text-align:center; padding:30px; background:#fff; border-radius:12px; border:1px dashed var(--border); color:var(--muted);">No slides added. Click "Add Slide" to begin.</div>`;
    }
};

/* ── BRAND ITEM HELPERS ── */
window.renderBrandItem = function(index, brand) {
    return `
    <div class="cms-brand-item" style="background:#fff; border:1px solid var(--border); border-radius:12px; padding:15px; position:relative;">
        <button class="btn btn-sm" style="position:absolute; top:8px; right:8px; color:var(--danger); padding:2px;" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
        <div id="brand-preview-${index}" onclick="window.openMediaSelector('brand-url-${index}', 'brand-preview-${index}', 'cms')" style="width:100%; height:80px; background:#f8fafc; border-radius:8px; border:2px dashed #e2e8f0; display:flex; align-items:center; justify-content:center; cursor:pointer; overflow:hidden; margin-bottom:10px;">
            ${brand.image ? `<img src="${brand.image}" style="width:100%; height:100%; object-fit:contain; padding:10px;">` : '<i class="fas fa-plus" style="color:#cbd5e1;"></i>'}
        </div>
        <input type="hidden" id="brand-url-${index}" class="brand-url" value="${brand.image || ''}">
        <input class="brand-name filter-input" style="width:100%; margin-bottom:8px; font-size:0.75rem; font-weight:700;" value="${brand.name || ''}" placeholder="Brand Name" oninput="window.autoLinkBrand(this)">
        <input class="brand-link filter-input" style="width:100%; font-size:0.75rem;" value="${brand.link || ''}" placeholder="Link (Optional)">
    </div>`;
};

/* ── GRID ITEM HELPERS ── */
window.renderGridItem = function(index, item) {
    return `
    <div class="cms-grid-item" style="background:#fff; border:1px solid var(--border); border-radius:12px; padding:15px; position:relative;">
        <button class="btn btn-sm" style="position:absolute; top:8px; right:8px; color:var(--danger); padding:2px;" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
        <div style="display:flex; gap:15px;">
            <div id="grid-preview-${index}" onclick="window.openMediaSelector('grid-url-${index}', 'grid-preview-${index}', 'cms')" style="width:100px; height:100px; background:#f8fafc; border-radius:8px; border:2px dashed #e2e8f0; display:flex; align-items:center; justify-content:center; cursor:pointer; overflow:hidden; flex-shrink:0;">
                ${item.image ? `<img src="${item.image}" style="width:100%; height:100%; object-fit:cover;">` : '<i class="fas fa-plus" style="color:#cbd5e1;"></i>'}
            </div>
            <div style="flex:1;">
                <input type="hidden" id="grid-url-${index}" class="grid-url" value="${item.image || ''}">
                <input class="grid-title filter-input" style="width:100%; margin-bottom:5px; font-weight:700;" value="${item.title || ''}" placeholder="Title (e.g. MEN)">
                <input class="grid-subtitle filter-input" style="width:100%; margin-bottom:5px; font-size:0.75rem;" value="${item.subtitle || ''}" placeholder="Subtitle">
                <input class="grid-link filter-input" style="width:100%; margin-bottom:5px; font-size:0.75rem;" value="${item.link || ''}" placeholder="Link URL">
                <select class="grid-span filter-input" style="width:100%; font-size:0.75rem;">
                    <option value="1x1" ${item.span === '1x1' ? 'selected' : ''}>Standard (1x1)</option>
                    <option value="2x1" ${item.span === '2x1' ? 'selected' : ''}>Wide (2x1)</option>
                    <option value="1x2" ${item.span === '1x2' ? 'selected' : ''}>Tall (1x2)</option>
                    <option value="2x2" ${item.span === '2x2' ? 'selected' : ''}>Large (2x2)</option>
                </select>
            </div>
        </div>
    </div>`;
};

window.addGridItem = function() {
    const container = document.getElementById('grid-items-container');
    const msg = document.getElementById('no-grid-msg');
    if (msg) msg.remove();
    
    const index = container.querySelectorAll('.cms-grid-item').length;
    const div = document.createElement('div');
    div.innerHTML = renderGridItem(index, {});
    container.appendChild(div.firstElementChild);
};

window.autoLinkBrand = function(nameEl) {
    const linkEl = nameEl.closest('.cms-brand-item').querySelector('.brand-link');
    if (linkEl && (!linkEl.value || linkEl.value.includes('/#/shop?brand='))) {
        const val = nameEl.value.trim();
        if (val) {
            linkEl.value = `/#/shop?brand=${val}`;
        } else {
            linkEl.value = '';
        }
    }
};

window.addBrandItem = function() {
    const container = document.getElementById('brand-items-container');
    const msg = document.getElementById('no-brands-msg');
    if (msg) msg.remove();
    
    const index = container.querySelectorAll('.cms-brand-item').length;
    const div = document.createElement('div');
    div.innerHTML = renderBrandItem(index, {});
    container.appendChild(div.firstElementChild);
};
