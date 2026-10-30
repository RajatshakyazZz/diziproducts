import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Palette, Save, Play, Sparkles, Image as ImageIcon, Trash2 } from 'lucide-react';
import { portalApi } from '../api/client';
import { StoreBranding } from '../api/types';
import { useToast } from '../context/ToastContext';
import ImageUploadButton from '../components/common/ImageUploadButton';

export default function Branding() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const { data: branding, isLoading } = useQuery({
    queryKey: ['branding'],
    queryFn: () => portalApi.getBranding(),
  });

  const [form, setForm] = useState<StoreBranding>({
    store_name: 'DiziProducts Store',
    tagline: 'Premium Reels for Your Growth',
    logo_url: '/logo.png',
    favicon_url: '/favicon.ico',
    banner_url: '',
    banner_enabled: false,
    banner_link: '/shop',
    primary_color: '#6d36e8',
    secondary_color: '#fe5f9b',
    accent_color: '#10b981',
    font_family: 'Plus Jakarta Sans',
  });

  React.useEffect(() => {
    if (branding) setForm(branding);
  }, [branding]);

  const mutation = useMutation({
    mutationFn: (updated: StoreBranding) => portalApi.updateBranding(updated),
    onSuccess: (data) => {
      queryClient.setQueryData(['branding'], data);
      try {
        localStorage.setItem('rb_portal_settings_branding', JSON.stringify(data));
        window.dispatchEvent(new CustomEvent('vaultworld:branding_updated', { detail: data }));
      } catch {}
      success('Branding Saved', 'Logo and palette updated across all customer touchpoints.');
    },
    onError: () => error('Save Failed', 'Could not save branding configuration.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Store Branding & Appearance
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
          Customize brand logos, vibrant gradients, and live storefront themes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 block">Store Name</label>
            <input
              type="text"
              value={form.store_name}
              onChange={(e) => setForm({ ...form, store_name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 block">Tagline</label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Logo & Favicon URLs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <label className="text-xs font-bold text-slate-300 block">
                  Store Logo URL / Path
                </label>
                <div className="flex items-center gap-2">
                  <ImageUploadButton
                    label="Upload Logo"
                    onUploadSuccess={(url) => setForm({ ...form, logo_url: url })}
                    helperText=""
                  />
                  {form.logo_url && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, logo_url: '/logo.webp?v=4' })}
                      className="text-[10px] text-sky-400 hover:underline"
                    >
                      Reset Default
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="/logo.webp?v=4"
                  value={form.logo_url}
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
                {form.logo_url && (
                  <img
                    src={form.logo_url}
                    alt="Logo preview"
                    className="w-8 h-8 rounded-lg object-contain bg-slate-950 border border-slate-800 p-0.5 shrink-0"
                    onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                  />
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <label className="text-xs font-bold text-slate-300 block">
                  Store Favicon URL / Path
                </label>
                <div className="flex items-center gap-2">
                  <ImageUploadButton
                    label="Upload Favicon"
                    onUploadSuccess={(url) => setForm({ ...form, favicon_url: url })}
                    helperText=""
                  />
                  {form.favicon_url && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, favicon_url: '/favicon.ico' })}
                      className="text-[10px] text-sky-400 hover:underline"
                    >
                      Reset Default
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="/favicon.ico"
                  value={form.favicon_url}
                  onChange={(e) => setForm({ ...form, favicon_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
                {form.favicon_url && (
                  <img
                    src={form.favicon_url}
                    alt="Favicon preview"
                    className="w-8 h-8 rounded-lg object-contain bg-slate-950 border border-slate-800 p-1 shrink-0"
                    onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Storewide Promotional / Offer Banner Section */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                  <span>Store Offer / Promotional Banner</span>
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Upload your customized sale or offer banner image. When disabled or empty, no banner will appear on the store.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                <input
                  type="checkbox"
                  checked={Boolean(form.banner_enabled)}
                  onChange={(e) => setForm({ ...form, banner_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px] font-medium text-slate-300">Banner Image File / URL</span>
                <div className="flex items-center gap-2">
                  <ImageUploadButton
                    label="Upload Banner (ImgBB)"
                    onUploadSuccess={(url) => setForm({ ...form, banner_url: url, banner_enabled: true })}
                    helperText=""
                  />
                  {form.banner_url && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, banner_url: '', banner_enabled: false })}
                      className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove Banner
                    </button>
                  )}
                </div>
              </div>

              <input
                type="text"
                placeholder="https://i.ibb.co/... or /custom-banner.webp"
                value={form.banner_url || ''}
                onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    Banner Click Link Destination
                  </label>
                  <input
                    type="text"
                    placeholder="/shop or https://..."
                    value={form.banner_link || ''}
                    onChange={(e) => setForm({ ...form, banner_link: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    Banner Status
                  </label>
                  <div className="h-[34px] flex items-center px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
                    {form.banner_enabled && form.banner_url ? (
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Active & Visible on Store
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                        Hidden / Disabled (No Banner Shown)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {form.banner_url && (
                <div className="mt-2 rounded-xl overflow-hidden border border-slate-800 bg-slate-900/60 p-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5 px-1">
                    <span className="font-semibold text-slate-300">Banner Live Preview:</span>
                    <span>Link: <code className="text-sky-300">{form.banner_link || '/shop'}</code></span>
                  </div>
                  <img
                    src={form.banner_url}
                    alt="Banner preview"
                    className="w-full h-auto max-h-48 object-cover rounded-lg border border-slate-800"
                    onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Color pickers */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">Primary Color</label>
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <input
                  type="color"
                  value={form.primary_color}
                  onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                  className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                />
                <span className="text-[11px] font-mono text-slate-300">{form.primary_color}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">Secondary Color</label>
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <input
                  type="color"
                  value={form.secondary_color}
                  onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                  className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                />
                <span className="text-[11px] font-mono text-slate-300">{form.secondary_color}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">Accent Color</label>
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <input
                  type="color"
                  value={form.accent_color}
                  onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                  className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                />
                <span className="text-[11px] font-mono text-slate-300">{form.accent_color}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 mt-4"
          >
            <Save className="w-4 h-4" />
            <span>Save Branding Changes</span>
          </button>
        </form>

        {/* Live Preview Panel */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Live Storefront Preview</span>
            </h3>
            <span className="text-[10px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Interactive
            </span>
          </div>

          {/* Mock Header */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div
                  style={{
                    background: `linear-gradient(135deg, ${form.secondary_color}, ${form.primary_color})`,
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">{form.store_name}</div>
                  <div className="text-[10px] text-slate-400">{form.tagline}</div>
                </div>
              </div>
            </div>

            {/* Mock CTA Button */}
            <button
              style={{
                background: `linear-gradient(135deg, ${form.primary_color}, ${form.secondary_color})`,
              }}
              className="w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-md"
            >
              Get Instant Access Now (Sample CTA)
            </button>

            {/* Mock Banner */}
            {form.banner_enabled && form.banner_url ? (
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold text-slate-400">Offer Banner:</span>
                <div className="rounded-xl overflow-hidden border border-slate-800 shadow-md">
                  <img
                    src={form.banner_url}
                    alt="Offer banner"
                    className="w-full h-auto object-cover max-h-32"
                    onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                  />
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-900 border border-dashed border-slate-800 text-center text-[10px] text-slate-500">
                Banner is disabled or empty (No banner displayed)
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
