import crypto from 'crypto';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface PayuCredentials {
  key: string;
  salt: string;
  environment: 'PRODUCTION' | 'TEST';
  enabled: boolean;
  surl?: string;
  furl?: string;
}

export interface CreatePayuPaymentParams {
  txnid: string;
  amount: number;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  udf1?: string; // e.g. orderToken
  udf2?: string; // e.g. resellerSlug
  udf3?: string;
  udf4?: string;
  udf5?: string;
}

export interface PayuPaymentFormPayload {
  actionUrl: string;
  params: {
    key: string;
    txnid: string;
    amount: string;
    productinfo: string;
    firstname: string;
    email: string;
    phone: string;
    surl: string;
    furl: string;
    hash: string;
    udf1: string;
    udf2: string;
    udf3: string;
    udf4: string;
    udf5: string;
    service_provider: string;
  };
}

let cachedPayuCreds: PayuCredentials | null = null;
let payuCredsCachedAt = 0;
const PAYU_CREDS_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Retrieve PayU credentials from Environment Variables or Firestore (store_settings/payu)
 */
export async function getPayuCredentials(forceRefresh = false): Promise<PayuCredentials> {
  if (!forceRefresh && cachedPayuCreds && Date.now() - payuCredsCachedAt < PAYU_CREDS_TTL) {
    return cachedPayuCreds;
  }

  // 1. Check all standard environment variable patterns
  let key = (
    process.env.PAYU_KEY ||
    process.env.PAYU_MERCHANT_KEY ||
    process.env.NEXT_PUBLIC_PAYU_KEY ||
    process.env.NEXT_PUBLIC_PAYU_MERCHANT_KEY ||
    ''
  ).trim();

  let salt = (
    process.env.PAYU_SALT ||
    process.env.PAYU_MERCHANT_SALT ||
    process.env.NEXT_PUBLIC_PAYU_SALT ||
    process.env.PAYU_SECRET_SALT ||
    ''
  ).trim();

  const rawEnv = (
    process.env.PAYU_ENV ||
    process.env.PAYU_ENVIRONMENT ||
    process.env.NEXT_PUBLIC_PAYU_ENV ||
    'PRODUCTION'
  ).toUpperCase();
  const environment: 'PRODUCTION' | 'TEST' =
    rawEnv === 'TEST' || rawEnv === 'SANDBOX' ? 'TEST' : 'PRODUCTION';

  // 2. Fallback to Firestore store_settings/payu if not configured in environment
  if ((!key || !salt) && db) {
    try {
      const snap = await getDoc(doc(db, 'store_settings', 'payu'));
      if (snap.exists()) {
        const data = snap.data();
        if (!key && data.key) key = String(data.key).trim();
        if (!salt && data.salt) salt = String(data.salt).trim();
      }
    } catch (err) {
      console.warn('Could not fetch store_settings/payu from Firestore:', err);
    }
  }

  const siteBase = (
    process.env.NEXT_PUBLIC_SITE_URL || 'https://diziproducts.shop'
  ).replace(/\/+$/, '');
  const surl = `${siteBase}/api/payment/payu/return`;
  const furl = `${siteBase}/api/payment/payu/return`;

  cachedPayuCreds = {
    key,
    salt,
    environment,
    enabled: Boolean(key && salt),
    surl,
    furl,
  };
  payuCredsCachedAt = Date.now();

  return cachedPayuCreds;
}

/**
 * Generate standard PayU payment initiation SHA-512 hash:
 * formula: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
 */
export function generatePayuHash(params: {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  salt: string;
}): string {
  const {
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1 = '',
    udf2 = '',
    udf3 = '',
    udf4 = '',
    udf5 = '',
    salt,
  } = params;

  // Formula requires exactly 10 empty udf slots: udf1..udf5 followed by udf6..udf10 (empty)
  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
  return crypto.createHash('sha512').update(hashString).digest('hex').toLowerCase();
}

/**
 * Verify PayU reverse response hash from return / webhook POST
 * Formula:
 * If additionalCharges:
 *   sha512(additionalCharges|SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 * Else:
 *   sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 */
export function verifyPayuResponseHash(params: Record<string, any>, salt: string): boolean {
  try {
    const receivedHash = String(params.hash || '').toLowerCase();
    if (!receivedHash || !salt) return false;

    const status = String(params.status || '');
    const firstname = String(params.firstname || '');
    const amount = String(params.amount || '');
    const txnid = String(params.txnid || '');
    const productinfo = String(params.productinfo || '');
    const email = String(params.email || '');
    const key = String(params.key || '');
    const udf1 = String(params.udf1 || '');
    const udf2 = String(params.udf2 || '');
    const udf3 = String(params.udf3 || '');
    const udf4 = String(params.udf4 || '');
    const udf5 = String(params.udf5 || '');
    const additionalCharges = params.additionalCharges ? String(params.additionalCharges) : '';

    let hashSequence = '';
    if (additionalCharges) {
      hashSequence = `${additionalCharges}|${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
    } else {
      hashSequence = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
    }

    const calculatedHash = crypto
      .createHash('sha512')
      .update(hashSequence)
      .digest('hex')
      .toLowerCase();

    return calculatedHash === receivedHash;
  } catch (err) {
    console.error('Error verifying PayU response hash:', err);
    return false;
  }
}

/**
 * Server-to-server verification with PayU's WebService verify_payment endpoint
 * URL: https://info.payu.in/merchant/postservice.php?form=2 (PRODUCTION)
 *      https://test.payu.in/merchant/postservice.php?form=2 (TEST)
 */
export async function verifyPayuWebService(params: {
  txnid: string;
  key: string;
  salt: string;
  environment: 'PRODUCTION' | 'TEST';
}): Promise<{
  verified: boolean;
  status: string;
  amount: number;
  raw?: any;
}> {
  const { txnid, key, salt, environment } = params;
  const endpoint =
    environment === 'TEST'
      ? 'https://test.payu.in/merchant/postservice.php?form=2'
      : 'https://info.payu.in/merchant/postservice.php?form=2';

  // Hash formula for verify_payment: sha512(key|verify_payment|var1|salt)
  const hashString = `${key}|verify_payment|${txnid}|${salt}`;
  const hash = crypto.createHash('sha512').update(hashString).digest('hex').toLowerCase();

  const bodyData = new URLSearchParams({
    key,
    command: 'verify_payment',
    var1: txnid,
    hash,
  });

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyData.toString(),
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn(`PayU verify_payment HTTP error: ${res.status}`);
      return { verified: false, status: 'HTTP_ERROR', amount: 0 };
    }

    const data = await res.json();
    const details = data?.transaction_details?.[txnid];

    if (details) {
      const isSuccess = details.status === 'success';
      const paidAmount = Number(details.amt || details.transaction_amount || details.amount || 0);
      return {
        verified: isSuccess,
        status: details.status || 'unknown',
        amount: paidAmount,
        raw: details,
      };
    }

    return {
      verified: false,
      status: data?.status === 0 ? 'NOT_FOUND' : 'UNKNOWN',
      amount: 0,
      raw: data,
    };
  } catch (err: any) {
    console.warn('PayU WebService verification error:', err);
    return { verified: false, status: 'ERROR', amount: 0 };
  }
}

/**
 * Build PayU checkout payload with action URL and signed parameters
 */
export async function buildPayuCheckoutPayload(params: CreatePayuPaymentParams): Promise<PayuPaymentFormPayload> {
  const creds = await getPayuCredentials();
  if (!creds.key || !creds.salt) {
    throw new Error('PayU API Key and Salt are not configured. Please add PAYU_KEY and PAYU_SALT in Vercel or Admin Portal.');
  }

  const actionUrl =
    creds.environment === 'TEST'
      ? 'https://test.payu.in/_payment'
      : 'https://secure.payu.in/_payment';

  const formattedAmount = Number(params.amount).toFixed(2);
  const cleanFirstname = (params.firstname || 'Customer').replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'Customer';
  const cleanProductInfo = (params.productinfo || 'Digital Bundle').slice(0, 95);

  const hash = generatePayuHash({
    key: creds.key,
    txnid: params.txnid,
    amount: formattedAmount,
    productinfo: cleanProductInfo,
    firstname: cleanFirstname,
    email: params.email,
    udf1: params.udf1 || '',
    udf2: params.udf2 || '',
    udf3: params.udf3 || '',
    udf4: params.udf4 || '',
    udf5: params.udf5 || '',
    salt: creds.salt,
  });

  return {
    actionUrl,
    params: {
      key: creds.key,
      txnid: params.txnid,
      amount: formattedAmount,
      productinfo: cleanProductInfo,
      firstname: cleanFirstname,
      email: params.email,
      phone: params.phone,
      surl: params.surl || creds.surl || '',
      furl: params.furl || creds.furl || '',
      hash,
      udf1: params.udf1 || '',
      udf2: params.udf2 || '',
      udf3: params.udf3 || '',
      udf4: params.udf4 || '',
      udf5: params.udf5 || '',
      service_provider: 'payu_paisa',
    },
  };
}
