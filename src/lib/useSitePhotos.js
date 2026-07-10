/**
 * useSitePhotos(section)
 * Fetches active photos for a logical_section from the site_photos table.
 * Returns empty array (not an error) if table doesn't exist yet.
 */
import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export function useSitePhotos(section) {
  const [photos,  setPhotos]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!section) { setLoading(false); return; }

    supabase
      .from('site_photos')
      .select('*')
      .eq('logical_section', section)
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setPhotos(data);
        // Silently ignore "table not exist" — fall back to defaults
        setLoading(false);
      });
  }, [section]);

  return { photos, loading };
}
