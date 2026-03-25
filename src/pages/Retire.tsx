import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Award, CheckCircle2, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { calculateCO2Offset, calculateTreesEquivalent, calculateHomesEquivalent } from '../data/mockData';

export default function Retire() {
  const navigate = useNavigate();
  const [selectedBatch, setSelectedBatch] = useState('BATCH-2026-002');
  const [quantity, setQuantity] = useState<number>(3000);
  const [isRetiring, setIsRetiring] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  const ownedBatches = [
    { id: 'BATCH-2026-002', producer: 'WindPower Ghana', owned: 6500 },
  ];

  const selectedBatchData = ownedBatches.find(b => b.id === selectedBatch);
  const co2Offset = calculateCO2Offset(quantity);
  const treesEquivalent = calculateTreesEquivalent(quantity);
  const homesEquivalent = calculateHomesEquivalent(quantity);

  const handleRetire = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRetiring(true);

    setTimeout(() => {
      setIsRetiring(false);
      setShowCertificate(true);
    }, 2000);
  };

  const handleDownloadCertificate = () => {
    // Simulate certificate download
    alert('Certificate downloaded!');
  };

  const handleViewDashboard = () => {
    setShowCertificate(false);
    navigate('/buyer-dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Retire Energy Credits</h1>
            <p className="mt-1 text-muted-foreground">
              Permanently retire tokens to claim environmental benefits
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Retirement Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Select Credits to Retire</CardTitle>
                  <CardDescription>
                    Choose which energy credits you want to retire
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRetire} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="batch">Energy Batch</Label>
                      <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                        <SelectTrigger id="batch">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ownedBatches.map((batch) => (
                            <SelectItem key={batch.id} value={batch.id}>
                              {batch.id} - {batch.producer} ({batch.owned.toLocaleString()} kWh)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity to Retire (kWh)</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        min={1}
                        max={selectedBatchData?.owned || 0}
                      />
                      <p className="text-xs text-muted-foreground">
                        Available: {selectedBatchData?.owned.toLocaleString()} kWh
                      </p>
                    </div>

                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-sm mb-3">Environmental Impact</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">CO₂ Offset:</span>
                            <span className="font-medium">{co2Offset.toLocaleString()} kg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Trees Equivalent:</span>
                            <span className="font-medium">{treesEquivalent} trees</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Homes Powered:</span>
                            <span className="font-medium">{homesEquivalent} days</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/buyer-dashboard')}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isRetiring || quantity <= 0 || quantity > (selectedBatchData?.owned || 0)}
                        className="flex-1"
                      >
                        {isRetiring ? 'Processing Retirement...' : 'Retire Tokens'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Info Card */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>About Retirement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium">Permanent Action</p>
                      <p className="text-muted-foreground">
                        Retired tokens cannot be transferred or reused
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium">Verified Impact</p>
                      <p className="text-muted-foreground">
                        Retirement is recorded on-chain with proof
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium">ESG Reporting</p>
                      <p className="text-muted-foreground">
                        Download certificate for compliance
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium">No Double Counting</p>
                      <p className="text-muted-foreground">
                        Blockchain ensures credits can't be claimed twice
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Retirement Certificate Modal */}
      <Dialog open={showCertificate} onOpenChange={setShowCertificate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Award className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-center text-2xl">Retirement Successful!</DialogTitle>
            <DialogDescription className="text-center">
              Your tokens have been permanently retired
            </DialogDescription>
          </DialogHeader>

          {/* Certificate Design */}
          <div className="space-y-6">
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
              <CardContent className="p-8 space-y-6">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">KPWATTS Retirement Certificate</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Renewable Energy Credit Retirement
                  </p>
                </div>

                <div className="space-y-3 border-t border-b border-border py-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Certificate ID:</span>
                    <span className="font-mono font-medium">RET-2026-{Math.floor(Math.random() * 1000)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Batch ID:</span>
                    <span className="font-medium">{selectedBatch}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Producer:</span>
                    <span className="font-medium">{selectedBatchData?.producer}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Quantity Retired:</span>
                    <span className="font-medium">{quantity.toLocaleString()} kWh</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">CO₂ Offset:</span>
                    <span className="font-medium">{co2Offset.toLocaleString()} kg CO₂</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Retirement Date:</span>
                    <span className="font-medium">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Transaction Hash:</span>
                    <span className="font-mono text-xs">0xcde345fgh678901...</span>
                  </div>
                </div>

                <div className="text-center text-xs text-muted-foreground">
                  <p>This certificate represents the permanent retirement of renewable energy credits</p>
                  <p className="mt-1">Verified on blockchain • Immutable proof of environmental impact</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleDownloadCertificate}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button onClick={handleViewDashboard} className="flex-1">
                View Dashboard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
