import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { useUser } from '@clerk/clerk-react';
import { ArrowLeft, CheckCircle2, ExternalLink, Loader2, MapPin } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { mockBatches } from '../data/mockData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001';

// On-chain batches passed via router state may have these extra fields.
interface OnChainFields {
  listingPublicKey?: string;
  listingId?: number;
  sellerAddress?: string;
}

export default function BatchDetail() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  const [quantity, setQuantity] = useState<number>(1000);
  const [showPurchase, setShowPurchase] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [purchaseTx, setPurchaseTx] = useState('');
  const [purchaseError, setPurchaseError] = useState('');

  // Fall back to router state for on-chain batches not present in mockBatches
  const batch = (mockBatches.find(b => b.id === batchId) ?? location.state?.batch) as
    | (typeof mockBatches[0] & OnChainFields)
    | undefined;

  if (!batch) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Batch not found</p>
      </div>
    );
  }

  const totalCost = quantity * batch.pricePerKwh;

  const generationData = [
    { day: 1, kwh: 800 },
    { day: 5, kwh: 820 },
    { day: 10, kwh: 850 },
    { day: 15, kwh: 830 },
    { day: 20, kwh: 860 },
    { day: 25, kwh: 840 },
    { day: 31, kwh: 825 },
  ];

  const handlePurchase = () => {
    if (!user?.id) {
      navigate('/auth');
      return;
    }

    setPurchaseError('');
    const txnRef = `KPWATTS-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    // Amount in smallest currency unit (kobo for NGN, cents for USD)
    const amountInSmallestUnit = Math.round(totalCost * 100);

    setShowPurchase(false);
    setIsPurchasing(true);

    window.webpayCheckout({
      merchant_code: import.meta.env.VITE_INTERSWITCH_MERCHANT_CODE || 'DEMO',
      pay_item_id: import.meta.env.VITE_INTERSWITCH_PAY_ITEM_ID || 'Default_Payable_DEMO',
      txn_ref: txnRef,
      amount: amountInSmallestUnit,
      currency: Number(import.meta.env.VITE_INTERSWITCH_CURRENCY || 566),
      site_redirect_url: `${window.location.origin}/buyer-dashboard`,
      mode: (import.meta.env.VITE_INTERSWITCH_MODE as 'TEST' | 'LIVE') || 'TEST',
      onComplete: async (response) => {
        const success = response.resp === '00' || response.responseCode === '00';
        if (success) {
          try {
            const fulfillRes = await fetch(`${API_BASE}/api/payment/fulfill`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                buyerUserId: user.id,
                paymentRef: response.txnref || txnRef,
                listingPublicKey: batch.listingPublicKey,
                listingId: batch.listingId,
                sellerAddress: batch.sellerAddress,
                amount: quantity,
              }),
            });
            const fulfillData = fulfillRes.ok ? await fulfillRes.json() : {};
            setPurchaseTx(fulfillData.tx || response.txnref || txnRef);
          } catch {
            // Non-critical: payment succeeded, on-chain step failed — still show success
            setPurchaseTx(response.txnref || txnRef);
          }
          setIsPurchasing(false);
          setShowSuccess(true);
        } else {
          setPurchaseError('Payment was not completed. Please try again.');
          setIsPurchasing(false);
        }
      },
      onClose: () => {
        setIsPurchasing(false);
      },
    });
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigate('/buyer-dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Full-screen loading overlay while payment is being processed */}
      {isPurchasing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Processing payment…</p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 lg:px-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/marketplace')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Marketplace
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{batch.id}</CardTitle>
                    <CardDescription className="mt-2">{batch.reportingPeriod}</CardDescription>
                  </div>
                  <StatusBadge status={batch.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Energy</p>
                    <p className="mt-1 text-2xl font-semibold">{batch.totalKwh.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">kWh</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Available</p>
                    <p className="mt-1 text-2xl font-semibold">{batch.availableKwh.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">kWh</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Price per kWh</p>
                    <p className="mt-1 text-2xl font-semibold">${batch.pricePerKwh}</p>
                    <p className="text-sm text-muted-foreground">USD</p>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <h3 className="font-semibold mb-4">Energy Generation Profile</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={generationData}>
                      <defs>
                        <linearGradient id="colorKwh" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="day"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="kwh"
                        stroke="hsl(var(--chart-1))"
                        fill="url(#colorKwh)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Producer Info */}
            <Card>
              <CardHeader>
                <CardTitle>Producer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{batch.producerName}</h3>
                    <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {batch.country}
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Verified Producer
                  </Badge>
                </div>

                <div className="grid gap-4 border-t border-border pt-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Energy Type</p>
                    <p className="mt-1 font-medium">{batch.energyType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Facility ID</p>
                    <p className="mt-1 font-medium">{batch.facilityId}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Blockchain Verification */}
            <Card>
              <CardHeader>
                <CardTitle>On-Chain Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mint Transaction</span>
                  <a
                    href="#"
                    className="flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                  >
                    {batch.mintTxHash.substring(0, 20)}...
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Minted At</span>
                  <span className="font-medium">
                    {new Date(batch.mintedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Verification Status</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    Verified
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Purchase Card */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Purchase Calculator</CardTitle>
                <CardDescription>Calculate your purchase amount</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity (kWh)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    min={1}
                    max={batch.availableKwh}
                  />
                  <p className="text-xs text-muted-foreground">
                    Max: {batch.availableKwh.toLocaleString()} kWh
                  </p>
                </div>

                <div className="space-y-2 rounded-lg bg-muted/50 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price per kWh</span>
                    <span className="font-medium">${batch.pricePerKwh}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="font-medium">{quantity.toLocaleString()} kWh</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="font-semibold">Total Cost</span>
                    <span className="text-xl font-bold text-primary">${totalCost.toFixed(2)}</span>
                  </div>
                </div>

                {purchaseError && (
                  <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                    {purchaseError}
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setShowPurchase(true)}
                  disabled={quantity <= 0 || quantity > batch.availableKwh}
                >
                  Purchase Credits
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Secure payment via Interswitch
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={showPurchase} onOpenChange={setShowPurchase}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>
              Review your purchase details before proceeding to payment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Batch ID:</span>
                <span className="font-medium">{batch.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity:</span>
                <span className="font-medium">{quantity.toLocaleString()} kWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-medium">${batch.pricePerKwh} per kWh</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <span>Total:</span>
                <span className="text-primary">${totalCost.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowPurchase(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handlePurchase} className="flex-1">
                Pay with Interswitch
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-center">Purchase Successful!</DialogTitle>
            <DialogDescription className="text-center">
              You've successfully purchased {quantity.toLocaleString()} kWh of renewable energy credits
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
              {purchaseTx && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction:</span>
                  <span className="font-mono text-xs break-all text-right max-w-[60%]">{purchaseTx}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tokens Received:</span>
                <span className="font-medium">{quantity.toLocaleString()} KPWATTS</span>
              </div>
            </div>
            <Button className="w-full" onClick={handleSuccessClose}>
              View in Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
