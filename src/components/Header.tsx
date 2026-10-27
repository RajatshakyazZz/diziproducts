'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, Search, Menu, X, ArrowRight, Sparkles, Copy, Check, Command } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { BUNDLE_PRODUCTS } from '@/data/bundles';
import { getAllCatalogBundles, getLocalCustomProductsSync, fetchCustomProducts } from '@/lib/customProducts';
import { filterBundlesByQuery } from '@/lib/search';
import { BundleProduct } from '@/types';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount } = useCart();
  const { settings } = useStoreSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isResellerRoute, setIsResellerRoute] = useState(false);
  const [isCouponBannerVisible, setIsCouponBannerVisible] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  const desktopSearchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener: Cmd+K / Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        desktopSearchInputRef.current?.focus();
        setIsDropdownOpen(Boolean(searchQuery.trim()));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

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
      setTimeout(() => setIsCopied(false), 2200);
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
    { name: 'Special Offer', href: '/claim-offer', isHot: true },
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
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_10px_30px_-10px_rgba(0,0,0,0.04)]">
      {/* Top Promotional Ribbon (Sleek Obsidian & Cyan Glow) */}
      {isCouponBannerVisible && (
        <div className="relative bg-gradient-to-r from-slate-950 via-[#071c28] to-slate-950 border-b border-cyan-500/20 text-white overflow-hidden py-1.5 px-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
            {/* Left Pill */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-extrabold text-[10px] uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-cyan-300" />
                <span>20% OFF</span>
              </span>
            </div>

            {/* Center Text */}
            <div className="flex-1 text-center min-w-0">
              <span className="text-[11.5px] sm:text-xs text-slate-200 font-medium tracking-tight">
                Get <strong className="text-white font-bold">20% Extra Off</strong> on All Bundles. Use coupon{' '}
                <span className="font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 px-1.5 py-0.5 rounded text-[11px]">OFF20</span>
              </span>
            </div>

            {/* Right Copy Button + Dismiss */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyCoupon}
                className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                title="Click to copy OFF20"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-300 text-[10px]">COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-cyan-300" />
                    <span className="text-slate-200 text-[10px]">Copy Code</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDismissCoupon}
                className="w-5 h-5 rounded-full hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Dismiss coupon bar"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[66px] sm:h-[72px] gap-4">
          
          {/* Brand Logo */}
          <Link href="/" prefetch={false} className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] bg-slate-950 border border-cyan-500/30 overflow-hidden flex items-center justify-center shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/20 group-hover:scale-105 transition-all">
              <img
                src="/logo.webp?v=4"
                alt="DiziProducts Store"
                width={44}
                height={44}
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-[17px] sm:text-[18px] text-slate-950 tracking-[-0.02em] leading-tight">
                Dizi<span className="text-cyan-600">Products</span>
              </span>
              <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                DIGITAL REELS VAULT
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  prefetch={false}
                  className={`relative px-3.5 py-1.5 rounded-full text-[13.5px] font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/80'
                  }`}
                >
                  <span>{link.name}</span>
                  {link.isHot && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)] animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Area: Search & Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Desktop Command Search Pill */}
            <div ref={desktopSearchRef} className="relative hidden md:block">
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center bg-slate-100/80 hover:bg-slate-100 focus-within:bg-white border border-slate-200/80 focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-500/10 rounded-full pl-3.5 pr-2 py-1 transition-all w-52 xl:w-64"
              >
                <Search className="w-3.5 h-3.5 text-cyan-600 shrink-0 mr-1.5" />
                <input
                  ref={desktopSearchInputRef}
                  type="text"
                  autoComplete="off"
                  spellCheck="false"
                  aria-label="Search bundles"
                  placeholder="Search 1,000+ reels..."
                  value={searchQuery}
                  onFocus={() => {
                    if (searchQuery.trim()) setIsDropdownOpen(true);
                  }}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full bg-transparent text-[13px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />

                {searchQuery ? (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    aria-label="Clear search"
                    className="p-0.5 rounded-full text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-medium text-slate-400 select-none shadow-2xs">
                    <Command className="w-2.5 h-2.5" />K
                  </kbd>
                )}
              </form>

              {/* Instant Dropdown Results */}
              {isDropdownOpen && searchQuery.trim() && (
                <div className="absolute top-full right-0 mt-2.5 w-84 lg:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-cyan-600" />
                      <span>{searchResults.length} Bundle{searchResults.length !== 1 ? 's' : ''} Found</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleViewAllResults}
                      className="text-[10.5px] text-cyan-700 font-bold hover:underline"
                    >
                      View all in Shop &rarr;
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 p-1.5">
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
                          className="w-10 h-10 rounded-lg object-cover shrink-0 bg-slate-900 border border-slate-200"
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
                              ₹{bundle.personalPrice || 49}.00
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}

                    {searchResults.length === 0 && (
                      <div className="py-6 text-center text-xs text-slate-500 space-y-1">
                        <p className="font-semibold text-slate-700">No matching bundles</p>
                        <p className="text-[11px] text-slate-400">Try AI, Story, Fitness, ASMR, Cars</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Search Icon Button */}
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchOpen(!isMobileSearchOpen);
                if (isMobileMenuOpen) setIsMobileMenuOpen(false);
              }}
              aria-label="Search"
              className="md:hidden w-9 h-9 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60 flex items-center justify-center transition-colors shrink-0"
            >
              <Search className="w-4 h-4 text-cyan-600" />
            </button>

            {/* Cart Button Pill */}
            <Link
              href="/cart"
              prefetch={false}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 text-slate-900 font-bold text-xs sm:text-[13px] transition-all group shrink-0 active:scale-95"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-4 h-4 text-cyan-600 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 text-[10px] font-black leading-none shadow-xs">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                if (isMobileSearchOpen) setIsMobileSearchOpen(false);
              }}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              className="lg:hidden p-2 rounded-full border border-slate-200 text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Input Drawer */}
        {isMobileSearchOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-md py-3 px-1 animate-in fade-in duration-150">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center bg-slate-100 border border-slate-200 rounded-full pl-3.5 pr-2 py-1.5 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20"
            >
              <Search className="w-4 h-4 text-cyan-600 shrink-0" />
              <input
                type="text"
                autoFocus
                autoComplete="off"
                spellCheck="false"
                placeholder="Search reels bundles..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full py-0.5 px-2 bg-transparent text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </form>

            {/* Mobile Results Preview */}
            {searchQuery.trim() && (
              <div className="mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span>{searchResults.length} Bundle{searchResults.length !== 1 ? 's' : ''} Found</span>
                  {searchResults.length > 0 && (
                    <button
                      type="button"
                      onClick={handleViewAllResults}
                      className="text-[10px] text-cyan-700 underline font-bold"
                    >
                      See All &rarr;
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 p-1">
                  {searchResults.slice(0, 5).map((bundle) => (
                    <Link
                      key={bundle.id}
                      href={`/product/${bundle.slug}`}
                      onClick={() => {
                        setIsMobileSearchOpen(false);
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center gap-2.5 p-2 rounded-xl active:bg-cyan-50"
                    >
                      <img
                        src={bundle.thumbnail}
                        alt={bundle.title}
                        className="w-9 h-9 rounded-lg object-cover shrink-0 bg-slate-900 border border-slate-200"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                          {bundle.title}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-bold text-cyan-800 bg-cyan-50 px-1 py-0.2 rounded">
                            {bundle.reelCount}+ Reels
                          </span>
                          <span className="text-xs font-black text-slate-900">
                            ₹{bundle.personalPrice || 49}.00
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white/95 backdrop-blur-md px-4 py-4 space-y-1 animate-in fade-in duration-150">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isActive ? 'bg-cyan-50 text-cyan-700' : 'text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span>{link.name}</span>
                  {link.isHot && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-cyan-600 text-white">
                      HOT
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </header>
  );
}
