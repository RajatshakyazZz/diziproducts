import { NextResponse } from 'next/server';
import { getPayuCredentials, verifyPayuWebService } from '@/lib/payu';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import {
  sendSaleSuccessTelegramAlert,
  sendAbandonedOrPendingTelegramAlert,
} from '@/lib/telegram';
import { sendMetaCapiPurchase } from '@/lib/metaCapi';
import { extractClientMetadata, generateOrderToken } from '@/lib/orderToken';
import { recordSaleEarning, getResellerProfile, getResellerWallet } from '@/lib/resellerService';
import { sendResellerSaleTelegramAlert } from '@/lib/telegramReseller';

interface ResolvedProductFiles {
  primaryLink: string;
  files: Array<{ id?: string; name: string; file_url: string }>;
}

async function resolveDriveFilesForProduct(item: { id?: string; title?: string }): Promise<ResolvedProductFiles> {
  const cleanId = String(item.id || '').trim();

  if (db && cleanId) {
    try {
      const snap = await getDoc(doc(db, 'products', cleanId));
      if (snap.exists()) {
        const data = snap.data();
        const filesList: any[] = Array.isArray(data.files) && data.files.length > 0
          ? data.files
              .filter((f: any) => f && (f.file_url || f.url))
              .map((f: any, idx: number) => ({
                id: f.id || `file-${idx + 1}`,
                name: f.name || `Drive File ${idx + 1}`,
                file_url: f.file_url || f.url,
              }))
          : [];

        const primaryLink =
          filesList[0]?.file_url ||
          data.google_drive_link ||
          data.googleDriveLink ||
          '';

        if (filesList.length > 0 || (primaryLink && primaryLink.startsWith('http'))) {
          return {
            primaryLink: primaryLink || filesList[0]?.file_url,
            files:
              filesList.length > 0
                ? filesList
                : [{ name: `${item.title || 'Reels Bundle'} Google Drive Access`, file_url: primaryLink }],
          };
        }
      }
    } catch (e) {
      console.warn('Error reading product doc for drive link:', e);
    }
  }

  return {
    primaryLink: '',
    files: [],
  };
}

async function handleVerify(
  orderId: string,
  clientMeta?: {
    clientIp?: string;
    clientUserAgent?: string;
    fbp?: string;
    fbc?: string;
    token?: string;
  }
) {
  let storedOrder: any = null;
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'orders', orderId));
      if (snap.exists()) {
        storedOrder = snap.data();
      }
    } catch (e) {
      console.warn('Error reading stored order doc:', e);
    }
  }

  const validToken = generateOrderToken(orderId);
  const isAlreadyPaid = storedOrder?.status === 'completed';

  let isPaid = isAlreadyPaid;
  let paidAmount = Number(storedOrder?.totalAmount || 0);

  // If not already marked completed, check live with PayU WebService API
  if (!isPaid) {
    try {
      const creds = await getPayuCredentials();
      if (creds.key && creds.salt) {
        const payuCheck = await verifyPayuWebService({
          txnid: orderId,
          key: creds.key,
          salt: creds.salt,
          environment: creds.environment,
        });
        if (payuCheck.verified) {
          isPaid = true;
          paidAmount = payuCheck.amount || paidAmount;
        }
      }
    } catch (err) {
      console.warn('Could not verify order with PayU WebService:', err);
    }
  }

  const alertPayload = {
    orderNumber: orderId,
    customer: {
      fullName: storedOrder?.customer?.fullName || 'Customer',
      email: storedOrder?.customer?.email || '',
      phone: storedOrder?.customer?.phone || '',
    },
    items: storedOrder?.items || [],
    orderBump: storedOrder?.orderBump || null,
    totalAmount: Number(storedOrder?.totalAmount || paidAmount || 0),
    paymentStatus: isPaid ? 'PAID' : (storedOrder?.status?.toUpperCase() || 'INCOMPLETE'),
    paymentMethod: 'PayU UPI / Card',
  };

  if (isPaid) {
    const isFirstPaidTransition = storedOrder?.status !== 'completed';
    const isCapiDelivered = storedOrder?.purchase_event_status === 'delivered';
    const isClientFired = Boolean(storedOrder?.purchase_client_fired);

    let capiStatus = storedOrder?.purchase_event_status || 'pending';
    let capiSentAt = storedOrder?.purchase_event_sent_at || null;

    if (!isCapiDelivered) {
      try {
        const capiResult = await sendMetaCapiPurchase({
          orderId,
          totalAmount: Number(storedOrder?.totalAmount || paidAmount),
          currency: 'INR',
          items: storedOrder?.items || [],
          customer: storedOrder?.customer,
          clientIp: clientMeta?.clientIp,
          clientUserAgent: clientMeta?.clientUserAgent,
          fbp: clientMeta?.fbp,
          fbc: clientMeta?.fbc,
        });

        if (capiResult.success) {
          capiStatus = 'delivered';
          capiSentAt = new Date().toISOString();
        } else if (!capiResult.skipped) {
          capiStatus = 'failed';
        }
      } catch (capiErr) {
        console.error('[Meta CAPI] Error dispatching event during PayU verification:', capiErr);
      }
    }

    if (db) {
      try {
        const orderRef = doc(db, 'orders', orderId);
        const updatePayload: Record<string, any> = {
          status: 'completed',
          purchase_event_id: `purchase_${orderId}`,
          purchase_event_status: capiStatus,
          purchase_event_attempts: (storedOrder?.purchase_event_attempts || 0) + 1,
        };
        if (capiSentAt) {
          updatePayload.purchase_event_sent_at = capiSentAt;
        }
        if (storedOrder?.reseller_id) {
          updatePayload.earning_status = 'recorded';
        }
        await updateDoc(orderRef, updatePayload);
      } catch (err) {
        console.warn('Error updating Firestore order status in PayU verify:', err);
      }
    }

    if (storedOrder?.reseller_id) {
      const baseSnapshot = Number(storedOrder.base_price_snapshot || 0);
      const resaleSnapshot = Number(storedOrder.resale_price_snapshot || storedOrder.totalAmount || 0);
      const maxPossibleEarning = Math.max(0, resaleSnapshot - baseSnapshot);
      const safeEarning = Math.min(Number(storedOrder.reseller_earning || 0), maxPossibleEarning);

      if (safeEarning > 0) {
        try {
          await recordSaleEarning({
            orderId,
            resellerId: storedOrder.reseller_id,
            listingId: storedOrder.reseller_listing_id || '',
            amount: safeEarning,
            productTitle: storedOrder.items?.[0]?.title || 'Viral Reels Bundle',
            settleImmediately: true,
          });
        } catch (resellerErr) {
          console.error('[Reseller Attribution] Error recording earning in PayU verify-order:', resellerErr);
        }
      }
    }

    if (isFirstPaidTransition) {
      await sendSaleSuccessTelegramAlert(alertPayload);

      if (storedOrder?.reseller_id) {
        try {
          const profile = await getResellerProfile(storedOrder.reseller_id);
          const wallet = await getResellerWallet(storedOrder.reseller_id);
          await sendResellerSaleTelegramAlert({
            orderNumber: orderId,
            resellerId: storedOrder.reseller_id,
            resellerUid: profile?.resellerUid || storedOrder.reseller_uid || 'RSL-DIZI',
            resellerName: profile?.displayName || storedOrder.reseller_name || 'Reseller',
            resellerEmail: profile?.email || '',
            resellerPhone: profile?.phone || '',
            productTitle: storedOrder.items?.[0]?.title || 'Viral Reels Bundle',
            totalAmount: Number(storedOrder.totalAmount || paidAmount),
            basePrice: Number(storedOrder.base_price_snapshot || (Number(storedOrder.totalAmount || 0) - Number(storedOrder.reseller_earning || 0))),
            resellerEarning: Number(storedOrder.reseller_earning || 0),
            customer: alertPayload.customer,
            availableBalance: wallet?.availableBalance ?? Number(storedOrder.reseller_earning || 0),
            totalEarned: wallet?.totalEarned ?? Number(storedOrder.reseller_earning || 0),
          });
        } catch (resellerAlertErr) {
          console.warn('Error dispatching reseller sale Telegram alert:', resellerAlertErr);
        }
      }
    }

    const rawItems = storedOrder?.items && storedOrder.items.length > 0
      ? storedOrder.items
      : [{ id: 'bundle', title: 'Viral Reels Bundle', license: 'personal' }];

    const verifiedItems = await Promise.all(
      rawItems.map(async (it: any) => {
        const resolved = await resolveDriveFilesForProduct(it);
        return {
          id: it.id,
          title: it.title,
          license: it.license || 'personal',
          googleDriveLink: resolved.primaryLink,
          files: resolved.files,
        };
      })
    );

    return {
      success: true,
      paid: true,
      order_status: 'SUCCESS',
      order_amount: paidAmount,
      orderNumber: orderId,
      customer: storedOrder?.customer || { fullName: 'Customer', email: '' },
      items: verifiedItems,
      hasBump: Boolean(storedOrder?.orderBump),
      purchase_event_id: `purchase_${orderId}`,
      eligible_for_browser_event: !isClientFired,
      order_token: storedOrder?.order_token || validToken,
      reseller_id: storedOrder?.reseller_id || null,
      reseller_slug: storedOrder?.reseller_slug || null,
      reseller_name: storedOrder?.reseller_name || null,
    };
  } else {
    if (storedOrder?.status === 'pending') {
      await sendAbandonedOrPendingTelegramAlert(alertPayload, 'payment_abandoned');
    }
    return {
      success: false,
      paid: false,
      order_status: storedOrder?.status || 'INCOMPLETE',
      orderNumber: orderId,
      customer: storedOrder?.customer || { fullName: 'Customer', email: '' },
      items: [],
      hasBump: false,
      eligible_for_browser_event: false,
      order_token: validToken,
    };
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id') || searchParams.get('orderId');
    const token = searchParams.get('token');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'order_id parameter is required' },
        { status: 400 }
      );
    }

    const clientMeta = {
      ...extractClientMetadata(request),
      token: token || undefined,
    };

    const verification: any = await handleVerify(orderId, clientMeta);

    return NextResponse.json(verification);
  } catch (error: any) {
    console.error('Error verifying PayU order:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, orderId } = body;

    if (action === 'mark_client_fired' && orderId && db) {
      try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
          purchase_client_fired: true,
          purchase_client_fired_at: new Date().toISOString(),
        });
        return NextResponse.json({ success: true, marked: true });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
