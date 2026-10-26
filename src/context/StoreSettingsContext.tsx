'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface StoreSettings {
  storeName: string;
  ownerName?: string;
  tagline: string;
  supportEmail: string;
  supportWhatsapp?: string;
  currency: string;
  currencySymbol: string;
  logoUrl?: string;
  primaryColor?: string;
  whatsappButtonEnabled?: boolean;
  whatsappDefaultMessage?: string;
  whatsappPopupText?: string;
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'VaultWorld Store',
  ownerName: 'Rajat Shakya',
  tagline: 'Premium Reels for Your Growth',
  supportEmail: 'support.vaultworld.shop@gmail.com',
  supportWhatsapp: '+91 8051017331',
  currency: 'INR',
  currencySymbol: '₹',
  whatsappButtonEnabled: true,
  whatsappDefaultMessage: 'Hi Rajat Shakya! I need quick help regarding my VaultWorld Store order.',
  whatsappPopupText: 'Need help? Chat on WhatsApp',
};

function sanitizeStoreName(name?: string, fallback = 'VaultWorld Store'): string {
  if (!name || !name.trim()) return fallback;
  if (/reels\s*bundles?/i.test(name) || /digonest/i.test(name) || /vaultzet/i.test(name)) {
    return 'VaultWorld Store';
  }
  return name.trim();
}

function sanitizeEmail(email?: string, fallback = 'support.vaultworld.shop@gmail.com'): string {
  if (!email || !email.trim()) return fallback;
  if (
    /reelsbundles/i.test(email) ||
    /digonest/i.test(email) ||
    /support@vaultzet\.(com|shop)/i.test(email) ||
    /rajattracozegaming/i.test(email)
  ) {
    return 'support.vaultworld.shop@gmail.com';
  }
  return email.trim();
}

function sanitizePhone(phone?: string, fallback = '+91 8051017331'): string {
  if (!phone || !phone.trim()) return fallback;
  if (/98765\s*43210/.test(phone) || /7895317940/.test(phone)) {
    return '+91 8051017331';
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
        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
          storeName: sanitizeStoreName(parsed.storeName),
          supportEmail: sanitizeEmail(parsed.supportEmail),
          supportWhatsapp: sanitizePhone(waData?.phone_number || parsed.supportWhatsapp),
          ownerName: parsed.ownerName || 'Rajat Shakya',
          whatsappButtonEnabled: waData?.enabled !== undefined ? waData.enabled : (parsed.whatsappButtonEnabled !== undefined ? parsed.whatsappButtonEnabled : true),
          whatsappDefaultMessage: waData?.default_message || parsed.whatsappDefaultMessage || DEFAULT_SETTINGS.whatsappDefaultMessage,
          whatsappPopupText: waData?.popup_text || parsed.whatsappPopupText || DEFAULT_SETTINGS.whatsappPopupText,
        });
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
        setSettings((prev) => ({
          ...prev,
          storeName: sanitizeStoreName(e.detail.store_name, prev.storeName),
          tagline: e.detail.tagline || prev.tagline,
          logoUrl: e.detail.logo_url || prev.logoUrl,
          primaryColor: e.detail.primary_color || prev.primaryColor,
        }));
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
          setSettings((prev) => {
            const updated = {
              ...prev,
              storeName: sanitizeStoreName(data.store_name, prev.storeName),
              supportEmail: sanitizeEmail(data.contact_email, prev.supportEmail),
              supportWhatsapp: sanitizePhone(data.support_whatsapp, prev.supportWhatsapp),
              currency: data.currency || prev.currency,
              currencySymbol: data.currency_symbol || prev.currencySymbol,
            };
            try {
              localStorage.setItem('vaultzet_store_settings', JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }

        if (!isCancelled && brandingSnap && brandingSnap.exists()) {
          const data = brandingSnap.data();
          setSettings((prev) => {
            const updated = {
              ...prev,
              storeName: sanitizeStoreName(data.store_name, prev.storeName),
              tagline: data.tagline || prev.tagline,
              logoUrl: data.logo_url || prev.logoUrl,
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
