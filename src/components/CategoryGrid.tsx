'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { BUNDLE_PRODUCTS } from '@/data/bundles';
import { fetchCustomCategories, getLocalCategoriesSync, calculateCategoryCounts, CategoryItem } from '@/lib/categories';
import { fetchCustomProducts, getAllCatalogBundles, getLocalCustomProductsSync } from '@/lib/customProducts';
import { BundleProduct } from '@/types';

export default function CategoryGrid() {
  const [categories, setCategories] = useState<CategoryItem[]>(() => getLocalCategoriesSync());
  const [customProducts, setCustomProducts] = useState<BundleProduct[]>(() => getLocalCustomProductsSync());

  useEffect(() => {
    fetchCustomCategories(true).then((res) => {
      if (res && res.length > 0) {
        setCategories(res);
      }
    }).catch(() => {});

    fetchCustomProducts().then((res) => {
      if (res && res.length > 0) {
        setCustomProducts(res);
      }
    }).catch(() => {});
  }, []);

  const allBundles = useMemo(() => {
    return getAllCatalogBundles(customProducts, BUNDLE_PRODUCTS);
  }, [customProducts]);

  const categoryCounts = useMemo(() => {
    return calculateCategoryCounts(allBundles, categories);
  }, [allBundles, categories]);

  return (
    <section className="py-8 sm:py-12 [contain:layout_style]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200/80 text-cyan-800 text-[11px] font-bold uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>EXPLORE NICHES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-[-0.02em]">
              Discover Reels for Every Niche.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Browse curated categories and find ready-to-post vertical content built for your audience.
            </p>
          </div>

          <Link
            href="/shop"
            prefetch={false}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-all shadow-xs shrink-0 self-start sm:self-auto group"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* 8 Category Cards in 2 Rows of 4 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
          {categories.slice(0, 8).map((cat) => (
            <Link
              key={cat.slug}
              href={`/shop?cat=${cat.slug}`}
              prefetch={false}
              className="py-5 px-4 rounded-[20px] bg-white border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] hover:shadow-[0_12px_28px_rgba(6,182,212,0.12)] hover:border-cyan-400/60 hover:-translate-y-1 transition-all text-center flex flex-col items-center justify-center group relative"
            >
              {cat.is_custom && (
                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-cyan-50 text-cyan-800 border border-cyan-200/60 shadow-2xs">
                  New
                </span>
              )}
              {/* Icon Box */}
              <div
                style={{
                  backgroundColor: cat.bg || '#ecfeff',
                  color: (cat as any).iconColor || '#0891b2',
                }}
                className="w-11 h-11 rounded-[14px] flex items-center justify-center text-lg font-bold mb-2.5 group-hover:scale-105 transition-transform"
              >
                {cat.icon || '✨'}
              </div>
              <h3 className="font-bold text-[14px] sm:text-[15px] text-slate-900 group-hover:text-cyan-600 transition-colors leading-snug">
                {cat.name}
              </h3>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                {categoryCounts[cat.slug] ?? cat.count ?? 0} Bundles
              </p>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
