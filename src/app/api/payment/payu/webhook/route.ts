import { NextResponse } from 'next/server';
import { getPayuCredentials, verifyPayuResponseHash } from '@/lib/payu';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { sendSaleSuccessTelegramAlert } from '@/lib/telegram';
import { sendResellerSaleTelegramAlert } from '@/lib/telegramReseller';
import { getResellerProfile, getResellerWallet } from '@/lib/resellerService';

export async function POST(request: Request) {
  try {
    let payload: Record<string, any> = {};

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        payload[key] = value;
      });
    }

    const creds = await getPayuCredentials();
    const isHashValid = verifyPayuResponseHash(payload, creds.salt);

    if (!isHashValid) {
      console.warn('[PayU Webhook] Invalid reverse hash signature received');
      return NextResponse.json({ success: false, error: 'Invalid hash' }, { status: 400 });
    }

    const orderId = String(payload.txnid || '').trim();
    const status = String(payload.status || '').toLowerCase();
    const isSuccess = status === 'success';

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Missing txnid' }, { status: 400 });
    }

    if (!isSuccess) {
      return NextResponse.json({ success: true, message: 'Ignored non-success status' });
    }

    let storedOrder: any = null;
    if (db) {
      const snap = await getDoc(doc(db, 'orders', orderId));
      if (snap.exists()) {
        storedOrder = snap.data();
      }
    }

    const isAlreadyCompleted = storedOrder?.status === 'completed';

    if (db && !isAlreadyCompleted) {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'completed',
        payu_payment_id: String(payload.mihpayid || payload.payuMoneyId || ''),
        paymentMethod: `PayU Webhook (${payload.mode || 'UPI'})`,
      });
    }

    if (!isAlreadyCompleted) {
      const alertPayload = {
        orderNumber: orderId,
        customer: {
          fullName: storedOrder?.customer?.fullName || payload.firstname || 'Customer',
          email: storedOrder?.customer?.email || payload.email || '',
          phone: storedOrder?.customer?.phone || payload.phone || '',
        },
        items: storedOrder?.items || [],
        orderBump: storedOrder?.orderBump || null,
        totalAmount: Number(storedOrder?.totalAmount || payload.amount || 0),
        paymentStatus: 'PAID (PayU Webhook Verified)',
        paymentMethod: 'PayU Webhook',
      };

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
            totalAmount: alertPayload.totalAmount,
            basePrice: Number(storedOrder.base_price_snapshot || alertPayload.totalAmount),
            resellerEarning: Number(storedOrder.reseller_earning || 0),
            customer: alertPayload.customer,
            availableBalance: wallet?.availableBalance ?? Number(storedOrder.reseller_earning || 0),
            totalEarned: wallet?.totalEarned ?? Number(storedOrder.reseller_earning || 0),
          });
        } catch {
          await sendSaleSuccessTelegramAlert(alertPayload);
        }
      } else {
        await sendSaleSuccessTelegramAlert(alertPayload);
      }
    }

    return NextResponse.json({ success: true, orderId });
  } catch (err: any) {
    console.error('Error in PayU webhook:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
