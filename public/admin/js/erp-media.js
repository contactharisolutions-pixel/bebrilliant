'use strict';
/**
 * erp-media.js — Advanced Media Library
 * List view · Robust thumbnail · One-click select · Upload · Rename · Delete
 */

window.mediaState = {
    folder: 'all',
    data:   [],
    mode:   'library',
    search: '',
    type:   'all',
    targetInput:   null,
    targetPreview: null,
    targetModule:  'general'
};

/* ─────────────────────── MAIN VIEW ─────────────────────── */
window.load_media = async function(folder) {
    folder = folder || 'all';
    const el = document.getElementById('view-media');
    if (!el) return;

    window.mediaState.mode   = 'library';
    window.mediaState.folder = folder;
    window.mediaState.search = '';
    window.mediaState.type   = 'all';

    el.innerHTML = `
    <div style="display:flex; height:calc(100vh - 120px); background:#fff; border-radius:16px; border:1px solid var(--border); overflow:hidden;">

        <!-- Sidebar -->
        <aside style="width:220px; min-width:220px; background:#f8fafc; border-right:1px solid var(--border); display:flex; flex-direction:column;">
            <div style="padding:20px 16px 12px; font-size:0.68rem; font-weight:800; text-transform:uppercase; letter-spacing:1.5px; color:var(--muted);">Folders</div>
            <div style="flex:1; overflow-y:auto; padding:0 10px; display:flex; flex-direction:column; gap:3px;">
                <button id="mf-all" class="media-folder-btn active" onclick="switchMediaFolder('all')">
                    <i class="fas fa-layer-group"></i> All Media
                </button>
                <div id="custom-folders" style="display:flex; flex-direction:column; gap:3px;"></div>
            </div>
            <div style="padding:14px 10px; border-top:1px solid var(--border);">
                <button class="btn btn-outline" style="width:100%; font-size:0.82rem;" onclick="showCreateFolderModal()">
                    <i class="fas fa-folder-plus"></i> New Folder
                </button>
            </div>
        </aside>

        <!-- Main content -->
        <main style="flex:1; display:flex; flex-direction:column; min-width:0; overflow:hidden;">

            <!-- Toolbar -->
            <div style="padding:14px 20px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:12px; background:#fff; flex-shrink:0;">
                <div style="position:relative; flex:1; max-width:300px;">
                    <i class="fas fa-search" style="position:absolute; left:11px; top:50%; transform:translateY(-50%); color:var(--muted); font-size:0.8rem;"></i>
                    <input id="media-search-box" type="text" class="filter-input" placeholder="Search media..." style="padding-left:34px; width:100%;"
                        oninput="mediaSearchDebounce(this.value)">
                </div>
                <select class="filter-input" style="width:130px;" onchange="window.mediaState.type=this.value; fetchMedia()">
                    <option value="all">All Types</option>
                    <option value="image">Images</option>
                    <option value="video">Videos</option>
                    <option value="document">Documents</option>
                </select>
                <div style="margin-left:auto; display:flex; gap:10px; align-items:center;">
                    <button id="media-bulk-delete-btn" class="btn btn-danger" style="display:none; font-size:0.8rem; padding:6px 12px;" onclick="bulkDeleteMedia()">
                        <i class="fas fa-trash-alt"></i> Delete Selected
                    </button>
                    <span id="media-count-badge" style="font-size:0.78rem; color:var(--muted); font-weight:600;"></span>
                    <div id="upload-progress-container" style="display:none; align-items:center; gap:8px;">
                        <span id="upload-progress-text" style="font-size:0.75rem; color:var(--muted); font-weight:700;"></span>
                        <div style="width:100px; height:8px; background:#e2e8f0; border-radius:4px; overflow:hidden;">
                            <div id="upload-progress-bar" style="width:0%; height:100%; background:var(--accent); transition:width 0.2s, background 0.3s;"></div>
                        </div>
                    </div>
                    <input type="file" id="media-upload-input" multiple hidden onchange="handleMediaUpload(this)">
                    <button class="btn btn-primary" onclick="document.getElementById('media-upload-input').click()">
                        <i class="fas fa-cloud-upload-alt"></i> Upload
                    </button>
                </div>
            </div>

            <!-- List table header -->
            <div id="media-list-header" style="display:grid; grid-template-columns:36px 72px 1fr 90px 90px 120px 110px; align-items:center; padding:8px 20px; background:#f8fafc; border-bottom:2px solid var(--border); font-size:0.7rem; font-weight:800; text-transform:uppercase; letter-spacing:0.8px; color:var(--muted); flex-shrink:0;">
                <div style="display:flex; align-items:center;">
                    <input type="checkbox" id="media-select-all" onclick="toggleAllMedia(this.checked)" style="cursor:pointer; width:16px; height:16px;">
                </div>
                <div>Preview</div>
                <div>File Name</div>
                <div>Type</div>
                <div>Size</div>
                <div>Uploaded</div>
                <div>Actions</div>
            </div>

            <!-- List body -->
            <div id="media-list" style="flex:1; overflow-y:auto;"></div>
        </main>
    </div>`;

    fetchFolders();
    fetchMedia();
};

let _mediaSearchTimer = null;
window.mediaSearchDebounce = function(val) {
    clearTimeout(_mediaSearchTimer);
    _mediaSearchTimer = setTimeout(() => { window.mediaState.search = val; fetchMedia(); }, 350);
};

/* ─────────────────────── FOLDERS ─────────────────────── */
window.switchMediaFolder = function(id) {
    window.mediaState.folder = id;
    document.querySelectorAll('.media-folder-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(id === 'all' ? 'mf-all' : `mf-${id}`);
    if (btn) btn.classList.add('active');
    fetchMedia();
};

async function fetchFolders() {
    try {
        const res = await api(`/api/media/folders?business_id=${BIZ}`);
        const c = document.getElementById('custom-folders');
        if (!res.success || !c) return;
        c.innerHTML = res.folders.map(f => `
            <button id="mf-${f.id}" class="media-folder-btn ${window.mediaState.folder === f.id ? 'active' : ''}"
                onclick="switchMediaFolder('${f.id}')">
                <i class="fas fa-folder"></i> ${f.folder_name}
            </button>`).join('');
    } catch(e) { console.error('folders error', e); }
}

window.showCreateFolderModal = function() {
    openModal('New Folder', `
        <div style="display:flex; flex-direction:column; gap:16px; padding:8px 0;">
            <div class="form-row">
                <label>Folder Name</label>
                <input id="new-folder-name" class="filter-input" placeholder="e.g. Products, Banners..." style="width:100%;"
                    onkeydown="if(event.key==='Enter') saveNewFolder()">
            </div>
            <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:4px;">
                <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="saveNewFolder()"><i class="fas fa-folder-plus"></i> Create</button>
            </div>
        </div>`);
    setTimeout(() => document.getElementById('new-folder-name')?.focus(), 80);
};

window.saveNewFolder = async function() {
    const inp = document.getElementById('new-folder-name');
    const name = (inp?.value || '').trim();
    if (!name) { inp && (inp.style.borderColor = 'var(--danger)'); return; }
    try {
        const r = await postAPI('/api/media/folders', { business_id: BIZ, folder_name: name });
        if (r.success) { toast('Folder created!', 'success'); closeModal(); fetchFolders(); }
        else toast(r.error || 'Error', 'error');
    } catch(e) { toast('Network error', 'error'); }
};

/* ─────────────────────── FETCH & RENDER ─────────────────────── */
async function fetchMedia() {
    const list = document.getElementById('media-list');
    if (!list) return;
    list.innerHTML = `<div style="text-align:center; padding:48px; color:var(--muted);"><div class="spinner"></div></div>`;

    const { folder, search, type } = window.mediaState;
    const q = new URLSearchParams({ business_id: BIZ });
    if (folder && folder !== 'all') q.append('folder_id', folder);
    if (search)                    q.append('search', search);
    if (type && type !== 'all')    q.append('type', type);

    try {
        const res = await api(`/api/media?${q}`);
        if (!res.success) {
            list.innerHTML = `<div style="text-align:center; padding:48px; color:var(--danger);">
                <i class="fas fa-exclamation-triangle" style="font-size:2rem; margin-bottom:12px; display:block;"></i>
                <b>Failed to load:</b> ${res.error || 'Unknown error'}</div>`;
            return;
        }
        window.mediaState.data = res.data;
        const badge = document.getElementById('media-count-badge');
        if (badge) badge.textContent = `${res.data.length} item${res.data.length !== 1 ? 's' : ''}`;
        renderList(res.data);
        if (typeof updateMediaBulkActions === 'function') updateMediaBulkActions();
    } catch(e) {
        list.innerHTML = `<div style="text-align:center; padding:48px; color:var(--danger);"><i class="fas fa-wifi" style="font-size:2rem; margin-bottom:12px; display:block;"></i>Network error</div>`;
    }
}

function renderList(data) {
    const list = document.getElementById('media-list');
    if (!list) return;

    const isSelector = window.mediaState.mode === 'selector';

    if (!data || !data.length) {
        list.innerHTML = `
        <div style="text-align:center; padding:80px 20px; color:var(--muted);">
            <i class="fas fa-images" style="font-size:4rem; opacity:0.15; margin-bottom:20px; display:block;"></i>
            <div style="font-size:1rem; font-weight:700; margin-bottom:8px;">No media found</div>
            <div style="font-size:0.85rem;">Upload files using the button above or change the filter.</div>
        </div>`;
        return;
    }

    list.innerHTML = data.map((m, i) => {
        const thumb   = m.thumbnail_url || m.file_url || '';
        const isImg   = m.file_type === 'image';
        const isVid   = m.file_type === 'video';
        const kb      = m.size ? (m.size > 1024*1024 ? (m.size/1024/1024).toFixed(1)+' MB' : (m.size/1024).toFixed(1)+' KB') : '—';
        const date    = m.created_at ? new Date(m.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';
        const rowBg   = i % 2 === 0 ? '#fff' : '#fafafa';

        const thumbHtml = isImg
            ? `<img
                src="${thumb}"
                width="56" height="56"
                style="width:56px; height:56px; object-fit:cover; border-radius:8px; display:block; border:1px solid var(--border);"
                onerror="this.onerror=null; this.src=''; this.style.display='none'; this.nextElementSibling.style.display='flex';">
               <div style="display:none; width:56px; height:56px; border-radius:8px; background:#f1f5f9; border:1px solid var(--border); align-items:center; justify-content:center;">
                   <i class="fas fa-image" style="color:#94a3b8; font-size:1.4rem;"></i>
               </div>`
            : isVid
            ? `<div style="width:56px; height:56px; border-radius:8px; background:#f0fdf4; border:1px solid #bbf7d0; display:flex; align-items:center; justify-content:center;">
                   <i class="fas fa-play-circle" style="color:var(--accent); font-size:1.6rem;"></i>
               </div>`
            : `<div style="width:56px; height:56px; border-radius:8px; background:#f8fafc; border:1px solid var(--border); display:flex; align-items:center; justify-content:center;">
                   <i class="fas fa-file-alt" style="color:#94a3b8; font-size:1.4rem;"></i>
               </div>`;

        const typeBadge = `<span style="padding:3px 9px; border-radius:20px; font-size:0.65rem; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;
            background:${isImg ? '#dcfce7' : isVid ? '#dbeafe' : '#f1f5f9'};
            color:${isImg ? '#15803d' : isVid ? '#1d4ed8' : '#475569'};">${m.file_type}</span>`;

        const actionBtns = isSelector
            ? `<button class="btn btn-primary" style="padding:5px 14px; font-size:0.78rem;" onclick="selectMediaItem('${m.id}')">
                   <i class="fas fa-check"></i> Select
               </button>`
            : `<div style="display:flex; gap:6px; align-items:center;">
                   <button title="Preview" onclick="previewMediaItem('${m.id}')" style="background:none; border:none; cursor:pointer; color:var(--accent); font-size:1rem; padding:4px 6px;" onmouseenter="this.style.opacity='.7'" onmouseleave="this.style.opacity='1'">
                       <i class="fas fa-eye"></i>
                   </button>
                   <button title="Rename" onclick="openInlineRename('${m.id}')" style="background:none; border:none; cursor:pointer; color:var(--muted); font-size:0.9rem; padding:4px 6px;" onmouseenter="this.style.color='var(--accent)'" onmouseleave="this.style.color='var(--muted)'">
                       <i class="fas fa-pen"></i>
                   </button>
                   <input type="file" id="rpl-${m.id}" hidden onchange="replaceMediaItem('${m.id}', this)">
                   <button title="Replace" onclick="document.getElementById('rpl-${m.id}').click()" style="background:none; border:none; cursor:pointer; color:var(--muted); font-size:0.9rem; padding:4px 6px;" onmouseenter="this.style.color='var(--accent)'" onmouseleave="this.style.color='var(--muted)'">
                       <i class="fas fa-sync-alt"></i>
                   </button>
                   <a href="${m.file_url}" download="${m.file_name}" title="Download" style="color:var(--muted); font-size:0.9rem; padding:4px 6px; text-decoration:none;" onmouseenter="this.style.color='var(--accent)'" onmouseleave="this.style.color='var(--muted)'">
                       <i class="fas fa-download"></i>
                   </a>
                   <button title="Delete" onclick="deleteMediaItem('${m.id}')" style="background:none; border:none; cursor:pointer; color:#ef4444; font-size:0.9rem; padding:4px 6px; opacity:0.6;" onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='.6'">
                       <i class="fas fa-trash"></i>
                   </button>
               </div>`;

        return `
        <div id="ml-row-${m.id}" style="display:grid; grid-template-columns:36px 72px 1fr 90px 90px 120px 110px; align-items:center; padding:10px 20px; background:${rowBg}; border-bottom:1px solid #f1f5f9; transition:background .15s;"
            onmouseenter="this.style.background='#f0fdf4'"
            onmouseleave="this.style.background='${rowBg}'">

            <!-- Checkbox -->
            <div style="display:flex; align-items:center;">
                <input type="checkbox" class="media-row-checkbox" value="${m.id}" onclick="updateMediaBulkActions()" style="cursor:pointer; width:16px; height:16px;">
            </div>

            <!-- Thumb -->
            <div style="display:flex; align-items:center;">${thumbHtml}</div>

            <!-- Name -->
            <div style="padding-right:16px; min-width:0;">
                <div id="ml-name-${m.id}" style="font-size:0.84rem; font-weight:700; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:pointer;"
                    title="${m.file_name}" ondblclick="openInlineRename('${m.id}')">${m.file_name}</div>
                <div style="font-size:0.7rem; color:var(--muted); margin-top:2px;">${m.width && m.height ? m.width + ' × ' + m.height + ' px' : ''}</div>
            </div>

            <!-- Type -->
            <div>${typeBadge}</div>

            <!-- Size -->
            <div style="font-size:0.8rem; color:var(--muted); font-weight:600;">${kb}</div>

            <!-- Date -->
            <div style="font-size:0.78rem; color:var(--muted);">${date}</div>

            <!-- Actions -->
            <div>${actionBtns}</div>
        </div>`;
    }).join('');
}

/* ─────────────────────── INLINE RENAME ─────────────────────── */
window.openInlineRename = function(id) {
    const m = window.mediaState.data.find(x => x.id === id);
    if (!m) return;
    const nameEl = document.getElementById(`ml-name-${id}`);
    if (!nameEl) return;
    const oldName = m.file_name;
    nameEl.innerHTML = `
        <input id="inline-rename-${id}" type="text" value="${oldName}"
            style="width:100%; font-size:0.84rem; font-weight:700; border:1.5px solid var(--accent); border-radius:6px; padding:3px 8px; outline:none; color:var(--text);"
            onkeydown="if(event.key==='Enter'){event.preventDefault(); commitRename('${id}', '${oldName}');} if(event.key==='Escape'){restoreNameEl('${id}','${oldName}');}">
        <span style="font-size:0.68rem; color:var(--muted);">Enter to save · Esc to cancel</span>`;
    const inp = document.getElementById(`inline-rename-${id}`);
    if (inp) { inp.focus(); inp.select(); inp.addEventListener('blur', () => setTimeout(() => commitRename('${id}', '${oldName}'), 150)); }
};

window.restoreNameEl = function(id, name) {
    const el = document.getElementById(`ml-name-${id}`);
    if (el) el.innerHTML = name;
};

window.commitRename = async function(id, oldName) {
    const inp = document.getElementById(`inline-rename-${id}`);
    if (!inp) return;
    const newName = (inp.value || '').trim();
    if (!newName || newName === oldName) { restoreNameEl(id, oldName); return; }
    try {
        const r = await putAPI(`/api/media/${id}/rename`, { file_name: newName });
        if (r.success) {
            toast('Renamed!', 'success');
            const m = window.mediaState.data.find(x => x.id === id);
            if (m) m.file_name = newName;
            const el = document.getElementById(`ml-name-${id}`);
            if (el) { el.textContent = newName; el.title = newName; }
        } else {
            toast(r.error || 'Rename failed', 'error');
            restoreNameEl(id, oldName);
        }
    } catch(e) {
        toast('Network error', 'error');
        restoreNameEl(id, oldName);
    }
};

/* ─────────────────────── UPLOAD ─────────────────────── */
window.handleMediaUpload = async function(input) {
    const files = Array.from(input.files || []);
    if (!files.length) return;
    
    const isSelector = window.mediaState.mode === 'selector';
    const cont = document.getElementById(isSelector ? 'sel-upload-progress-container' : 'upload-progress-container');
    const progText = document.getElementById(isSelector ? 'sel-upload-progress-text' : 'upload-progress-text');
    const progBar = document.getElementById(isSelector ? 'sel-upload-progress-bar' : 'upload-progress-bar');
    
    let done = 0;
    let successCount = 0;
    
    if (cont) cont.style.display = 'flex';
    if (progText) progText.textContent = `0 / ${files.length}`;
    if (progBar) { progBar.style.width = `0%`; progBar.style.background = 'var(--accent)'; }

    for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('business_id', BIZ);
        fd.append('module_name', 'gallery');
        if (window.mediaState.folder && window.mediaState.folder !== 'all')
            fd.append('folder_id', window.mediaState.folder);
        try {
            const r = await fetch('/api/media/upload', { method:'POST', body:fd }).then(res => res.json());
            done++;
            if (r.success) {
                successCount++;
            } else {
                toast(`❌ ${file.name}: ${r.error}`, 'error');
            }
        } catch(e) {
            done++;
            toast(`❌ ${file.name}: network error`, 'error');
        }
        
        if (progText) progText.textContent = `${done} / ${files.length}`;
        if (progBar) progBar.style.width = `${(done / files.length) * 100}%`;
    }

    input.value = '';
    
    if (successCount > 0) {
        toast(`${successCount} media file(s) uploaded successfully!`, 'success');
        if (progText) progText.innerHTML = `<i class="fas fa-check-circle" style="color:#10b981;"></i> Complete`;
        if (progBar) progBar.style.background = '#10b981';
    }

    setTimeout(() => { 
        if (cont) cont.style.display = 'none'; 
    }, 3500);

    fetchMedia();
};

/* ─────────────────────── SELECTOR MODE ─────────────────────── */
window.openMediaSelector = function(inputId, previewBoxId, moduleName) {
    moduleName = moduleName || 'general';
    window.mediaState.mode          = 'selector';
    window.mediaState.targetInput   = inputId;
    window.mediaState.targetPreview = previewBoxId;
    window.mediaState.targetModule  = moduleName;

    openModal('Select Media', `
        <div style="height:65vh; display:flex; flex-direction:column; gap:10px;">
            <div style="display:flex; gap:10px; align-items:center; flex-shrink:0;">
                <div style="position:relative; flex:1;">
                    <i class="fas fa-search" style="position:absolute; left:11px; top:50%; transform:translateY(-50%); color:var(--muted);"></i>
                    <input type="text" class="filter-input" placeholder="Search..." style="padding-left:34px; width:100%;"
                        oninput="window.mediaState.search=this.value; fetchMedia()">
                </div>
                <select class="filter-input" style="width:120px;" onchange="window.mediaState.type=this.value; fetchMedia()">
                    <option value="all">All</option>
                    <option value="image">Images</option>
                    <option value="video">Videos</option>
                </select>
                <div id="sel-upload-progress-container" style="display:none; align-items:center; gap:8px;">
                    <span id="sel-upload-progress-text" style="font-size:0.75rem; color:var(--muted); font-weight:700;"></span>
                    <div style="width:80px; height:8px; background:#e2e8f0; border-radius:4px; overflow:hidden;">
                        <div id="sel-upload-progress-bar" style="width:0%; height:100%; background:var(--accent); transition:width 0.2s, background 0.3s;"></div>
                    </div>
                </div>
                <input type="file" id="sel-upload-input" multiple hidden onchange="handleMediaUpload(this)">
                <button class="btn btn-primary" onclick="document.getElementById('sel-upload-input').click()">
                    <i class="fas fa-plus"></i> Upload
                </button>
            </div>
            <!-- Table Header -->
            <div style="display:grid; grid-template-columns:60px 1fr 80px 100px; padding:6px 16px; background:#f8fafc; border:1px solid var(--border); border-radius:8px; font-size:0.68rem; font-weight:800; text-transform:uppercase; color:var(--muted); flex-shrink:0;">
                <div>Preview</div><div>File Name</div><div>Type</div><div>Action</div>
            </div>
            <div id="media-list" style="flex:1; overflow-y:auto; border:1px solid var(--border); border-radius:8px;">
                <div style="text-align:center; padding:32px;"><div class="spinner"></div></div>
            </div>
        </div>
    `, 'modal-lg');

    fetchMedia();
};

window.selectMediaItem = function(id) {
    const m = window.mediaState.data.find(x => x.id === id);
    if (!m) return;
    const input   = document.getElementById(window.mediaState.targetInput);
    const preview = document.getElementById(window.mediaState.targetPreview);
    if (input)   input.value = m.file_url;
    if (preview) {
        preview.innerHTML = m.file_type === 'image'
            ? `<img src="${m.file_url}" style="width:100%; height:100%; object-fit:contain;">`
            : `<i class="fas fa-file-alt" style="font-size:2rem; color:var(--muted);"></i>`;
        preview.classList.add('has-image');
    }
    postAPI('/api/media/usage', { media_id:id, module_name:window.mediaState.targetModule, reference_id:'new' }).catch(()=>{});
    closeModal();
    toast('Media selected!', 'success');
    window.mediaState.mode = 'library';
};

/* ─────────────────────── PREVIEW MODAL ─────────────────────── */
window.previewMediaItem = function(id) {
    const m = window.mediaState.data.find(x => x.id === id);
    if (!m) return;
    const tags = (() => { try { return typeof m.tags === 'string' ? JSON.parse(m.tags) : (m.tags || []); } catch(e) { return []; }})();

    openModal('Media Preview', `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; min-height:380px;">

            <!-- Preview pane -->
            <div style="background:#f1f5f9; border-radius:12px; border:1px solid var(--border); display:flex; align-items:center; justify-content:center; overflow:hidden; min-height:300px;">
                ${m.file_type === 'image'
                    ? `<img src="${m.file_url}"
                           style="max-width:100%; max-height:380px; object-fit:contain; display:block;"
                           onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                       <div style="display:none; flex-direction:column; align-items:center; gap:10px; color:#94a3b8; padding:40px;">
                           <i class="fas fa-image" style="font-size:3rem;"></i>
                           <span>Image unavailable</span>
                       </div>`
                    : m.file_type === 'video'
                    ? `<video controls src="${m.file_url}" style="max-width:100%; max-height:380px; border-radius:8px;"></video>`
                    : `<div style="text-align:center; padding:40px; color:#94a3b8;">
                           <i class="fas fa-file-alt" style="font-size:4rem; margin-bottom:10px; display:block;"></i>
                           ${m.file_name}
                       </div>`}
            </div>

            <!-- Info pane -->
            <div style="display:flex; flex-direction:column; gap:14px;">
                <div style="font-size:0.65rem; font-weight:800; color:var(--muted); text-transform:uppercase; letter-spacing:1px;">File Name</div>
                <input id="preview-rename-${m.id}" type="text" value="${m.file_name}"
                    class="filter-input" style="font-weight:700; font-size:0.85rem;"
                    onkeydown="if(event.key==='Enter') renameFromPreview('${m.id}')">
                <button class="btn btn-outline" style="font-size:0.8rem; align-self:flex-start; padding:6px 14px;" onclick="renameFromPreview('${m.id}')">
                    <i class="fas fa-pen"></i> Save Name
                </button>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:0.82rem;">
                    <div><div style="font-size:0.6rem; font-weight:700; color:var(--muted); text-transform:uppercase; margin-bottom:3px;">Type</div><b>${m.file_type}</b></div>
                    <div><div style="font-size:0.6rem; font-weight:700; color:var(--muted); text-transform:uppercase; margin-bottom:3px;">Size</div><b>${m.size ? (m.size/1024).toFixed(1)+' KB' : '—'}</b></div>
                    <div><div style="font-size:0.6rem; font-weight:700; color:var(--muted); text-transform:uppercase; margin-bottom:3px;">Dimensions</div><b>${m.width ? m.width+'×'+m.height : '—'}</b></div>
                    <div><div style="font-size:0.6rem; font-weight:700; color:var(--muted); text-transform:uppercase; margin-bottom:3px;">Uploaded</div><b>${new Date(m.created_at).toLocaleDateString('en-IN')}</b></div>
                </div>

                <div>
                    <div style="font-size:0.6rem; font-weight:700; color:var(--muted); text-transform:uppercase; margin-bottom:6px;">Tags</div>
                    <div style="display:flex; flex-wrap:wrap; gap:5px;">
                        ${tags.length ? tags.map(t => `<span style="background:#dcfce7; color:#15803d; padding:2px 10px; border-radius:20px; font-size:0.72rem; font-weight:700;">${t}</span>`).join('') : '<span style="color:var(--muted); font-size:0.78rem;">None</span>'}
                    </div>
                </div>

                <div style="background:#f8fafc; border-radius:8px; padding:8px 12px; display:flex; gap:8px; align-items:center; margin-top:auto;">
                    <input type="text" value="${m.file_url}" readonly style="flex:1; font-size:0.7rem; border:none; background:transparent; color:#475569; outline:none;">
                    <button class="btn btn-sm btn-outline" style="padding:3px 10px; font-size:0.7rem;" onclick="navigator.clipboard.writeText('${m.file_url}').then(()=>toast('Copied!','success'))">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>

                <div style="display:flex; flex-direction:column; gap:8px; margin-top:4px;">
                    <div style="display:flex; gap:8px;">
                        <input type="file" id="rpl2-${m.id}" hidden onchange="replaceMediaItem('${m.id}', this)">
                        <button class="btn btn-outline" style="flex:1; font-size:0.82rem;" onclick="document.getElementById('rpl2-${m.id}').click()">
                            <i class="fas fa-sync-alt"></i> Replace
                        </button>
                        <a href="${m.file_url}" download="${m.file_name}" class="btn btn-outline" style="flex:1; font-size:0.82rem; text-align:center;">
                            <i class="fas fa-download"></i> Download
                        </a>
                    </div>
                    <button class="btn btn-danger" style="font-size:0.82rem;" onclick="deleteMediaItem('${m.id}')">
                        <i class="fas fa-trash-alt"></i> Delete Permanently
                    </button>
                </div>
            </div>
        </div>
    `, 'modal-lg');
};

window.renameFromPreview = async function(id) {
    const inp = document.getElementById(`preview-rename-${id}`);
    if (!inp) return;
    const newName = inp.value.trim();
    if (!newName) return;
    try {
        const r = await putAPI(`/api/media/${id}/rename`, { file_name: newName });
        if (r.success) {
            toast('Renamed!', 'success');
            const m = window.mediaState.data.find(x => x.id === id);
            if (m) m.file_name = newName;
            // Update the list row name if visible
            const el = document.getElementById(`ml-name-${id}`);
            if (el) { el.textContent = newName; el.title = newName; }
        } else toast(r.error || 'Rename failed', 'error');
    } catch(e) { toast('Network error', 'error'); }
};

/* ─────────────────────── ACTIONS ─────────────────────── */
window.replaceMediaItem = async function(id, input) {
    if (!input.files.length) return;
    if (!confirm('Replace this file globally across the system?')) return;
    toast('Uploading replacement...', 'info');
    const fd = new FormData();
    fd.append('file', input.files[0]);
    try {
        const r = await fetch(`/api/media/replace/${id}`, { method:'POST', body:fd }).then(res => res.json());
        if (r.success) { toast('Replaced!', 'success'); closeModal(); fetchMedia(); }
        else toast(r.error || 'Replace failed', 'error');
    } catch(e) { toast('Network error', 'error'); }
};

window.deleteMediaItem = async function(id) {
    if (!confirm('Delete permanently? This cannot be undone.')) return;
    try {
        const r = await api(`/api/media/${id}`, { method:'DELETE' });
        if (r.success) {
            toast('Deleted!', 'success');
            closeModal();
            // Remove row immediately
            const row = document.getElementById(`ml-row-${id}`);
            if (row) row.remove();
            window.mediaState.data = window.mediaState.data.filter(x => x.id !== id);
            const badge = document.getElementById('media-count-badge');
            if (badge) badge.textContent = `${window.mediaState.data.length} items`;
            updateMediaBulkActions();
        } else toast(r.error || 'Delete failed', 'error');
    } catch(e) { toast('Network error', 'error'); }
};

window.toggleAllMedia = function(checked) {
    document.querySelectorAll('.media-row-checkbox').forEach(cb => cb.checked = checked);
    updateMediaBulkActions();
};

window.updateMediaBulkActions = function() {
    const checked = document.querySelectorAll('.media-row-checkbox:checked').length;
    const allCb = document.getElementById('media-select-all');
    const total = document.querySelectorAll('.media-row-checkbox').length;
    if (allCb) allCb.checked = (checked === total && total > 0);

    const btn = document.getElementById('media-bulk-delete-btn');
    if (btn) {
        btn.style.display = checked > 0 ? 'inline-flex' : 'none';
        btn.innerHTML = `<i class="fas fa-trash-alt"></i> Delete Selected (${checked})`;
    }
};

window.bulkDeleteMedia = async function() {
    const checked = Array.from(document.querySelectorAll('.media-row-checkbox:checked')).map(cb => cb.value);
    if (!checked.length) return;
    if (!confirm(`Permanently delete ${checked.length} selected items?`)) return;

    let successCount = 0;
    const btn = document.getElementById('media-bulk-delete-btn');
    if (btn) btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Deleting...`;

    // Process deletions
    for (const id of checked) {
        try {
            const r = await api(`/api/media/${id}`, { method: 'DELETE' });
            if (r.success) successCount++;
        } catch(e) {}
    }
    
    if (successCount === checked.length) toast('Selected media deleted successfully!', 'success');
    else toast(`Deleted ${successCount} of ${checked.length} items.`, 'warning');

    fetchMedia();
};
