import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Pencil, Trash2, X, Search, ToggleLeft, ToggleRight,
  Upload, FileText, Eye, CheckSquare, Square,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

const CATEGORIES = ['starters','mains','noodles','salads','desserts','drinks'];

const EMPTY_FORM = {
  name:'', description:'', price:'', category:'mains',
  spicy_level:0, is_vegetarian:false, available:true, image_url:''
};

const CSV_STRUCTURE = [
  { col:'name',          type:'text',    req:true,  example:'Mohinga' },
  { col:'description',   type:'text',    req:false, example:'Rice noodles in fish broth' },
  { col:'price',         type:'number',  req:true,  example:'13.00' },
  { col:'category',      type:'text',    req:true,  example:'noodles' },
  { col:'spicy_level',   type:'number',  req:false, example:'1' },
  { col:'is_vegetarian', type:'boolean', req:false, example:'false' },
  { col:'available',     type:'boolean', req:false, example:'true' },
  { col:'image_url',     type:'text',    req:false, example:'https://...' },
];

export default function AdminMenu() {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [catFilter, setCat]       = useState('all');
  const [modal, setModal]         = useState(null); // null|'add'|'edit'|'csv'|'csvstructure'
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [csvRows, setCsvRows]     = useState([]);
  const [csvImporting, setCsvImp] = useState(false);
  const [selectedIds, setSelected] = useState([]);
  const csvRef                    = useRef();

  // ── Load ───────────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('menu_items').select('*').order('category');
    if (error) toast.error('Failed to load menu: ' + error.message);
    setItems(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // ── Filtered list (defined early so helpers below can reference it) ────────
  const filtered = items.filter(i => {
    const matchCat    = catFilter === 'all' || i.category === catFilter;
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // ── Selection helpers ──────────────────────────────────────────────────────
  const allSelected  = filtered.length > 0 && filtered.every(i => selectedIds.includes(i.id));
  const someSelected = filtered.some(i => selectedIds.includes(i.id)) && !allSelected;

  const toggleOne = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAll = () => {
    if (allSelected) {
      setSelected(prev => prev.filter(id => !filtered.find(i => i.id === id)));
    } else {
      setSelected(prev => [...new Set([...prev, ...filtered.map(i => i.id)])]);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} item(s)? This cannot be undone.`)) return;
    const { error } = await supabase.from('menu_items').delete().in('id', selectedIds);
    if (error) { toast.error('Bulk delete failed: ' + error.message); return; }
    toast.success(`${selectedIds.length} item(s) deleted.`);
    setSelected([]);
    load();
  };

  const handleBulkToggle = async (available) => {
    const { error } = await supabase.from('menu_items').update({ available }).in('id', selectedIds);
    if (error) { toast.error('Update failed: ' + error.message); return; }
    toast.success(`${selectedIds.length} item(s) ${available ? 'enabled' : 'hidden'}.`);
    setSelected([]);
    load();
  };

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openAdd  = () => { setForm(EMPTY_FORM); setEditing(null); setModal('add'); };
  const openEdit = (item) => {
    setForm({ ...EMPTY_FORM, ...item, price: String(item.price), spicy_level: String(item.spicy_level) });
    setEditing(item.id);
    setModal('edit');
  };
  const closeModal = () => { setModal(null); setEditing(null); setForm(EMPTY_FORM); setCsvRows([]); };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    const trimmed = form.name.trim();
    if (!trimmed || !form.price || !form.category) {
      toast.error('Name, price and category are required.');
      return;
    }
    setSaving(true);
    const payload = {
      name:          trimmed,
      description:   form.description || '',
      price:         parseFloat(form.price),
      category:      form.category,
      spicy_level:   parseInt(form.spicy_level) || 0,
      is_vegetarian: Boolean(form.is_vegetarian),
      available:     Boolean(form.available),
      image_url:     form.image_url || '',
    };
    let error;
    if (modal === 'add') {
      ({ error } = await supabase.from('menu_items').insert([payload]));
    } else {
      ({ error } = await supabase.from('menu_items').update(payload).eq('id', editing));
    }
    setSaving(false);
    if (error) { toast.error('Save failed: ' + error.message); return; }
    toast.success(modal === 'add' ? 'Item added!' : 'Item updated!');
    load();
    closeModal();
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) { toast.error('Delete failed: ' + error.message); return; }
    toast.success(`"${name}" deleted.`);
    load();
  };

  // ── Toggle availability ────────────────────────────────────────────────────
  const toggleAvailability = async (item) => {
    const { error } = await supabase
      .from('menu_items').update({ available: !item.available }).eq('id', item.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`${item.name} ${!item.available ? 'enabled' : 'hidden'}.`);
    load();
  };

  // ── CSV ────────────────────────────────────────────────────────────────────
  const handleCsvFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines   = ev.target.result.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g,''));
      const rows    = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g,''));
        const row  = {};
        headers.forEach((h, i) => { row[h] = vals[i] || ''; });
        return row;
      }).filter(r => r.name);
      setCsvRows(rows);
      setModal('csv');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCsvImport = async () => {
    if (!csvRows.length) return;
    setCsvImp(true);
    const payload = csvRows.map(r => ({
      name:          r.name || '',
      description:   r.description || '',
      price:         parseFloat(r.price) || 0,
      category:      r.category || 'mains',
      spicy_level:   parseInt(r.spicy_level) || 0,
      is_vegetarian: r.is_vegetarian === 'true' || r.is_vegetarian === '1',
      available:     r.available !== 'false' && r.available !== '0',
      image_url:     r.image_url || '',
    }));
    const { error } = await supabase.from('menu_items').insert(payload);
    setCsvImp(false);
    if (error) { toast.error('Import failed: ' + error.message); return; }
    toast.success(`${payload.length} items imported!`);
    load();
    closeModal();
  };

  const downloadSampleCsv = () => {
    const headers = CSV_STRUCTURE.map(c => c.col).join(',');
    const example = CSV_STRUCTURE.map(c => c.example).join(',');
    const blob = new Blob([headers + '\n' + example], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'menu_items_sample.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="admin-section-head">
        <div>
          <h2>Menu Items</h2>
          <p>{items.length} total · {items.filter(i => i.available).length} active</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button className="btn btn-outline" onClick={() => setModal('csvstructure')}>
            <Eye size={14} /> CSV Structure
          </button>
          <button className="btn btn-outline" onClick={() => csvRef.current.click()}>
            <Upload size={14} /> Import CSV
          </button>
          <input ref={csvRef} type="file" accept=".csv" style={{ display:'none' }} onChange={handleCsvFile} />
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={14} /> Add Item
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filter-bar">
        <div className="admin-search">
          <Search size={14} className="admin-search__icon" />
          <input
            placeholder="Search menu items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-input"
          style={{ width:'auto' }}
          value={catFilter}
          onChange={e => setCat(e.target.value)}
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="admin-bulk-bar">
          <span className="admin-bulk-bar__count">{selectedIds.length} item(s) selected</span>
          <div className="admin-bulk-bar__actions">
            <button className="btn btn-outline" style={{ fontSize:12 }} onClick={() => handleBulkToggle(true)}>
              <ToggleRight size={13} /> Enable All
            </button>
            <button className="btn btn-outline" style={{ fontSize:12 }} onClick={() => handleBulkToggle(false)}>
              <ToggleLeft size={13} /> Hide All
            </button>
            <button
              className="btn btn-outline"
              style={{ fontSize:12, color:'var(--crimson,#c0392b)', borderColor:'var(--crimson,#c0392b)' }}
              onClick={handleBulkDelete}
            >
              <Trash2 size={13} /> Delete Selected
            </button>
            <button className="btn btn-outline" style={{ fontSize:12 }} onClick={() => setSelected([])}>
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? <div className="spinner" /> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width:36, textAlign:'center' }}>
                  <button
                    style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
                    onClick={toggleAll}
                    title={allSelected ? 'Deselect all' : 'Select all'}
                  >
                    {allSelected
                      ? <CheckSquare size={16} color="var(--amber-dark,#b8762b)" />
                      : someSelected
                        ? <CheckSquare size={16} color="var(--amber,#E8A84A)" style={{ opacity:0.5 }} />
                        : <Square size={16} style={{ color:'var(--text-muted,#999)' }} />}
                  </button>
                </th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Spicy</th>
                <th>Veg</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign:'center', padding:'40px', color:'var(--text-muted)', fontStyle:'italic' }}>
                    No items found.
                  </td>
                </tr>
              ) : filtered.map(item => (
                <tr key={item.id} style={selectedIds.includes(item.id) ? { background:'rgba(232,168,74,0.07)' } : {}}>
                  <td style={{ textAlign:'center' }}>
                    <button
                      style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
                      onClick={() => toggleOne(item.id)}
                    >
                      {selectedIds.includes(item.id)
                        ? <CheckSquare size={15} color="var(--amber-dark,#b8762b)" />
                        : <Square size={15} style={{ color:'var(--text-muted,#999)' }} />}
                    </button>
                  </td>
                  <td>
                    <div style={{ fontWeight:500 }}>{item.name}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                      {(item.description||'').slice(0,55)}{(item.description||'').length > 55 ? '…' : ''}
                    </div>
                  </td>
                  <td style={{ textTransform:'capitalize' }}>{item.category}</td>
                  <td style={{ fontWeight:600, color:'var(--amber-dark)' }}>${parseFloat(item.price).toFixed(2)}</td>
                  <td>{'🌶'.repeat(item.spicy_level) || '—'}</td>
                  <td>{item.is_vegetarian ? '🌿' : '—'}</td>
                  <td>
                    <button
                      onClick={() => toggleAvailability(item)}
                      style={{ display:'flex', alignItems:'center', gap:5, fontSize:12,
                        color: item.available ? 'var(--jade-dark)' : 'var(--text-muted)',
                        background:'none', border:'none', cursor:'pointer' }}
                    >
                      {item.available
                        ? <ToggleRight size={18} color="var(--jade)" />
                        : <ToggleLeft size={18} />}
                      {item.available ? 'Active' : 'Hidden'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="admin-action-btn admin-action-btn--edit" onClick={() => openEdit(item)}>
                        <Pencil size={12} /> Edit
                      </button>
                      <button className="admin-action-btn admin-action-btn--delete" onClick={() => handleDelete(item.id, item.name)}>
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="admin-modal">
            <div className="admin-modal__header">
              <h3>{modal === 'add' ? 'Add Menu Item' : `Edit: ${form.name}`}</h3>
              <button className="admin-modal__close" onClick={closeModal}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="admin-modal__body">
                <div className="admin-form-grid">
                  <div className="form-group full">
                    <label>Item Name *</label>
                    <input required className="form-input" placeholder="e.g. Ohn No Khao Swe"
                      value={form.name} onChange={e => set('name', e.target.value)} />
                  </div>
                  <div className="form-group full">
                    <label>Description</label>
                    <textarea className="form-input" placeholder="Describe the dish..."
                      value={form.description} onChange={e => set('description', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Price ($) *</label>
                    <input required type="number" step="0.01" min="0" className="form-input" placeholder="0.00"
                      value={form.price} onChange={e => set('price', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <select required className="form-input" value={form.category} onChange={e => set('category', e.target.value)}>
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Spicy Level</label>
                    <select className="form-input" value={form.spicy_level} onChange={e => set('spicy_level', e.target.value)}>
                      <option value="0">0 — Not spicy</option>
                      <option value="1">1 — Mild 🌶</option>
                      <option value="2">2 — Medium 🌶🌶</option>
                      <option value="3">3 — Hot 🌶🌶🌶</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Image URL</label>
                    <input className="form-input" placeholder="https://..."
                      value={form.image_url} onChange={e => set('image_url', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
                    <input type="checkbox" id="chk-veg" checked={!!form.is_vegetarian} onChange={e => set('is_vegetarian', e.target.checked)} />
                    <label htmlFor="chk-veg" style={{ marginBottom:0, cursor:'pointer' }}>Vegetarian</label>
                  </div>
                  <div className="form-group" style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
                    <input type="checkbox" id="chk-avail" checked={!!form.available} onChange={e => set('available', e.target.checked)} />
                    <label htmlFor="chk-avail" style={{ marginBottom:0, cursor:'pointer' }}>Available on menu</label>
                  </div>
                </div>
              </div>
              <div className="admin-modal__footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : modal === 'add' ? 'Add Item' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CSV Structure Modal ── */}
      {modal === 'csvstructure' && (
        <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="admin-modal" style={{ maxWidth:680 }}>
            <div className="admin-modal__header">
              <h3><FileText size={16} style={{ verticalAlign:'middle', marginRight:6 }} />CSV Import Structure</h3>
              <button className="admin-modal__close" onClick={closeModal}><X size={18} /></button>
            </div>
            <div className="admin-modal__body">
              <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:14 }}>
                Use these columns when preparing your CSV file. Required columns must be present.
              </p>
              <div style={{ overflowX:'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr><th>Column</th><th>Type</th><th>Required</th><th>Example</th></tr>
                  </thead>
                  <tbody>
                    {CSV_STRUCTURE.map(c => (
                      <tr key={c.col}>
                        <td>
                          <code style={{ background:'var(--amber-pale)', padding:'2px 7px', borderRadius:4, fontSize:12 }}>
                            {c.col}
                          </code>
                        </td>
                        <td style={{ color:'var(--text-muted)', fontSize:12 }}>{c.type}</td>
                        <td>
                          {c.req
                            ? <span style={{ color:'var(--jade-dark)', fontWeight:700, fontSize:12 }}>Required</span>
                            : <span style={{ color:'var(--text-muted)', fontSize:12 }}>Optional</span>}
                        </td>
                        <td style={{ color:'var(--text-muted)', fontStyle:'italic', fontSize:12 }}>{c.example}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop:14, padding:'10px 14px', background:'var(--ivory)', borderRadius:8, fontSize:12, color:'var(--text-secondary)', lineHeight:1.6 }}>
                <strong>Tips:</strong> Category must be one of: <code>starters, mains, noodles, salads, desserts, drinks</code>.
                Booleans accept <code>true/false</code> or <code>1/0</code>. Spicy level is 0–3.
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="btn btn-outline" onClick={downloadSampleCsv}>
                <FileText size={13} /> Download Sample CSV
              </button>
              <button className="btn btn-primary" onClick={() => { closeModal(); setTimeout(() => csvRef.current.click(), 100); }}>
                <Upload size={13} /> Import CSV Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CSV Preview Modal ── */}
      {modal === 'csv' && (
        <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="admin-modal" style={{ maxWidth:780 }}>
            <div className="admin-modal__header">
              <h3>CSV Import Preview — {csvRows.length} rows</h3>
              <button className="admin-modal__close" onClick={closeModal}><X size={18} /></button>
            </div>
            <div className="admin-modal__body" style={{ padding:0 }}>
              <div style={{ padding:'16px 20px', background:'var(--ivory)', borderBottom:'1px solid var(--border)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <p style={{ fontSize:13, fontWeight:600, color:'var(--charcoal)' }}>
                    <Eye size={14} style={{ verticalAlign:'middle', marginRight:6 }} />
                    Expected CSV Structure
                  </p>
                  <button className="admin-action-btn admin-action-btn--edit" onClick={downloadSampleCsv}>
                    <FileText size={12} /> Download Sample CSV
                  </button>
                </div>
                <div style={{ overflowX:'auto' }}>
                  <table className="admin-table" style={{ fontSize:11 }}>
                    <thead>
                      <tr><th>Column</th><th>Type</th><th>Required</th><th>Example</th></tr>
                    </thead>
                    <tbody>
                      {CSV_STRUCTURE.map(c => (
                        <tr key={c.col}>
                          <td><code style={{ background:'var(--amber-pale)', padding:'1px 5px', borderRadius:3, fontSize:11 }}>{c.col}</code></td>
                          <td style={{ color:'var(--text-muted)' }}>{c.type}</td>
                          <td>{c.req ? <span style={{ color:'var(--jade-dark)', fontWeight:600 }}>Yes</span> : <span style={{ color:'var(--text-muted)' }}>No</span>}</td>
                          <td style={{ color:'var(--text-muted)', fontStyle:'italic' }}>{c.example}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div style={{ padding:'16px 20px' }}>
                <p style={{ fontSize:13, fontWeight:600, color:'var(--charcoal)', marginBottom:10 }}>
                  Data Preview (first 5 rows)
                </p>
                <div style={{ overflowX:'auto' }}>
                  <table className="admin-table" style={{ fontSize:11 }}>
                    <thead>
                      <tr>{Object.keys(csvRows[0]||{}).map(h => <th key={h}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {csvRows.slice(0,5).map((row,i) => (
                        <tr key={i}>
                          {Object.values(row).map((v,j) => (
                            <td key={j} style={{ maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {v || '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {csvRows.length > 5 && (
                  <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:8 }}>
                    …and {csvRows.length - 5} more rows will be imported.
                  </p>
                )}
              </div>
            </div>
            <div className="admin-modal__footer">
              <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
              <button className="btn btn-jade" disabled={csvImporting} onClick={handleCsvImport}>
                {csvImporting ? 'Importing…' : `Import ${csvRows.length} Items`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
