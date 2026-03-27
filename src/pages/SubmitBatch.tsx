import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle2, Upload } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

export default function SubmitBatch() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [batchId] = useState(`BATCH-2026-${Math.floor(Math.random() * 900 + 100)}`);
  const [month, setMonth] = useState('january');
  const [energyType, setEnergyType] = useState('solar');
  const [kwh, setKwh] = useState('25000');
  const [facilityId, setFacilityId] = useState('FAC-KE-001');
  const [price, setPrice] = useState('0.08');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate batch submission
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
    }, 2000);
  };

  const handleMint = () => {
    setShowSuccess(false);
    // Simulate minting
    setTimeout(() => {
      navigate('/producer-dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Submit Energy Batch</h1>
            <p className="mt-1 text-muted-foreground">
              Report your renewable energy generation for tokenization
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Energy Generation Details</CardTitle>
              <CardDescription>
                Provide verified data for your reporting period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Reporting Period */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="month">Reporting Month</Label>
                    <Select value={month} onValueChange={setMonth}>
                      <SelectTrigger id="month">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="january">January 2026</SelectItem>
                        <SelectItem value="february">February 2026</SelectItem>
                        <SelectItem value="december">December 2025</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="energy-type">Energy Type</Label>
                    <Select value={energyType} onValueChange={setEnergyType}>
                      <SelectTrigger id="energy-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solar">Solar</SelectItem>
                        <SelectItem value="wind">Wind</SelectItem>
                        <SelectItem value="hydro">Hydro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Energy Generated */}
                <div className="space-y-2">
                  <Label htmlFor="kwh">Energy Generated (kWh)</Label>
                  <Input
                    id="kwh"
                    type="number"
                    placeholder="25000"
                    value={kwh}
                    onChange={(e) => setKwh(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Total kWh generated and delivered to grid during reporting period
                  </p>
                </div>

                {/* Grid Connection ID */}
                <div className="space-y-2">
                  <Label htmlFor="facility-id">Grid Connection / Facility ID</Label>
                  <Input
                    id="facility-id"
                    placeholder="FAC-KE-001"
                    value={facilityId}
                    onChange={(e) => setFacilityId(e.target.value)}
                  />
                </div>

                {/* Price per kWh */}
                <div className="space-y-2">
                  <Label htmlFor="price">Price per kWh (USD)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.08"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Your listing price for the marketplace
                  </p>
                </div>

                {/* Upload Proof */}
                <div className="space-y-2">
                  <Label htmlFor="proof">Upload Verification Document</Label>
                  <div className="flex items-center gap-4">
                    <Input id="proof" type="file" className="hidden" />
                    <Button type="button" variant="outline" size="sm" asChild>
                      <label htmlFor="proof" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        Choose File
                      </label>
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      No file selected
                    </span>
                  </div>
                </div>

                {/* Batch Preview */}
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-2">Batch Preview</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Batch ID:</span>
                        <span className="font-medium">{batchId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tokens to Mint:</span>
                        <span className="font-medium">{Number(kwh).toLocaleString()} KPWATTS</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Verification:</span>
                        <span className="text-yellow-600 dark:text-yellow-400">Pending</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/producer-dashboard')}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? 'Submitting...' : 'Submit Batch'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-center">Batch Approved!</DialogTitle>
            <DialogDescription className="text-center">
              Your energy batch {batchId} has been verified and is ready to mint.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Batch ID:</span>
                <span className="font-medium">{batchId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Energy:</span>
                <span className="font-medium">{Number(kwh).toLocaleString()} kWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tokens:</span>
                <span className="font-medium">{Number(kwh).toLocaleString()} KPWATTS</span>
              </div>
            </div>
            <Button className="w-full" onClick={handleMint}>
              Mint KPWATTS Tokens
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
