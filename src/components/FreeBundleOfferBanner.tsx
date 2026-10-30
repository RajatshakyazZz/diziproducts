'use client';

import React from 'react';
import Link from 'next/link';
import { useStoreSettings } from '@/context/StoreSettingsContext';

interface FreeBundleOfferBannerProps {
  variant?: 'home' | 'checkout' | 'product';
  currentTotal?: number;
}

export default function FreeBundleOfferBanner({
  variant = 'home',
}: FreeBundleOfferBannerProps) {
  const { settings } = useStoreSettings();

  const bannerUrl = (settings.bannerUrl || '').trim();
  const isEnabled = settings.bannerEnabled !== false && Boolean(bannerUrl);

  // If no banner is uploaded/enabled in Admin Panel, do NOT render any hardcoded banner!
  if (!isEnabled || !bannerUrl) {
    return null;
  }

  // Safety check: permanently drop legacy hardcoded vaultzet banner
  if (
    /banner-free-bundles/i.test(bannerUrl) ||
    /Vaultzet-Neon-Reels-Bundle-Sale/i.test(bannerUrl) ||
    /vaultzet/i.test(bannerUrl)
  ) {
    return null;
  }

  const destinationLink = settings.bannerLink?.trim() || '/shop';

  const content = (
    <div className="w-full flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-800/80 bg-slate-950 shadow-xl group transition-all">
      <Link
        href={destinationLink}
        prefetch={false}
        className="block w-full overflow-hidden relative cursor-pointer"
        aria-label="Promotional Offer Banner"
      >
        <img
          src={bannerUrl}
          alt={settings.storeName ? `${settings.storeName} Offer Banner` : 'Promotional Offer'}
          width={1280}
          height={480}
          loading={variant === 'home' ? 'eager' : 'lazy'}
          decoding="async"
          className="w-full h-auto object-cover block group-hover:scale-[1.01] transition-transform duration-300"
        />
      </Link>
    </div>
  );

  if (variant === 'product') {
    return <div className="w-full my-3">{content}</div>;
  }

  if (variant === 'checkout') {
    return <div className="w-full mb-6">{content}</div>;
  }

  return (
    <section aria-label="Special offer banner" className="py-2 sm:py-4">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        {content}
      </div>
    </section>
  );
}
