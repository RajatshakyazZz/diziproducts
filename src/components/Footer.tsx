'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Zap,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Heart,
  ArrowRight,
  PlaySquare,
} from 'lucide-react';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { useCart } from '@/context/CartContext';
import { track } from '@/lib/analytics';

export default function Footer() {
  const pathname = usePathname();
  const { settings } = useStoreSettings();
  const { setIsCartOpen } = useCart();
  const [isResellerRoute, setIsResellerRoute] = React.useState(false);

  const storeName = settings.storeName || 'DiziProducts Store';
  let rawWhatsapp = settings.supportWhatsapp || settings.supportPhone || '8860032559';
  if (rawWhatsapp.includes('7895317940') || rawWhatsapp.includes('8051017331') || rawWhatsapp.includes('9142408286')) {
    rawWhatsapp = '8860032559';
  }
  const cleanWhatsappDigits = rawWhatsapp.replace(/[^0-9]/g, '');
  const cleanWhatsapp =
    cleanWhatsappDigits.length === 10
      ? `91${cleanWhatsappDigits}`
      : cleanWhatsappDigits.startsWith('0') && cleanWhatsappDigits.length === 11
      ? `91${cleanWhatsappDigits.slice(1)}`
      : cleanWhatsappDigits || '918860032559';
  const displayPhone = settings.supportPhone || '+91 8860032559';
  const storeLogo = settings.logoUrl || '/logo.webp?v=4';

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const isR = pathname?.startsWith('/r/') || pathname === '/r';
      const params = new URLSearchParams(window.location.search);
      const hasResellerParam = Boolean(
        params.get('r') ||
        params.get('reseller_slug') ||
        sessionStorage.getItem('vaultzet_reseller_slug')
      );
      const isResellerCheckoutOrSuccess =
        (pathname === '/checkout' || pathname === '/order-success') && hasResellerParam;
      setIsResellerRoute(isR || isResellerCheckoutOrSuccess);
    }
  }, [pathname]);

  if (
    pathname?.startsWith('/reels') ||
    pathname?.startsWith('/r/') ||
    pathname === '/r' ||
    isResellerRoute
  ) {
    return null;
  }

  const highlights = [
    {
      title: 'Instant Access',
      subtitle: 'Get files after payment',
      icon: Zap,
      bg: 'bg-sky-50 text-sky-700',
    },
    {
      title: 'High Quality',
      subtitle: 'Curated 1080P reels',
      icon: Sparkles,
      bg: 'bg-sky-100/70 text-sky-800',
    },
    {
      title: 'Regular Updates',
      subtitle: 'New bundles added weekly',
      icon: RefreshCw,
      bg: 'bg-slate-100 text-slate-800',
    },
    {
      title: 'Secure Checkout',
      subtitle: 'Verified Cashfree Gateway',
      icon: ShieldCheck,
      bg: 'bg-emerald-50 text-emerald-700',
    },
    {
      title: 'Creator Friendly',
      subtitle: 'Ready to post & monetize',
      icon: Heart,
      bg: 'bg-sky-50 text-sky-700',
    },
  ];

  const quickLinks = [
    { label: 'Home', href: '/' },
    { label: 'All Bundles', href: '/shop' },
    { label: 'Reels Feed', href: '/reels' },
    { label: 'Resell & Earn', href: '/earn' },
    { label: 'AI Reels', href: '/category/ai-reels' },
    { label: 'Motivational', href: '/category/motivation-reels' },
    { label: 'Cart', href: '#cart' },
    { label: 'My Orders', href: '/my-order' },
  ];

  return (
    <footer className="pt-6 pb-24 md:pb-12 [contain:layout_style]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* 5 Feature Highlights Bar */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {highlights.map((h, i) => {
              const Icon = h.icon;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-2 ${
                    i === 4 ? 'col-span-2 md:col-span-1 justify-center md:justify-start' : ''
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${h.bg}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {h.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {h.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Footer Container Card */}
        <div className="rounded-[32px] bg-slate-50 border border-slate-200/90 p-6 sm:p-10 shadow-xs space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Brand Left Column */}
            <div className="lg:col-span-5 space-y-3">
              <Link href="/" prefetch={false} className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-slate-950 border border-sky-500/30 overflow-hidden flex items-center justify-center shadow-md shadow-sky-500/10 shrink-0">
                  <img
                    src="/logo.webp?v=4"
                    alt="DiziProducts Store Logo"
                    width={44}
                    height={44}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="font-bold text-lg text-slate-900 tracking-tight block">
                    {settings.storeName || 'DiziProducts Store'}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    {settings.tagline || 'Everything You Need, All in One Place.'}
                  </span>
                </div>
              </Link>
              <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed max-w-sm">
                Premium ready-to-use reels bundles for creators, pages and digital businesses by {settings.storeName || 'DiziProducts Store'}.
              </p>
            </div>

            {/* Quick Links Column with White Pills */}
            <div className="lg:col-span-7 space-y-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Quick Links
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Browse important store links and pages.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {quickLinks.map((link) =>
                  link.href === '#cart' ? (
                    <button
                      key={link.label}
                      type="button"
                      onClick={() => setIsCartOpen(true)}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-sky-400 shadow-xs flex items-center justify-between group transition-all text-left"
                    >
                      <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-sky-600 transition-colors">
                        {link.label}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-sky-600 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ) : (
                    <Link
                      key={link.label}
                      href={link.href}
                      prefetch={false}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-sky-400 shadow-xs flex items-center justify-between group transition-all"
                    >
                      <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-sky-600 transition-colors">
                        {link.label}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-sky-600 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  )
                )}
              </div>
            </div>

          </div>

          {/* "Want a high-converting digital store like this?" WhatsApp CTA Banner */}
          <div className="relative rounded-2xl sm:rounded-3xl bg-[#0c0e16] border border-white/10 p-4 sm:p-6 shadow-xl overflow-hidden">
            {/* Ambient orange glow in the background */}
            <div className="pointer-events-none absolute -top-16 left-1/3 w-80 h-32 bg-orange-500/10 rounded-full blur-3xl" />

            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Left Side: Brand Icon + Text */}
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-black border border-white/15 flex items-center justify-center shrink-0 shadow-md overflow-hidden p-1.5">
                  <img
                    src={storeLogo}
                    alt={storeName}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                    Want a high-converting digital store like this?
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-400 font-normal mt-0.5">
                    Launch your fully automated digital storefront in 24 hours with {storeName}.
                  </p>
                </div>
              </div>

              {/* Right Side: Glowing Orange WhatsApp CTA Button */}
              <a
                href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Hi ${storeName}, I want to build a high-converting digital store like this.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  track('whatsapp_click', {
                    cta_name: 'build_your_own_store',
                    phone: `+${cleanWhatsapp}`,
                  });
                }}
                className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#ff5500] via-[#ff6a00] to-[#ff7b00] hover:from-[#ff6200] hover:to-[#ff8800] text-white font-extrabold text-xs sm:text-sm shadow-[0_0_24px_rgba(255,90,0,0.45)] hover:shadow-[0_0_32px_rgba(255,90,0,0.65)] hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 cursor-pointer"
              >
                <div className="w-5 h-5 rounded-md bg-black/60 border border-white/20 flex items-center justify-center overflow-hidden shrink-0 p-0.5">
                  <img
                    src={storeLogo}
                    alt={storeName}
                    width={18}
                    height={16}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <span>Build Your Own Store</span>
                <ArrowRight className="w-4 h-4 text-white stroke-[2.5]" />
              </a>

            </div>
          </div>

          {/* Legal Links Bar */}
          <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-600">
            <Link href="/privacy-policy" prefetch={false} className="hover:text-sky-600 transition-colors">
              Privacy Policy
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/refund-policy" prefetch={false} className="hover:text-sky-600 transition-colors">
              Refund Policy
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/terms-and-conditions" prefetch={false} className="hover:text-sky-600 transition-colors">
              Terms & Conditions
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/contact-us" prefetch={false} className="hover:text-sky-600 transition-colors">
              Contact Us
            </Link>
            <span className="text-slate-300">•</span>
            <a href={`mailto:${settings.supportEmail || 'ashamse137@gmail.com'}`} className="hover:text-sky-600 transition-colors">
              {settings.supportEmail || 'ashamse137@gmail.com'}
            </a>
            <span className="text-slate-300">•</span>
            <a href={`tel:${displayPhone.replace(/\s+/g, '')}`} className="hover:text-sky-600 transition-colors font-mono font-bold text-slate-800">
              📞 {displayPhone}
            </a>
          </div>

          {/* Bottom Copyright Row */}
          <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-slate-500 font-medium text-center">
            <p>© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
            <span className="hidden sm:inline text-slate-300">•</span>
            <p className="flex items-center justify-center gap-1.5 font-semibold text-slate-600">
              <span>Designed by</span>
              <a
                href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Hi ${storeName}, I want to build a high-converting digital store like this.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  track('whatsapp_click', {
                    cta_name: 'designed_by_store',
                    phone: `+${cleanWhatsapp}`,
                  });
                }}
                className="inline-flex items-center gap-1 text-slate-900 hover:text-orange-600 transition-colors font-bold"
              >
                <img
                  src={storeLogo}
                  alt={storeName}
                  width={14}
                  height={14}
                  className="w-3.5 h-3.5 rounded-full object-cover border border-slate-300 inline-block"
                />
                <span>{storeName}</span>
              </a>
            </p>
          </div>

        </div>

      </div>
    </footer>
  );
}
