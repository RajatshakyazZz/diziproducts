'use client';

import React, { useState, useRef } from 'react';
import { Bell, Clock, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { BUNDLE_PRODUCTS } from '@/data/bundles';
import { optimizeImageUrl } from '@/lib/imageOptimized';

export default function UpcomingBundles() {
  const upcoming = BUNDLE_PRODUCTS.filter((b) => b.isUpcoming);
  const [selectedBundle, setSelectedBundle] = useState<typeof upcoming[0] | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setSelectedBundle(null);
      setName('');
      setEmail('');
      setWhatsapp('');
    }, 2500);
  };

  return (
    <section className="py-8 sm:py-12 [contain:layout_style]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200/80 text-cyan-800 text-[11px] font-bold uppercase tracking-wider mb-2.5">
              <Clock className="w-3.5 h-3.5 text-cyan-600" />
              <span>IN PRODUCTION</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-[-0.02em]">
              Upcoming Reels Bundles.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Exciting new collections currently being curated and synced for creators.
            </p>
          </div>

          {/* Carousel Controls */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={scrollLeft}
              className="w-9 h-9 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center transition-colors shadow-2xs cursor-pointer active:scale-95"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={scrollRight}
              className="w-9 h-9 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center transition-colors shadow-2xs cursor-pointer active:scale-95"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel Slider */}
        <div
          ref={carouselRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory"
        >
            {upcoming.map((bundle) => (
              <div
                key={bundle.id}
                className="w-72 sm:w-[290px] bg-white rounded-[24px] border border-slate-200/90 shadow-xs hover:shadow-[0_14px_32px_rgba(6,182,212,0.14)] hover:border-cyan-400/60 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group shrink-0 snap-start"
              >
                <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden">
                  <img
                    src={optimizeImageUrl(bundle.thumbnail, 384, 75)}
                    alt={bundle.title}
                    width={384}
                    height={288}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-end p-3">
                    <span className="px-3 py-1 rounded-full bg-white/95 text-slate-950 text-[11px] font-bold shadow-md flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-cyan-600" />
                      <span>Dropping Soon</span>
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-cyan-900 bg-cyan-50 border border-cyan-200/50 px-2 py-0.5 rounded-md inline-block">
                      {bundle.category}
                    </span>
                    <h3 className="font-bold text-[14px] text-slate-950 line-clamp-2 leading-snug">
                      {bundle.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 font-medium">
                      {bundle.shortDescription}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedBundle(bundle)}
                    className="w-full py-2.5 px-3 rounded-xl border border-cyan-500/30 bg-cyan-50/70 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-cyan-600 hover:text-white text-cyan-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Notify Me on Launch</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        {/* Notify Me Modal */}
        {selectedBundle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200">
              <button
                onClick={() => setSelectedBundle(null)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200/60 text-cyan-600 flex items-center justify-center mb-4">
                <Bell className="w-6 h-6" />
              </div>

              <span className="text-[11px] font-bold uppercase text-cyan-800 tracking-wider">
                UPCOMING BUNDLE ALERT
              </span>
              <h3 className="text-xl font-black text-slate-950 mt-1">
                Get notified when it’s live
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Enter your details to receive an instant alert and early-bird launch pricing for <strong className="text-slate-800">{selectedBundle.title}</strong>.
              </p>

              {isSuccess ? (
                <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-bold text-sm flex items-center justify-center gap-2">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span>Success! We will notify you directly upon release.</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aman"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="you@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-cyan-500/25 mt-2 cursor-pointer"
                  >
                    Save & Notify Me →
                  </button>
                  <p className="text-[10px] text-center text-slate-400">
                    We hate spam. Your contact info will only be used for this bundle release.
                  </p>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
