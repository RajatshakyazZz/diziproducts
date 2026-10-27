'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ShoppingCart, Film, Sparkles } from 'lucide-react';
import { BUNDLE_PRODUCTS } from '@/data/bundles';
import { useCart } from '@/context/CartContext';
import { optimizeImageUrl } from '@/lib/imageOptimized';
import {
  fetchCustomProducts,
  getAllCatalogBundles,
  getLocalCustomProductsSync,
} from '@/lib/customProducts';
import { BundleProduct } from '@/types';

export default function FreshReelsGrid() {
  const { addToCart, buyNow } = useCart();
  const [freshBundles, setFreshBundles] = useState<BundleProduct[]>(() => {
    const local = getLocalCustomProductsSync();
    const all = getAllCatalogBundles(local, BUNDLE_PRODUCTS);
    return all.filter((b) => !b.isUpcoming).slice(0, 8);
  });

  useEffect(() => {
    fetchCustomProducts().then((res) => {
      const all = getAllCatalogBundles(res, BUNDLE_PRODUCTS);
      setFreshBundles(all.filter((b) => !b.isUpcoming).slice(0, 8));
    }).catch(() => {});
  }, []);

  return (
    <section className="py-8 sm:py-12 [contain:layout_style]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200/80 text-sky-800 text-[11px] font-bold uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>FRESH RELEASE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-[-0.02em]">
              Fresh Reels, Ready to Post.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Freshly curated vertical bundles to keep your posting schedule consistent and viral.
            </p>
          </div>

          <Link
            href="/shop"
            prefetch={false}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-all shadow-xs shrink-0 self-start sm:self-auto group"
          >
            <span>View All Catalog</span>
            <ArrowRight className="w-3.5 h-3.5 text-sky-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Product Cards Grid: 2 columns on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {freshBundles.map((bundle) => {
            const origPrice = bundle.personalOriginalPrice || 499;
            const currPrice = bundle.personalPrice || 99;
            const discount =
              origPrice > currPrice
                ? Math.round(((origPrice - currPrice) / origPrice) * 100)
                : 80;

            const isTrending =
              (Array.isArray(bundle.tags) && bundle.tags.includes('TRENDING')) ||
              bundle.isTrending;

            return (
              <div
                key={bundle.id}
                className="bg-white rounded-2xl sm:rounded-[24px] border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] hover:shadow-[0_16px_36px_-6px_rgba(2,132,199,0.12)] hover:border-sky-400/60 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Thumbnail */}
                <Link
                  href={`/product/${bundle.slug}`}
                  prefetch={false}
                  className="relative aspect-[4/3] overflow-hidden bg-slate-900 block"
                >
                  <img
                    src={optimizeImageUrl(bundle.thumbnail, 384, 75)}
                    alt={bundle.title}
                    width={384}
                    height={288}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Corner Ribbon */}
                  <div className="absolute top-0 right-0 overflow-hidden w-20 h-20 sm:w-24 sm:h-24 pointer-events-none">
                    {isTrending ? (
                      <div className="absolute transform rotate-45 bg-gradient-to-r from-sky-500 to-sky-600 text-white font-bold text-[7px] sm:text-[8px] py-0.5 sm:py-1 right-[-34px] sm:right-[-32px] top-[14px] sm:top-[18px] w-[110px] sm:w-[120px] text-center shadow-md flex items-center justify-center gap-0.5">
                        <span>TRENDING</span>
                      </div>
                    ) : (
                      <div className="absolute transform rotate-45 bg-gradient-to-r from-sky-600 to-blue-800 text-white font-bold text-[7.5px] sm:text-[9px] py-0.5 sm:py-1 right-[-34px] sm:right-[-32px] top-[14px] sm:top-[18px] w-[110px] sm:w-[120px] text-center shadow-md flex items-center justify-center gap-0.5">
                        <span>HOT</span>
                      </div>
                    )}
                  </div>

                  {/* 1080P Badge in Bottom Right */}
                  <span className="absolute bottom-1.5 right-1.5 sm:bottom-2.5 sm:right-2.5 px-1.5 py-0.5 sm:px-2 rounded-md text-[9px] sm:text-[10px] font-black bg-black/80 text-white backdrop-blur-md border border-white/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{String(bundle.resolution || '').includes('1080') ? '1080P' : 'HD'}</span>
                  </span>
                </Link>

                {/* Body */}
                <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3.5">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Link href={`/product/${bundle.slug}`} prefetch={false}>
                      <h3 className="font-bold text-xs sm:text-[14px] text-slate-900 group-hover:text-sky-700 transition-colors line-clamp-2 leading-snug min-h-[32px] sm:min-h-[40px]">
                        {bundle.title}
                      </h3>
                    </Link>

                    {/* Meta Pills */}
                    <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[9.5px] sm:text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200/50">
                        {bundle.reelCount}+ Reels
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[9.5px] sm:text-[11px] font-bold bg-slate-100 text-slate-700 flex items-center gap-0.5">
                        <Film className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span>MP4</span>
                      </span>
                    </div>
                  </div>

                  {/* Pricing & Buttons */}
                  <div className="pt-2 border-t border-slate-100 space-y-2 sm:space-y-2.5">
                    <div className="flex items-baseline justify-between gap-1 flex-wrap">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[10px] sm:text-xs text-slate-400 line-through font-semibold">
                          ₹{bundle.personalOriginalPrice}.00
                        </span>
                        <span className="text-sm sm:text-xl font-black text-slate-950">
                          ₹{bundle.personalPrice}.00
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                        {discount}% OFF
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                      <button
                        type="button"
                        onClick={() => addToCart(bundle, 'personal')}
                        className="py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200 font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1 transition-colors active:scale-95"
                      >
                        <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-600 shrink-0" />
                        <span className="truncate">Add to Cart</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => buyNow(bundle, 'personal')}
                        className="py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1 shadow-md shadow-sky-500/25 active:scale-95 transition-all"
                      >
                        <span className="truncate">Buy Now</span>
                        <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5] shrink-0" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
