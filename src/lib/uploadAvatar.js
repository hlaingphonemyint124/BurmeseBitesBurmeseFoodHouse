import { supabase } from './supabase';

/**
 * Uploads a profile photo to Supabase Storage (bucket: restaurant-images,
 * folder: avatars) and returns a public URL. Falls back to a base64
 * data URL if the storage bucket isn't reachable, so the upload never
 * silently fails.
 */
export async function uploadAvatarFile(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image is too large — please choose one under 5MB.');
  }

  const ext      = file.name.split('.').pop();
  const fileName = `avatars/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from('restaurant-images')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (!error) {
    const { data: { publicUrl } } = supabase.storage
      .from('restaurant-images')
      .getPublicUrl(data.path);
    return { url: publicUrl, usedFallback: false };
  }

  // Fallback: store as base64 directly on the user record
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return { url: base64, usedFallback: true };
}
