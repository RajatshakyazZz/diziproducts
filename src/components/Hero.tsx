'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, ArrowRight, FolderKanban, Film, ShieldCheck, Sparkles } from 'lucide-react';
import { BUNDLE_PRODUCTS } from '@/data/bundles';
import { optimizeImageUrl } from '@/lib/imageOptimized';

export default function Hero() {
  const phrases = ['Ready to Post.', 'Built to Engage.', 'Made to Grow.'];
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState(phrases[0]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Dynamic rotation state for the 3 hero preview cards
  const [activeOffset, setActiveOffset] = useState(0);
  const [isRotating, setIsRotating] = useState(true);

  useEffect(() => {
    const onInteract = () => setHasInteracted(true);
    const events = ['scroll', 'pointerdown', 'touchstart', 'keydown'] as const;
    events.forEach((evt) =>
      window.addEventListener(evt, onInteract, { once: true, passive: true })
    );
    return () => {
      events.forEach((evt) => window.removeEventListener(evt, onInteract));
    };
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (!hasInteracted) return;
    const currentPhrase = phrases[phraseIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting) {
      if (displayText.length < currentPhrase.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, displayText.length + 1));
        }, 85);
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, 2000);
      }
    } else {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, displayText.length - 1));
        }, 45);
      } else {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, phraseIndex, hasInteracted]);

  // Continuous auto-rotation every 5.5s unless hovered
  useEffect(() => {
    if (!hasInteracted || !isRotating) return;
    const interval = setInterval(() => {
      setActiveOffset((prev) => (prev + 1) % BUNDLE_PRODUCTS.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [hasInteracted, isRotating]);

  const totalBundles = BUNDLE_PRODUCTS.length;
  const leftCard = BUNDLE_PRODUCTS[activeOffset % totalBundles];
  const centerCard = BUNDLE_PRODUCTS[(activeOffset + 1) % totalBundles];
  const rightCard = BUNDLE_PRODUCTS[(activeOffset + 2) % totalBundles];

  return (
    <section className="pt-2 pb-2 sm:pt-6 sm:pb-6">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        
        {/* Main Hero Card Container */}
        <div
          className="relative rounded-[24px] sm:rounded-[36px] bg-gradient-to-br from-[#ffffff] via-[#f8feff] to-[#ecfeff] border border-cyan-200/80 shadow-[0_12px_40px_rgba(6,182,212,0.06)] p-4 sm:p-10 lg:px-12 lg:py-11 overflow-hidden"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(6, 182, 212, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(6, 182, 212, 0.04) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        >
          {/* Ambient Cyan Aura behind Right Visual */}
          <div
            className="pointer-events-none absolute -right-16 top-0 bottom-0 w-full lg:w-[58%] z-0"
            style={{
              background:
                'radial-gradient(circle at 65% 48%, rgba(34, 211, 238, 0.3) 0%, rgba(6, 182, 212, 0.16) 40%, rgba(236, 254, 255, 0.2) 70%, transparent 100%)',
            }}
          />

          {/* Subtle bottom-left cyan glow */}
          <div className="pointer-events-none absolute -left-12 -bottom-24 w-80 h-60 rounded-full bg-cyan-400/15 blur-2xl z-0" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 lg:gap-6 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-3.5 sm:space-y-6">
              
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200/80 text-cyan-800 text-[11px] sm:text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                <span>YOUR DIGITAL CONTENT LIBRARY</span>
              </div>

              {/* Heading */}
              <div>
                <h1 className="text-[32px] sm:text-[50px] lg:text-[62px] font-black text-slate-950 tracking-[-0.03em] leading-[1.06]">
                  Discover Your Next Viral Reel.
                </h1>
                <div className="text-[28px] sm:text-[44px] lg:text-[54px] font-black tracking-[-0.03em] leading-[1.08] mt-1 flex items-center min-h-[36px] sm:min-h-[58px]">
                  <span className="text-cyan-600">
                    {displayText}
                  </span>
                  <span className="w-[3px] h-[0.88em] bg-cyan-500 ml-1.5 inline-block animate-pulse shrink-0" />
                </div>
              </div>

              {/* Subtitle */}
              <p className="text-[13px] sm:text-[15.5px] text-slate-600 font-medium max-w-xl leading-[1.5] sm:leading-[1.6]">
                Download high-converting, professional reels bundles for Instagram, YouTube Shorts and Facebook. Pick your niche, preview sample videos, and get instant Google Drive access after purchase.
              </p>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center sm:gap-3.5 pt-0.5 sm:pt-1">
                <Link
                  href="/shop"
                  prefetch={false}
                  className="px-3.5 sm:px-6 py-2.5 sm:py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-bold text-[13px] sm:text-[14px] flex items-center justify-center gap-1.5 sm:gap-2.5 shadow-[0_10px_24px_rgba(6,182,212,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <span className="truncate">Explore Bundles</span>
                  <ArrowRight className="w-4 h-4 shrink-0 stroke-[2.5]" />
                </Link>

                <a
                  href="#rbui-preview"
                  className="px-3.5 sm:px-6 py-2.5 sm:py-3.5 rounded-xl bg-white text-slate-800 border border-slate-200 hover:border-cyan-400 font-bold text-[13px] sm:text-[14px] flex items-center justify-center gap-1.5 sm:gap-2.5 shadow-xs hover:bg-cyan-50/50 active:scale-95 transition-all"
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shrink-0">
                    <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-cyan-600 ml-0.5" />
                  </div>
                  <span className="truncate">Watch Previews</span>
                </a>
              </div>

              {/* 3 Metric Cards on Desktop */}
              <div className="hidden lg:grid grid-cols-3 gap-3.5 pt-3 max-w-xl">
                {/* Published Bundles */}
                <div className="relative overflow-hidden p-3.5 rounded-2xl bg-white border border-cyan-200/80 text-slate-900 flex flex-col items-center text-center shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0 mb-1">
                    <FolderKanban className="w-4 h-4 text-cyan-600" />
                  </div>
                  <div className="leading-tight relative z-10">
                    <div className="text-[20px] font-black tracking-tight text-slate-900">{totalBundles || 129}+</div>
                    <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Curated Bundles</div>
                  </div>
                </div>

                {/* Ready-to-Post Reels (Deep Navy Card) */}
                <div className="relative overflow-hidden p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-cyan-950 border border-cyan-500/30 text-white flex flex-col items-center text-center shadow-md">
                  <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 mb-1">
                    <Film className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div className="leading-tight relative z-10">
                    <div className="text-[20px] font-black tracking-tight text-cyan-300">222K+</div>
                    <div className="text-[11px] font-semibold text-slate-300 mt-0.5">Ready-to-Post Reels</div>
                  </div>
                </div>

                {/* Up to 1080P Maximum Quality */}
                <div className="relative overflow-hidden p-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 flex flex-col items-center text-center shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="leading-tight relative z-10">
                    <div className="text-[18px] font-black tracking-tight text-slate-900">1080P Max</div>
                    <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Full HD Quality</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right: 3 Phone Stack with Cyan Aura */}
            <div
              className="lg:col-span-5 flex flex-col items-center justify-center relative mt-1 sm:mt-0"
              onMouseEnter={() => setIsRotating(false)}
              onMouseLeave={() => setIsRotating(true)}
            >
              {/* Cyan Glow Directly Behind the 3 Phones */}
              <div
                className="pointer-events-none absolute inset-0 -m-6 rounded-full opacity-90 z-0"
                style={{
                  background:
                    'radial-gradient(circle at 50% 50%, rgba(34, 211, 238, 0.35) 0%, rgba(6, 182, 212, 0.18) 45%, transparent 72%)',
                }}
              />

              {/* 3 Phone Cards Container */}
              <div className="relative z-10 w-full max-w-[340px] sm:max-w-[380px] h-[235px] sm:h-[310px] lg:h-[340px] flex items-center justify-center">
                
                {/* Left Card (-8deg tilt) */}
                {leftCard && (
                  <Link
                    href={`/product/${leftCard.slug}`}
                    prefetch={false}
                    key={`left-${leftCard.id}`}
                    className="absolute z-10 w-[104px] sm:w-[142px] lg:w-[162px] aspect-[9/16] rounded-[16px] sm:rounded-[24px] overflow-hidden shadow-[0_12px_28px_rgba(15,23,42,0.18)] border-[3.5px] sm:border-[4.5px] border-white transform -rotate-[8deg] -translate-x-[52px] sm:-translate-x-[72px] lg:-translate-x-[82px] translate-y-1 sm:translate-y-2 transition-all hover:scale-95 duration-500 block bg-slate-900 group"
                  >
                    <img
                      src={optimizeImageUrl(leftCard.thumbnail, 384, 75)}
                      alt={leftCard.title}
                      width={384}
                      height={683}
                      fetchPriority="high"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent flex flex-col justify-between p-2 sm:p-3 text-white">
                      <div />
                      <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/95 shadow-md flex items-center justify-center mx-auto text-cyan-600">
                        <Play className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 fill-cyan-500 ml-0.5" />
                      </div>
                      <div>
                        <span className="text-[7px] sm:text-[8.5px] font-extrabold uppercase tracking-[0.12em] text-cyan-300 block mb-0.5">
                          HOT PREVIEW
                        </span>
                        <p className="text-[9px] sm:text-[11px] font-extrabold text-white line-clamp-2 leading-tight">
                          {leftCard.title}
                        </p>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Right Card (+8deg tilt) */}
                {rightCard && (
                  <Link
                    href={`/product/${rightCard.slug}`}
                    prefetch={false}
                    key={`right-${rightCard.id}`}
                    className="absolute z-10 w-[104px] sm:w-[142px] lg:w-[162px] aspect-[9/16] rounded-[16px] sm:rounded-[24px] overflow-hidden shadow-[0_12px_28px_rgba(15,23,42,0.18)] border-[3.5px] sm:border-[4.5px] border-white transform rotate-[8deg] translate-x-[52px] sm:translate-x-[72px] lg:translate-x-[82px] translate-y-1 sm:translate-y-2 transition-all hover:scale-95 duration-500 block bg-slate-900 group"
                  >
                    <img
                      src={optimizeImageUrl(rightCard.thumbnail, 384, 75)}
                      alt={rightCard.title}
                      width={384}
                      height={683}
                      fetchPriority="high"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent flex flex-col justify-between p-2 sm:p-3 text-white">
                      <div />
                      <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/95 shadow-md flex items-center justify-center mx-auto text-cyan-600">
                        <Play className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 fill-cyan-500 ml-0.5" />
                      </div>
                      <div>
                        <span className="text-[7px] sm:text-[8.5px] font-extrabold uppercase tracking-[0.12em] text-cyan-300 block mb-0.5">
                          PREVIEW
                        </span>
                        <p className="text-[9px] sm:text-[11px] font-extrabold text-white line-clamp-2 leading-tight">
                          {rightCard.title}
                        </p>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Center Upright Card (Front, crisp Cyan border) */}
                {centerCard && (
                  <Link
                    href={`/product/${centerCard.slug}`}
                    prefetch={false}
                    key={`center-${centerCard.id}`}
                    className="relative z-20 w-[126px] sm:w-[170px] lg:w-[195px] aspect-[9/16] rounded-[20px] sm:rounded-[26px] overflow-hidden shadow-[0_20px_45px_rgba(6,182,212,0.22)] border-[4px] sm:border-[5px] border-cyan-400 -translate-y-1 sm:-translate-y-2 transition-all hover:scale-[1.03] duration-500 block bg-slate-900 group"
                  >
                    <img
                      src={optimizeImageUrl(centerCard.thumbnail, 384, 75)}
                      alt={centerCard.title}
                      width={384}
                      height={683}
                      fetchPriority="high"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent flex flex-col justify-between p-2.5 sm:p-3.5 text-white">
                      <div />

                      <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white/95 shadow-lg flex items-center justify-center mx-auto text-cyan-600">
                        <Play className="w-3 h-3 sm:w-4 sm:h-4 fill-cyan-500 ml-0.5" />
                      </div>

                      <div>
                        <span className="text-[7.5px] sm:text-[9px] font-extrabold uppercase tracking-[0.14em] text-cyan-300 block mb-0.5 sm:mb-1">
                          FEATURED BUNDLE
                        </span>
                        <p className="text-[10.5px] sm:text-[12.5px] font-black text-white line-clamp-2 leading-snug">
                          {centerCard.title}
                        </p>
                      </div>
                    </div>
                  </Link>
                )}

              </div>

              {/* Bottom Quality Badges */}
              <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-3 mt-2 sm:mt-3">
                <span className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-white text-slate-800 border border-slate-200 shadow-xs">
                  9:16 Vertical
                </span>
                <span className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-cyan-600 text-white shadow-xs">
                  1080P Full HD
                </span>
              </div>

              {/* 3 Metric Cards on Mobile */}
              <div className="grid lg:hidden grid-cols-3 gap-2 pt-2.5 sm:pt-3 w-full max-w-md relative z-10">
                <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-cyan-200 text-slate-900 flex flex-col items-center text-center shadow-xs">
                  <div className="w-7 h-7 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center mb-1">
                    <FolderKanban className="w-3.5 h-3.5 text-cyan-600" />
                  </div>
                  <div className="leading-tight">
                    <div className="text-[14px] sm:text-[16px] font-black tracking-tight">{totalBundles || 129}+</div>
                    <div className="text-[8.5px] sm:text-[9px] font-semibold text-slate-500 mt-0.5 line-clamp-1">Bundles</div>
                  </div>
                </div>

                <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-slate-900 to-cyan-950 border border-cyan-500/30 text-white flex flex-col items-center text-center shadow-xs">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center mb-1">
                    <Film className="w-3.5 h-3.5 text-cyan-300" />
                  </div>
                  <div className="leading-tight">
                    <div className="text-[14px] sm:text-[16px] font-black tracking-tight text-cyan-300">222K+</div>
                    <div className="text-[8.5px] sm:text-[9px] font-semibold text-slate-300 mt-0.5 line-clamp-1">Ready Reels</div>
                  </div>
                </div>

                <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 flex flex-col items-center text-center shadow-xs">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="leading-tight">
                    <div className="text-[12px] sm:text-[13px] font-black tracking-tight leading-none">1080P</div>
                    <div className="text-[8.5px] sm:text-[9px] font-semibold text-slate-500 mt-1 line-clamp-1">Full HD</div>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
