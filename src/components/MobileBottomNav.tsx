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
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-2xl border-t border-slate-200/80 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] rounded-t-[26px] pt-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] px-2 grid grid-cols-4 items-center"
    >
      {navItems.map((item) => {
        return (
          <Link
            key={item.name}
            href={item.href}
            prefetch={false}
            className={`relative flex flex-col items-center justify-center py-1 transition-all duration-150 active:scale-95 select-none ${
              item.isActive
                ? 'text-sky-600 font-bold'
                : 'text-slate-400 hover:text-slate-600 font-semibold'
            }`}
          >
            {/* Top Indicator Line matching Image 2 */}
            {item.isActive && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-8 h-[3.5px] rounded-full bg-gradient-to-r from-sky-500 to-sky-600 shadow-[0_2px_8px_rgba(14,165,233,0.5)]" />
            )}
            <span className="relative flex items-center justify-center w-[24px] h-[24px]">
              {item.icon}
            </span>
            <span className="text-[10.5px] mt-1 tracking-tight leading-tight">
              {item.name}
            </span>
          </Link>
        );
      })}

      {/* Cart Button linking to /cart */}
      <Link
        href="/cart"
        prefetch={false}
        className={`relative flex flex-col items-center justify-center py-1 transition-all duration-150 active:scale-95 select-none ${
          isCartPage
            ? 'text-sky-600 font-bold'
            : 'text-slate-400 hover:text-slate-600 font-semibold'
        }`}
        aria-label="Cart"
      >
        {isCartPage && (
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-8 h-[3.5px] rounded-full bg-gradient-to-r from-sky-500 to-sky-600 shadow-[0_2px_8px_rgba(14,165,233,0.5)]" />
        )}
        <span className="relative flex items-center justify-center w-[24px] h-[24px]">
          <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-sky-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs border border-white">
              {cartCount}
            </span>
          )}
        </span>
        <span className="text-[10.5px] mt-1 tracking-tight leading-tight">
          Cart
        </span>
      </Link>
    </nav>
  );
}
