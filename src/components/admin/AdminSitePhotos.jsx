import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Image, Plus, Trash2, Edit3, Save, X, Upload,
  Link as LinkIcon, Eye, ChevronUp, ChevronDown,
  CheckCircle, RefreshCw, Monitor, Home, UtensilsCrossed,
  Star, CalendarDays, Images, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import './AdminComponents.css';

/* ═══════════════════════════════════════════════════════════════════
   SECTION DEFINITIONS
   Each section maps to a logical_section value stored in site_photos
═══════════════════════════════════════════════════════════════════ */
const SECTIONS = [
  {
    key: 'hero',
    label: 'Hero Slideshow',
    icon: <Home size={16}/>,
    description: 'Full-screen slideshow on the homepage. Each photo shows as a background slide with a title, tag and subtitle.',
    fields: ['title','tag','subtitle'],
    maxItems: 6,
    aspectHint: '16:9 — 1600×900px recommended',
  },
  {
    key: 'menu_header',
    label: 'Menu Page Header',
    icon: <UtensilsCrossed size={16}/>,
    description: 'Hero banner at the top of the Menu page.',
    fields: ['caption'],
    maxItems: 1,
    aspectHint: '16:5 wide banner — 1400×440px recommended',
  },
  {
    key: 'reservation_header',
    label: 'Reservation Page Header',
    icon: <CalendarDays size={16}/>,
    description: 'Hero banner at the top of the Reservation/Book a Table page.',
    fields: ['caption'],
    maxItems: 1,
    aspectHint: '16:5 wide banner — 1400×440px recommended',
  },
  {
    key: 'reviews_header',
    label: 'Reviews Page Header',
    icon: <Star size={16}/>,
    description: 'Hero banner at the top of the Reviews page.',
    fields: ['caption'],
    maxItems: 1,
    aspectHint: '16:5 wide banner — 1400×440px recommended',
  },
  {
    key: 'gallery_header',
    label: 'Gallery Page Header',
    icon: <Images size={16}/>,
    description: 'Hero banner at the top of the public Gallery page.',
    fields: ['caption'],
    maxItems: 1,
    aspectHint: '16:5 wide banner — 1400×440px recommended',
  },
  {
    key: 'gallery_food',
    label: 'Gallery — Food',
    icon: <Images size={16}/>,
    description: 'Food photos shown in the public Gallery page under the Food filter.',
    fields: ['caption'],
    maxItems: 30,
    aspectHint: 'Any ratio — square or portrait works well',
  },
  {
    key: 'gallery_ambiance',
    label: 'Gallery — Ambiance',
    icon: <Images size={16}/>,
    description: 'Restaurant ambiance photos shown in the public Gallery page.',
    fields: ['caption'],
    maxItems: 30,
    aspectHint: 'Landscape 3:2 — 900×600px recommended',
  },
  {
    key: 'gallery_events',
    label: 'Gallery — Events',
    icon: <Images size={16}/>,
    description: 'Event and special occasion photos shown in the public Gallery page.',
    fields: ['caption'],
    maxItems: 30,
    aspectHint: 'Any ratio',
  },
];

/* ═══════════════════════════════════════════════════════════════════
   UPLOAD HELPER — tries Supabase Storage, falls back to base64
═══════════════════════════════════════════════════════════════════ */
async function uploadFile(file, folder = 'site') {
  const ext      = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage
    .from('restaurant-images')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });
  if (error) return null; // caller handles fallback
  const { data: { publicUrl } } = supabase.storage
    .from('restaurant-images')
    .getPublicUrl(data.path);
  return publicUrl;
}

function base64(file) {
  return new Promise(res => {
    const r = new FileReader();
    r.onload = e => res(e.target.result);
    r.readAsDataURL(file);
  });
}

/* ═══════════════════════════════════════════════════════════════════
   IMAGE UPLOAD WIDGET (reusable)
═══════════════════════════════════════════════════════════════════ */
function ImageUploadWidget({ value, onChange, folder }) {
  const [mode, setMode]         = useState('url');
  const [preview, setPreview]   = useState(value || '');
  const [uploading, setUploading] = useState(false);
  const fileRef                 = useRef();

  const handleUrl = (e) => {
    const v = e.target.value;
    setPreview(v);
    onChange(v);
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const local = URL.createObjectURL(file);
    setPreview(local);
    let url = await uploadFile(file, folder);
    if (!url) {
      url = await base64(file);
      toast('Saved locally. Set up Supabase Storage bucket "restaurant-images" for production.', { icon: 'ℹ️' });
    } else {
      toast.success('Uploaded!');
    }
    onChange(url);
    setPreview(url);
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div className="gallery-upload-toggle">
        <button type="button"
          className={`gallery-upload-toggle__btn ${mode==='url'?'gallery-upload-toggle__btn--active':''}`}
          onClick={() => setMode('url')}>
          <LinkIcon size={13}/> Paste URL
        </button>
        <button type="button"
          className={`gallery-upload-toggle__btn ${mode==='file'?'gallery-upload-toggle__btn--active':''}`}
          onClick={() => setMode('file')}>
          <Upload size={13}/> Upload File
        </button>
      </div>

      {mode === 'url' && (
        <input className="form-input" placeholder="https://..." value={value} onChange={handleUrl} />
      )}
      {mode === 'file' && (
        <>
          <div className="gallery-upload-dropzone" onClick={() => fileRef.current.click()} style={{ cursor:'pointer' }}>
            {uploading ? (
              <div style={{ textAlign:'center' }}>
                <div className="spinner" style={{ margin:'0 auto 8px', width:24, height:24, borderWidth:2 }}/>
                <p style={{ fontSize:12, color:'var(--text-muted)' }}>Uploading…</p>
              </div>
            ) : preview ? (
              <p style={{ fontSize:13, color:'var(--jade-dark)', fontWeight:500 }}>✓ Image ready. Click to change.</p>
            ) : (
              <>
                <Upload size={26} style={{ color:'var(--amber-light)', marginBottom:8 }}/>
                <p style={{ fontSize:13, fontWeight:500, color:'var(--brown)' }}>Click to choose a file</p>
                <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>JPG, PNG, WebP</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile}/>
        </>
      )}

      {preview && (
        <div style={{ position:'relative', borderRadius:8, overflow:'hidden', height:140 }}>
          <img src={preview} alt="Preview" style={{ width:'100%', height:'100%', objectFit:'cover' }}
            onError={() => setPreview('')}/>
          <button type="button"
            style={{ position:'absolute', top:6, right:6, background:'rgba(0,0,0,0.6)', color:'#fff', borderRadius:'50%', width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center' }}
            onClick={() => { setPreview(''); onChange(''); }}>
            <X size={13}/>
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ADD / EDIT MODAL
═══════════════════════════════════════════════════════════════════ */
function PhotoModal({ section, editing, onClose, onSaved }) {
  const isEdit = !!editing;
  const [form, setForm] = useState(
    editing
      ? { image_url: editing.image_url, title: editing.title||'', tag: editing.tag||'', subtitle: editing.subtitle||'', caption: editing.caption||'', sort_order: editing.sort_order||0, active: editing.active !== false }
      : { image_url:'', title:'', tag:'', subtitle:'', caption:'', sort_order:0, active:true }
  );
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.image_url) { toast.error('Please provide an image.'); return; }
    setSaving(true);

    const payload = {
      logical_section: section.key,
      image_url: form.image_url,
      caption:   form.caption || '',
      sort_order: parseInt(form.sort_order) || 0,
      active:    form.active,
    };
    if (section.fields?.includes('title'))    payload.title    = form.title;
    if (section.fields?.includes('tag'))      payload.tag      = form.tag;
    if (section.fields?.includes('subtitle')) payload.subtitle = form.subtitle;

    let error;
    if (isEdit) {
      ({ error } = await supabase.from('site_photos').update(payload).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('site_photos').insert([payload]));
    }
    setSaving(false);
    if (error) { toast.error('Save failed: ' + error.message); return; }
    toast.success(isEdit ? 'Photo updated!' : 'Photo added!');
    onSaved();
  };

  /* Rendered through a portal straight into <body>.
     This is the fix for the "cropped popup" bug: the Site Photos panel
     (.site-section-panel) uses `backdrop-filter` in dark mode, and any
     element with an active backdrop-filter/filter/transform becomes a new
     "containing block" for its `position: fixed` children in CSS. That was
     silently trapping this modal inside the small panel box instead of the
     full viewport. Rendering it into document.body sidesteps that entirely,
     regardless of whatever CSS any future ancestor might have. */
  return createPortal(
    <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal" style={{ maxWidth:520 }}>
        <div className="admin-modal__header">
          <h3>{isEdit ? 'Edit Photo' : `Add to ${section.label}`}</h3>
          <button className="admin-modal__close" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={handleSave}>
          <div className="admin-modal__body" style={{ display:'flex', flexDirection:'column', gap:16 }}>

            <div className="form-group">
              <label>Image <span style={{ color:'var(--amber)', fontSize:11 }}>{section.aspectHint}</span></label>
              <ImageUploadWidget
                value={form.image_url}
                onChange={v => set('image_url', v)}
                folder={section.key}
              />
            </div>

            {section.fields?.includes('tag') && (
              <div className="form-group">
                <label>Tag / Label <span style={{ fontSize:11, color:'var(--text-muted)' }}>e.g. "Signature Dish"</span></label>
                <input className="form-input" value={form.tag} onChange={e => set('tag', e.target.value)} placeholder="Signature Dish" />
              </div>
            )}
            {section.fields?.includes('title') && (
              <div className="form-group">
                <label>Slide Title <span style={{ fontSize:11, color:'var(--text-muted)' }}>shown on hero</span></label>
                <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ohn No Khao Swe" />
              </div>
            )}
            {section.fields?.includes('subtitle') && (
              <div className="form-group">
                <label>Subtitle</label>
                <input className="form-input" value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="Burma's iconic coconut chicken noodle soup" />
              </div>
            )}
            {section.fields?.includes('caption') && (
              <div className="form-group">
                <label>Caption</label>
                <input className="form-input" value={form.caption} onChange={e => set('caption', e.target.value)} placeholder="e.g. Our dining room at dusk" />
              </div>
            )}

            <div className="admin-form-grid">
              <div className="form-group">
                <label>Sort Order <span style={{ fontSize:11, color:'var(--text-muted)' }}>lower = first</span></label>
                <input type="number" className="form-input" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} />
              </div>
              <div className="form-group" style={{ display:'flex', alignItems:'flex-end', paddingBottom:2 }}>
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', marginBottom:0 }}>
                  <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} />
                  <span>Active / Visible</span>
                </label>
              </div>
            </div>
          </div>
          <div className="admin-modal__footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Photo'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PHOTO CARD
═══════════════════════════════════════════════════════════════════ */
function PhotoCard({ photo, section, onEdit, onDelete, onMove, isFirst, isLast }) {
  return (
    <div className="site-photo-card">
      <div className="site-photo-card__img">
        <img
          src={photo.image_url}
          alt={photo.caption || photo.title || 'Photo'}
          loading="lazy"
          onError={e => { e.target.src = 'https://placehold.co/400x240/2a2218/c27a2a?text=Image+Error'; }}
        />
        {!photo.active && (
          <div className="site-photo-card__hidden-badge">Hidden</div>
        )}
      </div>
      <div className="site-photo-card__body">
        <div className="site-photo-card__meta">
          {photo.title && <p className="site-photo-card__title">{photo.title}</p>}
          {photo.tag   && <span className="site-photo-card__tag">{photo.tag}</span>}
          {photo.caption && !photo.title && <p className="site-photo-card__caption">{photo.caption}</p>}
          <span className="site-photo-card__order">#{photo.sort_order}</span>
        </div>
        <div className="site-photo-card__actions">
          <button className="site-photo-card__btn" onClick={() => onMove(photo, 'up')} disabled={isFirst} title="Move up">
            <ChevronUp size={14}/>
          </button>
          <button className="site-photo-card__btn" onClick={() => onMove(photo, 'down')} disabled={isLast} title="Move down">
            <ChevronDown size={14}/>
          </button>
          <button className="site-photo-card__btn site-photo-card__btn--edit" onClick={() => onEdit(photo)} title="Edit">
            <Edit3 size={14}/>
          </button>
          <button className="site-photo-card__btn site-photo-card__btn--delete" onClick={() => onDelete(photo)} title="Remove">
            <Trash2 size={14}/>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION PANEL
═══════════════════════════════════════════════════════════════════ */
function SectionPanel({ section, allPhotos, onRefresh }) {
  const photos  = allPhotos
    .filter(p => p.logical_section === section.key)
    .sort((a,b) => a.sort_order - b.sort_order);
  const [modal,   setModal]   = useState(null); // null | 'add' | photo-obj
  const atMax = photos.length >= section.maxItems;

  const handleDelete = async (photo) => {
    if (!window.confirm(`Remove this photo from ${section.label}?`)) return;
    const { error } = await supabase.from('site_photos').delete().eq('id', photo.id);
    if (error) { toast.error('Delete failed: ' + error.message); return; }
    if (photo.image_url?.includes('supabase') && photo.image_url?.includes('restaurant-images')) {
      const path = photo.image_url.split('restaurant-images/')[1];
      if (path) await supabase.storage.from('restaurant-images').remove([path]);
    }
    toast.success('Photo removed.');
    onRefresh();
  };

  const handleMove = async (photo, dir) => {
    const sorted = [...photos];
    const idx = sorted.findIndex(p => p.id === photo.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    await Promise.all([
      supabase.from('site_photos').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('site_photos').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
    onRefresh();
  };

  return (
    <div className="site-section-panel">
      <div className="site-section-panel__header">
        <div className="site-section-panel__title">
          <span className="site-section-panel__icon">{section.icon}</span>
          <div>
            <h3>{section.label}</h3>
            <p>{section.description}</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <span className="site-section-panel__count">
            {photos.length} / {section.maxItems}
          </span>
          <button
            className="btn btn-primary"
            style={{ padding:'8px 14px', fontSize:13 }}
            onClick={() => setModal('add')}
            disabled={atMax}
            title={atMax ? `Maximum ${section.maxItems} reached` : `Add to ${section.label}`}
          >
            <Plus size={14}/> Add Photo
          </button>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="site-section-empty">
          <Image size={32} style={{ color:'var(--text-muted)', marginBottom:10 }}/>
          <p>No photos yet in this section.</p>
          <button className="btn btn-outline" style={{ marginTop:10, fontSize:13 }} onClick={() => setModal('add')}>
            <Plus size={13}/> Add First Photo
          </button>
        </div>
      ) : (
        <div className="site-photo-grid">
          {photos.map((p, idx) => (
            <PhotoCard
              key={p.id}
              photo={p}
              section={section}
              onEdit={(ph) => setModal(ph)}
              onDelete={handleDelete}
              onMove={handleMove}
              isFirst={idx === 0}
              isLast={idx === photos.length - 1}
            />
          ))}
        </div>
      )}

      {modal && (
        <PhotoModal
          section={section}
          editing={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); onRefresh(); }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function AdminSitePhotos() {
  const [photos,  setPhotos]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [active,  setActive]  = useState('hero');
  const [dbReady, setDbReady] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('site_photos')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      // Table does not exist yet (42P01) or RLS blocked read (PGRST116/42501)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        setDbReady(false);
      } else {
        toast.error('Load failed: ' + error.message);
      }
      setLoading(false);
      return;
    }
    setPhotos(data || []);
    setDbReady(true);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const currentSection = SECTIONS.find(s => s.key === active);

  /* ── DB setup instructions if table missing ── */
  if (!dbReady) return (
    <div>
      <div className="admin-section-head">
        <div><h2>Site Photos</h2><p>Manage all photos across the website</p></div>
      </div>
      <div className="site-section-empty" style={{ padding:'48px 32px' }}>
        <Info size={36} style={{ color:'var(--amber)', marginBottom:12 }}/>
        <h3 style={{ fontFamily:'var(--font-display)', marginBottom:8 }}>Database Table Required</h3>
        <p style={{ maxWidth:520, textAlign:'center', lineHeight:1.7, color:'var(--text-muted)' }}>
          Run this SQL in your Supabase dashboard (SQL Editor) to create the <code>site_photos</code> table:
        </p>
        <pre style={{ background:'rgba(0,0,0,0.08)', padding:'16px 20px', borderRadius:8, marginTop:16, fontSize:12, textAlign:'left', maxWidth:640, overflowX:'auto', lineHeight:1.8 }}>
{`-- Paste this in Supabase → SQL Editor → Run
create table site_photos (
  id               uuid primary key default gen_random_uuid(),
  logical_section  text not null,
  image_url        text not null,
  title            text,
  tag              text,
  subtitle         text,
  caption          text,
  sort_order       int  default 0,
  active           bool default true,
  created_at       timestamptz default now()
);
alter table site_photos enable row level security;
create policy "site_photos_public_read" on site_photos
  for select using (true);
create policy "site_photos_auth_insert" on site_photos
  for insert to authenticated with check (true);
create policy "site_photos_auth_update" on site_photos
  for update to authenticated using (true) with check (true);
create policy "site_photos_auth_delete" on site_photos
  for delete to authenticated using (true);`}
        </pre>
        <button className="btn btn-primary" style={{ marginTop:20 }} onClick={load}>
          <RefreshCw size={14}/> Retry
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="admin-section-head">
        <div>
          <h2>Site Photos</h2>
          <p>Control every photo on the website — hero slides, page headers, gallery & more</p>
        </div>
        <button className="btn btn-outline" onClick={load} style={{ padding:'8px 14px', fontSize:13 }}>
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      <div className="site-photos-layout">
        {/* ── Section Tabs (left) ── */}
        <aside className="site-section-tabs">
          {SECTIONS.map(s => {
            const count = photos.filter(p => p.logical_section === s.key).length;
            return (
              <button
                key={s.key}
                className={`site-section-tab ${active === s.key ? 'site-section-tab--active' : ''}`}
                onClick={() => setActive(s.key)}
              >
                <span className="site-section-tab__icon">{s.icon}</span>
                <span className="site-section-tab__label">{s.label}</span>
                {count > 0 && <span className="site-section-tab__count">{count}</span>}
              </button>
            );
          })}
        </aside>

        {/* ── Section Content (right) ── */}
        <div className="site-section-content">
          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
              <div className="spinner"/>
            </div>
          ) : (
            <SectionPanel
              key={active}
              section={currentSection}
              allPhotos={photos}
              onRefresh={load}
            />
          )}
        </div>
      </div>
    </div>
  );
}
