import { NextResponse } from 'next/server';
import { getPayuCredentials } from '@/lib/payu';
import { getCashfreeCredentials } from '@/lib/cashfree';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [payuCreds, cashfreeCreds] = await Promise.all([
      getPayuCredentials().catch(() => ({ key: '', salt: '', enabled: false })),
      getCashfreeCredentials().catch(() => ({ appId: '', secretKey: '', enabled: false })),
    ]);

    const payuConfigured = Boolean(payuCreds.key && payuCreds.salt);
    const cashfreeConfigured = Boolean(cashfreeCreds.appId && cashfreeCreds.secretKey);

    const configuredEnvGateway = (process.env.ACTIVE_PAYMENT_GATEWAY || process.env.NEXT_PUBLIC_ACTIVE_PAYMENT_GATEWAY || '').toLowerCase();

    let activeGateway: 'payu' | 'cashfree' = 'payu';

    if (configuredEnvGateway === 'cashfree') {
      activeGateway = 'cashfree';
    } else if (configuredEnvGateway === 'payu') {
      activeGateway = 'payu';
    } else {
      // Default preference: if PayU is configured, use PayU; otherwise fallback to Cashfree
      if (payuConfigured) {
        activeGateway = 'payu';
      } else if (cashfreeConfigured) {
        activeGateway = 'cashfree';
      } else {
        activeGateway = 'payu';
      }
    }

    return NextResponse.json({
      success: true,
      activeGateway,
      payuConfigured,
      cashfreeConfigured,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      activeGateway: 'payu',
      payuConfigured: false,
      cashfreeConfigured: false,
    });
  }
}
