'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Trash2, ArrowRight, ShieldCheck, Zap, Gift, Lock } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { ORDER_BUMP } from '@/data/bundles';
import { optimizeImageUrl } from '@/lib/imageOptimized';

export default function CartDrawer() {
  const pathname = usePathname();
  const {
    items,
    removeFromCart,
    isCartOpen,
    setIsCartOpen,
    subtotal,
    total,
    orderBumpAdded,
    toggleOrderBump,
    freeBundles,
    removeFreeBundle,
    setIsFreeBundleModalOpen,
    isQualifiedForFreeOffer,
  } = useCart();

  if (pathname?.startsWith('/r/') || pathname === '/r') return null;
  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex justify-end">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in"
      />

      {/* Drawer Card */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-lg text-slate-950">Your Cart</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
              {items.length + (orderBumpAdded ? 1 : 0)} items
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 pb-16 space-y-4">
          {items.length === 0 && !orderBumpAdded ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 text-2xl">
                🛒
              </div>
              <h4 className="font-bold text-lg text-slate-950">Your cart is empty</h4>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Explore our viral reels bundles and level up your social media growth today!
              </p>
              <Link
                href="/shop"
                onClick={() => setIsCartOpen(false)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white font-bold shadow-md shadow-sky-500/20 hover:from-sky-400 hover:to-sky-500 transition-colors"
              >
                Browse All Bundles →
              </Link>
            </div>
          ) : (
            <>
              {/* Product Items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={`${item.product.id}-${item.license}`}
                    className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex gap-3.5 relative group"
                  >
                    <img
                      src={optimizeImageUrl(item.product.thumbnail, 128, 70)}
                      alt={item.product.title}
                      width={64}
                      height={80}
                      loading="lazy"
                      decoding="async"
                      className="w-16 h-20 object-cover rounded-xl shrink-0 border border-slate-200"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h5 className="font-bold text-xs text-slate-900 leading-tight line-clamp-2">
                          {item.product.title}
                        </h5>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              item.license === 'reseller'
                                ? 'bg-sky-100 text-sky-900 border border-sky-300'
                                : 'bg-slate-100 text-slate-800 border border-slate-200'
                            }`}
                          >
                            {item.license === 'reseller' ? 'Reseller Rights' : 'Personal Use'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {item.product.reelCount}+ Reels
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-black text-sm text-slate-950">
                          ₹{item.price}.00
                        </span>
                        <button
                          onClick={() => removeFromCart(item.product.id, item.license)}
                          className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Free Bundle Offer Status */}
              {freeBundles.length > 0 ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2.5 mt-3">
                  <div className="flex items-center justify-between text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-emerald-600" />
                      Free Bonus Bundles ({freeBundles.length}/2 Claimed)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsFreeBundleModalOpen(true)}
                      className="text-[10px] font-bold text-emerald-700 underline hover:text-emerald-900"
                    >
                      Change
                    </button>
                  </div>
                  {freeBundles.map((fb) => (
                    <div
                      key={fb.id}
                      className="flex items-center justify-between gap-2.5 bg-white p-2 rounded-xl border border-emerald-100"
                    >
                      <img
                        src={optimizeImageUrl(fb.thumbnail, 64, 70)}
                        alt={fb.title}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                          {fb.title}
                        </p>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                          FREE BONUS (₹0)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFreeBundle(fb.id)}
                        className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                        aria-label="Remove free bundle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : isQualifiedForFreeOffer ? (
                <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-200 flex items-center justify-between gap-2 mt-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-900">
                    <Gift className="w-4 h-4 shrink-0 text-sky-600" />
                    <span>🎉 2 Free Bundles Unlocked!</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFreeBundleModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white text-xs font-bold hover:from-sky-400 hover:to-sky-500 shadow-sm cursor-pointer"
                  >
                    Select Now
                  </button>
                </div>
              ) : subtotal > 0 ? (
                <div className="p-2.5 rounded-xl bg-sky-50/50 border border-sky-200/80 flex items-center justify-between text-xs text-sky-900 font-bold mt-3">
                  <span>Add ₹{149 - subtotal} more to claim 2 Free Bundles!</span>
                  <Link
                    href="/claim-offer"
                    onClick={() => setIsCartOpen(false)}
                    className="underline hover:text-sky-700 shrink-0 font-bold"
                  >
                    View Offer
                  </Link>
                </div>
              ) : null}

              {/* Order Bump In-Cart Offer */}
              <div className="p-3.5 rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50/50 mt-4 relative">
                <div className="flex items-center gap-1.5 text-sky-900 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                  <Zap className="w-3.5 h-3.5 text-sky-600 fill-sky-500" />
                  Exclusive 1-Click Order Bump
                </div>
                <div className="flex gap-3 items-center">
                  <img
                    src={optimizeImageUrl(ORDER_BUMP.thumbnail, 128, 70)}
                    alt={ORDER_BUMP.title}
                    width={48}
                    height={56}
                    loading="lazy"
                    decoding="async"
                    className="w-12 h-14 rounded-lg object-cover shrink-0 border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                      {ORDER_BUMP.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-xs text-emerald-700">
                        ₹{ORDER_BUMP.discountPrice}
                      </span>
                      <span className="text-[10px] text-slate-400 line-through">
                        ₹{ORDER_BUMP.originalPrice}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                        80% OFF
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={toggleOrderBump}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      orderBumpAdded
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-sky-300 text-sky-900 hover:bg-sky-100'
                    }`}
                  >
                    {orderBumpAdded ? '✓ Added' : '+ Add ₹99'}
                  </button>
                </div>
              </div>

              {/* Pay Now Button */}
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3.5 shadow-xs">
                <div className="space-y-1.5 text-xs sm:text-sm">
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-700">₹{subtotal}.00</span>
                  </div>
                  {orderBumpAdded && (
                    <div className="flex justify-between text-emerald-600 text-xs font-bold">
                      <span>Bonus Upsell Pack (80% Off)</span>
                      <span>+₹{ORDER_BUMP.discountPrice}.00</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm sm:text-base font-bold text-slate-950 pt-2 border-t border-slate-200">
                    <span>Total Amount</span>
                    <span className="text-xl font-black text-sky-800">₹{total}.00</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Instant Checkout (₹{total})</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Link>

                <div className="flex items-center justify-center gap-3 text-[11px] font-semibold text-slate-500 pt-0.5">
                  <span className="flex items-center gap-1 text-emerald-700 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Instant Drive Link
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-sky-700 font-bold">
                    <Zap className="w-3.5 h-3.5 text-sky-600 fill-sky-600 shrink-0" />
                    Zero Delay Access
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
