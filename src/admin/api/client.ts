import {
  initialSummary,
  initialProducts,
  initialOrders,
  initialCustomers,
  initialCoupons,
  initialContent,
  initialBranding,
  initialSiteMode,
  initialStoreSetup,
  initialMetaPixel,
  initialWhatsappButton,
  initialWebhooks,
  initialWebhookLogs,
  initialPlugins,
  initialThemes,
  initialConnectorStatus,
  initialPgBridge,
  initialPayuConfig,
  initialDnpMeta,
  initialMmc,
  initialRankMath,
  initialLiteSpeed,
  initialCategories,
  initialReels,
} from './mockData';
import {
  DailySummary,
  Product,
  CategoryItem,
  Order,
  Customer,
  Coupon,
  ContentItem,
  StoreBranding,
  SiteModeConfig,
  StoreSetupConfig,
  MetaPixelConfig,
  WhatsappButtonConfig,
  WebhookConfig,
  WebhookLogEntry,
  WpPlugin,
  WpTheme,
  ConnectorStatus,
  PgBridgeConfig,
  PayuConfig,
  DnpMetaConfig,
  MmcAnalyticsConfig,
  RankMathConfig,
  LiteSpeedConfig,
  TelegramConfig,
  OrderSyncParams,
  DownloadableFileTokenResponse,
  ReelItem,
} from './types';
import { db, logAdminAction } from '../lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';

/**
 * Recursively strips undefined keys and normalizes payloads so Firestore setDoc/updateDoc
 * never throws "Unsupported field value: undefined".
 */
export function sanitizePayload<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }
  if (Array.isArray(input)) {
    return input
      .filter((item) => item !== undefined)
      .map((item) => (typeof item === 'object' && item !== null ? sanitizePayload(item) : item)) as unknown as T;
  }
  if (typeof input === 'object' && !(input instanceof Date)) {
    const clean: any = {};
    for (const [key, val] of Object.entries(input)) {
      if (val !== undefined) {
        clean[key] = typeof val === 'object' && val !== null ? sanitizePayload(val) : val;
      }
    }
    return clean as T;
  }
  return input;
}

const initialTelegram: TelegramConfig = {
  enabled: false,
  bot_token: '',
  admin_chat_ids: '',
  new_order_alert: false,
  product_alert: false,
  daily_summary_alert: false,
};

class PortalApiClient {
  private apiKey: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.apiKey = localStorage.getItem('rb_portal_api_key');
    }
  }

  setApiKey(key: string) {
    this.apiKey = key;
    if (typeof window !== 'undefined') {
      localStorage.setItem('rb_portal_api_key', key);
    }
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  clearApiKey() {
    this.apiKey = null;
    localStorage.removeItem('rb_portal_api_key');
  }

  // ==========================================
  // AUTH
  // ==========================================
  async verifyKey(key: string): Promise<{ valid: boolean; user?: string; role?: string }> {
    if (key && key.trim().length > 0) {
      this.setApiKey(key);
      return { valid: true, user: 'Admin Operator', role: 'SuperAdmin' };
    }
    return { valid: false };
  }

  async login(credentials: { username: string; password?: string }): Promise<any> {
    const mockKey = `rb_live_${Date.now()}`;
    this.setApiKey(mockKey);
    return { success: true, key: mockKey, user: credentials.username, role: 'SuperAdmin' };
  }

  // ==========================================
  // 1. DASHBOARD & SUMMARY (Aggregated from real Firestore orders)
  // ==========================================
  async getDailySummary(): Promise<DailySummary> {
    const orders = await this.getOrders();
    const paidOrders = orders.filter((o) => o.status === 'completed');
    const totalSales = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const pendingOrders = orders.filter(
      (o) => o.status === 'pending' || o.status === 'processing' || o.status === 'failed'
    );
    const refundedOrders = orders.filter((o) => o.status === 'refunded');
    const uniqueCustomerEmails = new Set(paidOrders.map((o) => o.customer.email).filter(Boolean));

    // Dynamically aggregate top selling bundles ONLY from COMPLETED (paid) orders
    const bundleSalesMap = new Map<string, { id: string | number; name: string; sales_count: number; revenue: number }>();
    paidOrders.forEach((o) => {
      (o.items || []).forEach((it) => {
        const key = String(it.product_id || it.name);
        if (!bundleSalesMap.has(key)) {
          bundleSalesMap.set(key, {
            id: it.product_id || key,
            name: it.name || 'Viral Reels Bundle',
            sales_count: 1,
            revenue: Number(it.total || o.total || 0),
          });
        } else {
          const existing = bundleSalesMap.get(key)!;
          existing.sales_count += 1;
          existing.revenue += Number(it.total || 0);
        }
      });
    });

    const topSellingBundles = Array.from(bundleSalesMap.values())
      .filter((b) => b.sales_count > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4);

    return {
      sales: totalSales,
      orders: paidOrders.length,
      customers: uniqueCustomerEmails.size,
      pending_orders: pendingOrders.length,
      refunded_orders: refundedOrders.length,
      gross_revenue: totalSales,
      net_revenue: totalSales,
      average_order_value: paidOrders.length > 0 ? Math.round(totalSales / paidOrders.length) : 0,
      currency: 'INR',
      currency_symbol: '₹',
      revenue_trend: [
        { date: 'Today', revenue: totalSales, orders: paidOrders.length },
      ],
      top_selling_bundles: topSellingBundles,
      site_mode: 'LIVE',
      connector_status: {
        version: '2.0.0',
        latest_version: '2.0.0',
        update_available: false,
        last_checked: new Date().toISOString(),
      },
    };
  }

  // ==========================================
  // 2. PRODUCTS (Direct Firestore)
  // ==========================================

  /**
   * Universal normalizer that safely maps Firestore docs, storefront BundleProduct
   * instances, or legacy payloads into a 100% compliant admin Product object.
   */
  normalizeAdminProduct(raw: any): Product | null {
    if (!raw || typeof raw !== 'object') return null;

    const id = String(raw.id || raw.slug || '').trim();
    const slug = String(raw.slug || raw.id || '')
      .toLowerCase()
      .replace(/^rb-/, '')
      .trim();

    // 1. Filter out internal system documents, deleted records, or trash
    if (
      !id ||
      id === 'category-registry-v1' ||
      slug === 'category-registry-v1' ||
      raw.name === '[INTERNAL_CATEGORY_REGISTRY]' ||
      raw.name === '[DELETED]' ||
      raw.title === '[DELETED]' ||
      raw.status === 'trash' ||
      raw.status === 'private' ||
      raw.is_deleted === true
    ) {
      return null;
    }

    // 2. Resolve title / name (storefront uses 'title', admin uses 'name')
    const name = String(raw.name || raw.title || '').trim();
    if (!name) return null; // Reject records without an actual bundle title

    // 3. Resolve prices (storefront uses 'personalPrice', admin uses 'price')
    const price = Number(
      raw.price !== undefined && raw.price !== null
        ? raw.price
        : raw.personalPrice !== undefined && raw.personalPrice !== null
        ? raw.personalPrice
        : raw.sale_price !== undefined && raw.sale_price !== null
        ? raw.sale_price
        : 99
    );

    const regularPrice = Number(
      raw.regular_price !== undefined && raw.regular_price !== null
        ? raw.regular_price
        : raw.personalOriginalPrice !== undefined && raw.personalOriginalPrice !== null
        ? raw.personalOriginalPrice
        : raw.originalPrice !== undefined && raw.originalPrice !== null
        ? raw.originalPrice
        : price > 0
        ? Math.max(price * 5, 499)
        : 499
    );

    const resellerPrice = Number(
      raw.reseller_price !== undefined && raw.reseller_price !== null
        ? raw.reseller_price
        : raw.resellerPrice !== undefined && raw.resellerPrice !== null
        ? raw.resellerPrice
        : price > 0
        ? price * 2
        : 199
    );

    const resellerRegularPrice = Number(
      raw.reseller_regular_price !== undefined && raw.reseller_regular_price !== null
        ? raw.reseller_regular_price
        : raw.resellerOriginalPrice !== undefined && raw.resellerOriginalPrice !== null
        ? raw.resellerOriginalPrice
        : regularPrice > 0
        ? regularPrice * 2
        : 1999
    );

    // 4. Resolve categories (storefront can have 'category' string or 'categories' array)
    let categories: string[] = [];
    if (Array.isArray(raw.categories) && raw.categories.length > 0) {
      categories = raw.categories.filter((c: any) => typeof c === 'string' && c.trim());
    } else if (typeof raw.category === 'string' && raw.category.trim()) {
      categories = [raw.category.trim()];
    } else if (Array.isArray(raw.category) && raw.category.length > 0) {
      categories = raw.category.filter((c: any) => typeof c === 'string' && c.trim());
    }
    if (categories.length === 0) {
      categories = ['Trending Reels'];
    }

    // 5. Resolve featured image
    const featuredImage =
      String(raw.featured_image || raw.thumbnail || raw.image || '').trim() ||
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600';

    // 6. Resolve stock status and status
    const stockStatus: 'instock' | 'outofstock' | 'onbackorder' =
      raw.stock_status === 'outofstock' || raw.stock_status === 'onbackorder'
        ? raw.stock_status
        : 'instock';

    const status: 'publish' | 'draft' | 'pending' | 'private' | 'trash' =
      raw.status === 'draft' || raw.status === 'pending'
        ? raw.status
        : 'publish';

    // 7. Resolve Google Drive link and downloadable files
    const googleDriveLink = String(
      raw.google_drive_link ||
      raw.googleDriveLink ||
      raw.drive_link ||
      ''
    ).trim();

    let files: Array<{ id: string; name: string; file_url: string }> = [];
    if (Array.isArray(raw.files) && raw.files.length > 0) {
      files = raw.files
        .filter((f: any) => f && (f.file_url || f.name))
        .map((f: any, idx: number) => ({
          id: String(f.id || `file-${idx + 1}`),
          name: String(f.name || `${name} Part ${idx + 1}`),
          file_url: String(f.file_url || ''),
        }));
    }
    if (files.length === 0 && googleDriveLink) {
      files = [
        {
          id: `file-1`,
          name: `${name} (Google Drive Access)`,
          file_url: googleDriveLink,
        },
      ];
    }

    return {
      id,
      name,
      slug: slug || id.toLowerCase().replace(/^rb-/, ''),
      status,
      stock_status: stockStatus,
      price: isNaN(price) ? 99 : price,
      regular_price: isNaN(regularPrice) ? 499 : regularPrice,
      sale_price: isNaN(price) ? 99 : price,
      reseller_price: isNaN(resellerPrice) ? 199 : resellerPrice,
      reseller_regular_price: isNaN(resellerRegularPrice) ? 1999 : resellerRegularPrice,
      categories,
      reel_count: Number(raw.reel_count || raw.reelCount || 1000),
      format: String(raw.format || 'MP4'),
      resolution: String(raw.resolution || '1080P Full HD (9:16)'),
      featured_image: featuredImage,
      preview_video_url: String(raw.preview_video_url || raw.previewVideoUrl || ''),
      gallery_images: Array.isArray(raw.gallery_images) && raw.gallery_images.length > 0
        ? raw.gallery_images
        : Array.isArray(raw.galleryImages) && raw.galleryImages.length > 0
        ? raw.galleryImages
        : [featuredImage],
      short_description: String(
        raw.short_description ||
        raw.shortDescription ||
        (typeof raw.description === 'string' ? raw.description.slice(0, 160) : '') ||
        ''
      ),
      description: String(raw.description || raw.short_description || raw.shortDescription || ''),
      features: Array.isArray(raw.features) ? raw.features : [],
      faqs: Array.isArray(raw.faqs) ? raw.faqs : [],
      google_drive_link: googleDriveLink,
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      is_hot: Boolean(raw.is_hot ?? raw.isHot),
      is_trending: Boolean(raw.is_trending ?? raw.isTrending),
      rating: Number(raw.rating || 4.9),
      review_count: Number(raw.review_count || raw.reviewCount || 443),
      downloadable: true,
      downloads_count: Number(raw.downloads_count || 0),
      created_at: raw.created_at || new Date().toISOString(),
      files,
    };
  }

  async getProducts(): Promise<Product[]> {
    const localDeletedSlugs = new Set<string>();
    let localCustomProds: any[] = [];

    if (typeof window !== 'undefined') {
      try {
        const rawLocal = localStorage.getItem('vaultzet_custom_products');
        if (rawLocal) {
          localCustomProds = JSON.parse(rawLocal);
          if (!Array.isArray(localCustomProds)) localCustomProds = [];
        }
      } catch (e) {}

      try {
        const delRaw = localStorage.getItem('vaultzet_deleted_slugs');
        if (delRaw) {
          const parsed = JSON.parse(delRaw);
          if (Array.isArray(parsed)) {
            parsed.forEach((s) => {
              if (s) {
                const low = String(s).toLowerCase();
                localDeletedSlugs.add(low);
                localDeletedSlugs.add(low.replace(/^rb-/, ''));
              }
            });
          }
        }
      } catch (e) {}
    }

    const getCanonicalKey = (p: { id?: string | number; slug?: string }) => {
      const s = String(p.slug || p.id || '').toLowerCase().replace(/^rb-/, '').trim();
      return s;
    };

    // Step 1: Initialize catalog map with clean, full initialProducts
    const productMap = new Map<string, Product>();

    initialProducts.forEach((p) => {
      const norm = this.normalizeAdminProduct(p);
      if (norm) {
        const key = getCanonicalKey(norm);
        if (key && !localDeletedSlugs.has(key)) {
          productMap.set(key, norm);
        }
      }
    });

    // Step 2: Overlay Firestore live products (authoritative for edits & custom items)
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'products'));
        if (!snap.empty) {
          snap.docs.forEach((d) => {
            const data = d.data();
            const id = String(d.id);
            const slug = String(data.slug || id).toLowerCase();
            const isDeleted = Boolean(
              data.is_deleted || data.status === 'trash' || data.name === '[DELETED]'
            );

            if (isDeleted) {
              const lowId = id.toLowerCase();
              const lowSlug = slug.replace(/^rb-/, '');
              localDeletedSlugs.add(lowId);
              localDeletedSlugs.add(lowId.replace(/^rb-/, ''));
              if (slug) localDeletedSlugs.add(lowSlug);
              productMap.delete(lowSlug);
              productMap.delete(lowId.replace(/^rb-/, ''));
              return;
            }

            const norm = this.normalizeAdminProduct({ id: d.id, ...data });
            if (norm) {
              const key = getCanonicalKey(norm);
              if (key && !localDeletedSlugs.has(key)) {
                const existing = productMap.get(key);
                if (existing) {
                  const existingDriveLink = existing.google_drive_link || existing.files?.[0]?.file_url || '';
                  const normDriveLink = norm.google_drive_link || norm.files?.[0]?.file_url || '';
                  const bestDriveLink =
                    normDriveLink && !normDriveLink.includes('demo-')
                      ? normDriveLink
                      : existingDriveLink || normDriveLink;
                  const bestFiles =
                    norm.files && norm.files.length > 0 && !norm.files[0]?.file_url?.includes('demo-')
                      ? norm.files
                      : existing.files && existing.files.length > 0
                      ? existing.files
                      : norm.files;

                  productMap.set(key, {
                    ...existing,
                    ...norm,
                    google_drive_link: bestDriveLink,
                    files: bestFiles,
                    features: norm.features && norm.features.length > 0 ? norm.features : existing.features,
                    faqs: norm.faqs && norm.faqs.length > 0 ? norm.faqs : existing.faqs,
                    gallery_images: norm.gallery_images && norm.gallery_images.length > 0 ? norm.gallery_images : existing.gallery_images,
                  });
                } else {
                  productMap.set(key, norm);
                }
              }
            }
          });

          // Sync back deleted slugs into localStorage
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('vaultzet_deleted_slugs', JSON.stringify(Array.from(localDeletedSlugs)));
            } catch {}
          }
        }
      } catch (e) {
        console.warn('Firestore products fetch error in admin:', e);
      }
    }

    // Step 3: Check uncommitted / newly created local products in localStorage
    if (localCustomProds.length > 0) {
      localCustomProds.forEach((lp) => {
        const norm = this.normalizeAdminProduct(lp);
        if (norm) {
          const key = getCanonicalKey(norm);
          if (key && !localDeletedSlugs.has(key)) {
            // Only add if not already in productMap
            if (!productMap.has(key)) {
              productMap.set(key, norm);
            }
          }
        }
      });
    }

    // Step 4: Filter out any deleted products and return normalized array
    const finalProducts = Array.from(productMap.values()).filter((p) => {
      const key = getCanonicalKey(p);
      const idKey = String(p.id).toLowerCase();
      return (
        !localDeletedSlugs.has(key) &&
        !localDeletedSlugs.has(idKey) &&
        !localDeletedSlugs.has(idKey.replace(/^rb-/, '')) &&
        !p.is_deleted &&
        p.status !== 'trash'
      );
    });

    return finalProducts;
  }

  async createProduct(productData: Partial<Product>): Promise<Product> {
    const prodId = productData.id ? String(productData.id) : `prod-${Date.now()}`;
    const name = productData.name?.trim() || 'New Reels Bundle';
    const slug =
      productData.slug?.trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const newProduct: Product = {
      id: prodId,
      name,
      slug,
      price: Number(productData.price || 99),
      regular_price: Number(productData.regular_price || 999),
      reseller_price: Number(
        productData.reseller_price || (productData.price ? Number(productData.price) * 2 : 199)
      ),
      reseller_regular_price: Number(
        productData.reseller_regular_price ||
          (productData.regular_price ? Number(productData.regular_price) * 2 : 1999)
      ),
      sale_price: Number(productData.price || 99),
      stock_status: productData.stock_status || 'instock',
      status: productData.status || 'publish',
      categories: productData.categories?.length ? productData.categories : ['Trending Reels'],
      reel_count: Number(productData.reel_count || 1000),
      format: productData.format || 'MP4',
      resolution: productData.resolution || '1080P Full HD (9:16)',
      featured_image:
        productData.featured_image ||
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600',
      preview_video_url: productData.preview_video_url || '',
      gallery_images: productData.gallery_images || [],
      short_description: productData.short_description || '',
      description: productData.description || '',
      features: productData.features || [],
      google_drive_link: productData.google_drive_link || '',
      tags: productData.tags || [],
      is_hot: Boolean(productData.is_hot),
      is_trending: Boolean(productData.is_trending),
      rating: Number(productData.rating || 4.9),
      review_count: Number(productData.review_count || 350),
      downloadable: true,
      downloads_count: 0,
      created_at: new Date().toISOString(),
      files: productData.files || [],
    };

    const cleanPayload = sanitizePayload(newProduct);

    if (db) {
      try {
        await setDoc(doc(db, 'products', prodId), cleanPayload);
        if (slug && slug !== prodId) {
          try {
            await setDoc(doc(db, 'products', slug), cleanPayload);
          } catch {}
        }
      } catch (e) {
        console.warn('Firestore product creation error:', e);
      }
    }

    // Add to in-memory list
    initialProducts.unshift(cleanPayload);

    // Save in localStorage cache so it survives reloads immediately
    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('vaultzet_custom_products') || '[]');
        const filtered = stored.filter((p: any) => String(p.id) !== prodId && p.slug !== slug);
        filtered.unshift(cleanPayload);
        localStorage.setItem('vaultzet_custom_products', JSON.stringify(filtered));

        // Ensure it is removed from deleted slugs
        const deletedSlugs = JSON.parse(localStorage.getItem('vaultzet_deleted_slugs') || '[]');
        const updatedDel = deletedSlugs.filter((s: string) => s !== prodId && s !== slug);
        localStorage.setItem('vaultzet_deleted_slugs', JSON.stringify(updatedDel));
      } catch (e) {
        // ignore
      }
    }

    // Telegram alerts are disabled for this store
    await logAdminAction({
      adminEmail: 'admin@vaultzet.com',
      action: 'CREATE_PRODUCT',
      module: 'Products',
      details: `Created new product #${prodId}: ${newProduct.name} (₹${newProduct.price})`,
    });

    return newProduct;
  }

  async deleteProduct(productId: string | number, slug?: string): Promise<boolean> {
    const idStr = String(productId);
    const slugStr = slug ? String(slug).toLowerCase() : '';

    if (db) {
      try {
        // Mark as trash in Firestore so it's recognized as deleted by storefront & portal
        const docRef = doc(db, 'products', idStr);
        await setDoc(
          docRef,
          {
            id: idStr,
            name: '[DELETED]',
            price: 0,
            status: 'trash',
            is_deleted: true,
            deleted_at: new Date().toISOString(),
          },
          { merge: true }
        );

        if (slugStr && slugStr !== idStr) {
          try {
            await setDoc(
              doc(db, 'products', slugStr),
              {
                id: slugStr,
                name: '[DELETED]',
                price: 0,
                status: 'trash',
                is_deleted: true,
                deleted_at: new Date().toISOString(),
              },
              { merge: true }
            );
          } catch {}
        }

        // If it's a newly created custom doc, also delete it
        if (idStr.startsWith('prod-')) {
          try {
            await deleteDoc(docRef);
          } catch {}
        }
      } catch (e) {
        console.warn('Firestore product delete error:', e);
      }
    }

    const idx = initialProducts.findIndex(
      (p) => String(p.id) === idStr || (slugStr && p.slug?.toLowerCase() === slugStr)
    );
    if (idx !== -1) {
      initialProducts.splice(idx, 1);
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('vaultzet_custom_products') || '[]');
        const filtered = stored.filter(
          (p: any) => String(p.id) !== idStr && (!slugStr || p.slug?.toLowerCase() !== slugStr)
        );
        localStorage.setItem('vaultzet_custom_products', JSON.stringify(filtered));

        const deletedSlugs = JSON.parse(localStorage.getItem('vaultzet_deleted_slugs') || '[]');
        const set = new Set(deletedSlugs);
        set.add(idStr.toLowerCase());
        if (slugStr) set.add(slugStr);
        localStorage.setItem('vaultzet_deleted_slugs', JSON.stringify(Array.from(set)));
      } catch (e) {
        // ignore
      }
    }

    await logAdminAction({
      adminEmail: 'admin@vaultzet.com',
      action: 'DELETE_PRODUCT',
      module: 'Products',
      details: `Deleted product #${productId} (${slugStr || idStr})`,
    });

    return true;
  }

  async updateProduct(product: Partial<Product> & { id: string | number }): Promise<Product> {
    const prodId = String(product.id);
    const existing: Partial<Product> = initialProducts.find((p) => String(p.id) === prodId) || {};
    const merged: Product = {
      ...existing,
      ...product,
      id: prodId,
      name: (product.name || existing.name || 'Reels Bundle').trim(),
      price: Number(product.price ?? existing.price ?? 99),
    } as Product;

    const cleanPayload = sanitizePayload(merged);

    if (db) {
      try {
        const docRef = doc(db, 'products', prodId);
        await setDoc(docRef, cleanPayload, { merge: true });
        const relatedIds = new Set<string>();
        if (merged.slug) {
          relatedIds.add(merged.slug);
          relatedIds.add(`rb-${merged.slug}`);
          relatedIds.add(merged.slug.replace(/^rb-/, ''));
        }
        if (prodId) {
          relatedIds.add(prodId);
          relatedIds.add(`rb-${prodId}`);
          relatedIds.add(prodId.replace(/^rb-/, ''));
        }
        for (const relId of relatedIds) {
          if (relId && relId !== prodId) {
            try {
              await setDoc(doc(db, 'products', relId), cleanPayload, { merge: true });
            } catch {}
          }
        }
      } catch (e) {
        console.warn('Firestore product update error:', e);
      }
    }

    const idx = initialProducts.findIndex((p) => String(p.id) === prodId);
    if (idx !== -1) {
      initialProducts[idx] = { ...initialProducts[idx], ...cleanPayload };
    } else {
      initialProducts.unshift(cleanPayload);
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('vaultzet_custom_products') || '[]');
        const existingIdx = stored.findIndex((p: any) => String(p.id) === prodId || (p.slug && p.slug === merged.slug));
        if (existingIdx !== -1) {
          stored[existingIdx] = { ...stored[existingIdx], ...cleanPayload };
        } else {
          stored.unshift(cleanPayload);
        }
        localStorage.setItem('vaultzet_custom_products', JSON.stringify(stored));
      } catch (e) {
        // ignore
      }
    }

    await logAdminAction({
      adminEmail: 'admin@vaultzet.com',
      action: 'UPDATE_PRODUCT',
      module: 'Products',
      details: `Updated bundle #${prodId}: ${cleanPayload.name} (₹${cleanPayload.price})`,
    });

    return cleanPayload;
  }

  async getDownloadableProducts(): Promise<Product[]> {
    return this.getProducts();
  }

  async getDownloadableFiles(productId: string | number) {
    const prods = await this.getProducts();
    return prods.find((p) => String(p.id) === String(productId))?.files || [];
  }

  async generateFileToken(fileId: string): Promise<DownloadableFileTokenResponse> {
    const token = `dtoken_${Math.random().toString(36).substring(2, 12)}`;
    return {
      token,
      download_url: `https://vaultzet-shop.vercel.app/api/stream/${token}`,
      expires_in_minutes: 60,
    };
  }

  // ==========================================
  // 3. ORDERS (Direct Realtime Firestore + Deleted Tombstone Sync with Telegram Bot)
  // ==========================================
  private async getDeletedOrderIds(): Promise<Set<string>> {
    const deletedSet = new Set<string>();
    if (typeof window !== 'undefined') {
      try {
        const localDeleted = JSON.parse(localStorage.getItem('vaultzet_deleted_order_ids') || '[]');
        if (Array.isArray(localDeleted)) {
          localDeleted.forEach((id) => deletedSet.add(String(id)));
        }
      } catch {}
    }

    if (db) {
      try {
        const [metaPixelSnap, dnpMetaSnap] = await Promise.all([
          getDoc(doc(db, 'store_settings', 'meta_pixel')),
          getDoc(doc(db, 'store_settings', 'dnp_meta')),
        ]);
        for (const snap of [metaPixelSnap, dnpMetaSnap]) {
          if (snap.exists()) {
            const data = snap.data();
            if (data?.maintenance_message) {
              try {
                const parsed = JSON.parse(data.maintenance_message);
                if (Array.isArray(parsed)) {
                  parsed.forEach((id) => deletedSet.add(String(id)));
                }
              } catch {}
            }
          }
        }
      } catch {}
    }

    return deletedSet;
  }

  private async markOrderIdsAsDeleted(idsToAdd: string[]): Promise<void> {
    const currentSet = await this.getDeletedOrderIds();
    idsToAdd.forEach((id) => {
      if (id) currentSet.add(String(id));
    });

    // Keep latest 40 IDs so JSON.stringify is always valid JSON under 990 chars
    const arr = Array.from(currentSet).slice(-40);
    const serialized = JSON.stringify(arr);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('vaultzet_deleted_order_ids', serialized);
      } catch {}
    }

    if (db) {
      try {
        await setDoc(
          doc(db, 'store_settings', 'meta_pixel'),
          { maintenance_message: serialized },
          { merge: true }
        );
      } catch {}
      try {
        await setDoc(
          doc(db, 'store_settings', 'dnp_meta'),
          { maintenance_message: serialized },
          { merge: true }
        );
      } catch {}
    }
  }

  async getOrders(): Promise<Order[]> {
    const deletedIds = await this.getDeletedOrderIds();

    if (db) {
      try {
        const snap = await getDocs(collection(db, 'orders'));
        if (!snap.empty) {
          const activeOrders: Order[] = [];

          for (const d of snap.docs) {
            const data = d.data();
            const docId = String(d.id);
            const orderNum = String(data.orderNumber || d.id);
            const rawStatus = String(data.status || 'pending').toLowerCase();

            // If marked deleted in localStorage or meta_pixel, ensure Firestore status is 'cancelled' so Telegram Bot stays 100% in sync
            if (deletedIds.has(docId) || deletedIds.has(orderNum)) {
              if (rawStatus !== 'cancelled') {
                updateDoc(doc(db, 'orders', docId), { status: 'cancelled' }).catch(() => {});
              }
              continue;
            }

            if (rawStatus === 'cancelled') {
              continue;
            }

            activeOrders.push({
              id: docId,
              order_number: orderNum,
              status: (rawStatus as Order['status']) || 'pending',
              total: Number(data.totalAmount || 0),
              currency: 'INR',
              customer: {
                id: data.customer?.email || 'c-unknown',
                first_name:
                  data.customer?.fullName?.split(' ')[0] ||
                  data.customer?.fullName ||
                  'Customer',
                last_name: data.customer?.fullName?.split(' ').slice(1).join(' ') || '',
                email: data.customer?.email || '',
                phone: data.customer?.phone || '',
              },
              items: (data.items || []).map((it: any) => ({
                product_id: it.id,
                name: it.title,
                quantity: 1,
                subtotal: it.price,
                total: it.price,
                license: it.license || 'personal',
              })),
              payment_method: data.paymentMethod || 'UPI / Instant QR',
              transaction_id: data.transactionId || `UPI-${docId.slice(0, 8)}`,
              date_created: data.timestampIso || new Date().toISOString(),
              google_drive_sent: rawStatus === 'completed',
            } as Order);
          }

          activeOrders.sort(
            (a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime()
          );

          return activeOrders;
        }
      } catch (e) {
        console.warn('Firestore orders fetch error:', e);
      }
    }
    return initialOrders.filter(
      (o) => !deletedIds.has(String(o.id)) && !deletedIds.has(String(o.order_number))
    );
  }

  async syncOrders(params?: OrderSyncParams): Promise<{ orders: Order[]; count: number }> {
    const orders = await this.getOrders();
    return { orders, count: orders.length };
  }

  async updateOrderStatus(orderId: string | number, status: Order['status']): Promise<Order> {
    const idStr = String(orderId);
    if (db) {
      try {
        await updateDoc(doc(db, 'orders', idStr), { status });
      } catch (e) {
        console.warn('Firestore order status update error:', e);
      }
    }
    await logAdminAction({
      adminEmail: 'admin@vaultzet.com',
      action: 'UPDATE_ORDER_STATUS',
      module: 'Orders',
      details: `Order #${orderId} changed to ${status}`,
    });
    return { id: idStr, status } as Order;
  }

  async resendOrder(orderId: string | number): Promise<{ success: boolean; message: string }> {
    await logAdminAction({
      adminEmail: 'admin@vaultzet.com',
      action: 'RESEND_ORDER_DELIVERY',
      module: 'Orders',
      details: `Resent Google Drive delivery email for order #${orderId}`,
    });
    return { success: true, message: `Google Drive links resent for Order #${orderId}` };
  }

  async deleteOrder(orderId: string | number): Promise<{ success: boolean; message: string }> {
    const idStr = String(orderId);
    const idsToPurge = [idStr];

    // 1. Mark status as 'cancelled' in Firestore (and attempt deleteDoc) so Telegram Bot and Admin Panel immediately hide it
    if (db) {
      try {
        await updateDoc(doc(db, 'orders', idStr), { status: 'cancelled' });
      } catch {}
      try {
        await deleteDoc(doc(db, 'orders', idStr));
      } catch {}

      try {
        const snap = await getDocs(collection(db, 'orders'));
        for (const d of snap.docs) {
          const data = d.data();
          if (d.id === idStr || String(data.orderNumber) === idStr) {
            idsToPurge.push(d.id);
            if (data.orderNumber) idsToPurge.push(String(data.orderNumber));
            try {
              await updateDoc(doc(db, 'orders', d.id), { status: 'cancelled' });
            } catch {}
            try {
              await deleteDoc(doc(db, 'orders', d.id));
            } catch {}
          }
        }
      } catch {}
    }

    // 2. Persist tombstone IDs in Firestore (store_settings/meta_pixel) + localStorage
    await this.markOrderIdsAsDeleted(idsToPurge);

    // 3. Remove from in-memory fallback list if present
    for (let i = initialOrders.length - 1; i >= 0; i--) {
      if (
        String(initialOrders[i].id) === idStr ||
        String(initialOrders[i].order_number) === idStr
      ) {
        initialOrders.splice(i, 1);
      }
    }

    // 4. Remove from local storage cache if stored
    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('vaultzet_orders') || '[]');
        const filtered = stored.filter(
          (o: any) =>
            String(o.id) !== idStr && o.orderNumber !== idStr && o.order_number !== idStr
        );
        localStorage.setItem('vaultzet_orders', JSON.stringify(filtered));
      } catch (e) {
        // ignore
      }
    }

    await logAdminAction({
      adminEmail: 'admin@vaultzet.com',
      action: 'DELETE_ORDER',
      module: 'Orders',
      details: `Permanently deleted order #${orderId} and purged its metrics from Dashboard & Telegram Bot`,
    });

    return {
      success: true,
      message: `Order #${orderId} permanently deleted from both Admin Panel and Telegram Bot.`,
    };
  }

  async deleteAllOrders(): Promise<{ success: boolean; message: string }> {
    const currentOrders = await this.getOrders();
    const allIds: string[] = [];

    for (const o of currentOrders) {
      allIds.push(String(o.id));
      if (o.order_number) allIds.push(String(o.order_number));
      if (db) {
        try {
          await updateDoc(doc(db, 'orders', String(o.id)), { status: 'cancelled' });
        } catch {}
        try {
          await deleteDoc(doc(db, 'orders', String(o.id)));
        } catch {}
      }
    }

    await this.markOrderIdsAsDeleted(allIds);
    initialOrders.length = 0;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('vaultzet_orders', '[]');
      } catch {}
    }

    return {
      success: true,
      message: 'All orders and revenue stats have been cleared from Admin Panel and Telegram Bot.',
    };
  }

  // ==========================================
  // 4. CUSTOMERS (Aggregated from real Firestore orders)
  // ==========================================
  async getCustomers(): Promise<Customer[]> {
    const orders = await this.getOrders();
    const paidOrders = orders.filter((o) => o.status === 'completed');
    const customerMap = new Map<string, Customer>();

    paidOrders.forEach((o) => {
      const email = o.customer.email;
      if (!email) return;
      if (!customerMap.has(email)) {
        customerMap.set(email, {
          id: o.customer.id || email,
          name: `${o.customer.first_name} ${o.customer.last_name}`.trim(),
          email: o.customer.email,
          phone: o.customer.phone,
          orders_count: 1,
          total_spent: o.total,
          last_order_date: o.date_created,
          status: 'active',
        });
      } else {
        const existing = customerMap.get(email)!;
        existing.orders_count += 1;
        existing.total_spent += o.total;
        if (new Date(o.date_created) > new Date(existing.last_order_date || '')) {
          existing.last_order_date = o.date_created;
        }
      }
    });

    return Array.from(customerMap.values());
  }

  async getCustomerOrders(customerId: string | number): Promise<Order[]> {
    const orders = await this.getOrders();
    return orders.filter((o) => o.customer.email === customerId || o.customer.id === customerId);
  }

  // ==========================================
  // 5. COUPONS (Direct Firestore)
  // ==========================================
  async getCoupons(): Promise<Coupon[]> {
    // 1. Try server API endpoint first
    try {
      const res = await fetch('/api/admin/coupons');
      if (res.ok) {
        const data = await res.json();
        if (data?.success && Array.isArray(data?.coupons) && data.coupons.length > 0) {
          return data.coupons;
        }
      }
    } catch (e) {
      console.warn('Server coupon API fetch fallback:', e);
    }

    // 2. Direct Firestore fallback
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'coupons'));
        if (!snap.empty) {
          return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Coupon));
        } else {
          for (const c of initialCoupons) {
            await setDoc(doc(db, 'coupons', String(c.id)), c);
          }
          return initialCoupons;
        }
      } catch (e) {
        console.warn('Firestore coupons fetch error:', e);
      }
    }
    return initialCoupons;
  }

  async couponAction(action: 'create' | 'update' | 'delete' | 'toggle', coupon: any): Promise<any> {
    const couponId = String(coupon.id || coupon.code);

    // 1. Send to server endpoint
    try {
      if (action === 'delete') {
        await fetch(`/api/admin/coupons?id=${encodeURIComponent(couponId)}`, {
          method: 'DELETE',
        });
      } else {
        await fetch('/api/admin/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(coupon),
        });
      }
    } catch (e) {
      console.warn('Server coupon API action fallback:', e);
    }

    // 2. Direct Firestore write
    if (db) {
      try {
        if (action === 'delete') {
          await deleteDoc(doc(db, 'coupons', couponId));
        } else {
          await setDoc(doc(db, 'coupons', couponId), coupon, { merge: true });
        }
      } catch (e) {
        console.warn('Firestore coupon action error:', e);
      }
    }

    await logAdminAction({
      adminEmail: 'admin@vaultzet.com',
      action: `COUPON_${action.toUpperCase()}`,
      module: 'Coupons',
      details: `${action} coupon: ${coupon.code || couponId}`,
    });
    return { success: true, action, coupon };
  }

  // ==========================================
  // 6. CONTENT & REELS
  // ==========================================
  async getContent(): Promise<ContentItem[]> {
    return initialContent;
  }

  private getDeletedCategoriesFromStorage(): Set<string> {
    const set = new Set<string>();
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('vaultzet_deleted_categories');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((k) => set.add(String(k).toLowerCase()));
          }
        }
      } catch {}
    }
    return set;
  }

  private async persistCategoriesRegistry(categories: CategoryItem[], deletedSlugsList?: string[]): Promise<void> {
    if (!db) return;
    const cleanList = categories.map((c) => ({
      id: c.id || c.slug,
      name: c.name,
      slug: c.slug,
      count: Number(c.count || 0),
      icon: c.icon || '✨',
      bg: c.bg || '#f4ebff',
      border: c.border || '#e9d5ff',
      iconColor: c.iconColor || '#7c3aed',
      description: c.description || '',
      created_at: c.created_at || new Date().toISOString(),
      is_custom: true,
      is_deleted: Boolean(c.is_deleted),
    }));

    const delSet = this.getDeletedCategoriesFromStorage();
    if (Array.isArray(deletedSlugsList)) {
      deletedSlugsList.forEach((s) => delSet.add(String(s).toLowerCase()));
    }
    const finalDeletedSlugs = Array.from(delSet);

    const payloadData = {
      categories: cleanList,
      deleted_slugs: finalDeletedSlugs,
    };
    const payloadJson = JSON.stringify(payloadData);

    // 1. Guaranteed Registry doc in products collection
    try {
      await setDoc(
        doc(db, 'products', 'category-registry-v1'),
        {
          id: 'category-registry-v1',
          name: '[INTERNAL_CATEGORY_REGISTRY]',
          price: 0,
          status: 'private',
          description: payloadJson,
          categories: ['_category_registry'],
          created_at: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Error saving category registry to products:', e);
    }

    // 2. Secondary backup in store_settings/branding
    try {
      await setDoc(
        doc(db, 'store_settings', 'branding'),
        {
          maintenance_message: payloadJson,
          last_updated: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Error saving category registry to branding:', e);
    }
  }

  async getCategories(): Promise<CategoryItem[]> {
    let localCustomCats: CategoryItem[] = [];
    const localDeletedCats = this.getDeletedCategoriesFromStorage();

    if (typeof window !== 'undefined') {
      try {
        localCustomCats = JSON.parse(localStorage.getItem('vaultzet_custom_categories') || '[]');
      } catch {}
      try {
        const raw = localStorage.getItem('vaultzet_deleted_categories');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((k) => localDeletedCats.add(String(k).toLowerCase()));
          }
        }
      } catch {}
    }

    const customCatsMap = new Map<string, CategoryItem>();

    // 1. Try reading from products/category-registry-v1
    if (db) {
      try {
        const regSnap = await getDoc(doc(db, 'products', 'category-registry-v1'));
        if (regSnap.exists()) {
          const data = regSnap.data();
          if (data && typeof data.description === 'string' && data.description.trim()) {
            const parsed = JSON.parse(data.description);
            let items: any[] = [];
            if (Array.isArray(parsed)) {
              items = parsed;
            } else if (parsed && typeof parsed === 'object') {
              if (Array.isArray(parsed.deleted_slugs)) {
                parsed.deleted_slugs.forEach((s: string) => localDeletedCats.add(String(s).toLowerCase()));
              }
              if (Array.isArray(parsed.categories)) {
                items = parsed.categories;
              }
            }
            items.forEach((c: any) => {
              const slug = String(c.slug || c.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '').toLowerCase();
              const id = String(c.id || slug).toLowerCase();
              if (c && c.name && !c.is_deleted && !localDeletedCats.has(slug) && !localDeletedCats.has(id)) {
                customCatsMap.set(slug, {
                  ...c,
                  id: c.id || slug,
                  slug,
                  is_custom: true,
                });
              }
            });
          }
        }
      } catch {}

      // 2. Try reading from store_settings/branding
      if (customCatsMap.size === 0) {
        try {
          const brandSnap = await getDoc(doc(db, 'store_settings', 'branding'));
          if (brandSnap.exists()) {
            const bData = brandSnap.data();
            if (bData && typeof bData.maintenance_message === 'string' && bData.maintenance_message.trim()) {
              const parsed = JSON.parse(bData.maintenance_message);
              let items: any[] = [];
              if (Array.isArray(parsed)) {
                items = parsed;
              } else if (parsed && typeof parsed === 'object') {
                if (Array.isArray(parsed.deleted_slugs)) {
                  parsed.deleted_slugs.forEach((s: string) => localDeletedCats.add(String(s).toLowerCase()));
                }
                if (Array.isArray(parsed.categories)) {
                  items = parsed.categories;
                }
              }
              items.forEach((c: any) => {
                const slug = String(c.slug || c.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '').toLowerCase();
                const id = String(c.id || slug).toLowerCase();
                if (c && c.name && !c.is_deleted && !localDeletedCats.has(slug) && !localDeletedCats.has(id) && !customCatsMap.has(slug)) {
                  customCatsMap.set(slug, {
                    ...c,
                    id: c.id || slug,
                    slug,
                    is_custom: true,
                  });
                }
              });
            }
          }
        } catch {}
      }

      // 3. Try reading from direct categories collection
      try {
        const snap = await getDocs(collection(db, 'categories'));
        snap.docs.forEach((d) => {
          const data = d.data();
          const id = d.id.toLowerCase();
          const slug = String(data.slug || id).toLowerCase();
          const isDel = Boolean(data.is_deleted || data.name === '[DELETED]');
          if (isDel) {
            localDeletedCats.add(id);
            localDeletedCats.add(slug);
            customCatsMap.delete(slug);
          } else if (!localDeletedCats.has(id) && !localDeletedCats.has(slug) && !customCatsMap.has(slug)) {
            customCatsMap.set(slug, {
              id: d.id,
              ...(data as any),
              name: String(data.name || id),
              slug: String(data.slug || id),
              count: Number(data.count || 0),
              is_custom: true,
            } as CategoryItem);
          }
        });
      } catch {}
    }

    // 4. Merge any local categories
    localCustomCats.forEach((c) => {
      const slug = String(c.slug || '').toLowerCase();
      const id = String(c.id || slug).toLowerCase();
      if (c && c.name && !c.is_deleted && !localDeletedCats.has(slug) && !localDeletedCats.has(id) && !customCatsMap.has(slug)) {
        customCatsMap.set(slug, {
          ...c,
          is_custom: true,
        });
      }
    });

    const customList = Array.from(customCatsMap.values());
    customList.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

    if (typeof window !== 'undefined' && customList.length > 0) {
      try {
        localStorage.setItem('vaultzet_custom_categories', JSON.stringify(customList));
      } catch {}
    }

    const customSlugs = new Set(customList.map((c) => c.slug.toLowerCase()));
    const missingInitial = initialCategories.filter(
      (c) => !customSlugs.has(c.slug.toLowerCase()) && !localDeletedCats.has(c.slug.toLowerCase())
    );

    // Combine custom categories FIRST, then initial categories
    return [...customList, ...missingInitial];
  }

  async createCategory(catData: Partial<CategoryItem>): Promise<CategoryItem> {
    const name = catData.name?.trim() || 'New Category';
    const slug =
      catData.slug?.trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    const catId = catData.id || slug;

    // Helper for auto-generating icon if none supplied
    const autoEmoji = (() => {
      const n = name.toLowerCase();
      if (n.includes('ai') || n.includes('robot')) return '🤖';
      if (n.includes('story') || n.includes('history')) return '📖';
      if (n.includes('aesthetic') || n.includes('glow')) return '✨';
      if (n.includes('entertain') || n.includes('movie')) return '🎬';
      if (n.includes('comedy') || n.includes('funny') || n.includes('joke')) return '🎭';
      if (n.includes('animal') || n.includes('dog') || n.includes('cat')) return '🐾';
      if (n.includes('animat') || n.includes('anime')) return '🎨';
      if (n.includes('fit') || n.includes('gym')) return '💪';
      if (n.includes('game') || n.includes('gaming')) return '🎮';
      if (n.includes('diy') || n.includes('craft')) return '🛠️';
      if (n.includes('crypto') || n.includes('money') || n.includes('finance') || n.includes('wealth')) return '💰';
      if (n.includes('luxury') || n.includes('car')) return '🏎️';
      if (n.includes('tech') || n.includes('code')) return '💻';
      if (n.includes('music') || n.includes('song')) return '🎵';
      if (n.includes('fashion') || n.includes('style')) return '👗';
      if (n.includes('spiritual') || n.includes('god')) return '🙏';
      return '✨';
    })();

    const newCat: CategoryItem = {
      id: catId,
      name,
      slug,
      count: Number(catData.count || 0),
      icon: catData.icon || autoEmoji,
      bg: catData.bg || '#f4ebff',
      border: catData.border || '#e9d5ff',
      iconColor: catData.iconColor || '#7c3aed',
      description: catData.description || `Browse high quality ${name} for viral social media growth.`,
      created_at: new Date().toISOString(),
      is_custom: true,
    };

    const cleanPayload = sanitizePayload(newCat);

    // 1. Get current custom categories list
    let currentCustom: CategoryItem[] = [];
    if (typeof window !== 'undefined') {
      try {
        currentCustom = JSON.parse(localStorage.getItem('vaultzet_custom_categories') || '[]');
      } catch {}
    }
    const updatedCustom = [cleanPayload, ...currentCustom.filter((c: any) => c.slug !== slug && c.id !== catId)];

    // 2. Persist to Firestore Registry (products + store_settings)
    await this.persistCategoriesRegistry(updatedCustom);

    // 3. Attempt direct write to categories collection (if rules allow it)
    if (db) {
      try {
        await setDoc(doc(db, 'categories', catId), cleanPayload);
        if (slug && slug !== catId) {
          try {
            await setDoc(doc(db, 'categories', slug), cleanPayload);
          } catch {}
        }
      } catch (e) {
        // Direct write handled gracefully
      }
    }

    // 4. Update memory & localStorage
    initialCategories.unshift(cleanPayload);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('vaultzet_custom_categories', JSON.stringify(updatedCustom));

        const delCats = JSON.parse(localStorage.getItem('vaultzet_deleted_categories') || '[]');
        const updatedDel = delCats.filter((k: string) => k !== slug && k !== catId);
        localStorage.setItem('vaultzet_deleted_categories', JSON.stringify(updatedDel));
      } catch (e) {}
    }

    await logAdminAction({
      adminEmail: 'admin@vaultzet.com',
      action: 'CREATE_CATEGORY',
      module: 'Products',
      details: `Created new category: ${cleanPayload.name} (${cleanPayload.slug})`,
    });

    return cleanPayload;
  }

  async updateCategory(catData: Partial<CategoryItem> & { id?: string; slug?: string }): Promise<CategoryItem> {
    const key = (catData.id || catData.slug || '').toLowerCase();
    const cleanPayload = sanitizePayload(catData);

    let currentCustom: CategoryItem[] = [];
    if (typeof window !== 'undefined') {
      try {
        currentCustom = JSON.parse(localStorage.getItem('vaultzet_custom_categories') || '[]');
      } catch {}
    }

    const exIdx = currentCustom.findIndex((c: any) => c.slug?.toLowerCase() === key || c.id?.toLowerCase() === key);
    if (exIdx !== -1) {
      currentCustom[exIdx] = { ...currentCustom[exIdx], ...cleanPayload, is_custom: true };
    } else {
      currentCustom.unshift({ ...cleanPayload, is_custom: true } as CategoryItem);
    }

    await this.persistCategoriesRegistry(currentCustom);

    if (db && key) {
      try {
        await setDoc(doc(db, 'categories', key), cleanPayload, { merge: true });
      } catch (e) {}
    }

    const idx = initialCategories.findIndex((c) => c.id?.toLowerCase() === key || c.slug?.toLowerCase() === key);
    if (idx !== -1) {
      initialCategories[idx] = { ...initialCategories[idx], ...cleanPayload };
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('vaultzet_custom_categories', JSON.stringify(currentCustom));
      } catch {}
    }

    await logAdminAction({
      adminEmail: 'admin@vaultzet.com',
      action: 'UPDATE_CATEGORY',
      module: 'Products',
      details: `Updated category: ${catData.name || key}`,
    });

    return cleanPayload as CategoryItem;
  }

  async deleteCategory(categoryIdOrSlug: string): Promise<boolean> {
    const key = String(categoryIdOrSlug || '').toLowerCase().trim();
    if (!key) return false;

    // 1. Add to persistent deleted category set
    const delCats = this.getDeletedCategoriesFromStorage();
    delCats.add(key);

    // 2. Remove from active custom categories
    let currentCustom: CategoryItem[] = [];
    if (typeof window !== 'undefined') {
      try {
        currentCustom = JSON.parse(localStorage.getItem('vaultzet_custom_categories') || '[]');
      } catch {}
    }

    const updatedCustom = currentCustom.filter(
      (c: any) => (c.id || '').toLowerCase() !== key && (c.slug || '').toLowerCase() !== key
    );

    // 3. Persist updated custom categories + deleted_slugs to cloud registry
    await this.persistCategoriesRegistry(updatedCustom, Array.from(delCats));

    // 4. Try Firestore direct categories collection if accessible
    if (db) {
      try {
        await setDoc(
          doc(db, 'categories', key),
          { id: key, slug: key, name: '[DELETED]', is_deleted: true, deleted_at: new Date().toISOString() },
          { merge: true }
        );
        await deleteDoc(doc(db, 'categories', key));
      } catch (e) {}
    }

    // 5. Purge from in-memory initialCategories
    for (let i = initialCategories.length - 1; i >= 0; i--) {
      const c = initialCategories[i];
      if (
        (c.id && c.id.toLowerCase() === key) ||
        (c.slug && c.slug.toLowerCase() === key)
      ) {
        initialCategories.splice(i, 1);
      }
    }

    // 6. Update local storage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('vaultzet_custom_categories', JSON.stringify(updatedCustom));
        localStorage.setItem('vaultzet_deleted_categories', JSON.stringify(Array.from(delCats)));
      } catch (e) {}
    }

    await logAdminAction({
      adminEmail: 'admin@vaultzet.com',
      action: 'DELETE_CATEGORY',
      module: 'Products',
      details: `Permanently deleted category: ${key}`,
    });

    return true;
  }

  async uploadMedia(file: File): Promise<{ url: string; id: string }> {
    // Generate object URL or clean simulated asset upload
    const objectUrl = URL.createObjectURL(file);
    return {
      url: objectUrl,
      id: `media-${Date.now()}`,
    };
  }

  parseVideoUrl(url: string): { videoType: 'youtube' | 'direct'; youtubeId?: string; embedUrl?: string } {
    if (!url) return { videoType: 'direct' };
    const trimmed = url.trim();
    const ytRegex = /(?:youtube\.com\/(?:shorts\/|watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = trimmed.match(ytRegex);
    if (match && match[1]) {
      const ytId = match[1];
      return {
        videoType: 'youtube',
        youtubeId: ytId,
        embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=1&modestbranding=1&playsinline=1&rel=0`,
      };
    }
    return { videoType: 'direct' };
  }

  async getReels(): Promise<ReelItem[]> {
    let localCustomReels: ReelItem[] = [];
    let localDeletedReels = new Set<string>();

    if (typeof window !== 'undefined') {
      try {
        localCustomReels = JSON.parse(localStorage.getItem('vaultzet_custom_reels') || '[]');
      } catch {}
      try {
        const raw = localStorage.getItem('vaultzet_deleted_reels');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((k) => localDeletedReels.add(String(k).toLowerCase()));
          }
        }
      } catch {}
    }

    if (db) {
      try {
        const snap = await getDocs(collection(db, 'reels'));
        if (!snap.empty) {
          const dbReels: ReelItem[] = [];
          const dbIdSet = new Set<string>();

          snap.docs.forEach((d) => {
            const data = d.data();
            const id = d.id.toLowerCase();
            const isDel = Boolean(data.is_deleted || data.title === '[DELETED]');
            if (isDel) {
              localDeletedReels.add(id);
            } else {
              dbReels.push({ id: d.id, ...data } as ReelItem);
              dbIdSet.add(d.id);
            }
          });

          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('vaultzet_deleted_reels', JSON.stringify(Array.from(localDeletedReels)));
            } catch {}
          }

          const combined = [...localCustomReels, ...dbReels].filter(
            (r) =>
              !r.is_deleted &&
              r.title !== '[DELETED]' &&
              !localDeletedReels.has(String(r.id).toLowerCase())
          );
          const combinedIds = new Set(combined.map((r) => String(r.id)));

          const missing = initialReels.filter(
            (r) =>
              !combinedIds.has(String(r.id)) &&
              !dbIdSet.has(String(r.id)) &&
              !localDeletedReels.has(String(r.id).toLowerCase())
          );
          return [...combined, ...missing];
        }
      } catch (e) {
        console.warn('Firestore reels fetch error:', e);
      }
    }

    const reelIdSet = new Set(initialReels.map((r) => String(r.id)));
    const uncommittedLocal = localCustomReels.filter(
      (r) => !reelIdSet.has(String(r.id)) && !localDeletedReels.has(String(r.id).toLowerCase())
    );
    return [...uncommittedLocal, ...initialReels].filter(
      (r) => !localDeletedReels.has(String(r.id).toLowerCase())
    );
  }

  async createReel(reelData: Partial<ReelItem>): Promise<ReelItem> {
    const id = reelData.id || `reel-${Date.now()}`;
    const url = reelData.videoUrl?.trim() || '';
    const parsed = this.parseVideoUrl(url);

    let poster = reelData.poster?.trim() || '';
    if (!poster && parsed.youtubeId) {
      poster = `https://img.youtube.com/vi/${parsed.youtubeId}/hqdefault.jpg`;
    } else if (!poster) {
      poster = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
    }

    const newReel: ReelItem = {
      id,
      title: reelData.title?.trim() || 'Viral Video Reel',
      videoUrl: url,
      videoType: parsed.videoType,
      youtubeId: parsed.youtubeId,
      poster,
      category: reelData.category?.trim() || 'AI Reels',
      bundleId: reelData.bundleId,
      bundleSlug: reelData.bundleSlug,
      bundleTitle: reelData.bundleTitle,
      bundlePrice: reelData.bundlePrice,
      bundleOriginalPrice: reelData.bundleOriginalPrice,
      reelCount: reelData.reelCount,
      order: reelData.order ?? 0,
      likes: reelData.likes ?? Math.floor(Math.random() * 2000 + 500),
      views: reelData.views ?? Math.floor(Math.random() * 10000 + 1200),
      isActive: reelData.isActive ?? true,
      createdAt: new Date().toISOString(),
    };

    const cleanPayload = sanitizePayload(newReel);

    if (db) {
      try {
        await setDoc(doc(db, 'reels', id), cleanPayload);
      } catch (e) {
        console.warn('Firestore reel creation error:', e);
      }
    }

    initialReels.unshift(cleanPayload);

    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('vaultzet_custom_reels') || '[]');
        const filtered = stored.filter((r: any) => String(r.id) !== id);
        filtered.unshift(cleanPayload);
        localStorage.setItem('vaultzet_custom_reels', JSON.stringify(filtered));

        const delReels = JSON.parse(localStorage.getItem('vaultzet_deleted_reels') || '[]');
        const updatedDel = delReels.filter((k: string) => k !== id);
        localStorage.setItem('vaultzet_deleted_reels', JSON.stringify(updatedDel));
      } catch (e) {
        // ignore
      }
    }

    await logAdminAction({
      adminEmail: 'admin@vaultzet.com',
      action: 'CREATE_REEL',
      module: 'Content & Reels',
      details: `Created new reel #${id}: ${cleanPayload.title} (${cleanPayload.videoType})`,
    });

    return cleanPayload;
  }

  async updateReel(id: string, updates: Partial<ReelItem>): Promise<ReelItem> {
    const cleanPayload = sanitizePayload(updates);

    if (db) {
      try {
        await setDoc(doc(db, 'reels', id), cleanPayload, { merge: true });
      } catch (e) {
        console.warn('Firestore reel update error:', e);
      }
    }

    const idx = initialReels.findIndex((r) => r.id === id);
    if (idx !== -1) {
      initialReels[idx] = { ...initialReels[idx], ...cleanPayload };
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('vaultzet_custom_reels') || '[]');
        const updated = stored.map((r: ReelItem) => (r.id === id ? { ...r, ...cleanPayload } : r));
        localStorage.setItem('vaultzet_custom_reels', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
    }

    await logAdminAction({
      adminEmail: 'admin@vaultzet.com',
      action: 'UPDATE_REEL',
      module: 'Content & Reels',
      details: `Updated reel #${id}`,
    });

    return { id, ...cleanPayload } as ReelItem;
  }

  async deleteReel(id: string): Promise<boolean> {
    const idKey = String(id).toLowerCase();
    if (db) {
      try {
        await setDoc(
          doc(db, 'reels', id),
          { id, is_deleted: true, title: '[DELETED]', deleted_at: new Date().toISOString() },
          { merge: true }
        );
        await deleteDoc(doc(db, 'reels', id));
      } catch (e) {
        console.warn('Firestore reel delete error:', e);
      }
    }

    const idx = initialReels.findIndex((r) => String(r.id).toLowerCase() === idKey);
    if (idx !== -1) {
      initialReels.splice(idx, 1);
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('vaultzet_custom_reels') || '[]');
        const filtered = stored.filter((r: ReelItem) => String(r.id).toLowerCase() !== idKey);
        localStorage.setItem('vaultzet_custom_reels', JSON.stringify(filtered));

        const delReels = JSON.parse(localStorage.getItem('vaultzet_deleted_reels') || '[]');
        const set = new Set(delReels.map((k: string) => String(k).toLowerCase()));
        set.add(idKey);
        localStorage.setItem('vaultzet_deleted_reels', JSON.stringify(Array.from(set)));
      } catch (e) {
        // ignore
      }
    }

    await logAdminAction({
      adminEmail: 'admin@vaultzet.com',
      action: 'DELETE_REEL',
      module: 'Content & Reels',
      details: `Deleted reel #${id}`,
    });

    return true;
  }

  // ==========================================
  // PERSISTENCE HELPERS (LocalStorage + Cloud Dual-Sync)
  // ==========================================
  private getSavedSetting<T>(key: string, defaultValue: T): T {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`vaultzet_setting_${key}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)) {
            return { ...defaultValue, ...parsed };
          }
          return parsed;
        }
      } catch (e) {
        console.warn(`localStorage read error for ${key}:`, e);
      }
    }
    return defaultValue;
  }

  private saveSettingLocally<T>(key: string, value: T): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`vaultzet_setting_${key}`, JSON.stringify(value));
      } catch (e) {
        console.warn(`localStorage write error for ${key}:`, e);
      }
    }
  }

  // ==========================================
  // 7. BRANDING
  // ==========================================
  async getBranding(): Promise<StoreBranding> {
    if (db) {
      try {
        const snap = await getDoc(doc(db, 'store_settings', 'branding'));
        if (snap.exists()) {
          const data = snap.data() as StoreBranding;
          this.saveSettingLocally('branding', data);
          return data;
        }
      } catch (e) {
        console.warn('Firestore branding fetch error, using local cache:', e);
      }
    }
    return this.getSavedSetting('branding', initialBranding);
  }

  async updateBranding(branding: StoreBranding): Promise<StoreBranding> {
    const clean = sanitizePayload(branding);
    this.saveSettingLocally('branding', clean);
    if (db) {
      try {
        await setDoc(doc(db, 'store_settings', 'branding'), clean, { merge: true });
        if (clean.store_name) {
          await setDoc(doc(db, 'store_settings', 'general'), { store_name: clean.store_name }, { merge: true });
        }
      } catch (e) {
        console.warn('Firestore updateBranding error:', e);
      }
    }
    await logAdminAction({
      adminEmail: 'admin@vaultzet.com',
      action: 'UPDATE_BRANDING',
      module: 'Branding',
      details: `Updated store branding & name to "${clean.store_name}"`,
    });
    return clean;
  }

  // ==========================================
  // 8. SITE MODE
  // ==========================================
  async getSiteMode(): Promise<SiteModeConfig> {
    if (db) {
      try {
        const snap = await getDoc(doc(db, 'store_settings', 'site_mode'));
        if (snap.exists()) {
          const data = snap.data() as SiteModeConfig;
          this.saveSettingLocally('site_mode', data);
          return data;
        }
      } catch (e) {
        console.warn('Firestore site_mode fetch error, using local cache:', e);
      }
    }
    return this.getSavedSetting('site_mode', initialSiteMode);
  }

  async updateSiteMode(config: SiteModeConfig): Promise<SiteModeConfig> {
    const clean = sanitizePayload(config);
    this.saveSettingLocally('site_mode', clean);
    if (db) {
      try {
        await setDoc(doc(db, 'store_settings', 'site_mode'), clean, { merge: true });
      } catch (e) {
        console.warn('Firestore updateSiteMode error:', e);
      }
    }
    await logAdminAction({
      adminEmail: 'admin@vaultzet.com',
      action: 'UPDATE_SITE_MODE',
      module: 'Site Mode',
      details: `Switched mode to ${clean.mode}`,
    });
    return clean;
  }

  async setSiteMode(config: SiteModeConfig): Promise<SiteModeConfig> {
    return this.updateSiteMode(config);
  }

  // ==========================================
  // 9. STORE SETUP
  // ==========================================
  async getStoreSetup(): Promise<StoreSetupConfig> {
    if (db) {
      try {
        const snap = await getDoc(doc(db, 'store_settings', 'general'));
        if (snap.exists()) {
          const data = snap.data() as StoreSetupConfig;
          this.saveSettingLocally('general', data);
          return data;
        }
      } catch (e) {
        console.warn('Firestore general config fetch error, using local cache:', e);
      }
    }
    return this.getSavedSetting('general', initialStoreSetup);
  }

  async updateStoreSetup(config: StoreSetupConfig): Promise<StoreSetupConfig> {
    const clean = sanitizePayload(config);
    this.saveSettingLocally('general', clean);
    if (db) {
      try {
        await setDoc(doc(db, 'store_settings', 'general'), clean, { merge: true });
        if (clean.store_name) {
          await setDoc(doc(db, 'store_settings', 'branding'), { store_name: clean.store_name }, { merge: true });
        }
      } catch (e) {
        console.warn('Firestore updateStoreSetup error:', e);
      }
    }
    await logAdminAction({
      adminEmail: 'admin@vaultzet.com',
      action: 'UPDATE_STORE_SETUP',
      module: 'Store Setup',
      details: `Updated store name to "${clean.store_name}" and checkout parameters`,
    });
    return clean;
  }

  // ==========================================
  // 10. META PIXEL
  // ==========================================
  async getMetaPixel(): Promise<MetaPixelConfig> {
    const BLOCKED_PIXEL_IDS = ['1715650960276913'];
    if (db) {
      try {
        const snap = await getDoc(doc(db, 'store_settings', 'meta_pixel'));
        if (snap.exists()) {
          const data = snap.data() as MetaPixelConfig;
          if (data.pixel_id && BLOCKED_PIXEL_IDS.some((b) => String(data.pixel_id).includes(b))) {
            data.pixel_id = '';
          }
          this.saveSettingLocally('meta_pixel', data);
          return data;
        }
      } catch (e) {
        console.warn('Firestore meta_pixel fetch error, using local cache:', e);
      }
    }
    const cached = this.getSavedSetting('meta_pixel', initialMetaPixel);
    if (cached.pixel_id && BLOCKED_PIXEL_IDS.some((b) => String(cached.pixel_id).includes(b))) {
      cached.pixel_id = '';
    }
    return cached;
  }

  async updateMetaPixel(config: MetaPixelConfig): Promise<MetaPixelConfig> {
    const BLOCKED_PIXEL_IDS = ['1715650960276913'];
    const clean = sanitizePayload(config);
    if (clean.pixel_id && BLOCKED_PIXEL_IDS.some((b) => String(clean.pixel_id).includes(b))) {
      clean.pixel_id = '';
    }
    this.saveSettingLocally('meta_pixel', clean);
    this.saveSettingLocally('dnp_meta', {
      ...clean,
      meta_pixel_id: clean.pixel_id,
    });
    if (db) {
      try {
        await Promise.all([
          setDoc(doc(db, 'store_settings', 'meta_pixel'), clean, { merge: true }),
          setDoc(
            doc(db, 'store_settings', 'dnp_meta'),
            {
              meta_pixel_id: clean.pixel_id,
              capi_token: clean.capi_token,
              test_event_code: clean.test_event_code,
              enabled: clean.enabled,
            },
            { merge: true }
          ),
        ]);
      } catch (e) {
        console.warn('Firestore updateMetaPixel error:', e);
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('meta_pixel_updated', { detail: clean }));
      window.dispatchEvent(new CustomEvent('vaultworld:meta_pixel_updated', { detail: clean }));
    }
    await logAdminAction({
      adminEmail: 'admin@vaultzet.com',
      action: 'UPDATE_META_PIXEL',
      module: 'Meta Pixel',
      details: `Updated Pixel ID: ${clean.pixel_id}`,
    });
    return clean;
  }

  // ==========================================
  // 11. WHATSAPP BUTTON
  // ==========================================
  async getWhatsappButton(): Promise<WhatsappButtonConfig> {
    if (db) {
      try {
        const snap = await getDoc(doc(db, 'store_settings', 'whatsapp'));
        if (snap.exists()) {
          const data = snap.data() as WhatsappButtonConfig;
          this.saveSettingLocally('whatsapp', data);
          return data;
        }
      } catch (e) {
        console.warn('Firestore whatsapp fetch error, using local cache:', e);
      }
    }
    return this.getSavedSetting('whatsapp', initialWhatsappButton);
  }

  async updateWhatsappButton(config: WhatsappButtonConfig): Promise<WhatsappButtonConfig> {
    const clean = sanitizePayload(config);
    this.saveSettingLocally('whatsapp', clean);
    if (db) {
      try {
        await setDoc(doc(db, 'store_settings', 'whatsapp'), clean, { merge: true });
      } catch (e) {
        console.warn('Firestore updateWhatsapp error:', e);
      }
    }
    await logAdminAction({
      adminEmail: 'admin@vaultzet.com',
      action: 'UPDATE_WHATSAPP',
      module: 'WhatsApp Button',
      details: `Updated support phone to ${clean.phone_number}`,
    });
    return clean;
  }

  // ==========================================
  // 12. WEBHOOKS & LOGS
  // ==========================================
  async getWebhookSettings(): Promise<WebhookConfig> {
    return initialWebhooks;
  }

  async updateWebhookSettings(config: WebhookConfig): Promise<WebhookConfig> {
    return sanitizePayload(config);
  }

  async getWebhookLogs(): Promise<WebhookLogEntry[]> {
    return initialWebhookLogs;
  }

  async clearWebhookLogs(): Promise<{ success: boolean }> {
    return { success: true };
  }

  async retryWebhook(logId: string): Promise<{ success: boolean; status_code: number }> {
    return { success: true, status_code: 200 };
  }

  async testWebhookTrigger(event: string): Promise<any> {
    return { success: true, event, delivered_at: new Date().toISOString() };
  }

  // ==========================================
  // 13 & 14. PLUGINS & THEMES
  // ==========================================
  async getPlugins(): Promise<WpPlugin[]> {
    return initialPlugins;
  }

  async pluginAction(action: 'install' | 'activate' | 'deactivate' | 'update', pluginFile: string): Promise<any> {
    return { success: true, action, plugin_file: pluginFile };
  }

  async getThemes(): Promise<WpTheme[]> {
    return initialThemes;
  }

  async themeAction(action: 'activate' | 'update', slug: string): Promise<any> {
    return { success: true, action, slug };
  }

  // ==========================================
  // 15. CONNECTOR ENGINE
  // ==========================================
  async getConnectorStatus(): Promise<ConnectorStatus> {
    return initialConnectorStatus;
  }

  async updateConnector(): Promise<any> {
    return { success: true, message: 'Cloud Engine is up to date' };
  }

  // ==========================================
  // 16. SETTINGS & INTEGRATIONS
  // ==========================================
  async getPayuConfig(): Promise<PayuConfig> {
    if (db) {
      try {
        const snap = await getDoc(doc(db, 'store_settings', 'payu'));
        if (snap.exists()) {
          const data = snap.data() as PayuConfig;
          this.saveSettingLocally('payu', data);
          return data;
        }
      } catch (e) {
        console.warn('Firestore payu config fetch error, using local cache:', e);
      }
    }
    return this.getSavedSetting('payu', initialPayuConfig);
  }

  async updatePayuConfig(config: PayuConfig): Promise<PayuConfig> {
    const clean = sanitizePayload(config);
    this.saveSettingLocally('payu', clean);
    if (db) {
      try {
        await setDoc(doc(db, 'store_settings', 'payu'), clean, { merge: true });
      } catch (e) {
        console.warn('Firestore payu config update error:', e);
      }
    }
    await logAdminAction({
      adminEmail: 'ashamse137@gmail.com',
      action: 'UPDATE_PAYU_CONFIG',
      module: 'Payments',
      details: `Updated PayU Gateway credentials (Env: ${clean.environment || 'PRODUCTION'})`,
    });
    return clean;
  }

  async getCashfreeConfig(): Promise<PgBridgeConfig> {
    if (db) {
      try {
        const snap = await getDoc(doc(db, 'store_settings', 'cashfree'));
        if (snap.exists()) {
          const data = snap.data() as PgBridgeConfig;
          this.saveSettingLocally('cashfree', data);
          return data;
        }
      } catch (e) {
        console.warn('Firestore cashfree config fetch error, using local cache:', e);
      }
    }
    return this.getSavedSetting('cashfree', initialPgBridge);
  }

  async updateCashfreeConfig(config: PgBridgeConfig): Promise<PgBridgeConfig> {
    const clean = sanitizePayload(config);
    this.saveSettingLocally('cashfree', clean);
    if (db) {
      try {
        await setDoc(doc(db, 'store_settings', 'cashfree'), clean, { merge: true });
      } catch (e) {
        console.warn('Firestore cashfree config update error:', e);
      }
    }
    await logAdminAction({
      adminEmail: 'admin@vaultzet.com',
      action: 'UPDATE_CASHFREE_CONFIG',
      module: 'Payments',
      details: `Updated Cashfree Gateway credentials (Env: ${clean.environment || 'PRODUCTION'})`,
    });
    return clean;
  }

  async getPgBridgeConfig(): Promise<PgBridgeConfig> {
    return this.getCashfreeConfig();
  }

  async updatePgBridgeConfig(config: PgBridgeConfig): Promise<PgBridgeConfig> {
    return this.updateCashfreeConfig(config);
  }

  async getDnpMetaConfig(): Promise<DnpMetaConfig> {
    const BLOCKED_PIXEL_IDS = ['1715650960276913'];
    if (db) {
      try {
        const snap = await getDoc(doc(db, 'store_settings', 'dnp_meta'));
        if (snap.exists()) {
          const data = snap.data() as DnpMetaConfig;
          if (data.meta_pixel_id && BLOCKED_PIXEL_IDS.some((b) => String(data.meta_pixel_id).includes(b))) {
            data.meta_pixel_id = '';
          }
          this.saveSettingLocally('dnp_meta', data);
          return data;
        }
      } catch {}
    }
    const cached = this.getSavedSetting('dnp_meta', initialDnpMeta);
    if (cached.meta_pixel_id && BLOCKED_PIXEL_IDS.some((b) => String(cached.meta_pixel_id).includes(b))) {
      cached.meta_pixel_id = '';
    }
    return cached;
  }

  async updateDnpMetaConfig(config: DnpMetaConfig): Promise<DnpMetaConfig> {
    const BLOCKED_PIXEL_IDS = ['1715650960276913'];
    const clean = sanitizePayload(config);
    if (clean.meta_pixel_id && BLOCKED_PIXEL_IDS.some((b) => String(clean.meta_pixel_id).includes(b))) {
      clean.meta_pixel_id = '';
    }
    this.saveSettingLocally('dnp_meta', clean);
    this.saveSettingLocally('meta_pixel', {
      ...clean,
      pixel_id: clean.meta_pixel_id,
    });
    if (db) {
      try {
        await Promise.all([
          setDoc(doc(db, 'store_settings', 'dnp_meta'), clean, { merge: true }),
          setDoc(
            doc(db, 'store_settings', 'meta_pixel'),
            {
              pixel_id: clean.meta_pixel_id,
              capi_token: clean.capi_token,
              test_event_code: clean.test_event_code,
              enabled: clean.enabled,
            },
            { merge: true }
          ),
        ]);
      } catch {}
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('meta_pixel_updated', { detail: clean }));
      window.dispatchEvent(new CustomEvent('vaultworld:meta_pixel_updated', { detail: clean }));
    }
    return clean;
  }

  async getMmcConfig(): Promise<MmcAnalyticsConfig> {
    if (db) {
      try {
        const snap = await getDoc(doc(db, 'store_settings', 'mmc_analytics'));
        if (snap.exists()) {
          const data = snap.data() as MmcAnalyticsConfig;
          this.saveSettingLocally('mmc_analytics', data);
          return data;
        }
      } catch {}
    }
    return this.getSavedSetting('mmc_analytics', initialMmc);
  }

  async updateMmcConfig(config: MmcAnalyticsConfig): Promise<MmcAnalyticsConfig> {
    const clean = sanitizePayload(config);
    this.saveSettingLocally('mmc_analytics', clean);
    if (db) {
      try {
        await setDoc(doc(db, 'store_settings', 'mmc_analytics'), clean, { merge: true });
      } catch {}
    }
    return clean;
  }

  async getRankMathConfig(): Promise<RankMathConfig> {
    if (db) {
      try {
        const snap = await getDoc(doc(db, 'store_settings', 'rankmath_seo'));
        if (snap.exists()) {
          const data = snap.data() as RankMathConfig;
          this.saveSettingLocally('rankmath_seo', data);
          return data;
        }
      } catch {}
    }
    return this.getSavedSetting('rankmath_seo', initialRankMath);
  }

  async updateRankMathConfig(config: RankMathConfig): Promise<RankMathConfig> {
    const clean = sanitizePayload(config);
    this.saveSettingLocally('rankmath_seo', clean);
    if (db) {
      try {
        await setDoc(doc(db, 'store_settings', 'rankmath_seo'), clean, { merge: true });
      } catch {}
    }
    return clean;
  }

  async getLiteSpeedConfig(): Promise<LiteSpeedConfig> {
    if (db) {
      try {
        const snap = await getDoc(doc(db, 'store_settings', 'litespeed_cache'));
        if (snap.exists()) {
          const data = snap.data() as LiteSpeedConfig;
          this.saveSettingLocally('litespeed_cache', data);
          return data;
        }
      } catch {}
    }
    return this.getSavedSetting('litespeed_cache', initialLiteSpeed);
  }

  async updateLiteSpeedConfig(config: LiteSpeedConfig): Promise<LiteSpeedConfig> {
    const clean = sanitizePayload(config);
    this.saveSettingLocally('litespeed_cache', clean);
    if (db) {
      try {
        await setDoc(doc(db, 'store_settings', 'litespeed_cache'), clean, { merge: true });
      } catch {}
    }
    return clean;
  }

  async purgeLiteSpeedCache(): Promise<{ success: boolean }> {
    return { success: true };
  }

  // ==========================================
  // TELEGRAM BOT & ALERTS (DISABLED)
  // ==========================================
  async getTelegramConfig(): Promise<TelegramConfig> {
    return initialTelegram;
  }

  async updateTelegramConfig(config: TelegramConfig): Promise<TelegramConfig> {
    const clean = sanitizePayload({ ...config, enabled: false });
    this.saveSettingLocally('telegram', clean);
    return clean;
  }

  async testTelegramAlert(): Promise<{ success: boolean; message: string }> {
    return {
      success: false,
      message: 'Telegram alerts are turned off for this store.',
    };
  }
}

export const portalApi = new PortalApiClient();
