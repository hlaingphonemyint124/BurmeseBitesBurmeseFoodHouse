import React, { useState, useEffect, useCallback } from 'react';
import {
  Star, Plus, Trash2, Edit3, Save, X,
  Eye, EyeOff, RefreshCw, Image as ImageIcon,
  ChevronUp, ChevronDown, CheckCircle, AlertCircle,
  ExternalLink, Loader
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase, getAllMenuItems } from '../../lib/supabase';

/* ── direct supabase calls — no wrapper so we see every error ── */
const db = {
  getAll: () =>
    supabase.from('featured_dishes')
      .select('id, menu_item_id, image_url, sort_order, active, created_at, menu_items(id,name,category,price,image_url,description)')
      .order('sort_order', { ascending: true }),

  insert: (payload) =>
    supabase.from('featured_dishes')
      .insert(payload),          // no .select() — avoids RLS read-after-write issue

  update: (id, data) =>
    supabase.from('featured_dishes')
      .update(data)
      .eq('id', id),

  delete: (id) =>
    supabase.from('featured_dishes')
      .delete()
      .eq('id', id),
};

const BLANK = { menu_item_id: '', image_url: '' };

export default function AdminFeaturedDishes() {
  const [rows,      setRows]      = useState([]);
  const [allItems,  setAllItems]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [showAdd,   setShowAdd]   = useState(false);
  const [form,      setForm]      = useState(BLANK);
  const [editId,    setEditId]    = useState(null);
  const [editImg,   setEditImg]   = useState('');
  const [err,       setErr]       = useState(null);

  /* ── Load both tables ── */
  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);

    const [featRes, menuRes] = await Promise.all([
      db.getAll(),
      getAllMenuItems(),
    ]);

    if (featRes.error) {
      setErr(featRes.error);
      setLoading(false);
      return;
    }

    setRows(featRes.data || []);
    setAllItems(menuRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Add ── */
  const handleAdd = async () => {
    if (!form.menu_item_id) { toast.error('Select a menu item'); return; }
    if (rows.some(r => r.menu_item_id === form.menu_item_id)) {
      toast.error('Already featured'); return;
    }

    setSaving(true);
    const payload = {
      menu_item_id: form.menu_item_id,
      image_url:    form.image_url.trim() || null,
      sort_order:   rows.length,
      active:       true,
    };

    const { error } = await db.insert(payload);

    if (error) {
      console.error('[featured_dishes insert]', error);
      toast.error(`Save failed: ${error.message || error.code}`);
      setSaving(false);
      return;
    }

    toast.success('Added to Chef\'s Selections!');
    setShowAdd(false);
    setForm(BLANK);
    await load();
    setSaving(false);
  };

  /* ── Save image edit ── */
  const handleSaveImg = async (id) => {
    setSaving(true);
    const { error } = await db.update(id, { image_url: editImg.trim() || null });
    if (error) { toast.error(error.message); setSaving(false); return; }
    toast.success('Updated');
    setEditId(null);
    await load();
    setSaving(false);
  };

  /* ── Toggle visible/hidden ── */
  const handleToggle = async (id, current) => {
    const { error } = await db.update(id, { active: !current });
    if (error) { toast.error(error.message); return; }
    toast.success(!current ? '✅ Now visible on homepage' : '🙈 Hidden from homepage');
    await load();
  };

  /* ── Delete ── */
  const handleDelete = async (id) => {
    if (!window.confirm('Remove this dish from Chef\'s Selections?')) return;
    const { error } = await db.delete(id);
    if (error) { toast.error(error.message); return; }
    toast.success('Removed');
    await load();
  };

  /* ── Reorder ── */
  const handleMove = async (idx, dir) => {
    const next = idx + dir;
    if (next < 0 || next >= rows.length) return;
    const updated = [...rows];
    [updated[idx], updated[next]] = [updated[next], updated[idx]];
    setRows(updated);
    await Promise.all([
      db.update(updated[idx].id,  { sort_order: idx }),
      db.update(updated[next].id, { sort_order: next }),
    ]);
    toast.success('Order saved');
  };

  const getName  = r => r.menu_items?.name     || allItems.find(m => m.id === r.menu_item_id)?.name     || '—';
  const getCat   = r => r.menu_items?.category || allItems.find(m => m.id === r.menu_item_id)?.category || '—';
  const getPrice = r => parseFloat(r.menu_items?.price || allItems.find(m => m.id === r.menu_item_id)?.price || 0).toFixed(2);
  const getThumb = r => r.image_url || r.menu_items?.image_url || null;

  const usedIds     = new Set(rows.map(r => r.menu_item_id));
  const activeCount = rows.filter(r => r.active).length;
  const available   = allItems.filter(m => !usedIds.has(m.id));

  return (
    <div className="afd">
      <style>{`
        .afd-hdr{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px}
        .afd-hdr h2{font-size:22px;font-weight:700;margin:0 0 4px;color:var(--charcoal)}
        .afd-hdr p{font-size:13px;color:#888;margin:0}
        .afd-hdr-btns{display:flex;gap:8px;flex-wrap:wrap;align-items:center}

        .afd-err{background:rgba(220,38,38,0.07);border:1px solid rgba(220,38,38,0.3);border-radius:12px;padding:16px 18px;margin-bottom:20px}
        .afd-err-title{font-size:13px;font-weight:600;color:#DC2626;margin:0 0 6px;display:flex;align-items:center;gap:8px}
        .afd-err pre{font-size:11px;margin:0;font-family:monospace;background:rgba(0,0,0,0.05);padding:10px;border-radius:6px;overflow-x:auto;white-space:pre-wrap;color:#991B1B}

        .afd-stats{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap}
        .afd-stat{background:var(--surface-1,#fff);border:1px solid var(--border);border-radius:12px;padding:14px 20px;display:flex;align-items:center;gap:12px;flex:1;min-width:130px}
        .afd-stat__icon{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .afd-stat__val{font-size:22px;font-weight:700;color:var(--charcoal);line-height:1}
        .afd-stat__lbl{font-size:11px;color:#888;margin-top:2px}

        .afd-add-card{background:var(--surface-1,#fff);border:2px solid var(--amber);border-radius:14px;padding:20px;margin-bottom:20px}
        .afd-add-card h3{font-size:15px;font-weight:600;margin:0 0 16px;color:var(--charcoal);display:flex;align-items:center;gap:8px}
        .afd-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        @media(max-width:640px){.afd-grid{grid-template-columns:1fr}}
        .afd-field{display:flex;flex-direction:column;gap:5px}
        .afd-field label{font-size:12px;font-weight:600;color:#888;letter-spacing:.03em;text-transform:uppercase}
        .afd-field select,.afd-field input{padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--surface-0,#fff);color:var(--charcoal);outline:none;transition:border-color .2s;width:100%;box-sizing:border-box}
        .afd-field select:focus,.afd-field input:focus{border-color:var(--amber);box-shadow:0 0 0 3px rgba(194,122,42,.1)}
        .afd-hint{font-size:11px;color:#aaa;margin-top:3px}
        .afd-add-actions{display:flex;gap:8px;margin-top:16px;align-items:center}

        .afd-wrap{background:var(--surface-1,#fff);border:1px solid var(--border);border-radius:14px;overflow:hidden}
        .afd-tbl{width:100%;border-collapse:collapse}
        .afd-tbl th{padding:11px 16px;text-align:left;font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.06em;background:var(--ivory,#FAF6EE);border-bottom:1px solid var(--border);white-space:nowrap}
        .afd-tbl td{padding:13px 16px;font-size:13px;color:var(--charcoal);border-bottom:1px solid var(--border);vertical-align:middle}
        .afd-tbl tr:last-child td{border-bottom:none}
        .afd-tbl tbody tr:hover{background:rgba(194,122,42,.03)}

        .afd-order{display:flex;flex-direction:column;gap:3px}
        .afd-ob{background:none;border:1px solid var(--border);border-radius:5px;padding:3px 5px;cursor:pointer;color:#999;display:flex;transition:all .15s}
        .afd-ob:hover:not(:disabled){border-color:var(--amber);color:var(--amber-dark);background:var(--amber-pale)}
        .afd-ob:disabled{opacity:.2;cursor:not-allowed}

        .afd-dish{display:flex;align-items:center;gap:12px}
        .afd-thumb{width:50px;height:50px;border-radius:10px;object-fit:cover;flex-shrink:0;background:var(--ivory)}
        .afd-thumb-ph{width:50px;height:50px;border-radius:10px;background:var(--ivory);display:flex;align-items:center;justify-content:center;color:#ccc;flex-shrink:0}
        .afd-dish-name{font-weight:600;line-height:1.3}
        .afd-dish-sub{font-size:11px;color:#888;margin-top:2px}

        .afd-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap;cursor:pointer;transition:opacity .15s}
        .afd-badge:hover{opacity:.75}
        .afd-badge--on{background:rgba(34,197,94,.12);color:#16A34A}
        .afd-badge--off{background:rgba(156,163,175,.12);color:#6B7280}

        .afd-url{font-size:11px;font-family:monospace;color:#888;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block}
        .afd-url-none{font-size:11px;color:#ccc;font-style:italic}
        .afd-inline-input{padding:6px 10px;border:1.5px solid var(--amber);border-radius:7px;font-size:12px;background:var(--surface-0,#fff);color:var(--charcoal);outline:none;width:180px}

        .afd-acts{display:flex;gap:6px;align-items:center}
        .afd-btn{background:none;border:1px solid var(--border);border-radius:7px;padding:6px 8px;cursor:pointer;color:#888;display:flex;align-items:center;transition:all .18s}
        .afd-btn:hover{border-color:var(--amber);color:var(--amber-dark)}
        .afd-btn.del:hover{border-color:#DC2626;color:#DC2626}
        .afd-btn.grn:hover{border-color:#16A34A;color:#16A34A}

        .afd-empty{text-align:center;padding:64px 24px;color:#aaa}
        .afd-empty svg{opacity:.25;margin-bottom:14px}
        .afd-footer{padding:12px 16px;font-size:12px;color:#888;text-align:center;border-top:1px solid var(--border);background:var(--ivory,#FAF6EE)}

        .afd-preview{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--amber-dark);text-decoration:none;padding:6px 10px;border:1px solid var(--border);border-radius:8px;transition:all .18s}
        .afd-preview:hover{border-color:var(--amber);background:var(--amber-pale)}

        [data-theme="dark"] .afd-stat,
        [data-theme="dark"] .afd-add-card,
        [data-theme="dark"] .afd-wrap{background:#1E1A14;border-color:rgba(255,255,255,.08)}
        [data-theme="dark"] .afd-tbl th{background:#161210}
        [data-theme="dark"] .afd-tbl tbody tr:hover{background:rgba(255,255,255,.03)}
        [data-theme="dark"] .afd-field select,
        [data-theme="dark"] .afd-field input,
        [data-theme="dark"] .afd-inline-input{background:#161210;border-color:rgba(255,255,255,.12);color:#F5F0E8}
        [data-theme="dark"] .afd-footer{background:#161210}
      `}</style>

      {/* ── Header ── */}
      <div className="afd-hdr">
        <div>
          <h2>Chef's Selections</h2>
          <p>Curate the featured dishes shown on the homepage — changes are live immediately</p>
        </div>
        <div className="afd-hdr-btns">
          <a href="/" target="_blank" rel="noopener noreferrer" className="afd-preview">
            <ExternalLink size={13}/> Preview Homepage
          </a>
          <button className="btn btn-outline" onClick={load}
            style={{ display:'flex', alignItems:'center', gap:6 }}>
            <RefreshCw size={14}/> Refresh
          </button>
          <button className="btn btn-primary"
            onClick={() => { setShowAdd(s => !s); setForm(BLANK); }}
            style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Plus size={15}/> Add Dish
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {err && (
        <div className="afd-err">
          <p className="afd-err-title"><AlertCircle size={16}/> Supabase error — featured_dishes</p>
          <pre>{JSON.stringify(err, null, 2)}</pre>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="afd-stats">
        <div className="afd-stat">
          <div className="afd-stat__icon" style={{ background:'rgba(194,122,42,.12)', color:'#C27A2A' }}><Star size={17}/></div>
          <div><div className="afd-stat__val">{rows.length}</div><div className="afd-stat__lbl">Total Featured</div></div>
        </div>
        <div className="afd-stat">
          <div className="afd-stat__icon" style={{ background:'rgba(34,197,94,.10)', color:'#16A34A' }}><Eye size={17}/></div>
          <div><div className="afd-stat__val">{activeCount}</div><div className="afd-stat__lbl">Visible on Homepage</div></div>
        </div>
        <div className="afd-stat">
          <div className="afd-stat__icon" style={{ background:'rgba(156,163,175,.12)', color:'#6B7280' }}><EyeOff size={17}/></div>
          <div><div className="afd-stat__val">{rows.length - activeCount}</div><div className="afd-stat__lbl">Hidden</div></div>
        </div>
        <div className="afd-stat">
          <div className="afd-stat__icon" style={{ background:'rgba(59,130,246,.10)', color:'#2563EB' }}><Star size={17}/></div>
          <div><div className="afd-stat__val">{allItems.length}</div><div className="afd-stat__lbl">Menu Items Available</div></div>
        </div>
      </div>

      {/* ── Add Form ── */}
      {showAdd && (
        <div className="afd-add-card">
          <h3><Plus size={15}/> Add a Dish to Chef's Selections</h3>
          <div className="afd-grid">
            <div className="afd-field">
              <label>Menu Item *</label>
              <select
                value={form.menu_item_id}
                onChange={e => setForm(f => ({ ...f, menu_item_id: e.target.value }))}
              >
                <option value="">— Choose a dish from your menu —</option>
                {available.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}  ·  {m.category}  ·  ${parseFloat(m.price).toFixed(2)}
                  </option>
                ))}
              </select>
              {available.length === 0 && allItems.length > 0 && (
                <span className="afd-hint">All menu items are already featured.</span>
              )}
              {allItems.length === 0 && (
                <span className="afd-hint" style={{ color:'#DC2626' }}>No menu items found. Add items in Menu Items first.</span>
              )}
            </div>
            <div className="afd-field">
              <label>Custom Image URL <span style={{ fontWeight:400, color:'#bbb', textTransform:'none' }}>(optional)</span></label>
              <input
                value={form.image_url}
                onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                placeholder="https://images.unsplash.com/photo-…"
              />
              <span className="afd-hint">Leave blank to use the menu item's existing image</span>
            </div>
          </div>
          <div className="afd-add-actions">
            <button
              className="btn btn-primary"
              onClick={handleAdd}
              disabled={saving || !form.menu_item_id}
              style={{ display:'flex', alignItems:'center', gap:7 }}
            >
              {saving ? <><Loader size={14} className="spin"/>&nbsp;Saving…</> : <><Save size={14}/> Save to Homepage</>}
            </button>
            <button className="btn btn-outline"
              onClick={() => { setShowAdd(false); setForm(BLANK); }}>
              Cancel
            </button>
            {form.menu_item_id && (
              <span style={{ fontSize:12, color:'#888', marginLeft:4 }}>
                This dish will appear on the homepage immediately after saving.
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="afd-wrap">
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:64 }}>
            <Loader size={24} className="spin" style={{ color:'var(--amber)' }}/>
          </div>
        ) : rows.length === 0 ? (
          <div className="afd-empty">
            <Star size={44}/>
            <p style={{ fontSize:15, fontWeight:600, margin:'0 0 6px', color:'var(--charcoal)' }}>
              No featured dishes yet
            </p>
            <span style={{ fontSize:13 }}>
              Click <strong>+ Add Dish</strong> above → pick any menu item → Save.<br/>
              It will appear on the homepage Chef's Selections section instantly.
            </span>
          </div>
        ) : (
          <>
            <table className="afd-tbl">
              <thead>
                <tr>
                  <th style={{ width:60 }}>Order</th>
                  <th>Dish</th>
                  <th>Price</th>
                  <th>Custom Image</th>
                  <th>Homepage</th>
                  <th style={{ width:120, textAlign:'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.id}>
                    {/* Order */}
                    <td>
                      <div className="afd-order">
                        <button className="afd-ob" onClick={() => handleMove(idx, -1)} disabled={idx === 0}>
                          <ChevronUp size={13}/>
                        </button>
                        <button className="afd-ob" onClick={() => handleMove(idx, 1)} disabled={idx === rows.length - 1}>
                          <ChevronDown size={13}/>
                        </button>
                      </div>
                    </td>

                    {/* Dish info */}
                    <td>
                      <div className="afd-dish">
                        {getThumb(row)
                          ? <img src={getThumb(row)} alt={getName(row)} className="afd-thumb" loading="lazy"/>
                          : <div className="afd-thumb-ph"><ImageIcon size={18}/></div>
                        }
                        <div>
                          <div className="afd-dish-name">{getName(row)}</div>
                          <div className="afd-dish-sub">{getCat(row)}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ fontWeight:700, color:'var(--amber-dark)' }}>${getPrice(row)}</td>

                    {/* Image URL inline edit */}
                    <td>
                      {editId === row.id ? (
                        <input className="afd-inline-input" value={editImg}
                          onChange={e => setEditImg(e.target.value)}
                          placeholder="https://…" autoFocus/>
                      ) : row.image_url ? (
                        <span className="afd-url" title={row.image_url}>{row.image_url}</span>
                      ) : (
                        <span className="afd-url-none">Default image</span>
                      )}
                    </td>

                    {/* Status — click to toggle */}
                    <td>
                      <span
                        className={`afd-badge ${row.active ? 'afd-badge--on' : 'afd-badge--off'}`}
                        onClick={() => handleToggle(row.id, row.active)}
                        title="Click to toggle visibility"
                      >
                        {row.active
                          ? <><CheckCircle size={11}/> Visible</>
                          : <><EyeOff size={11}/> Hidden</>
                        }
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="afd-acts">
                        {editId === row.id ? (
                          <>
                            <button className="afd-btn grn" onClick={() => handleSaveImg(row.id)} disabled={saving} title="Save image">
                              <Save size={14}/>
                            </button>
                            <button className="afd-btn" onClick={() => setEditId(null)} title="Cancel">
                              <X size={14}/>
                            </button>
                          </>
                        ) : (
                          <button className="afd-btn"
                            onClick={() => { setEditId(row.id); setEditImg(row.image_url || ''); }}
                            title="Edit custom image URL">
                            <Edit3 size={14}/>
                          </button>
                        )}
                        <button className="afd-btn"
                          onClick={() => handleToggle(row.id, row.active)}
                          title={row.active ? 'Hide from homepage' : 'Show on homepage'}>
                          {row.active ? <EyeOff size={14}/> : <Eye size={14}/>}
                        </button>
                        <button className="afd-btn del"
                          onClick={() => handleDelete(row.id)}
                          title="Remove from Chef's Selections">
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="afd-footer">
              💡 Status badge is clickable to toggle · Use arrows to reorder · Up to 6 active dishes show on homepage · All changes are live
            </div>
          </>
        )}
      </div>

      <style>{`.spin{animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
