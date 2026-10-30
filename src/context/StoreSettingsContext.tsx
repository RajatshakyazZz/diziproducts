'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface StoreSettings {
  storeName: string;
  ownerName?: string;
  tagline: string;
  supportEmail: string;
  supportPhone?: string;
  supportWhatsapp?: string;
  currency: string;
  currencySymbol: string;
  logoUrl?: string;
  bannerUrl?: string;
  bannerEnabled?: boolean;
  bannerLink?: string;
  primaryColor?: string;
  whatsappButtonEnabled?: boolean;
  whatsappDefaultMessage?: string;
  whatsappPopupText?: string;
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'DiziProducts Store',
  ownerName: 'DiziProducts Team',
  tagline: 'Everything You Need, All in One Place.',
  supportEmail: 'ashamse137@gmail.com',
  supportPhone: '+91 8860032559',
  supportWhatsapp: '+91 8860032559',
  currency: 'INR',
  currencySymbol: '₹',
  logoUrl: '/logo.webp?v=4',
  bannerUrl: '',
  bannerEnabled: false,
  bannerLink: '/shop',
  whatsappButtonEnabled: true,
  whatsappDefaultMessage: 'Hi DiziProducts Support! I need quick help regarding my DiziProducts Store order.',
  whatsappPopupText: 'Need help? Chat on WhatsApp',
};

function sanitizeStoreName(name?: string, fallback = 'DiziProducts Store'): string {
  if (!name || !name.trim()) return fallback;
  if (/reels\s*bundles?/i.test(name) || /digonest/i.test(name) || /vaultzet/i.test(name) || /vaultworld/i.test(name)) {
    return 'DiziProducts Store';
  }
  return name.trim();
}

function sanitizeTagline(tagline?: string, fallback = 'Everything You Need, All in One Place.'): string {
  if (!tagline || !tagline.trim()) return fallback;
  if (/vaultzet/i.test(tagline) || /categories store/i.test(tagline)) {
    return 'Everything You Need, All in One Place.';
  }
  return tagline.trim();
}

function sanitizeLogoUrl(url?: string, fallback = '/logo.webp?v=4'): string {
  if (!url || !url.trim()) return fallback;
  if (/vaultzet/i.test(url)) {
    return '/logo.webp?v=4';
  }
  return url.trim();
}

function sanitizeBannerUrl(url?: string): string {
  if (!url || !url.trim()) return '';
  // Purge the old hardcoded Vaultzet banners
  if (/banner-free-bundles/i.test(url) || /Vaultzet-Neon-Reels-Bundle-Sale/i.test(url) || /vaultzet/i.test(url)) {
    return '';
  }
  return url.trim();
}

function sanitizeEmail(email?: string, fallback = 'ashamse137@gmail.com'): string {
  if (!email || !email.trim()) return fallback;
  if (
    /reelsbundles/i.test(email) ||
    /digonest/i.test(email) ||
    /support@vaultzet\.(com|shop)/i.test(email) ||
    /rajattracozegaming/i.test(email) ||
    /vaultworld/i.test(email)
  ) {
    return 'ashamse137@gmail.com';
  }
  return email.trim();
}

function sanitizePhone(phone?: string, fallback = '+91 8860032559'): string {
  if (!phone || !phone.trim()) return fallback;
  if (
    /98765\s*43210/.test(phone) ||
    /8051017331/.test(phone) ||
    /9142408286/.test(phone) ||
    /7895317940/.test(phone)
  ) {
    return '+91 8860032559';
  }
  return phone.trim();
}

const StoreSettingsContext = createContext<{
  settings: StoreSettings;
  isLoading: boolean;
}>({
  settings: DEFAULT_SETTINGS,
  isLoading: false,
});

export function StoreSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const cached = localStorage.getItem('vaultzet_store_settings');
      const portalWa = localStorage.getItem('rb_portal_settings_whatsapp');
      let waData: any = null;
      if (portalWa) {
        try { waData = JSON.parse(portalWa); } catch {}
      }

      if (cached) {
        const parsed = JSON.parse(cached);
        const cleaned = {
          ...DEFAULT_SETTINGS,
          ...parsed,
          storeName: sanitizeStoreName(parsed.storeName),
          tagline: sanitizeTagline(parsed.tagline),
          logoUrl: sanitizeLogoUrl(parsed.logoUrl),
          bannerUrl: sanitizeBannerUrl(parsed.bannerUrl),
          bannerEnabled: parsed.bannerEnabled !== undefined ? Boolean(parsed.bannerEnabled) : false,
          bannerLink: parsed.bannerLink || '/shop',
          supportEmail: sanitizeEmail(parsed.supportEmail),
          supportWhatsapp: sanitizePhone(waData?.phone_number || parsed.supportWhatsapp || '+91 8860032559'),
          ownerName: '',
          whatsappButtonEnabled: waData?.enabled !== undefined ? waData.enabled : (parsed.whatsappButtonEnabled !== undefined ? parsed.whatsappButtonEnabled : true),
          whatsappDefaultMessage: waData?.default_message || parsed.whatsappDefaultMessage || DEFAULT_SETTINGS.whatsappDefaultMessage,
          whatsappPopupText: waData?.popup_text || parsed.whatsappPopupText || DEFAULT_SETTINGS.whatsappPopupText,
        };
        setSettings(cleaned);
        try {
          localStorage.setItem('vaultzet_store_settings', JSON.stringify(cleaned));
        } catch {}
      } else if (waData?.phone_number) {
        setSettings((prev) => ({
          ...prev,
          supportWhatsapp: sanitizePhone(waData.phone_number),
          whatsappButtonEnabled: waData.enabled !== undefined ? waData.enabled : true,
          whatsappDefaultMessage: waData.default_message || prev.whatsappDefaultMessage,
          whatsappPopupText: waData.popup_text || prev.whatsappPopupText,
        }));
      }
    } catch {}

    const handleCustomWaUpdate = (e: any) => {
      if (e.detail?.phone_number) {
        setSettings((prev) => ({
          ...prev,
          supportWhatsapp: sanitizePhone(e.detail.phone_number),
          whatsappButtonEnabled: e.detail.enabled !== undefined ? e.detail.enabled : prev.whatsappButtonEnabled,
          whatsappDefaultMessage: e.detail.default_message || prev.whatsappDefaultMessage,
          whatsappPopupText: e.detail.popup_text || prev.whatsappPopupText,
        }));
      }
    };

    const handleBrandingUpdate = (e: any) => {
      if (e.detail) {
        setSettings((prev) => {
          const updatedBannerUrl = e.detail.banner_url !== undefined
            ? sanitizeBannerUrl(e.detail.banner_url)
            : prev.bannerUrl;
          const updatedBannerEnabled = e.detail.banner_enabled !== undefined
            ? Boolean(e.detail.banner_enabled)
            : (updatedBannerUrl ? (prev.bannerEnabled ?? false) : false);
          const updatedBannerLink = e.detail.banner_link || prev.bannerLink || '/shop';

          const updated = {
            ...prev,
            storeName: sanitizeStoreName(e.detail.store_name, prev.storeName),
            tagline: sanitizeTagline(e.detail.tagline, prev.tagline),
            logoUrl: sanitizeLogoUrl(e.detail.logo_url, prev.logoUrl),
            bannerUrl: updatedBannerUrl,
            bannerEnabled: updatedBannerEnabled,
            bannerLink: updatedBannerLink,
            primaryColor: e.detail.primary_color || prev.primaryColor,
          };
          try {
            localStorage.setItem('vaultzet_store_settings', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    };

    window.addEventListener('vaultworld:whatsapp_updated', handleCustomWaUpdate);
    window.addEventListener('vaultworld:branding_updated', handleBrandingUpdate);
    return () => {
      window.removeEventListener('vaultworld:whatsapp_updated', handleCustomWaUpdate);
      window.removeEventListener('vaultworld:branding_updated', handleBrandingUpdate);
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;
    let hasTriggered = false;

    const startFirestoreSync = async () => {
      if (hasTriggered || isCancelled) return;
      hasTriggered = true;
      cleanupListeners();

      try {
        const [{ db }, { doc, getDoc }] = await Promise.all([
          import('@/lib/firebase'),
          import('firebase/firestore'),
        ]);
        if (isCancelled || !db) {
          setIsLoading(false);
          return;
        }

        const [generalSnap, brandingSnap, whatsappSnap] = await Promise.all([
          getDoc(doc(db, 'store_settings', 'general')).catch(() => null),
          getDoc(doc(db, 'store_settings', 'branding')).catch(() => null),
          getDoc(doc(db, 'store_settings', 'whatsapp')).catch(() => null),
        ]);

        if (!isCancelled && generalSnap && generalSnap.exists()) {
          const data = generalSnap.data();
          const generalOfferBanner = sanitizeBannerUrl(data.free_bundle_offer?.banner_image || data.banner_url);
          setSettings((prev) => {
            const updated = {
              ...prev,
              storeName: sanitizeStoreName(data.store_name, prev.storeName),
              supportEmail: sanitizeEmail(data.contact_email, prev.supportEmail),
              supportPhone: data.support_phone || data.support_whatsapp || prev.supportPhone,
              supportWhatsapp: sanitizePhone(data.support_whatsapp, prev.supportWhatsapp),
              currency: data.currency || prev.currency,
              currencySymbol: data.currency_symbol || prev.currencySymbol,
              bannerUrl: generalOfferBanner || prev.bannerUrl || '',
              bannerEnabled: data.free_bundle_offer?.enabled !== undefined
                ? Boolean(data.free_bundle_offer.enabled)
                : (generalOfferBanner ? prev.bannerEnabled : false),
            };
            try {
              localStorage.setItem('vaultzet_store_settings', JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }

        if (!isCancelled && brandingSnap && brandingSnap.exists()) {
          const data = brandingSnap.data();
          const brandingBanner = sanitizeBannerUrl(data.banner_url || data.offer_banner_url || data.hero_banner_url);
          setSettings((prev) => {
            const updated = {
              ...prev,
              storeName: sanitizeStoreName(data.store_name, prev.storeName),
              tagline: sanitizeTagline(data.tagline, prev.tagline),
              logoUrl: sanitizeLogoUrl(data.logo_url, prev.logoUrl),
              bannerUrl: brandingBanner || prev.bannerUrl || '',
              bannerEnabled: data.banner_enabled !== undefined
                ? Boolean(data.banner_enabled)
                : (brandingBanner ? (prev.bannerEnabled ?? true) : false),
              bannerLink: data.banner_link || prev.bannerLink || '/shop',
              primaryColor: data.primary_color || prev.primaryColor,
            };
            try {
              localStorage.setItem('vaultzet_store_settings', JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }

        if (!isCancelled && whatsappSnap && whatsappSnap.exists()) {
          const data = whatsappSnap.data();
          setSettings((prev) => {
            const updated = {
              ...prev,
              supportWhatsapp: sanitizePhone(data.phone_number, prev.supportWhatsapp),
              whatsappButtonEnabled: data.enabled !== undefined ? data.enabled : prev.whatsappButtonEnabled,
              whatsappDefaultMessage: data.default_message || prev.whatsappDefaultMessage,
              whatsappPopupText: data.popup_text || prev.whatsappPopupText,
            };
            try {
              localStorage.setItem('vaultzet_store_settings', JSON.stringify(updated));
              localStorage.setItem('rb_portal_settings_whatsapp', JSON.stringify(data));
            } catch {}
            return updated;
          });
        }
      } catch {
        // Fallback gracefully without throwing console errors
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    const events = ['scroll', 'pointerdown', 'touchstart', 'keydown'] as const;
    const cleanupListeners = () => {
      events.forEach((evt) => window.removeEventListener(evt, startFirestoreSync));
    };

    events.forEach((evt) =>
      window.addEventListener(evt, startFirestoreSync, { once: true, passive: true })
    );

    return () => {
      isCancelled = true;
      cleanupListeners();
    };
  }, []);

  return (
    <StoreSettingsContext.Provider value={{ settings, isLoading }}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  return useContext(StoreSettingsContext);
}
