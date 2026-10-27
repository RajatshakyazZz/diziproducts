import React from 'react';
import { TrendingUp, Users, Star, Award, Sparkles, CheckCircle2, Quote, ArrowUpRight } from 'lucide-react';

export default function CreatorProof() {
  const stats = [
    {
      value: '14.2M+',
      label: 'Organic Views Generated',
      sub: 'Across Instagram Reels & Shorts',
      icon: TrendingUp,
      accent: 'from-sky-500/20 to-blue-500/5',
      iconColor: 'text-sky-600',
    },
    {
      value: '10,000+',
      label: 'Active Creators & Brands',
      sub: 'Growing pages consistently',
      icon: Users,
      accent: 'from-blue-500/20 to-sky-500/5',
      iconColor: 'text-blue-600',
    },
    {
      value: '4.95 / 5',
      label: 'Average Creator Rating',
      sub: 'Based on 3,850+ verified downloads',
      icon: Star,
      accent: 'from-amber-500/20 to-yellow-500/5',
      iconColor: 'text-amber-500',
    },
    {
      value: '100%',
      label: 'Commercial & Resell Rights',
      sub: 'Zero watermarks • Keep 100% profit',
      icon: Award,
      accent: 'from-emerald-500/20 to-blue-600/5',
      iconColor: 'text-emerald-600',
    },
  ];

  const testimonials = [
    {
      name: 'Aman Verma',
      handle: '@tech_insights_ai',
      followers: '145K Followers',
      avatarInitial: 'AV',
      avatarGrad: 'from-sky-400 to-blue-600',
      quote:
        'The AI Reels pack helped me scale from 5K to 100K followers in just 45 days. The 9:16 framing, punchy pacing, and audio syncing are top-tier.',
      metric: '+95K Followers in 30 Days',
      metricBg: 'bg-emerald-500/10 text-emerald-800 border-emerald-300/40',
      niche: 'AI & Tech',
    },
    {
      name: 'Pooja Kashyap',
      handle: '@daily_motivation_hub',
      followers: '280K Followers',
      avatarInitial: 'PK',
      avatarGrad: 'from-sky-400 to-indigo-600',
      quote:
        'I purchased the Commercial License and started offering curated niche reels to agency clients. Made back my store investment 10x in the first week alone.',
      metric: '₹45,000+ Resale Revenue',
      metricBg: 'bg-sky-500/10 text-sky-900 border-sky-300/40',
      niche: 'Motivation',
    },
    {
      name: 'Rohan Mehra',
      handle: '@satisfying_daily_viral',
      followers: '520K Followers',
      avatarInitial: 'RM',
      avatarGrad: 'from-blue-500 to-indigo-600',
      quote:
        'Audience retention skyrocketed. My average watch percentage jumped from 60% to 110% on YouTube Shorts using their 4K ASMR and satisfying reel cuts.',
      metric: '8.4M Views on Single Short',
      metricBg: 'bg-sky-500/10 text-sky-900 border-sky-300/40',
      niche: 'Viral ASMR',
    },
  ];

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden [contain:layout_style]">
      {/* Ambient background lighting */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] bg-sky-200/20 blur-[130px] rounded-full -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-50/90 border border-sky-200/80 text-sky-900 text-xs font-bold uppercase tracking-wider mb-3 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>PROVEN CREATOR RESULTS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-[-0.03em] leading-tight">
            Creator Growth in Real Numbers.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2.5 font-medium leading-relaxed max-w-2xl mx-auto">
            See how creators, theme page owners, and social agencies are dominating the algorithm with our ready-to-post vertical reels.
          </p>
        </div>

        {/* Stats 4-Grid with modern bento styling */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 mb-12 sm:mb-16">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="group relative p-5 sm:p-7 rounded-[24px] sm:rounded-[28px] bg-white border border-slate-200/80 hover:border-sky-400/60 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)] hover:shadow-[0_16px_36px_-6px_rgba(2,132,199,0.14)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* Subtle top specular shimmer line */}
                <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-sky-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${stat.accent} border border-slate-200/60 flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-0.5">
                    Verified <ArrowUpRight className="w-3 h-3 text-sky-600" />
                  </span>
                </div>

                <div>
                  <div className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight leading-none">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-[13px] font-bold text-slate-800 mt-1.5 leading-snug">
                    {stat.label}
                  </div>
                  <div className="text-[10.5px] sm:text-[11.5px] font-medium text-slate-400 mt-0.5 leading-tight">
                    {stat.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3 Real Creator Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-7">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="relative p-6 sm:p-8 rounded-[28px] bg-white border border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_45px_rgba(2,132,199,0.12)] hover:border-sky-300/80 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group overflow-hidden"
            >
              {/* Giant background quote watermark */}
              <Quote className="absolute -bottom-4 -right-4 w-28 h-28 text-slate-100 pointer-events-none -z-0 opacity-40 group-hover:text-sky-50 group-hover:opacity-60 transition-colors" />

              <div className="relative z-10 space-y-4">
                {/* Metric pill & Stars */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-2xs ${t.metricBg}`}>
                    <Sparkles className="w-3 h-3" />
                    <span>{t.metric}</span>
                  </span>

                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>

                {/* Quote Text */}
                <p className="text-[13.5px] sm:text-[14.5px] text-slate-700 font-medium leading-[1.65]">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              {/* Creator Footer Info */}
              <div className="relative z-10 pt-5 mt-5 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.avatarGrad} text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0 border border-white`}>
                    {t.avatarInitial}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <h3 className="font-bold text-sm text-slate-950 leading-tight">
                        {t.name}
                      </h3>
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 fill-sky-50 shrink-0" />
                    </div>
                    <p className="text-[11px] font-semibold text-sky-700 leading-tight mt-0.5">
                      {t.handle}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] font-bold text-slate-500 block leading-tight">
                    {t.followers}
                  </span>
                  <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider block mt-0.5">
                    {t.niche}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
