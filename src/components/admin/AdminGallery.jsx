import "./AdminComponents.css";
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, X, Image, Upload, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

const CATS = ['food','ambiance','events'];

const EMPTY = { image_url:'', caption:'', category:'food', sort_order:0 };

export default function AdminGallery() {
  const [images, setImages]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [preview, setPreview]   = useState('');
  const [uploadMode, setUploadMode] = useState('url'); // 'url' | 'file'
  const [uploading, setUploading]   = useState(false);
  const fileInputRef            = useRef();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('gallery').select('*').order('sort_order');
    if (error) toast.error('Failed to load gallery: ' + error.message);
    setImages(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Upload local file to Supabase Storage ──────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    setUploading(true);
    const ext      = file.name.split('.').pop();
    const fileName = `gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('restaurant-images')
      .upload(fileName, file, { cacheControl:'3600', upsert:false });

    setUploading(false);

    if (error) {
      // Storage bucket may not be set up — fall back to base64 data URL
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        setPreview(dataUrl);
        set('image_url', dataUrl);
        toast('Image loaded locally. For production, set up a Supabase Storage bucket named "restaurant-images".', { icon:'ℹ️' });
      };
      reader.readAsDataURL(file);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('restaurant-images')
      .getPublicUrl(data.path);

    set('image_url', publicUrl);
    setPreview(publicUrl);
    toast.success('Image uploaded!');
    e.target.value = '';
  };

  // ── Save new image to gallery table ───────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.image_url) { toast.error('Please provide an image.'); return; }
    setSaving(true);
    const { error } = await supabase.from('gallery').insert([{
      image_url:  form.image_url,
      caption:    form.caption || '',
      category:   form.category,
      sort_order: parseInt(form.sort_order) || 0,
    }]);
    setSaving(false);
    if (error) { toast.error('Failed to save: ' + error.message); return; }
    toast.success('Image added to gallery!');
    setModal(false);
    setForm(EMPTY);
    setPreview('');
    setUploadMode('url');
    load();
  };

  // ── Delete from gallery table (and optionally storage) ────────────────────
  const handleDelete = async (img) => {
    if (!window.confirm('Remove this image from the gallery?')) return;
    const { error } = await supabase.from('gallery').delete().eq('id', img.id);
    if (error) { toast.error('Delete failed: ' + error.message); return; }
    // Attempt to delete from storage if it's a supabase storage URL
    if (img.image_url && img.image_url.includes('supabase') && img.image_url.includes('restaurant-images')) {
      const path = img.image_url.split('restaurant-images/')[1];
      if (path) await supabase.storage.from('restaurant-images').remove([path]);
    }
    toast.success('Image removed.');
    load();
  };

  const openModal = () => { setForm(EMPTY); setPreview(''); setUploadMode('url'); setModal(true); };

  return (
    <div>
      <div className="admin-section-head">
        <div>
          <h2>Gallery (Legacy)</h2>
          <p>{images.length} legacy images — new photos should be added via <strong>Site Photos → Gallery</strong></p>
        </div>
        <button className="btn btn-primary" onClick={openModal}>
          <Plus size={15} /> Add Image
        </button>
      </div>
      <div style={{ background:'rgba(232,168,74,0.08)', border:'1px solid rgba(232,168,74,0.2)', borderRadius:10, padding:'12px 16px', marginBottom:20, fontSize:13, color:'var(--amber-dark)', display:'flex', alignItems:'center', gap:10 }}>
        <span>💡</span>
        <span>This is the legacy gallery table. To manage all website photos including hero slides and page headers, use the <strong>Site Photos</strong> section in the sidebar.</span>
      </div>

      {loading ? <div className="spinner" /> : (
        <>
          {CATS.map(cat => {
            const catImgs = images.filter(i => i.category === cat);
            if (catImgs.length === 0) return null;
            return (
              <div key={cat} style={{ marginBottom:32 }}>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:16, color:'var(--charcoal)', marginBottom:14, textTransform:'capitalize', display:'flex', alignItems:'center', gap:8 }}>
                  {cat}
                  <span style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'var(--font-body)', fontWeight:400 }}>({catImgs.length})</span>
                </h3>
                <div className="gallery-admin-grid">
                  {catImgs.map(img => (
                    <div key={img.id} className="gallery-admin-item">
                      <img
                        src={img.image_url}
                        alt={img.caption || cat}
                        loading="lazy"
                        onError={e => { e.target.src='https://via.placeholder.com/300x200?text=Image+Error'; }}
                      />
                      <div className="gallery-admin-item__overlay">
                        <p>{img.caption || '(no caption)'}</p>
                        <button onClick={() => handleDelete(img)}>
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {images.length === 0 && (
            <div style={{ textAlign:'center', padding:'60px', background:'#fff', borderRadius:'var(--radius)', border:'1px solid var(--border)' }}>
              <Image size={40} style={{ color:'var(--text-muted)', margin:'0 auto 12px', display:'block' }} />
              <p style={{ color:'var(--text-muted)', fontStyle:'italic' }}>No images yet. Add your first gallery image.</p>
            </div>
          )}
        </>
      )}

      {/* ── Add Image Modal ── */}
      {modal && (
        <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="admin-modal">
            <div className="admin-modal__header">
              <h3>Add Gallery Image</h3>
              <button className="admin-modal__close" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="admin-modal__body">

                {/* Upload mode toggle */}
                <div className="gallery-upload-toggle">
                  <button type="button"
                    className={`gallery-upload-toggle__btn ${uploadMode==='url'?'gallery-upload-toggle__btn--active':''}`}
                    onClick={() => setUploadMode('url')}>
                    <LinkIcon size={14} /> Paste URL
                  </button>
                  <button type="button"
                    className={`gallery-upload-toggle__btn ${uploadMode==='file'?'gallery-upload-toggle__btn--active':''}`}
                    onClick={() => setUploadMode('file')}>
                    <Upload size={14} /> Upload from Device
                  </button>
                </div>

                {/* URL input */}
                {uploadMode === 'url' && (
                  <div className="form-group">
                    <label>Image URL</label>
                    <input className="form-input" placeholder="https://..."
                      value={form.image_url}
                      onChange={e => { set('image_url', e.target.value); setPreview(e.target.value); }} />
                  </div>
                )}

                {/* File upload */}
                {uploadMode === 'file' && (
                  <div className="form-group">
                    <label>Upload Image</label>
                    <div
                      className="gallery-upload-dropzone"
                      onClick={() => fileInputRef.current.click()}
                    >
                      {uploading ? (
                        <div style={{ textAlign:'center' }}>
                          <div className="spinner" style={{ margin:'0 auto 8px', width:28, height:28, borderWidth:2 }} />
                          <p style={{ fontSize:13, color:'var(--text-muted)' }}>Uploading…</p>
                        </div>
                      ) : preview ? (
                        <p style={{ fontSize:13, color:'var(--jade-dark)', fontWeight:500 }}>✓ Image selected. Click to change.</p>
                      ) : (
                        <>
                          <Upload size={28} style={{ color:'var(--amber-light)', marginBottom:8 }} />
                          <p style={{ fontSize:13, fontWeight:500, color:'var(--brown)' }}>Click to choose a file</p>
                          <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>JPG, PNG, WebP supported</p>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display:'none' }}
                      onChange={handleFileUpload}
                    />
                  </div>
                )}

                {/* Preview */}
                {preview && (
                  <div style={{ position:'relative', borderRadius:'var(--radius-sm)', overflow:'hidden', height:180 }}>
                    <img
                      src={preview}
                      alt="Preview"
                      style={{ width:'100%', height:'100%', objectFit:'cover' }}
                      onError={() => setPreview('')}
                    />
                    <button
                      type="button"
                      style={{ position:'absolute', top:8, right:8, background:'rgba(30,26,20,0.7)', color:'#fff', borderRadius:'50%', width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center' }}
                      onClick={() => { setPreview(''); set('image_url',''); }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div className="form-group">
                  <label>Caption</label>
                  <input className="form-input" placeholder="e.g. Our signature Mohinga"
                    value={form.caption} onChange={e => set('caption', e.target.value)} />
                </div>
                <div className="admin-form-grid">
                  <div className="form-group">
                    <label>Category</label>
                    <select className="form-input" value={form.category} onChange={e => set('category', e.target.value)}>
                      {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Sort Order</label>
                    <input type="number" className="form-input" placeholder="0"
                      value={form.sort_order} onChange={e => set('sort_order', e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="admin-modal__footer">
                <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                  {saving ? 'Adding…' : 'Add to Gallery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
