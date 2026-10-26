'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';
import CartDrawer from '@/components/CartDrawer';
import FreeBundlesModal from '@/components/FreeBundlesModal';
import WhatsAppButton from '@/components/WhatsAppButton';
import { CartProvider } from '@/context/CartContext';
import { StoreSettingsProvider } from '@/context/StoreSettingsContext';
import { ResellerAuthProvider } from '@/context/ResellerAuthContext';

export default function StoreLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/asdf');

  if (isAdminRoute) {
    return (
      <div className="admin-root min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        {children}
      </div>
    );
  }

  return (
    <StoreSettingsProvider>
      <ResellerAuthProvider>
        <CartProvider>
          <Header />
          <main className="flex-grow pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
            {children}
          </main>
          <Footer />
          <CartDrawer />
          <FreeBundlesModal />
          <MobileBottomNav />
          <WhatsAppButton />
        </CartProvider>
      </ResellerAuthProvider>
    </StoreSettingsProvider>
  );
}
