'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
    _diziproducts_active_pixel_id?: string;
  }
}

function injectMetaPixelScript(): void {
  if (typeof window === 'undefined') return;
  if (window.fbq) return;

  try {
    const f: any = window;
    const b: any = document;
    const e = 'script';
    const v = 'https://connect.facebook.net/en_US/fbevents.js';

    if (f.fbq) return;
    const n: any = (f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];

    const t = b.createElement(e);
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    if (s && s.parentNode) {
      s.parentNode.insertBefore(t, s);
    } else {
      (b.head || b.body || b.documentElement).appendChild(t);
    }
  } catch (err) {
    console.warn('[MetaPixelTracker] Script injection warning:', err);
  }
}

export default function MetaPixelTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPixelId = useRef<string>('');
  const initialPageViewSent = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isCancelled = false;

    const resolveAndApplyPixel = async () => {
      let resolvedId = '';

      // 1. Try local storage cache from Admin Panel
      try {
        const storedMeta =
          localStorage.getItem('vaultzet_setting_meta_pixel') ||
          localStorage.getItem('rb_portal_settings_meta_pixel');
        if (storedMeta) {
          const parsed = JSON.parse(storedMeta);
          if (parsed.enabled !== false && parsed.pixel_id && String(parsed.pixel_id).trim()) {
            resolvedId = String(parsed.pixel_id).trim();
          }
        }

        if (!resolvedId) {
          const storedDnp =
            localStorage.getItem('vaultzet_setting_dnp_meta') ||
            localStorage.getItem('rb_portal_settings_dnp_meta');
          if (storedDnp) {
            const parsed = JSON.parse(storedDnp);
            if (parsed.enabled !== false && (parsed.meta_pixel_id || parsed.pixel_id)) {
              resolvedId = String(parsed.meta_pixel_id || parsed.pixel_id).trim();
            }
          }
        }
      } catch {}

      // 2. Fetch from live API (Firestore store_settings/meta_pixel & dnp_meta)
      try {
        const res = await fetch('/api/settings/meta-pixel', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.enabled && data.pixel_id && String(data.pixel_id).trim()) {
            resolvedId = String(data.pixel_id).trim();
          }
        }
      } catch (err) {
        // Fallback to local
      }

      if (isCancelled) return;

      // If no pixel ID configured in Admin Panel, do nothing
      if (!resolvedId) {
        currentPixelId.current = '';
        window._diziproducts_active_pixel_id = '';
        return;
      }

      // 3. Inject script & initialize Meta Pixel
      injectMetaPixelScript();

      if (typeof window.fbq === 'function') {
        if (currentPixelId.current !== resolvedId) {
          currentPixelId.current = resolvedId;
          window._diziproducts_active_pixel_id = resolvedId;

          try {
            window.fbq('init', resolvedId);
            window.fbq('track', 'PageView');
            initialPageViewSent.current = true;
          } catch (fbErr) {
            console.warn('[MetaPixelTracker] fbq init warning:', fbErr);
          }
        }
      } else {
        const interval = setInterval(() => {
          if (typeof window.fbq === 'function') {
            clearInterval(interval);
            if (currentPixelId.current !== resolvedId) {
              currentPixelId.current = resolvedId;
              window._diziproducts_active_pixel_id = resolvedId;
              try {
                window.fbq('init', resolvedId);
                window.fbq('track', 'PageView');
                initialPageViewSent.current = true;
              } catch (e) {}
            }
          }
        }, 100);

        setTimeout(() => clearInterval(interval), 3000);
      }
    };

    resolveAndApplyPixel();

    // Listen for real-time updates from Admin Panel
    const handlePixelUpdated = (e: any) => {
      const newId = String(e.detail?.pixel_id || e.detail?.meta_pixel_id || '').trim();
      const isEnabled = e.detail?.enabled !== false;

      if (newId && isEnabled) {
        injectMetaPixelScript();
        if (typeof window.fbq === 'function') {
          currentPixelId.current = newId;
          window._diziproducts_active_pixel_id = newId;
          try {
            window.fbq('init', newId);
            window.fbq('track', 'PageView');
          } catch {}
        }
      } else {
        currentPixelId.current = '';
        window._diziproducts_active_pixel_id = '';
      }
    };

    window.addEventListener('meta_pixel_updated', handlePixelUpdated);
    window.addEventListener('vaultworld:meta_pixel_updated', handlePixelUpdated);

    return () => {
      isCancelled = true;
      window.removeEventListener('meta_pixel_updated', handlePixelUpdated);
      window.removeEventListener('vaultworld:meta_pixel_updated', handlePixelUpdated);
    };
  }, []);

  // Track PageView on SPA route changes
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
    if (!currentPixelId.current || !initialPageViewSent.current) return;

    try {
      window.fbq('track', 'PageView');
    } catch {}
  }, [pathname, searchParams]);

  return null;
}
