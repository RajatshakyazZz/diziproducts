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

export default function TrendingMarquee() {
  const { addToCart, buyNow } = useCart();
  const [items, setItems] = useState<BundleProduct[]>(() => {
    const local = getLocalCustomProductsSync();
    const all = getAllCatalogBundles(local, BUNDLE_PRODUCTS);
    return all.filter((b) => !b.isUpcoming).slice(0, 6);
  });

  useEffect(() => {
    fetchCustomProducts().then((res) => {
      const all = getAllCatalogBundles(res, BUNDLE_PRODUCTS);
      setItems(all.filter((b) => !b.isUpcoming).slice(0, 6));
    }).catch(() => {});
  }, []);

  const loopItems = [...items, ...items];

  return (
    <section className="py-6 sm:py-10 overflow-hidden [contain:layout_style]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200/80 text-cyan-800 text-[11px] font-bold uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>VIRAL PICKS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-[-0.02em]">
              Trending Bundles Creators Love.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Top-performing reels collections with proven viewer retention.
            </p>
          </div>

          <Link
            href="/shop"
            prefetch={false}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-all shadow-xs shrink-0 self-start sm:self-auto group"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Marquee Rail */}
        <div className="relative w-full overflow-hidden marquee-mask">
          <div className="flex gap-4 sm:gap-5 w-max animate-marquee hover:[animation-play-state:paused] py-2 will-change-transform">
            {loopItems.map((bundle, index) => {
              const origPrice = bundle.personalOriginalPrice || 499;
              const currPrice = bundle.personalPrice || 99;
              const discount =
                origPrice > currPrice
                  ? Math.round(((origPrice - currPrice) / origPrice) * 100)
                  : 80;

              return (
                <div
                  key={`${bundle.id}-${index}`}
                  className="w-72 sm:w-[305px] bg-white rounded-[24px] border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] hover:shadow-[0_16px_36px_-6px_rgba(6,182,212,0.12)] hover:border-cyan-400/60 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group shrink-0"
                >
                  {/* 4:3 Thumbnail */}
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
                    
                    {/* Corner Ribbon Badge */}
                    <div className="absolute top-0 right-0 overflow-hidden w-24 h-24 pointer-events-none">
                      <div className="absolute transform rotate-45 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold text-[9px] py-1 right-[-32px] top-[18px] w-[120px] text-center shadow-md flex items-center justify-center gap-1">
                        <span>HOT</span>
                      </div>
                    </div>

                    {/* 1080P Badge in Bottom Right */}
                    <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-black bg-black/85 text-white border border-white/20">
                      1080P
                    </span>
                  </Link>

                  {/* Card Body */}
                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <Link href={`/product/${bundle.slug}`} prefetch={false}>
                        <h3 className="font-bold text-sm text-slate-900 group-hover:text-cyan-700 transition-colors line-clamp-1 leading-snug">
                          {bundle.title}
                        </h3>
                      </Link>

                      {/* Meta Pills */}
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200/50">
                          {bundle.reelCount}+ Reels
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 flex items-center gap-1">
                          <Film className="w-3 h-3" />
                          <span>Ready MP4</span>
                        </span>
                      </div>
                    </div>

                    {/* Pricing & Actions */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs text-slate-400 line-through font-semibold">
                            ₹{bundle.personalOriginalPrice}.00
                          </span>
                          <span className="text-lg font-black text-slate-950">
                            ₹{bundle.personalPrice}.00
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                          {discount}% OFF
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => addToCart(bundle, 'personal')}
                          className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition-colors active:scale-95"
                        >
                          <ShoppingCart className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                          <span className="truncate">Add to Cart</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => buyNow(bundle, 'personal')}
                          className="py-2 px-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-cyan-500/25 active:scale-95 transition-all"
                        >
                          <span className="truncate">Buy Now</span>
                          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
