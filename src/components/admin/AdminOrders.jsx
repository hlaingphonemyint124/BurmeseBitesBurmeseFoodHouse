import "./AdminComponents.css";
import "./AdminPayments.css";
import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, Eye, CheckCircle, XCircle, Image, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllOrders, updateOrderStatus, confirmPayment, rejectPayment } from '../../lib/supabase';

const STATUS_PIPELINE = ['received', 'preparing', 'ready', 'delivered'];

export default function AdminOrders() {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [statusF, setStatusF]   = useState('all');
  const [expanded, setExpanded] = useState({});
  const [slipModal, setSlipModal] = useState(null); // { order }
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'payments'

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

  const handleConfirmPayment = async (order) => {
    const { error } = await confirmPayment(order.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Payment confirmed! Order is now being prepared.');
    setSlipModal(null);
    load();
  };

  const handleRejectPayment = async (order) => {
    const { error } = await rejectPayment(order.id);
    if (error) { toast.error(error.message); return; }
    toast.error('Payment slip rejected. Customer will be notified.');
    setSlipModal(null);
    load();
  };

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const statusClass = (s) => ({
    received:'status-received', preparing:'status-preparing',
    ready:'status-ready', delivered:'status-delivered'
  }[s] || 'status-received');

  const payStatusClass = (s) => ({
    unpaid: 'pay-status--unpaid',
    pending_review: 'pay-status--pending',
    confirmed: 'pay-status--confirmed',
    rejected: 'pay-status--rejected',
  }[s] || 'pay-status--unpaid');

  const payStatusLabel = (s) => ({
    unpaid: 'Unpaid',
    pending_review: 'Pending Review',
    confirmed: 'Confirmed',
    rejected: 'Rejected',
  }[s] || 'Unpaid');

  const filtered = orders.filter(o => {
    const matchStatus = statusF === 'all' || o.status === statusF;
    const matchSearch = o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
                        o.email.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const pendingPayments = orders.filter(o => o.payment_status === 'pending_review');

  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled' && o.payment_status === 'confirmed')
    .reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);

  return (
    <div>
      <div className="admin-section-head">
        <div>
          <h2>Orders & Payments</h2>
          <p>{orders.length} total orders · Confirmed revenue: <strong style={{ color:'var(--amber-dark)' }}>${totalRevenue.toFixed(2)}</strong></p>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="admin-tab-bar">
        <button
          className={`admin-tab ${activeTab === 'orders' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          All Orders
        </button>
        <button
          className={`admin-tab ${activeTab === 'payments' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          Payment Slips
          {pendingPayments.length > 0 && (
            <span className="admin-tab__badge">{pendingPayments.length}</span>
          )}
        </button>
      </div>

      {/* ══ ORDERS TAB ═══════════════════════════════════════════════════════ */}
      {activeTab === 'orders' && (
        <>
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
                    <th>Payment</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Update</th>
                    <th>Items</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign:'center', padding:'40px', color:'var(--text-muted)', fontStyle:'italic' }}>No orders found.</td></tr>
                  ) : filtered.map(order => (
                    <React.Fragment key={order.id}>
                      <tr>
                        <td>
                          <div style={{ fontWeight:500 }}>{order.customer_name}</div>
                          <div style={{ fontSize:11, color:'var(--text-muted)' }}>{order.email}</div>
                        </td>
                        <td style={{ textTransform:'capitalize' }}>{order.order_type}</td>
                        <td style={{ fontWeight:600, color:'var(--amber-dark)' }}>${parseFloat(order.total_amount).toFixed(2)}</td>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <span className={`pay-status-badge ${payStatusClass(order.payment_status)}`}>
                              {payStatusLabel(order.payment_status)}
                            </span>
                            {order.payment_slip_url && (
                              <button className="slip-eye-btn" onClick={() => setSlipModal(order)} title="View slip">
                                <Eye size={13} />
                              </button>
                            )}
                          </div>
                        </td>
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
                          <td colSpan={8} style={{ background:'var(--ivory)', padding:'0' }}>
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
        </>
      )}

      {/* ══ PAYMENT SLIPS TAB ════════════════════════════════════════════════ */}
      {activeTab === 'payments' && (
        <div className="payment-slips-panel">
          {loading ? <div className="spinner" /> : (
            <>
              {pendingPayments.length === 0 && (
                <div className="payments-empty">
                  <CheckCircle size={44} className="payments-empty__icon" />
                  <p>No pending payment slips</p>
                  <p className="payments-empty__sub">All payment slips have been reviewed.</p>
                </div>
              )}
              {pendingPayments.length > 0 && (
                <>
                  <div className="payments-pending-header">
                    <Clock size={16} />
                    <span>{pendingPayments.length} slip{pendingPayments.length > 1 ? 's' : ''} awaiting review</span>
                  </div>
                  <div className="payment-slip-grid">
                    {pendingPayments.map(order => (
                      <div key={order.id} className="payment-slip-card">
                        <div className="payment-slip-card__img-wrap" onClick={() => setSlipModal(order)}>
                          {order.payment_slip_url ? (
                            <img src={order.payment_slip_url} alt="Payment slip" className="payment-slip-card__img" />
                          ) : (
                            <div className="payment-slip-card__no-img"><Image size={28} /></div>
                          )}
                          <div className="payment-slip-card__zoom">View</div>
                        </div>
                        <div className="payment-slip-card__info">
                          <div className="payment-slip-card__name">{order.customer_name}</div>
                          <div className="payment-slip-card__meta">
                            <span className="payment-slip-card__method">{order.payment_method === 'kbz' ? 'KBZ Pay' : 'AYA Pay'}</span>
                            <span className="payment-slip-card__amount">${parseFloat(order.total_amount).toFixed(2)}</span>
                          </div>
                          <div className="payment-slip-card__time">{new Date(order.created_at).toLocaleString()}</div>
                        </div>
                        <div className="payment-slip-card__actions">
                          <button className="slip-action-btn slip-action-btn--confirm" onClick={() => handleConfirmPayment(order)}>
                            <CheckCircle size={15} /> Confirm
                          </button>
                          <button className="slip-action-btn slip-action-btn--reject" onClick={() => handleRejectPayment(order)}>
                            <XCircle size={15} /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* All reviewed slips */}
              {orders.filter(o => o.payment_status === 'confirmed' || o.payment_status === 'rejected').length > 0 && (
                <div className="payment-reviewed-section">
                  <h4 className="payment-reviewed-section__title">Recently Reviewed</h4>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Customer</th>
                          <th>Method</th>
                          <th>Amount</th>
                          <th>Payment Status</th>
                          <th>Slip</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.filter(o => o.payment_status === 'confirmed' || o.payment_status === 'rejected').map(order => (
                          <tr key={order.id}>
                            <td>
                              <div style={{ fontWeight:500 }}>{order.customer_name}</div>
                              <div style={{ fontSize:11, color:'var(--text-muted)' }}>{order.email}</div>
                            </td>
                            <td style={{ textTransform:'capitalize' }}>{order.payment_method || '—'}</td>
                            <td style={{ fontWeight:600, color:'var(--amber-dark)' }}>${parseFloat(order.total_amount).toFixed(2)}</td>
                            <td>
                              <span className={`pay-status-badge ${payStatusClass(order.payment_status)}`}>
                                {payStatusLabel(order.payment_status)}
                              </span>
                            </td>
                            <td>
                              {order.payment_slip_url ? (
                                <button className="slip-eye-btn" onClick={() => setSlipModal(order)}>
                                  <Eye size={13} /> View
                                </button>
                              ) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══ SLIP MODAL ═══════════════════════════════════════════════════════ */}
      {slipModal && (
        <div className="slip-modal-overlay" onClick={() => setSlipModal(null)}>
          <div className="slip-modal" onClick={e => e.stopPropagation()}>
            <div className="slip-modal__header">
              <div>
                <h3>Payment Slip</h3>
                <p>{slipModal.customer_name} · #{slipModal.id?.slice(-8).toUpperCase()}</p>
              </div>
              <button className="slip-modal__close" onClick={() => setSlipModal(null)}>✕</button>
            </div>
            <div className="slip-modal__body">
              <div className="slip-modal__img-wrap">
                {slipModal.payment_slip_url ? (
                  <img src={slipModal.payment_slip_url} alt="Payment slip" className="slip-modal__img" />
                ) : (
                  <div className="slip-modal__no-img"><Image size={40} /><p>No slip uploaded</p></div>
                )}
              </div>
              <div className="slip-modal__details">
                <div className="slip-modal__detail-row">
                  <span>Amount</span><strong>${parseFloat(slipModal.total_amount).toFixed(2)}</strong>
                </div>
                <div className="slip-modal__detail-row">
                  <span>Method</span><strong style={{ textTransform:'capitalize' }}>{slipModal.payment_method === 'kbz' ? 'KBZ Pay' : 'AYA Pay'}</strong>
                </div>
                <div className="slip-modal__detail-row">
                  <span>Order type</span><strong style={{ textTransform:'capitalize' }}>{slipModal.order_type}</strong>
                </div>
                <div className="slip-modal__detail-row">
                  <span>Current status</span>
                  <span className={`pay-status-badge ${['confirmed','rejected'].includes(slipModal.payment_status) ? (slipModal.payment_status === 'confirmed' ? 'pay-status--confirmed' : 'pay-status--rejected') : 'pay-status--pending'}`}>
                    {payStatusLabel(slipModal.payment_status)}
                  </span>
                </div>
              </div>
            </div>
            {slipModal.payment_status === 'pending_review' && (
              <div className="slip-modal__footer">
                <button className="slip-action-btn slip-action-btn--reject slip-action-btn--lg" onClick={() => handleRejectPayment(slipModal)}>
                  <XCircle size={16} /> Reject Payment
                </button>
                <button className="slip-action-btn slip-action-btn--confirm slip-action-btn--lg" onClick={() => handleConfirmPayment(slipModal)}>
                  <CheckCircle size={16} /> Confirm Payment
                </button>
              </div>
            )}
            {slipModal.payment_status !== 'pending_review' && (
              <div className="slip-modal__footer">
                <button className="btn btn-outline" style={{ width:'100%' }} onClick={() => setSlipModal(null)}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
