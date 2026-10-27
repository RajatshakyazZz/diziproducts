import { NextResponse } from 'next/server';
import { getPayuCredentials, verifyPayuResponseHash } from '@/lib/payu';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import {
  sendSaleSuccessTelegramAlert,
  sendAbandonedOrPendingTelegramAlert,
} from '@/lib/telegram';
import { sendResellerSaleTelegramAlert } from '@/lib/telegramReseller';
import { getResellerProfile, getResellerWallet } from '@/lib/resellerService';
import { generateOrderToken } from '@/lib/orderToken';

async function handlePayuResponse(data: Record<string, any>, requestUrl: string) {
  const url = new URL(requestUrl);
  const isLocalhost = url.host.includes('localhost');
  const baseUrl = isLocalhost
    ? `${url.protocol}//${url.host}`
    : (process.env.NEXT_PUBLIC_SITE_URL || 'https://diziproducts.shop');

  const orderId = String(data.txnid || url.searchParams.get('order_id') || '').trim();
  const tokenParam = String(data.udf1 || url.searchParams.get('token') || '').trim();
  const resellerSlug = String(data.udf2 || url.searchParams.get('reseller_slug') || '').trim();

  if (!orderId) {
    return NextResponse.redirect(`${baseUrl}/checkout?error=missing_order_id`, 303);
  }

  const orderToken = tokenParam || generateOrderToken(orderId);
  const creds = await getPayuCredentials();

  // Verify reverse hash from PayU
  const isHashValid = verifyPayuResponseHash(data, creds.salt);
  const status = String(data.status || '').toLowerCase();
  const isSuccess = isHashValid && status === 'success';

  let storedOrder: any = null;
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'orders', orderId));
      if (snap.exists()) {
        storedOrder = snap.data();
      }
    } catch (e) {
      console.warn('Could not read order doc for PayU return:', e);
    }
  }

  const expectedAmount = Number(storedOrder?.totalAmount || 0);
  const paidAmount = Number(data.amount || 0);

  const alertPayload = {
    orderNumber: orderId,
    customer: {
      fullName: storedOrder?.customer?.fullName || data.firstname || 'Customer',
      email: storedOrder?.customer?.email || data.email || '',
      phone: storedOrder?.customer?.phone || data.phone || '',
    },
    items: storedOrder?.items || [],
    orderBump: storedOrder?.orderBump || null,
    totalAmount: Number(storedOrder?.totalAmount || paidAmount),
    paymentStatus: isSuccess ? 'PAID' : (status.toUpperCase() || 'FAILED'),
    paymentMethod: 'PayU UPI / Card',
  };

  // Anti-tamper verification: Check paid amount against order total
  if (isSuccess && expectedAmount > 0 && paidAmount < expectedAmount - 1) {
    console.error(
      `[Security Warning] Underpaid order on PayU return: #${orderId}! Expected: ₹${expectedAmount}, Paid: ₹${paidAmount}`
    );
    if (db) {
      try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
          status: 'failed_underpaid',
          security_tamper_flag: true,
        });
      } catch {}
    }
    return NextResponse.redirect(
      `${baseUrl}/checkout?error=payment_amount_tampered&orderId=${encodeURIComponent(orderId)}`,
      303
    );
  }

  if (isSuccess) {
    const isAlreadyCompleted = storedOrder?.status === 'completed';

    if (db && !isAlreadyCompleted) {
      try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
          status: 'completed',
          payu_payment_id: String(data.mihpayid || data.payuMoneyId || ''),
          bank_ref_num: String(data.bank_ref_num || ''),
          paymentMethod: `PayU (${data.mode || 'UPI'})`,
        });
      } catch (err) {
        console.warn('Error updating Firestore order on PayU return:', err);
      }
    }

    // Send Telegram alert if first transition to completed
    if (!isAlreadyCompleted) {
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
            basePrice: Number(
              storedOrder.base_price_snapshot ||
                (Number(storedOrder.totalAmount || 0) - Number(storedOrder.reseller_earning || 0))
            ),
            resellerEarning: Number(storedOrder.reseller_earning || 0),
            customer: alertPayload.customer,
            availableBalance: wallet?.availableBalance ?? Number(storedOrder.reseller_earning || 0),
            totalEarned: wallet?.totalEarned ?? Number(storedOrder.reseller_earning || 0),
          });
        } catch (e) {
          console.warn('Error dispatching reseller alert in PayU return route:', e);
          await sendSaleSuccessTelegramAlert(alertPayload);
        }
      } else {
        await sendSaleSuccessTelegramAlert(alertPayload);
      }
    }

    const effectiveReseller = resellerSlug || storedOrder?.reseller_slug || '';
    const resellerQuery = effectiveReseller
      ? `&r=${encodeURIComponent(effectiveReseller)}&reseller_slug=${encodeURIComponent(effectiveReseller)}`
      : '';

    return NextResponse.redirect(
      `${baseUrl}/order-success?orderId=${encodeURIComponent(orderId)}&token=${encodeURIComponent(orderToken)}${resellerQuery}`,
      303
    );
  } else {
    // Payment Failed or Cancelled
    if (db && storedOrder?.status === 'pending') {
      try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
          status: 'failed',
          payu_error: data.error_Message || data.unmappedstatus || 'Payment failed',
        });
      } catch (err) {
        console.warn('Error updating abandoned Firestore order on PayU return:', err);
      }
    }

    if (storedOrder?.status !== 'failed') {
      await sendAbandonedOrPendingTelegramAlert(alertPayload, 'payment_abandoned');
    }

    const effectiveReseller = resellerSlug || storedOrder?.reseller_slug || '';
    const resellerQuery = effectiveReseller
      ? `&r=${encodeURIComponent(effectiveReseller)}&reseller_slug=${encodeURIComponent(effectiveReseller)}`
      : '';

    return NextResponse.redirect(
      `${baseUrl}/checkout?error=payment_${status || 'failed'}&orderId=${encodeURIComponent(orderId)}${resellerQuery}`,
      303
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const data: Record<string, any> = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });
    return await handlePayuResponse(data, request.url);
  } catch (err: any) {
    console.error('Error in PayU POST return handler:', err);
    return NextResponse.redirect('/checkout?error=payu_processing_error', 303);
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const data: Record<string, any> = {};
    url.searchParams.forEach((value, key) => {
      data[key] = value;
    });
    return await handlePayuResponse(data, request.url);
  } catch (err: any) {
    console.error('Error in PayU GET return handler:', err);
    return NextResponse.redirect('/checkout?error=payu_processing_error', 303);
  }
}
