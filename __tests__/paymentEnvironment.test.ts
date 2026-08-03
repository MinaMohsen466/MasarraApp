/**
 * Guards the MyFatoorah environment contract.
 *
 * Three things must name the same environment: the backend that mints the
 * session, the SDK script the page loads, and the origin the WebView serves the
 * document under. Any disagreement is rejected with "SessionId is not valid!".
 *
 * Note a production *deployment* does not imply live payments — the production
 * backend runs MYFATOORAH_TEST_MODE=true while the app is in testing, so only
 * the server's own report may decide this.
 */
import { sendPayment, resolveGatewayOrigin } from '../src/services/paymentApi';

jest.mock('../src/utils/secureStorage', () => ({
  getSecureToken: jest.fn().mockResolvedValue('test-token'),
}));

const sessionResponse = (extra: Record<string, unknown> = {}) => ({
  ok: true,
  status: 200,
  headers: { get: () => 'application/json' },
  json: () =>
    Promise.resolve({
      success: true,
      data: { sessionId: 'KWT-test-session', encryptionKey: 'key', ...extra },
    }),
});

const params = {
  bookingId: 'booking-1',
  invoiceValue: 10,
  customerName: 'Test',
  customerEmail: 'test@example.com',
};

describe('resolveGatewayOrigin', () => {
  it('returns the live gateway only when the server explicitly says live', () => {
    expect(resolveGatewayOrigin(false)).toBe('https://portal.myfatoorah.com');
  });

  it('returns the test gateway when the server says test', () => {
    expect(resolveGatewayOrigin(true)).toBe('https://demo.myfatoorah.com');
  });

  it('fails safe to the test gateway when the server says nothing', () => {
    // Guessing "live" would put real cards in front of testers.
    expect(resolveGatewayOrigin(undefined)).toBe('https://demo.myfatoorah.com');
  });
});

describe('sendPayment', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads the SDK from the same origin it reports back', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue(sessionResponse());

    const result = await sendPayment(params);

    // The script tag and the origin handed to the WebView must agree — they
    // were decided independently before, and drifted.
    expect(result.data?.gatewayOrigin).toBe('https://demo.myfatoorah.com');
    expect(result.data?.invoiceURL).toContain(
      'https://demo.myfatoorah.com/sessions/v1/session.js',
    );
    expect(result.data?.invoiceURL).not.toContain('portal.myfatoorah.com');
  });

  it('switches both to live when the server reports live', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      sessionResponse({ isTestMode: false }),
    );

    const result = await sendPayment(params);

    expect(result.data?.gatewayOrigin).toBe('https://portal.myfatoorah.com');
    expect(result.data?.invoiceURL).toContain(
      'https://portal.myfatoorah.com/sessions/v1/session.js',
    );
    expect(result.data?.invoiceURL).not.toContain('demo.myfatoorah.com');
  });

  it('bounds the wait for the gateway script instead of spinning forever', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue(sessionResponse());

    const result = await sendPayment(params);

    expect(result.data?.invoiceURL).toContain('waitedMs >= 15000');
    expect(result.data?.invoiceURL).toContain('PAYMENT_ERROR');
  });
});
