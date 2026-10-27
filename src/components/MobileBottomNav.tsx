'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { cartCount, isCartOpen } = useCart();

  // Hide on checkout, thankyou, reseller hub/landing pages, or when CartDrawer is open
  if (
    isCartOpen ||
    pathname?.startsWith('/r/') ||
    pathname === '/r' ||
    pathname?.startsWith('/earn') ||
    pathname === '/earn' ||
    pathname.includes('/checkout') ||
    pathname.includes('/order-success')
  ) {
    return null;
  }

  const isReelsPage = pathname.startsWith('/reels');
  const isShopPage = pathname === '/shop' || pathname.startsWith('/category');
  const isCartPage = pathname === '/cart';
  const isHomePage = pathname === '/';

  const navItems = [
    {
      name: 'Home',
      href: '/',
      isActive: isHomePage,
      icon: (
        <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9.5 9-7 9 7V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path d="M9 22V12h6v10" />
        </svg>
      ),
    },
    {
      name: 'Preview',
      href: '/reels',
      isActive: isReelsPage,
      icon: (
        <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      name: 'Bundle',
      href: '/shop',
      isActive: isShopPage,
      icon: (
        <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.9a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
          <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
          <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation Dock"
      className="md:hidden fixed bottom-3.5 left-3.5 right-3.5 z-50 max-w-[390px] mx-auto min-h-[60px] glossy-glass-dock rounded-[26px] p-1.5 grid grid-cols-4 items-center gap-1 select-none"
    >
      {navItems.map((item) => {
        return (
          <Link
            key={item.name}
            href={item.href}
            prefetch={false}
            className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-[20px] transition-all duration-200 active:scale-95 select-none ${
              item.isActive
                ? 'glossy-glass-pill-active text-sky-600 font-bold'
                : 'text-slate-500 hover:text-slate-800 font-semibold'
            }`}
          >
            {/* Top Indicator Pill matching Screenshot */}
            {item.isActive && (
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-7 h-[3px] rounded-full bg-gradient-to-r from-sky-500 to-sky-600 shadow-[0_1px_6px_rgba(14,165,233,0.7)]" />
            )}
            <span className="relative flex items-center justify-center w-[22px] h-[22px]">
              {item.icon}
            </span>
            <span className="text-[10px] mt-0.5 tracking-tight leading-tight">
              {item.name}
            </span>
          </Link>
        );
      })}

      {/* Cart Button linking to /cart */}
      <Link
        href="/cart"
        prefetch={false}
        className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-[20px] transition-all duration-200 active:scale-95 select-none ${
          isCartPage
            ? 'glossy-glass-pill-active text-sky-600 font-bold'
            : 'text-slate-500 hover:text-slate-800 font-semibold'
        }`}
        aria-label="Cart"
      >
        {isCartPage && (
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-7 h-[3px] rounded-full bg-gradient-to-r from-sky-500 to-sky-600 shadow-[0_1px_6px_rgba(14,165,233,0.7)]" />
        )}
        <span className="relative flex items-center justify-center w-[22px] h-[22px]">
          <svg className="w-[21px] h-[21px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-sky-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs border border-white">
              {cartCount}
            </span>
          )}
        </span>
        <span className="text-[10px] mt-0.5 tracking-tight leading-tight">
          Cart
        </span>
      </Link>
    </nav>
  );
}
