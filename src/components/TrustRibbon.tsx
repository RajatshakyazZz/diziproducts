'use client';

import React from 'react';
import Link from 'next/link';
import {
  Zap,
  Film,
  Award,
  ShieldCheck,
  Sparkles,
  FolderOpen,
  ArrowRight,
  Download,
} from 'lucide-react';

export default function TrustRibbon() {
  const trustItems = [
    {
      icon: Zap,
      title: 'Instant Access',
      subtitle: 'Direct Google Drive links',
      badge: 'Immediate',
      color: 'text-cyan-600 bg-cyan-50 border-cyan-200/60',
    },
    {
      icon: Film,
      title: '1080p & 4K Ready',
      subtitle: 'Crystal-clear 9:16 vertical',
      badge: 'Full HD',
      color: 'text-blue-600 bg-blue-50 border-blue-200/60',
    },
    {
      icon: Award,
      title: 'Resell Rights',
      subtitle: 'Commercial license included',
      badge: '100% Profit',
      color: 'text-amber-600 bg-amber-50 border-amber-200/60',
    },
    {
      icon: ShieldCheck,
      title: 'Safe Checkout',
      subtitle: '100% encrypted UPI & Cards',
      badge: 'Verified',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200/60',
    },
    {
      icon: Sparkles,
      title: 'Weekly Updates',
      subtitle: 'Trending audio & viral niches',
      badge: 'Fresh',
      color: 'text-purple-600 bg-purple-50 border-purple-200/60',
    },
  ];

  return (
    <section className="py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-4">
        
        {/* 1. Self-Service Order Access Card */}
        <div className="relative overflow-hidden rounded-[24px] sm:rounded-[28px] bg-gradient-to-r from-slate-950 via-[#072435] to-slate-950 border border-cyan-500/30 p-5 sm:p-6 shadow-[0_12px_36px_rgba(2,6,23,0.3)]">
          {/* Subtle Ambient Radial Glow */}
          <div className="pointer-events-none absolute -right-10 -bottom-10 w-60 h-60 bg-cyan-400/15 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center sm:items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <FolderOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    Looking for Your Purchased Reels Download Link?
                  </h3>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-400/20 text-cyan-300 border border-cyan-400/40">
                    Instant
                  </span>
                </div>
                <p className="text-xs sm:text-[13.5px] text-slate-300 font-medium mt-1 leading-snug">
                  If you already completed payment, access all your reel links, bonus Google Drives, and invoices immediately using your order ID or email.
                </p>
              </div>
            </div>

            <Link
              href="/my-order"
              prefetch={false}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-[0_4px_16px_rgba(6,182,212,0.3)] hover:scale-[1.02] active:scale-95 transition-all shrink-0 w-full sm:w-auto justify-center"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Go To Order Lookup</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>
          </div>
        </div>

        {/* 2. 5-Item Trust Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {trustItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group relative p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-cyan-300 shadow-2xs hover:shadow-xs transition-all duration-200 flex items-center gap-3"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-slate-900 leading-tight truncate">
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-tight truncate mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
