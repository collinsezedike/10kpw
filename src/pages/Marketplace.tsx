import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { CheckCircle2, ChevronDown, ChevronUp, Filter, Search } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { mockBatches, EnergyBatch } from '../data/mockData';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001';

interface OnChainListing {
  publicKey: string;
  seller: string;
  amount: string;
  pricePerUnit: string;
  listingId: string;
}

function onChainListingToBatch(listing: OnChainListing): EnergyBatch & {
  listingPublicKey: string;
  listingId: number;
  sellerAddress: string;
} {
  const amount = Number(listing.amount);
  const pricePerKwh = Number(listing.pricePerUnit) / 1_000_000;
  const sellerShort = `${listing.seller.slice(0, 6)}...${listing.seller.slice(-4)}`;
  return {
    id: `ON-CHAIN-${listing.listingId}`,
    producerId: listing.seller,
    producerName: sellerShort,
    country: 'On-Chain',
    energyType: 'Solar',
    totalKwh: amount,
    availableKwh: amount,
    pricePerKwh,
    status: 'active',
    verificationStatus: 'verified',
    mintedAt: new Date().toISOString(),
    mintTxHash: listing.publicKey,
    facilityId: listing.seller.slice(0, 8),
    reportingPeriod: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    listingPublicKey: listing.publicKey,
    listingId: Number(listing.listingId),
    sellerAddress: listing.seller,
  };
}

export default function Marketplace() {
  const [countryFilter, setCountryFilter] = useState('all');
  const [energyTypeFilter, setEnergyTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minKwh, setMinKwh] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [onChainBatches, setOnChainBatches] = useState<ReturnType<typeof onChainListingToBatch>[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/energy/listings`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.listings?.length) {
          setOnChainBatches(data.listings.map(onChainListingToBatch));
        }
      })
      .catch(() => {/* use mock data as fallback */});
  }, []);

  // Merge: mock data first, then any on-chain listings not already in mock
  const mockIds = new Set(mockBatches.map(b => b.id));
  const extraOnChain = onChainBatches.filter(b => !mockIds.has(b.id));
  const allBatches = [...mockBatches, ...extraOnChain] as (EnergyBatch & Partial<{
    listingPublicKey: string; listingId: number; sellerAddress: string;
  }>)[];

  const availableBatches = allBatches.filter(b => b.status === 'active' && b.availableKwh > 0);

  const filteredBatches = availableBatches.filter(batch => {
    if (countryFilter !== 'all' && batch.country !== countryFilter) return false;
    if (energyTypeFilter !== 'all' && batch.energyType !== energyTypeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!batch.id.toLowerCase().includes(q) && !batch.producerName.toLowerCase().includes(q)) return false;
    }
    if (minPrice && batch.pricePerKwh < Number(minPrice)) return false;
    if (maxPrice && batch.pricePerKwh > Number(maxPrice)) return false;
    if (minKwh && batch.availableKwh < Number(minKwh)) return false;
    if (verificationFilter !== 'all' && batch.verificationStatus !== verificationFilter) return false;
    return true;
  });

  const hasActiveMoreFilters = minPrice || maxPrice || minKwh || verificationFilter !== 'all';

  const clearAllFilters = () => {
    setCountryFilter('all');
    setEnergyTypeFilter('all');
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setMinKwh('');
    setVerificationFilter('all');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Energy Credit Marketplace</h1>
          <p className="mt-1 text-muted-foreground">
            Browse and purchase verified renewable energy credits from global producers
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {/* Main filter row */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by batch ID or producer..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  <SelectItem value="Kenya">Kenya</SelectItem>
                  <SelectItem value="Ghana">Ghana</SelectItem>
                  <SelectItem value="Nigeria">Nigeria</SelectItem>
                </SelectContent>
              </Select>

              <Select value={energyTypeFilter} onValueChange={setEnergyTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Energy Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Solar">Solar</SelectItem>
                  <SelectItem value="Wind">Wind</SelectItem>
                  <SelectItem value="Hydro">Hydro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* More filters toggle */}
            {showMoreFilters && (
              <div className="mt-4 grid gap-4 border-t border-border pt-4 md:grid-cols-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Min Price ($/kWh)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Max Price ($/kWh)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Any"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Min Available (kWh)</Label>
                  <Input
                    type="number"
                    placeholder="Any"
                    value={minKwh}
                    onChange={(e) => setMinKwh(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Verification</Label>
                  <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="verified">Verified Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredBatches.length} of {availableBatches.length} available batches
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMoreFilters(v => !v)}
            className={hasActiveMoreFilters ? 'border-primary text-primary' : ''}
          >
            <Filter className="mr-2 h-4 w-4" />
            More Filters
            {showMoreFilters
              ? <ChevronUp className="ml-2 h-3 w-3" />
              : <ChevronDown className="ml-2 h-3 w-3" />
            }
            {hasActiveMoreFilters && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {[minPrice, maxPrice, minKwh, verificationFilter !== 'all' ? '1' : ''].filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>

        {/* Batch Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBatches.map((batch) => (
            <Card key={batch.id} className="overflow-hidden transition-shadow hover:shadow-lg">
              <CardContent className="p-0">
                <div className="border-b border-border bg-muted/30 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-sm font-medium text-foreground">{batch.id}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{batch.reportingPeriod}</p>
                    </div>
                    <StatusBadge status={batch.status} />
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{batch.producerName}</h3>
                      <p className="text-sm text-muted-foreground">{batch.country}</p>
                    </div>
                    {batch.verificationStatus === 'verified' && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  <div className="mb-4 flex items-center gap-2">
                    <Badge variant="secondary">{batch.energyType}</Badge>
                  </div>

                  <div className="space-y-3 border-t border-border pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Available</span>
                      <span className="font-medium">{batch.availableKwh.toLocaleString()} kWh</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Price per kWh</span>
                      <span className="font-medium">${batch.pricePerKwh}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Value</span>
                      <span className="font-semibold text-primary">
                        ${(batch.availableKwh * batch.pricePerKwh).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <Link to={`/batch/${batch.id}`} state={{ batch }}>
                    <Button className="mt-4 w-full">View Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBatches.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No batches found matching your filters</p>
              <Button variant="link" className="mt-2" onClick={clearAllFilters}>
                Clear all filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
