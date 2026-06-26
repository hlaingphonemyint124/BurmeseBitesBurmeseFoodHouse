import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, RefreshCw, Download, X, CheckCircle,
  AlertCircle, Eye, Edit3, Save, Trash2, Shield,
  UserCheck, UserX, ShieldOff, ChevronUp, ChevronDown,
  Mail, Phone, Calendar, Clock, Ban, MoreVertical,
  Copy, ExternalLink, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

/* ─── SQL to run in Supabase ─── */
const SETUP_SQL = `-- 1. Create profiles table (synced with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     text,
  email         text,
  phone         text,
  role          text DEFAULT 'customer' CHECK (role IN ('customer','driver','admin')),
  avatar_url    text,
  banned        boolean DEFAULT false,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  last_sign_in  timestamptz
);

-- 2. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Policies
CREATE POLICY "Public profiles readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin full access" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Backfill existing users into profiles
INSERT INTO public.profiles (id, email, full_name, role, created_at)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email,'@',1)),
  COALESCE(raw_user_meta_data->>'role', 'customer'),
  created_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  updated_at = NOW();`;

/* ─── Helpers ─── */
const fmt     = d => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const fmtDT   = d => d ? new Date(d).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
const initials= (name, email) => (name || email || '?').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();

const ROLE_CFG = {
  admin:    { bg:'rgba(194,122,42,0.14)', color:'#C27A2A', label:'Admin'    },
  driver:   { bg:'rgba(42,107,82,0.12)',  color:'#2A6B52', label:'Driver'   },
  customer: { bg:'rgba(59,130,246,0.10)', color:'#2563EB', label:'Customer' },
};
const rc = role => ROLE_CFG[role] || ROLE_CFG.customer;

/* ─── User Detail Modal ─── */
function UserModal({ user: u, onClose, onSaved }) {
  const [tab,   setTab]   = useState('info');
  const [form,  setForm]  = useState({
    full_name: u.full_name || '',
    phone:     u.phone     || '',
    role:      u.role      || 'customer',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', u.id);
    if (error) { toast.error(error.message); setSaving(false); return; }
    toast.success('User updated');
    onSaved();
    onClose();
    setSaving(false);
  };

  const cfg = rc(u.role);
  const name = u.full_name || u.email?.split('@')[0] || 'User';

  return (
    <div className="au-overlay" onClick={onClose}>
      <div className="au-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="au-modal-hdr">
          <div className="au-modal-avatar">{initials(name, u.email)}</div>
          <div className="au-modal-info">
            <h3>{name}</h3>
            <span>{u.email}</span>
            <div style={{ display:'flex', gap:6, marginTop:6, flexWrap:'wrap' }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:cfg.bg, color:cfg.color }}>
                {cfg.label}
              </span>
              <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600,
                background: u.email_verified ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                color: u.email_verified ? '#16A34A' : '#CA8A04' }}>
                {u.email_verified ? '✓ Verified' : '⚠ Unverified'}
              </span>
              {u.banned && <span style={{ padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:'rgba(220,38,38,0.1)', color:'#DC2626' }}>Banned</span>}
            </div>
          </div>
          <button className="au-modal-close" onClick={onClose}><X size={18}/></button>
        </div>

        {/* Tabs */}
        <div className="au-modal-tabs">
          {['info','edit','activity'].map(t => (
            <button key={t} className={`au-modal-tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        <div className="au-modal-body">
          {tab === 'info' && (
            <div className="au-detail-grid">
              {[
                ['User ID',     <code style={{fontSize:10}}>{u.id}</code>],
                ['Email',       u.email],
                ['Phone',       u.phone || '—'],
                ['Role',        <span style={{color:cfg.color,fontWeight:600}}>{cfg.label}</span>],
                ['Status',      u.email_verified ? 'Verified' : 'Unverified'],
                ['Banned',      u.banned ? 'Yes' : 'No'],
                ['Registered',  fmtDT(u.created_at)],
                ['Last Sign In',fmtDT(u.last_sign_in)],
              ].map(([label, val]) => (
                <div key={label} className="au-detail-row">
                  <span className="au-detail-label">{label}</span>
                  <strong className="au-detail-val">{val}</strong>
                </div>
              ))}
            </div>
          )}

          {tab === 'edit' && (
            <div className="au-edit-form">
              {[
                { label:'Full Name',  key:'full_name', type:'text',   placeholder:'Full name'  },
                { label:'Phone',      key:'phone',     type:'text',   placeholder:'+95 ...'    },
              ].map(f => (
                <div key={f.key} className="au-field">
                  <label>{f.label}</label>
                  <input type={f.type} value={form[f.key]} placeholder={f.placeholder}
                    onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}/>
                </div>
              ))}
              <div className="au-field">
                <label>Role</label>
                <select value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))}>
                  <option value="customer">Customer</option>
                  <option value="driver">Driver</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button className="btn btn-primary" onClick={save} disabled={saving}
                style={{marginTop:8,display:'flex',alignItems:'center',gap:6}}>
                <Save size={14}/>{saving?'Saving…':'Save Changes'}
              </button>
            </div>
          )}

          {tab === 'activity' && (
            <div className="au-timeline">
              {[
                { icon:<CheckCircle size={14}/>, color:'#16A34A', label:'Account created',  time: fmtDT(u.created_at) },
                u.email_verified && { icon:<Mail size={14}/>, color:'#2563EB', label:'Email verified', time:'Verified' },
                u.last_sign_in && { icon:<UserCheck size={14}/>, color:'#7C3AED', label:'Last sign in', time: fmtDT(u.last_sign_in) },
                u.banned && { icon:<Ban size={14}/>, color:'#DC2626', label:'Account banned', time:'' },
              ].filter(Boolean).map((item,i)=>(
                <div key={i} className="au-tl-item">
                  <div className="au-tl-dot" style={{background:item.color+'18',color:item.color}}>{item.icon}</div>
                  <div><p className="au-tl-label">{item.label}</p><span className="au-tl-time">{item.time}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function AdminUsers() {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [roleF,    setRoleF]    = useState('all');
  const [statusF,  setStatusF]  = useState('all');
  const [sortBy,   setSortBy]   = useState('created_at');
  const [sortDir,  setSortDir]  = useState('desc');
  const [page,     setPage]     = useState(1);
  const [selected, setSelected] = useState(null);
  const [showSQL,  setShowSQL]  = useState(false);
  const [dbErr,    setDbErr]    = useState(null);
  const PER = 12;

  /* ── Fetch from profiles table ── */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setDbErr(null);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setDbErr(error);
      setLoading(false);
      return;
    }
    setUsers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
    // Real-time subscription
    const ch = supabase.channel('profiles_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchUsers)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [fetchUsers]);

  /* ── Update role ── */
  const updateRole = async (id, role) => {
    const { error } = await supabase.from('profiles').update({ role, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Role updated to ${role}`);
    fetchUsers();
  };

  /* ── Toggle ban ── */
  const toggleBan = async (id, banned) => {
    const { error } = await supabase.from('profiles').update({ banned: !banned, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(!banned ? 'User banned' : 'User unbanned');
    fetchUsers();
  };

  /* ── Delete ── */
  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user profile? This cannot be undone.')) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('User deleted');
    fetchUsers();
  };

  /* ── Export CSV ── */
  const exportCSV = () => {
    const rows = [['Name','Email','Role','Verified','Banned','Registered','Last Sign In']];
    filtered.forEach(u => rows.push([
      u.full_name||'', u.email||'', u.role||'customer',
      u.email_verified?'Yes':'No', u.banned?'Yes':'No',
      fmt(u.created_at), fmt(u.last_sign_in)
    ]));
    const blob = new Blob([rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n')], {type:'text/csv'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `users_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    toast.success('Exported!');
  };

  /* ── Sort toggle ── */
  const toggleSort = col => {
    if (sortBy===col) setSortDir(d=>d==='asc'?'desc':'asc');
    else { setSortBy(col); setSortDir('desc'); }
    setPage(1);
  };

  /* ── Filter + sort ── */
  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    if (q && !(u.full_name||'').toLowerCase().includes(q) && !(u.email||'').toLowerCase().includes(q)) return false;
    if (roleF!=='all' && (u.role||'customer')!==roleF) return false;
    if (statusF==='verified'   && !u.email_verified) return false;
    if (statusF==='unverified' &&  u.email_verified) return false;
    if (statusF==='banned'     && !u.banned)         return false;
    return true;
  }).sort((a,b) => {
    const av = sortBy==='name'?(a.full_name||a.email||''):(a[sortBy]||'');
    const bv = sortBy==='name'?(b.full_name||b.email||''):(b[sortBy]||'');
    return sortDir==='asc' ? (av>bv?1:-1) : (av<bv?1:-1);
  });

  const pages    = Math.ceil(filtered.length / PER);
  const paged    = filtered.slice((page-1)*PER, page*PER);
  const thisMonth = users.filter(u => {
    if (!u.created_at) return false;
    const d = new Date(u.created_at), now = new Date();
    return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
  }).length;

  const SortIcon = ({col}) => sortBy===col ? (sortDir==='asc'?<ChevronUp size={12}/>:<ChevronDown size={12}/>) : null;

  return (
    <div className="au">
      <style>{`
        .au{}
        /* Header */
        .au-hdr{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px}
        .au-hdr h2{font-size:22px;font-weight:700;margin:0 0 4px;color:var(--charcoal)}
        .au-hdr p{font-size:13px;color:#888;margin:0}
        .au-hdr-btns{display:flex;gap:8px;flex-wrap:wrap}
        /* SQL */
        .au-sql{background:rgba(194,122,42,0.07);border:1px solid rgba(194,122,42,0.25);border-radius:12px;padding:16px;margin-bottom:20px}
        .au-sql p{font-size:13px;color:var(--amber-dark);margin:0 0 8px;font-weight:500}
        .au-sql pre{font-size:11px;background:rgba(0,0,0,0.05);padding:12px;border-radius:8px;overflow-x:auto;margin:0;font-family:monospace;line-height:1.6;color:var(--charcoal);white-space:pre-wrap}
        /* Error */
        .au-err{background:rgba(220,38,38,0.07);border:1px solid rgba(220,38,38,0.25);border-radius:12px;padding:16px;margin-bottom:20px}
        .au-err-title{font-size:13px;font-weight:600;color:#DC2626;margin:0 0 6px;display:flex;align-items:center;gap:8px}
        .au-err pre{font-size:11px;background:rgba(0,0,0,0.05);padding:10px;border-radius:6px;margin:0;font-family:monospace;white-space:pre-wrap;color:#991B1B}
        /* Stats */
        .au-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px}
        .au-stat{background:var(--surface-1,#fff);border:1px solid var(--border);border-radius:12px;padding:14px 18px;display:flex;align-items:center;gap:12px}
        .au-stat__icon{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .au-stat__value{font-size:22px;font-weight:700;color:var(--charcoal);line-height:1}
        .au-stat__label{font-size:11px;color:#888;margin-top:2px}
        .au-stat__sub{font-size:11px;color:#16A34A;margin-top:2px;font-weight:500}
        /* Toolbar */
        .au-toolbar{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center}
        .au-search{position:relative;flex:1;min-width:200px}
        .au-search input{width:100%;padding:9px 12px 9px 36px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--surface-0,#fff);color:var(--charcoal);outline:none;box-sizing:border-box}
        .au-search input:focus{border-color:var(--amber)}
        .au-search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#aaa;pointer-events:none}
        .au-filter select{padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--surface-0,#fff);color:var(--charcoal);outline:none;cursor:pointer}
        /* Table */
        .au-wrap{background:var(--surface-1,#fff);border:1px solid var(--border);border-radius:14px;overflow:hidden}
        .au-tbl{width:100%;border-collapse:collapse}
        .au-tbl th{padding:10px 14px;text-align:left;font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.06em;background:var(--ivory,#FAF6EE);border-bottom:1px solid var(--border);white-space:nowrap;cursor:pointer;user-select:none}
        .au-tbl th:hover{color:var(--charcoal)}
        .au-tbl td{padding:12px 14px;font-size:13px;color:var(--charcoal);border-bottom:1px solid var(--border);vertical-align:middle}
        .au-tbl tr:last-child td{border-bottom:none}
        .au-tbl tbody tr:hover{background:var(--ivory,#FAF6EE)}
        /* User cell */
        .au-user{display:flex;align-items:center;gap:10px}
        .au-avatar{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;background:rgba(194,122,42,0.14);color:#C27A2A}
        .au-user-name{font-weight:500;font-size:13px;margin:0}
        .au-user-email{font-size:11px;color:#888;margin:0}
        /* Action menu */
        .au-action-wrap{position:relative}
        .au-action-btn{background:none;border:1px solid var(--border);border-radius:6px;padding:5px 7px;cursor:pointer;color:#888;display:flex;align-items:center;transition:all .18s}
        .au-action-btn:hover{border-color:var(--amber);color:var(--amber-dark)}
        .au-action-menu{position:absolute;right:0;top:calc(100% + 6px);background:var(--surface-1,#fff);border:1px solid var(--border);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.12);z-index:200;min-width:185px;overflow:hidden}
        .au-action-menu button{display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;background:none;border:none;font-size:13px;cursor:pointer;color:var(--charcoal);text-align:left;transition:background .15s}
        .au-action-menu button:hover{background:var(--ivory,#FAF6EE)}
        .au-action-menu hr{border:none;border-top:1px solid var(--border);margin:4px 0}
        .au-action-menu .danger{color:#DC2626}
        /* Pagination */
        .au-pag{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-top:1px solid var(--border);font-size:13px;color:#888;flex-wrap:wrap;gap:8px}
        .au-pag-btns{display:flex;gap:5px}
        .au-pag-btn{padding:5px 10px;border:1px solid var(--border);border-radius:6px;background:none;cursor:pointer;font-size:13px;color:var(--charcoal);transition:all .15s}
        .au-pag-btn:hover{border-color:var(--amber);color:var(--amber-dark)}
        .au-pag-btn.active{background:var(--amber);border-color:var(--amber);color:#fff;font-weight:600}
        .au-pag-btn:disabled{opacity:.4;cursor:not-allowed}
        /* Empty */
        .au-empty{text-align:center;padding:60px 24px;color:#aaa}
        .au-empty svg{opacity:.25;margin-bottom:12px}
        /* Modal */
        .au-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)}
        .au-modal{background:var(--surface-1,#fff);border-radius:16px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,0.2)}
        .au-modal-hdr{display:flex;align-items:flex-start;gap:14px;padding:22px 22px 14px;border-bottom:1px solid var(--border)}
        .au-modal-avatar{width:50px;height:50px;border-radius:50%;background:rgba(194,122,42,0.14);color:#C27A2A;font-size:17px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .au-modal-info{flex:1}
        .au-modal-info h3{margin:0 0 2px;font-size:16px;font-weight:700;color:var(--charcoal)}
        .au-modal-info span{font-size:12px;color:#888}
        .au-modal-close{background:none;border:none;cursor:pointer;color:#aaa;padding:4px;border-radius:6px;align-self:flex-start}
        .au-modal-close:hover{color:var(--charcoal);background:var(--ivory,#FAF6EE)}
        .au-modal-tabs{display:flex;border-bottom:1px solid var(--border);padding:0 22px}
        .au-modal-tab{padding:11px 16px;border:none;background:none;cursor:pointer;font-size:13px;color:#888;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all .18s}
        .au-modal-tab.active{color:var(--amber-dark);border-bottom-color:var(--amber-dark);font-weight:600}
        .au-modal-body{padding:18px 22px 22px}
        /* Detail grid */
        .au-detail-grid{display:flex;flex-direction:column;gap:10px}
        .au-detail-row{display:flex;justify-content:space-between;align-items:center;padding:9px 13px;background:var(--ivory,#FAF6EE);border-radius:8px;gap:12px}
        .au-detail-label{font-size:12px;color:#888;flex-shrink:0}
        .au-detail-val{font-size:13px;font-weight:500;text-align:right;word-break:break-all}
        /* Edit form */
        .au-edit-form{display:flex;flex-direction:column;gap:14px}
        .au-field{display:flex;flex-direction:column;gap:5px}
        .au-field label{font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.03em}
        .au-field input,.au-field select{padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--surface-0,#fff);color:var(--charcoal);outline:none;transition:border-color .2s}
        .au-field input:focus,.au-field select:focus{border-color:var(--amber)}
        /* Timeline */
        .au-timeline{display:flex;flex-direction:column;gap:0}
        .au-tl-item{display:flex;align-items:flex-start;gap:12px;padding:11px 0;border-bottom:1px solid var(--border)}
        .au-tl-item:last-child{border-bottom:none}
        .au-tl-dot{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .au-tl-label{margin:0;font-size:13px;font-weight:500;color:var(--charcoal)}
        .au-tl-time{font-size:11px;color:#888}
        /* Dark mode */
        [data-theme="dark"] .au-stat,
        [data-theme="dark"] .au-wrap,
        [data-theme="dark"] .au-modal{background:#1E1A14;border-color:rgba(255,255,255,0.08)}
        [data-theme="dark"] .au-tbl th{background:#161210;color:#888}
        [data-theme="dark"] .au-tbl tbody tr:hover{background:#2A2218}
        [data-theme="dark"] .au-search input,
        [data-theme="dark"] .au-filter select,
        [data-theme="dark"] .au-field input,
        [data-theme="dark"] .au-field select{background:#1E1A14;border-color:rgba(255,255,255,0.1);color:#F5F0E8}
        [data-theme="dark"] .au-action-menu{background:#1E1A14;border-color:rgba(255,255,255,0.1)}
        [data-theme="dark"] .au-action-menu button:hover{background:#2A2218}
        [data-theme="dark"] .au-action-menu hr{border-color:rgba(255,255,255,0.08)}
        [data-theme="dark"] .au-detail-row{background:#2A2218}
        [data-theme="dark"] .au-modal-hdr,
        [data-theme="dark"] .au-modal-tabs,
        [data-theme="dark"] .au-pag{border-color:rgba(255,255,255,0.08)}
        [data-theme="dark"] .au-tl-item{border-color:rgba(255,255,255,0.08)}
      `}</style>

      {/* ── Header ── */}
      <div className="au-hdr">
        <div>
          <h2>User Management</h2>
          <p>{users.length} total users registered</p>
        </div>
        <div className="au-hdr-btns">
          <button className="btn btn-outline" onClick={()=>setShowSQL(s=>!s)}
            style={{fontSize:12,display:'flex',alignItems:'center',gap:6}}>
            {showSQL?'Hide':'Show'} SQL Setup
          </button>
          <button className="btn btn-outline" onClick={fetchUsers}
            style={{display:'flex',alignItems:'center',gap:6}}>
            <RefreshCw size={14}/> Refresh
          </button>
          <button className="btn btn-outline" onClick={exportCSV}
            style={{display:'flex',alignItems:'center',gap:6}}>
            <Download size={14}/> Export CSV
          </button>
        </div>
      </div>

      {/* ── SQL Setup ── */}
      {showSQL && (
        <div className="au-sql">
          <p>📋 Run this SQL once in your Supabase SQL Editor to enable real-time user management:</p>
          <pre>{SETUP_SQL}</pre>
        </div>
      )}

      {/* ── Error ── */}
      {dbErr && (
        <div className="au-err">
          <p className="au-err-title"><AlertCircle size={15}/> Could not load profiles table</p>
          <pre>{JSON.stringify(dbErr, null, 2)}</pre>
          <p style={{fontSize:12,color:'#991B1B',margin:'8px 0 0'}}>
            Click "Show SQL Setup" above and run the SQL in your Supabase dashboard.
          </p>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="au-stats">
        {[
          { icon:<Users size={17}/>,      bg:'rgba(59,130,246,0.1)',  color:'#2563EB', val:users.length,                                          label:'Total Users',  sub:`+${thisMonth} this month` },
          { icon:<CheckCircle size={17}/>, bg:'rgba(34,197,94,0.1)',  color:'#16A34A', val:users.filter(u=>u.email_verified).length,               label:'Verified'      },
          { icon:<Shield size={17}/>,      bg:'rgba(194,122,42,0.12)',color:'#C27A2A', val:users.filter(u=>u.role==='admin').length,                label:'Admins'        },
          { icon:<UserCheck size={17}/>,   bg:'rgba(42,107,82,0.12)', color:'#2A6B52', val:users.filter(u=>u.role==='driver').length,               label:'Drivers'       },
          { icon:<Ban size={17}/>,         bg:'rgba(220,38,38,0.1)',  color:'#DC2626', val:users.filter(u=>u.banned).length,                        label:'Banned'        },
        ].map((s,i)=>(
          <div key={i} className="au-stat">
            <div className="au-stat__icon" style={{background:s.bg,color:s.color}}>{s.icon}</div>
            <div>
              <div className="au-stat__value">{s.val}</div>
              <div className="au-stat__label">{s.label}</div>
              {s.sub && <div className="au-stat__sub">{s.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="au-toolbar">
        <div className="au-search">
          <Search size={14} className="au-search-icon"/>
          <input placeholder="Search by name or email…" value={search}
            onChange={e=>{setSearch(e.target.value);setPage(1)}}/>
        </div>
        <div className="au-filter">
          <select value={roleF} onChange={e=>{setRoleF(e.target.value);setPage(1)}}>
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="driver">Driver</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="au-filter">
          <select value={statusF} onChange={e=>{setStatusF(e.target.value);setPage(1)}}>
            <option value="all">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="au-wrap">
        {loading ? (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:64}}>
            <div className="spinner"/>
          </div>
        ) : paged.length === 0 ? (
          <div className="au-empty">
            <Users size={40}/>
            <p>{users.length===0?'No users yet — run the SQL setup above to sync your auth users.':'No users match your filters.'}</p>
          </div>
        ) : (
          <>
            <table className="au-tbl">
              <thead>
                <tr>
                  <th onClick={()=>toggleSort('name')} style={{minWidth:200}}>
                    User <SortIcon col="name"/>
                  </th>
                  <th>Role</th>
                  <th>Status</th>
                  <th onClick={()=>toggleSort('created_at')} style={{minWidth:110}}>
                    Registered <SortIcon col="created_at"/>
                  </th>
                  <th onClick={()=>toggleSort('last_sign_in')} style={{minWidth:110}}>
                    Last Sign In <SortIcon col="last_sign_in"/>
                  </th>
                  <th style={{width:50,textAlign:'center'}}>⋯</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(u => {
                  const name = u.full_name || u.email?.split('@')[0] || 'User';
                  const cfg  = rc(u.role || 'customer');
                  return (
                    <tr key={u.id} style={{ opacity: u.banned ? 0.6 : 1 }}>
                      <td>
                        <div className="au-user">
                          <div className="au-avatar">{initials(name, u.email)}</div>
                          <div>
                            <p className="au-user-name">{name}{u.banned&&<span style={{marginLeft:6,fontSize:10,background:'rgba(220,38,38,0.1)',color:'#DC2626',padding:'1px 6px',borderRadius:10}}>Banned</span>}</p>
                            <p className="au-user-email">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:cfg.bg,color:cfg.color}}>
                          {cfg.label}
                        </span>
                      </td>
                      <td>
                        <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:600,
                          background: u.email_verified?'rgba(34,197,94,0.1)':'rgba(234,179,8,0.1)',
                          color:      u.email_verified?'#16A34A':'#CA8A04'}}>
                          {u.email_verified?'Verified':'Unverified'}
                        </span>
                      </td>
                      <td style={{color:'#888',fontSize:12}}>{fmt(u.created_at)}</td>
                      <td style={{color:'#888',fontSize:12}}>{fmt(u.last_sign_in)}</td>
                      <td>
                        <ActionMenu
                          user={u}
                          onView={()=>setSelected(u)}
                          onRoleChange={r=>updateRole(u.id,r)}
                          onToggleBan={()=>toggleBan(u.id,u.banned)}
                          onDelete={()=>deleteUser(u.id)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {pages > 1 && (
              <div className="au-pag">
                <span>Showing {(page-1)*PER+1}–{Math.min(page*PER,filtered.length)} of {filtered.length}</span>
                <div className="au-pag-btns">
                  <button className="au-pag-btn" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>←</button>
                  {Array.from({length:Math.min(pages,7)},(_,i)=>i+1).map(p=>(
                    <button key={p} className={`au-pag-btn ${page===p?'active':''}`} onClick={()=>setPage(p)}>{p}</button>
                  ))}
                  <button className="au-pag-btn" onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page===pages}>→</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {selected && <UserModal user={selected} onClose={()=>setSelected(null)} onSaved={fetchUsers}/>}
    </div>
  );
}

/* ─── Action dropdown menu ─── */
function ActionMenu({ user: u, onView, onRoleChange, onToggleBan, onDelete }) {
  const [open, setOpen] = useState(false);
  useEffect(()=>{
    const h = ()=>setOpen(false);
    document.addEventListener('click',h);
    return ()=>document.removeEventListener('click',h);
  },[]);
  return (
    <div className="au-action-wrap" onClick={e=>e.stopPropagation()}>
      <button className="au-action-btn" onClick={()=>setOpen(o=>!o)}><MoreVertical size={15}/></button>
      {open && (
        <div className="au-action-menu">
          <button onClick={()=>{onView();setOpen(false)}}><Eye size={14}/> View Details</button>
          <button onClick={()=>{onView();setOpen(false)}}><Edit3 size={14}/> Edit User</button>
          <hr/>
          {(u.role||'customer')!=='customer'&&<button onClick={()=>{onRoleChange('customer');setOpen(false)}}><ShieldOff size={14}/> Set as Customer</button>}
          {(u.role||'customer')!=='driver'  &&<button onClick={()=>{onRoleChange('driver');setOpen(false)}}><UserCheck size={14}/> Make Driver</button>}
          {(u.role||'customer')!=='admin'   &&<button onClick={()=>{onRoleChange('admin');setOpen(false)}}><Shield size={14}/> Make Admin</button>}
          <hr/>
          <button onClick={()=>{onToggleBan();setOpen(false)}}>{u.banned?<><UserX size={14}/> Unban User</>:<><Ban size={14}/> Ban User</>}</button>
          <button className="danger" onClick={()=>{onDelete();setOpen(false)}}><Trash2 size={14}/> Delete</button>
        </div>
      )}
    </div>
  );
}
