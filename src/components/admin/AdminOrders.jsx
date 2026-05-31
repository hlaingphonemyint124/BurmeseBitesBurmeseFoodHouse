import "./AdminComponents.css";
import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllOrders, updateOrderStatus } from '../../lib/supabase';

const STATUS_PIPELINE = ['received', 'preparing', 'ready', 'delivered'];

export default function AdminOrders() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [statusF, setStatusF] = useState('all');
  const [expanded, setExpanded] = useState({});

  const load = () => {
    setLoading(true);
    getAllOrders().then(({ data }) => {
      setOrders(data || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const advanceStatus = async (order) => {
    const idx = STATUS_PIPELINE.indexOf(order.status);
    if (idx === STATUS_PIPELINE.length - 1) return;
    const next = STATUS_PIPELINE[idx + 1];
    const { error } = await updateOrderStatus(order.id, next);
    if (error) { toast.error(error.message); return; }
    toast.success(`Order marked as "${next}".`);
    load();
  };

  const setStatus = async (id, status) => {
    const { error } = await updateOrderStatus(id, status);
    if (error) { toast.error(error.message); return; }
    toast.success(`Status updated to "${status}".`);
    load();
  };

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const statusClass = (s) => ({
    received:'status-received', preparing:'status-preparing',
    ready:'status-ready', delivered:'status-delivered'
  }[s] || 'status-received');

  const filtered = orders.filter(o => {
    const matchStatus = statusF === 'all' || o.status === statusF;
    const matchSearch = o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
                        o.email.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);

  return (
    <div>
      <div className="admin-section-head">
        <div>
          <h2>Orders</h2>
          <p>{orders.length} total orders · Total revenue: <strong style={{ color:'var(--amber-dark)' }}>${totalRevenue.toFixed(2)}</strong></p>
        </div>
      </div>

      {/* Status pipeline summary */}
      <div className="orders-pipeline">
        {STATUS_PIPELINE.map(s => (
          <div key={s} className={`orders-pipeline__step ${statusF === s ? 'orders-pipeline__step--active' : ''}`}
            onClick={() => setStatusF(statusF === s ? 'all' : s)}>
            <div className="orders-pipeline__count">{orders.filter(o => o.status === s).length}</div>
            <div className="orders-pipeline__label" style={{ textTransform:'capitalize' }}>{s}</div>
          </div>
        ))}
      </div>

      <div className="admin-filter-bar">
        <div className="admin-search">
          <Search size={14} className="admin-search__icon" />
          <input placeholder="Search by customer or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input" style={{ width:'auto' }} value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="all">All Statuses</option>
          {STATUS_PIPELINE.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Update</th>
                <th>Items</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:'40px', color:'var(--text-muted)', fontStyle:'italic' }}>No orders found.</td></tr>
              ) : filtered.map(order => (
                <React.Fragment key={order.id}>
                  <tr>
                    <td>
                      <div style={{ fontWeight:500 }}>{order.customer_name}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>{order.email}</div>
                    </td>
                    <td style={{ textTransform:'capitalize' }}>{order.order_type}</td>
                    <td style={{ fontWeight:600, color:'var(--amber-dark)' }}>${parseFloat(order.total_amount).toFixed(2)}</td>
                    <td style={{ fontSize:12 }}>{new Date(order.created_at).toLocaleDateString()}<br/><span style={{ color:'var(--text-muted)' }}>{new Date(order.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span></td>
                    <td><span className={`status-badge ${statusClass(order.status)}`}>{order.status}</span></td>
                    <td>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                        {order.status !== 'delivered' && (
                          <button className="admin-action-btn admin-action-btn--approve" onClick={() => advanceStatus(order)}>
                            Next →
                          </button>
                        )}
                        <select
                          className="form-input"
                          style={{ padding:'4px 8px', fontSize:11, width:'auto' }}
                          value={order.status}
                          onChange={e => setStatus(order.id, e.target.value)}
                        >
                          {STATUS_PIPELINE.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                        </select>
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleExpand(order.id)}
                        style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--amber-dark)', fontWeight:500 }}
                      >
                        {expanded[order.id] ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                        {(order.order_items || []).length} items
                      </button>
                    </td>
                  </tr>
                  {expanded[order.id] && (
                    <tr>
                      <td colSpan={7} style={{ background:'var(--ivory)', padding:'0' }}>
                        <div style={{ padding:'12px 20px' }}>
                          <table style={{ width:'100%', fontSize:12 }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign:'left', color:'var(--text-muted)', padding:'4px 8px' }}>Item</th>
                                <th style={{ textAlign:'left', color:'var(--text-muted)', padding:'4px 8px' }}>Qty</th>
                                <th style={{ textAlign:'left', color:'var(--text-muted)', padding:'4px 8px' }}>Unit Price</th>
                                <th style={{ textAlign:'left', color:'var(--text-muted)', padding:'4px 8px' }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(order.order_items || []).map(item => (
                                <tr key={item.id}>
                                  <td style={{ padding:'4px 8px' }}>{item.name}</td>
                                  <td style={{ padding:'4px 8px' }}>{item.quantity}</td>
                                  <td style={{ padding:'4px 8px' }}>${parseFloat(item.price).toFixed(2)}</td>
                                  <td style={{ padding:'4px 8px', fontWeight:600 }}>${(item.quantity * item.price).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {order.notes && (
                            <p style={{ marginTop:8, fontSize:12, color:'var(--text-muted)' }}>
                              <strong>Notes:</strong> {order.notes}
                            </p>
                          )}
                          {order.address && (
                            <p style={{ marginTop:4, fontSize:12, color:'var(--text-muted)' }}>
                              <strong>Delivery to:</strong> {order.address}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
