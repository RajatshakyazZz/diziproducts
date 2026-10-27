'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Play, Pause, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { BUNDLE_PRODUCTS } from '@/data/bundles';
import { useCart } from '@/context/CartContext';
import { ReelItem, BundleProduct } from '@/types';
import { getStoreReels, initialStoreReels, parseVideoUrl } from '@/lib/reels';
import { resolveBundleSlug, getProductUrlForReel } from '@/lib/bundleResolver';
import { optimizeImageUrl } from '@/lib/imageOptimized';

export default function ReelsVideoPreview() {
  const { buyNow } = useCart();
  const [reels, setReels] = useState<ReelItem[]>(initialStoreReels);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  useEffect(() => {
    let isMounted = true;
    let hasFetched = false;

    const loadLiveReels = () => {
      if (hasFetched || !isMounted) return;
      hasFetched = true;
      cleanup();
      getStoreReels().then((data) => {
        if (isMounted && data && data.length > 0) {
          setReels(data);
        }
      });
    };

    const events = ['scroll', 'pointerdown', 'touchstart', 'keydown'] as const;
    const cleanup = () => {
      events.forEach((evt) => window.removeEventListener(evt, loadLiveReels));
    };

    events.forEach((evt) =>
      window.addEventListener(evt, loadLiveReels, { once: true, passive: true })
    );

    return () => {
      isMounted = false;
      cleanup();
    };
  }, []);

  const handleTogglePlay = (id: string) => {
    const video = videoRefs.current[id];

    if (activeVideoId === id) {
      if (video) video.pause();
      setActiveVideoId(null);
    } else {
      if (activeVideoId && videoRefs.current[activeVideoId]) {
        videoRefs.current[activeVideoId]?.pause();
      }
      setActiveVideoId(id);
    }
  };

  const handleBuy = (reel: ReelItem) => {
    const matched = resolveBundleSlug(reel.bundleSlug || reel.title || '');

    if (matched) {
      buyNow(matched, 'personal');
      return;
    }

    const customBundle: BundleProduct = {
      id: reel.bundleId || `custom-${reel.id}`,
      slug: reel.bundleSlug || 'viral-reels-pack',
      title: reel.bundleTitle || reel.title,
      shortDescription: `Curated digital video reel package: ${reel.title}`,
      category: reel.category || 'AI Reels',
      categorySlug: 'ai-reels',
      reelCount: 1000,
      personalPrice: reel.bundlePrice || 49,
      personalOriginalPrice: (reel.bundlePrice || 49) * 5,
      resellerPrice: (reel.bundlePrice || 49) * 2,
      resellerOriginalPrice: (reel.bundlePrice || 49) * 10,
      thumbnail: reel.poster || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600',
      galleryImages: [reel.poster || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600'],
      tags: ['INSTANT ACCESS', 'HD'],
      rating: 5.0,
      reviewCount: 120,
      resolution: '1080P Full HD',
      aspectRatio: '9:16 Vertical',
      format: 'MP4',
      audioIncluded: true,
      googleDriveLink: '',
      features: ['Direct Instant Download', 'Commercial Rights'],
      faqs: [],
    };

    buyNow(customBundle, 'personal');
  };

  return (
    <section id="rbui-preview" className="py-8 sm:py-12 [contain:layout_style]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200/80 text-cyan-800 text-[11px] font-bold uppercase tracking-wider mb-2.5">
              <Play className="w-3.5 h-3.5 fill-cyan-600 text-cyan-600" />
              <span>INTERACTIVE PLAYER</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-[-0.02em]">
              Preview Reels Before You Buy.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Watch real samples, inspect vertical 9:16 clarity, and pick your next viral collection.
            </p>
          </div>

          <Link
            href="/reels"
            prefetch={false}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-all shadow-xs shrink-0 self-start sm:self-auto group"
          >
            <span>View All Previews</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Video Preview Phones Horizontal Track */}
        <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 scrollbar-none">
            {reels.map((item) => {
              const isPlaying = activeVideoId === item.id;
              const parsed = parseVideoUrl(item.videoUrl);
              const isYouTube = item.videoType === 'youtube' || parsed.videoType === 'youtube' || Boolean(item.youtubeId);
              const ytId = item.youtubeId || parsed.youtubeId;

              const reelPoster =
                item.poster ||
                resolveBundleSlug(item.bundleSlug || item.title)?.thumbnail ||
                '/baby-strawberry-reel.webp';

              return (
                <div
                  key={item.id}
                  className="w-48 sm:w-52 aspect-[9/16] rounded-[26px] bg-slate-950 p-2.5 shadow-xl border-[3px] border-slate-800 relative flex flex-col justify-between overflow-hidden shrink-0 group select-none"
                >
                  {/* Video / Poster */}
                  {isYouTube && ytId ? (
                    isPlaying ? (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=${
                          isMuted ? 1 : 0
                        }&loop=1&playlist=${ytId}&controls=1&modestbranding=1&playsinline=1&rel=0`}
                        className="absolute inset-0 w-full h-full border-0 z-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <img
                        src={optimizeImageUrl(reelPoster, 256, 75)}
                        alt={item.title}
                        width={256}
                        height={455}
                        loading="lazy"
                        decoding="async"
                        onClick={() => handleTogglePlay(item.id)}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/baby-strawberry-reel.webp';
                        }}
                        className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                      />
                    )
                  ) : isPlaying ? (
                    <video
                      ref={(el) => {
                        videoRefs.current[item.id] = el;
                      }}
                      src={item.videoUrl}
                      poster={optimizeImageUrl(reelPoster, 256, 75)}
                      autoPlay
                      loop
                      playsInline
                      muted={isMuted}
                      onClick={() => handleTogglePlay(item.id)}
                      className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                    />
                  ) : (
                    <img
                      src={optimizeImageUrl(reelPoster, 256, 75)}
                      alt={item.title}
                      width={256}
                      height={455}
                      loading="lazy"
                      decoding="async"
                      onClick={() => handleTogglePlay(item.id)}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/baby-strawberry-reel.webp';
                      }}
                      className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                    />
                  )}

                  {/* Top bar controls */}
                  <div className="relative z-20 flex justify-between items-center">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-black/80 text-white">
                      {item.category || (isYouTube ? 'YouTube' : 'Reel')}
                    </span>
                    <button
                      type="button"
                      aria-label={isMuted ? `Unmute ${item.title}` : `Mute ${item.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMuted(!isMuted);
                        Object.values(videoRefs.current).forEach((v) => {
                          if (v) v.muted = !isMuted;
                        });
                      }}
                      className="p-1.5 rounded-full bg-black/80 text-white hover:bg-black"
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Center Play Button */}
                  {(!isYouTube || !isPlaying) && (
                    <div
                      onClick={() => handleTogglePlay(item.id)}
                      className={`absolute inset-0 z-10 flex items-center justify-center cursor-pointer transition-opacity ${
                        isPlaying ? 'opacity-0 hover:opacity-100 bg-black/20' : 'opacity-100 bg-black/30'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-cyan-400 shadow-xl shadow-cyan-500/30 flex items-center justify-center text-slate-950 transform group-hover:scale-110 transition-transform">
                        {isPlaying ? (
                          <Pause className="w-5 h-5 fill-slate-950" />
                        ) : (
                          <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bottom Bar: Title & Buy Now */}
                  <div className="relative z-20 flex items-center justify-between gap-1 pt-2 bg-gradient-to-t from-black/95 via-black/75 to-transparent p-2 rounded-xl">
                    <Link
                      href={getProductUrlForReel(item)}
                      prefetch={false}
                      className="text-xs font-bold text-white hover:text-cyan-300 hover:underline truncate max-w-[95px] transition-colors"
                      title={item.bundleTitle || item.title}
                    >
                      {item.bundleTitle || item.title}
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleBuy(item)}
                      className="px-2.5 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white text-[11px] font-bold shrink-0 flex items-center gap-0.5 shadow-md active:scale-95 transition-all"
                    >
                      <span>Buy Now</span>
                      <span className="text-[13px] leading-none">›</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

      </div>
    </section>
  );
}
