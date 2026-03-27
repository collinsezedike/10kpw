interface InterswitchResponse {
  resp: string;
  responseCode?: string;
  txnref: string;
  amount: number;
  [key: string]: unknown;
}

interface InterswitchCheckoutOptions {
  merchant_code: string;
  pay_item_id: string;
  txn_ref: string;
  amount: number;
  currency: number;
  site_redirect_url: string;
  mode?: 'TEST' | 'LIVE';
  onComplete?: (response: InterswitchResponse) => void;
  onClose?: () => void;
}

interface Window {
  webpayCheckout: (options: InterswitchCheckoutOptions) => void;
}
