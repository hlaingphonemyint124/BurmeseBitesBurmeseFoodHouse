import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────────────────────
//  These values come from your .env.local file
//  VITE_SUPABASE_URL     → your Supabase Project URL
//  VITE_SUPABASE_ANON_KEY → your Supabase anon/public key
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    '⚠️  Missing Supabase credentials.\n' +
    'Open your .env.local file and fill in:\n' +
    '  VITE_SUPABASE_URL=https://xxxx.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=eyJ...'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const signUp = async (email, password, fullName) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  return { data, error };
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// ─── Menu ─────────────────────────────────────────────────────────────────────
export const getMenuItems = async () =>
  supabase.from('menu_items').select('*').eq('available', true).order('category');

export const getAllMenuItems = async () =>
  supabase.from('menu_items').select('*').order('category');

export const createMenuItem   = async (item)        => supabase.from('menu_items').insert([item]).select();
export const updateMenuItem   = async (id, updates) => supabase.from('menu_items').update(updates).eq('id', id).select();
export const deleteMenuItem   = async (id)          => supabase.from('menu_items').delete().eq('id', id);

// ─── Reservations ─────────────────────────────────────────────────────────────
export const createReservation = async (r) =>
  supabase.from('reservations').insert([r]).select();

export const getAllReservations = async () =>
  supabase.from('reservations').select('*').order('created_at', { ascending: false });

export const updateReservationStatus = async (id, status) =>
  supabase.from('reservations').update({ status }).eq('id', id).select();

export const deleteReservation = async (id) =>
  supabase.from('reservations').delete().eq('id', id);

// ─── Orders ───────────────────────────────────────────────────────────────────
export const createOrder = async (order) =>
  supabase.from('orders').insert([order]).select();

export const createOrderItems = async (items) =>
  supabase.from('order_items').insert(items).select();

export const getAllOrders = async () =>
  supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });

export const updateOrderStatus = async (id, status) =>
  supabase.from('orders').update({ status }).eq('id', id).select();

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const getReviews = async () =>
  supabase.from('reviews').select('*').eq('approved', true).order('created_at', { ascending: false });

export const getAllReviews = async () =>
  supabase.from('reviews').select('*').order('created_at', { ascending: false });

export const createReview = async (review) =>
  supabase.from('reviews').insert([review]).select();

export const updateReviewApproval = async (id, approved) =>
  supabase.from('reviews').update({ approved }).eq('id', id).select();

export const deleteReview = async (id) =>
  supabase.from('reviews').delete().eq('id', id);

// ─── Gallery ──────────────────────────────────────────────────────────────────
export const getGalleryImages = async () =>
  supabase.from('gallery').select('*').order('sort_order');

export const createGalleryImage = async (image) =>
  supabase.from('gallery').insert([image]).select();

export const deleteGalleryImage = async (id) =>
  supabase.from('gallery').delete().eq('id', id);

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export const getDashboardStats = async () => {
  const [orders, reservations, reviews, menuItems] = await Promise.all([
    supabase.from('orders').select('id, total_amount, created_at, status'),
    supabase.from('reservations').select('id, status, created_at'),
    supabase.from('reviews').select('id, approved'),
    supabase.from('menu_items').select('id, available'),
  ]);
  return {
    orders:       orders.data       || [],
    reservations: reservations.data || [],
    reviews:      reviews.data      || [],
    menuItems:    menuItems.data    || [],
  };
};

// ─── Payment Slips ────────────────────────────────────────────────────────────
export const uploadPaymentSlip = async (orderId, file) => {
  const ext = file.name.split('.').pop();
  const path = `payment-slips/${orderId}.${ext}`;
  const { data, error } = await supabase.storage
    .from('payment-slips')
    .upload(path, file, { upsert: true });
  if (error) return { data: null, error };
  const { data: { publicUrl } } = supabase.storage.from('payment-slips').getPublicUrl(path);
  return { data: { path, publicUrl }, error: null };
};

export const updateOrderPayment = async (id, slipUrl, method) =>
  supabase.from('orders')
    .update({ payment_slip_url: slipUrl, payment_method: method, payment_status: 'pending_review' })
    .eq('id', id).select();

export const confirmPayment = async (id) =>
  supabase.from('orders')
    .update({ payment_status: 'confirmed', status: 'preparing' })
    .eq('id', id).select();

export const rejectPayment = async (id) =>
  supabase.from('orders')
    .update({ payment_status: 'rejected', status: 'received' })
    .eq('id', id).select();

export const getOrderByIdPoll = async (id) =>
  supabase.from('orders').select('id, status, payment_status, payment_slip_url, payment_method').eq('id', id).single();
