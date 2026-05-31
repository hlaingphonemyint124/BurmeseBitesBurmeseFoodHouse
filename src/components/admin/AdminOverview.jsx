import "./AdminOverview.css";
import React, { useState, useEffect } from 'react';
import { ShoppingBag, CalendarDays, Star, UtensilsCrossed, TrendingUp, Clock } from 'lucide-react';
import { getDashboardStats, getAllOrders, getAllReservations } from '../../lib/supabase';

export default function AdminOverview() {
  const [stats, setStats]             = useState(null);
  const [recentOrders, setOrders]     = useState([]);
  const [recentRes, setReservations]  = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getAllOrders(),
      getAllReservations(),
    ]).then(([s, { data: orders }, { data: res }]) => {
      setStats(s);
      setOrders((orders || []).slice(0, 5));
      setReservations((res || []).slice(0, 5));
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="spinner" />;

  const totalRevenue = stats.orders
    .filter(o => o.status !== 'cancelled')
    .reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);

  const todayOrders = stats.orders.filter(o => {
    const d = new Date(o.created_at);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  const pendingReservations = stats.reservations.filter(r => r.status === 'pending').length;
  const pendingReviews      = stats.reviews.filter(r => !r.approved).length;

  const STAT_CARDS = [
    { label: 'Total Revenue',        value: `$${totalRevenue.toFixed(2)}`, icon: <TrendingUp size={22} />,      color: 'amber' },
    { label: 'Total Orders',         value: stats.orders.length,           icon: <ShoppingBag size={22} />,     color: 'blue'  },
    { label: 'Reservations Pending', value: pendingReservations,           icon: <CalendarDays size={22} />,    color: 'jade'  },
    { label: 'Reviews to Approve',   value: pendingReviews,                icon: <Star size={22} />,            color: 'red'   },
  ];

  const statusClass = (s) => {
    const map = { pending:'status-pending', confirmed:'status-confirmed', cancelled:'status-cancelled',
                  received:'status-received', preparing:'status-preparing', ready:'status-ready', delivered:'status-delivered' };
    return map[s] || 'status-pending';
  };

  return (
    <div className="admin-overview">
      {/* Stat cards */}
      <div className="admin-stats">
        {STAT_CARDS.map(c => (
          <div key={c.label} className="admin-stat-card">
            <div className={`admin-stat-card__icon admin-stat-card__icon--${c.color}`}>{c.icon}</div>
            <div>
              <div className="admin-stat-card__value">{c.value}</div>
              <div className="admin-stat-card__label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary row */}
      <div className="overview-summary-row">
        <div className="overview-info-card">
          <UtensilsCrossed size={18} />
          <div>
            <strong>{stats.menuItems.length}</strong> Menu Items
            <span>({stats.menuItems.filter(m => m.available).length} active)</span>
          </div>
        </div>
        <div className="overview-info-card">
          <ShoppingBag size={18} />
          <div>
            <strong>{todayOrders}</strong> Orders Today
          </div>
        </div>
        <div className="overview-info-card">
          <Star size={18} />
          <div>
            <strong>{stats.reviews.filter(r => r.approved).length}</strong> Approved Reviews
          </div>
        </div>
        <div className="overview-info-card">
          <Clock size={18} />
          <div>
            <strong>{stats.reservations.filter(r => r.status === 'confirmed').length}</strong> Confirmed Bookings
          </div>
        </div>
      </div>

      <div className="overview-grid">
        {/* Recent Orders */}
        <div className="admin-panel">
          <div className="admin-panel__head">
            <h3>Recent Orders</h3>
            <a href="/admin/orders" className="admin-panel__link">View all →</a>
          </div>
          {recentOrders.length === 0 ? (
            <p className="admin-empty">No orders yet.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(o => (
                    <tr key={o.id}>
                      <td>{o.customer_name}</td>
                      <td style={{ textTransform:'capitalize' }}>{o.order_type}</td>
                      <td>${parseFloat(o.total_amount).toFixed(2)}</td>
                      <td><span className={`status-badge ${statusClass(o.status)}`}>{o.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Reservations */}
        <div className="admin-panel">
          <div className="admin-panel__head">
            <h3>Recent Reservations</h3>
            <a href="/admin/reservations" className="admin-panel__link">View all →</a>
          </div>
          {recentRes.length === 0 ? (
            <p className="admin-empty">No reservations yet.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Date</th>
                    <th>Party</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRes.map(r => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{r.date} {r.time}</td>
                      <td>{r.party_size} guests</td>
                      <td><span className={`status-badge ${statusClass(r.status)}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// add css import at top (prepend)
