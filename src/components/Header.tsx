'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, Search, Menu, X, Play, ArrowRight, Sparkles, Copy, Check, Tag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { BUNDLE_PRODUCTS } from '@/data/bundles';
import { getAllCatalogBundles, getLocalCustomProductsSync, fetchCustomProducts } from '@/lib/customProducts';
import { filterBundlesByQuery } from '@/lib/search';
import { BundleProduct } from '@/types';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount, setIsCartOpen } = useCart();
  const { settings } = useStoreSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isResellerRoute, setIsResellerRoute] = useState(false);
  const [isCouponBannerVisible, setIsCouponBannerVisible] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  // Check if coupon banner was previously dismissed in the current session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem('vaultzet_dismiss_coupon_banner');
      if (dismissed === 'true') {
        setIsCouponBannerVisible(false);
      }
    }
  }, []);

  const handleDismissCoupon = () => {
    setIsCouponBannerVisible(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('vaultzet_dismiss_coupon_banner', 'true');
    }
  };

  const handleCopyCoupon = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText('OFF20');
      sessionStorage.setItem('vaultzet_applied_coupon', 'OFF20');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Hide header on reseller landing pages or checkout flows
  useEffect(() => {
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

  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const searchQueryRef = useRef(searchQuery);
  searchQueryRef.current = searchQuery;

  // Catalog bundles for instant header autocomplete
  const [catalogBundles, setCatalogBundles] = useState<BundleProduct[]>(() => {
    return getAllCatalogBundles(getLocalCustomProductsSync(), BUNDLE_PRODUCTS);
  });

  useEffect(() => {
    fetchCustomProducts().then((res) => {
      if (res && res.length > 0) {
        setCatalogBundles(getAllCatalogBundles(res, BUNDLE_PRODUCTS));
      }
    }).catch(() => {});
  }, []);

  // Instant matching results for live autocomplete dropdown
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return filterBundlesByQuery(catalogBundles, searchQuery);
  }, [catalogBundles, searchQuery]);

  // Close desktop dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync header search box with URL query when on /shop or when pathname changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const s = params.get('s') || params.get('q') || '';
      if (pathname === '/shop') {
        setSearchQuery(s);
      } else if (!s) {
        setSearchQuery('');
      }
    }
  }, [pathname]);

  // Listen to custom cross-component search sync event
  useEffect(() => {
    const handleVaultzetSearch = (e: Event) => {
      const customEvt = e as CustomEvent<string>;
      if (typeof customEvt.detail === 'string' && customEvt.detail !== searchQueryRef.current) {
        setSearchQuery(customEvt.detail);
      }
    };
    window.addEventListener('vaultzet:search', handleVaultzetSearch);
    return () => window.removeEventListener('vaultzet:search', handleVaultzetSearch);
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setIsDropdownOpen(Boolean(val.trim()));
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const handleViewAllResults = () => {
    setIsDropdownOpen(false);
    setIsMobileSearchOpen(false);
    setIsMobileMenuOpen(false);
    const q = searchQuery.trim();
    if (typeof window !== 'undefined') {
      window.location.href = q ? `/shop?s=${encodeURIComponent(q)}` : '/shop';
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleViewAllResults();
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'Special Offer', href: '/claim-offer' },
    { name: 'Reels Feed', href: '/reels' },
    { name: 'Resell & Earn', href: '/earn' },
    { name: 'My Orders', href: '/my-order' },
    { name: 'About Us', href: '/about-us' },
  ];

  if (
    pathname?.startsWith('/reels') ||
    pathname?.startsWith('/r/') ||
    pathname === '/r' ||
    isResellerRoute
  ) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)]">
      {/* Top Promotional Coupon Header Bar (Deep Navy with Cyan Accent) */}
      {isCouponBannerVisible && (
        <div className="relative bg-gradient-to-r from-[#091e2b] via-[#0d3448] to-[#071924] border-b border-cyan-900/40 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_-20%,rgba(6,182,212,0.18),rgba(255,255,255,0))] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 relative flex items-center justify-between gap-2 text-xs">
            {/* Left: Cyan Tag Badge */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 z-10">
              <span className="w-5 h-5 rounded-full bg-cyan-400/20 text-cyan-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              </span>
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 text-[10px] font-black uppercase tracking-wider text-cyan-200 flex items-center gap-1">
                <span>EXCLUSIVE OFFER</span>
              </span>
            </div>

            {/* Center: Offer Notice */}
            <div className="flex-1 overflow-hidden px-1 text-center min-w-0">
              <div className="font-semibold text-[11px] sm:text-xs md:text-[13px] text-slate-100 tracking-wide">
                <span>Save Big: </span>
                <span>Get Instant </span>
                <span className="text-cyan-300 font-extrabold underline decoration-cyan-400/50">20% Extra Off</span>
                <span> on All Reels Bundles with commercial rights!</span>
              </div>
            </div>

            {/* Right: Coupon Badge with Copy Action + Close */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 z-10">
              <button
                type="button"
                onClick={handleCopyCoupon}
                className="px-2.5 sm:px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-cyan-400/40 text-white shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer select-none group"
                title="Click to copy code and auto-apply discount"
              >
                <span className="text-[9px] sm:text-[10px] font-extrabold text-cyan-200 uppercase tracking-wider">
                  CODE
                </span>
                <span className="text-xs font-black text-cyan-300 tracking-wider">
                  {isCopied ? 'COPIED!' : 'OFF20'}
                </span>
                {isCopied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-cyan-300 group-hover:scale-110 transition-transform shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={handleDismissCoupon}
                className="w-6 h-6 rounded-md hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="Dismiss coupon bar"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[66px] sm:h-[72px] gap-3">
          
          {/* Brand Logo */}
          <Link href="/" prefetch={false} className="flex items-center gap-2.5 group shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-950 border border-cyan-500/30 overflow-hidden flex items-center justify-center shadow-md shadow-cyan-500/10 group-hover:scale-105 transition-transform shrink-0">
              <img
                src="/logo.webp?v=4"
                alt="DiziProducts Store Logo"
                width={44}
                height={44}
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-[16px] sm:text-[17px] text-slate-900 tracking-tight leading-tight">
                {settings.storeName}
              </span>
              <span className="text-[11px] sm:text-[12px] font-medium text-slate-500 tracking-tight">
                {settings.tagline}
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-7">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  prefetch={false}
                  className={`text-[14px] lg:text-[15px] font-semibold transition-all relative py-1 ${
                    isActive ? 'text-cyan-600 font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Tools: Search & Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Pill Search Box with Autocomplete Dropdown */}
            <div ref={desktopSearchRef} className="relative hidden sm:block">
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center bg-slate-50 hover:bg-slate-100/80 focus-within:bg-white border border-slate-200 rounded-xl pl-3.5 pr-2 py-0.5 focus-within:ring-2 focus-within:ring-cyan-500/20 focus-within:border-cyan-500 transition-all"
              >
                <Search className="w-4 h-4 text-cyan-600 shrink-0" />
                <input
                  type="text"
                  autoComplete="off"
                  spellCheck="false"
                  aria-label="Search bundles"
                  placeholder="Search bundles..."
                  value={searchQuery}
                  onFocus={() => {
                    if (searchQuery.trim()) setIsDropdownOpen(true);
                  }}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-44 lg:w-56 py-1.5 px-2 bg-transparent text-[13px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    aria-label="Clear search"
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </form>

              {/* Instant Dropdown Results for Desktop */}
              {isDropdownOpen && searchQuery.trim() && (
                <div className="absolute top-full right-0 mt-2 w-80 lg:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2.5 bg-cyan-50/70 border-b border-cyan-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-cyan-900 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-600" />
                      <span>{searchResults.length} Bundle{searchResults.length !== 1 ? 's' : ''} Found</span>
                    </span>
                    {searchResults.length > 0 && (
                      <span className="text-[10px] text-slate-500 font-medium">Click to open</span>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-1">
                    {searchResults.slice(0, 5).map((bundle) => (
                      <Link
                        key={bundle.id}
                        href={`/product/${bundle.slug}`}
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-cyan-50/60 transition-colors group"
                      >
                        <img
                          src={bundle.thumbnail}
                          alt={bundle.title}
                          className="w-11 h-11 rounded-lg object-cover shrink-0 bg-slate-900 border border-slate-200"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-cyan-700 transition-colors">
                            {bundle.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-100 px-1.5 py-0.5 rounded">
                              {bundle.reelCount}+ Reels
                            </span>
                            <span className="text-xs font-black text-slate-900">
                              ₹{bundle.personalPrice || 49}
                            </span>
                            {bundle.personalOriginalPrice && (
                              <span className="text-[10px] text-slate-400 line-through">
                                ₹{bundle.personalOriginalPrice}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}

                    {searchResults.length === 0 && (
                      <div className="py-6 text-center text-xs text-slate-500 space-y-1">
                        <p className="font-semibold text-slate-700">No matching bundles</p>
                        <p className="text-[11px] text-slate-400">Try AI, Story, Fitness, ASMR, Animals</p>
                      </div>
                    )}
                  </div>

                  {searchResults.length > 0 && (
                    <button
                      type="button"
                      onClick={handleViewAllResults}
                      className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold text-xs text-center block transition-all"
                    >
                      View all {searchResults.length} results in Shop &rarr;
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchOpen(!isMobileSearchOpen);
                if (isMobileMenuOpen) setIsMobileMenuOpen(false);
              }}
              aria-label="Search"
              className="sm:hidden w-9 h-9 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center hover:bg-slate-200 transition-colors shrink-0"
            >
              <Search className="w-4 h-4 text-cyan-600" />
            </button>

            {/* Mobile Cart Button */}
            <Link
              href="/cart"
              prefetch={false}
              className="sm:hidden px-2.5 h-9 rounded-xl bg-cyan-50 text-cyan-900 border border-cyan-200 flex items-center gap-1.5 hover:bg-cyan-100 transition-colors text-xs font-bold relative shrink-0"
              aria-label="Cart"
            >
              <ShoppingCart className="w-4 h-4 text-cyan-600" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-cyan-600 text-[9px] font-black text-white flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Desktop Cart Button Pill */}
            <Link
              href="/cart"
              prefetch={false}
              className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-900 font-bold text-sm transition-all group"
              aria-label="Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-4 h-4 text-cyan-600 group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 w-4 h-4 rounded-full bg-cyan-600 text-[10px] font-black text-white flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </div>
              <span>Cart</span>
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                if (isMobileSearchOpen) setIsMobileSearchOpen(false);
              }}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              className="md:hidden px-2.5 h-9 rounded-xl border border-slate-200 text-slate-900 flex items-center gap-1.5 hover:bg-slate-100 text-xs font-bold shrink-0"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              <span>Menu</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Dropdown Bar */}
        {isMobileSearchOpen && (
          <div className="sm:hidden border-t border-slate-100 bg-white py-2.5 px-1 animate-in fade-in duration-150">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-2 py-0.5 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20"
            >
              <Search className="w-4 h-4 text-cyan-600 shrink-0" />
              <input
                type="text"
                autoFocus
                autoComplete="off"
                spellCheck="false"
                placeholder="Type to search bundles instantly..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full py-1.5 px-2 bg-transparent text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </form>

            {/* Mobile Instant Results List */}
            {searchQuery.trim() && (
              <div className="mt-2.5 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden animate-in fade-in duration-150">
                <div className="p-2 bg-cyan-50/80 border-b border-cyan-100 flex items-center justify-between text-[11px] font-bold text-cyan-900">
                  <span>
                    {searchResults.length} Bundle{searchResults.length !== 1 ? 's' : ''} Found
                  </span>
                  {searchResults.length > 0 && (
                    <button
                      type="button"
                      onClick={handleViewAllResults}
                      className="text-[10px] text-cyan-700 underline font-bold"
                    >
                      See All in Shop &rarr;
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 p-1">
                  {searchResults.slice(0, 5).map((bundle) => (
                    <Link
                      key={bundle.id}
                      href={`/product/${bundle.slug}`}
                      onClick={() => {
                        setIsMobileSearchOpen(false);
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center gap-2.5 p-2 rounded-lg active:bg-cyan-50 transition-colors"
                    >
                      <img
                        src={bundle.thumbnail}
                        alt={bundle.title}
                        className="w-10 h-10 rounded-lg object-cover shrink-0 bg-slate-900 border border-slate-200"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                          {bundle.title}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-bold text-cyan-800 bg-cyan-100/70 px-1 py-0.2 rounded">
                            {bundle.reelCount}+ Reels
                          </span>
                          <span className="text-xs font-black text-slate-900">
                            ₹{bundle.personalPrice || 49}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}

                  {searchResults.length === 0 && (
                    <div className="py-4 text-center text-xs text-slate-500">
                      No bundles found. Try AI, Story, Fitness, ASMR...
                    </div>
                  )}
                </div>

                {searchResults.length > 0 && (
                  <button
                    type="button"
                    onClick={handleViewAllResults}
                    className="w-full py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold text-xs text-center block"
                  >
                    View all {searchResults.length} results in Shop &rarr;
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mobile menu dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-2 animate-in fade-in duration-150">
            <div className="space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3.5 py-2.5 rounded-xl text-[14px] font-bold transition-colors ${
                      isActive ? 'bg-cyan-50 text-cyan-700' : 'text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
