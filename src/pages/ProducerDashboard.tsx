import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useUser } from '@clerk/clerk-react';
import { Battery, DollarSign, MapPin, Plus, TrendingUp, Zap, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001';

export default function ProducerDashboard() {
  const { user } = useUser();
  const [inverters, setInverters] = useState([]);
  const [locations, setLocations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);

  const fetchInverters = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');

    try {
      // 1. Fetch all inverters for this user
      const res = await fetch(`${API_BASE}/api/enode/user/${user.id}/inverters`);
      if (!res.ok) throw new Error('Failed to fetch inverters');
      const data = await res.json();

      // Enode returns { data: [...inverters] }
      const inverterList = data.data ?? [];
      setInverters(inverterList);

      // 2. For each inverter, fetch its location in parallel
      const locationResults = await Promise.allSettled(
        inverterList.map(async (inv) => {
          const locRes = await fetch(`${API_BASE}/api/enode/inverters/${inv.id}/location`);
          if (!locRes.ok) return { id: inv.id, location: null };
          const locData = await locRes.json();
          return { id: inv.id, location: locData };
        })
      );

      // Build a map of inverterId -> location
      const locMap = {};
      locationResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value?.id) {
          locMap[result.value.id] = result.value.location;
        }
      });
      setLocations(locMap);

    } catch (err) {
      console.error(err);
      setError('Could not load your devices. Make sure your inverter is connected.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInverters();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API_BASE}/api/wallet/${user.id}/balance`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setTokenBalance(data.balance); })
      .catch(() => {/* non-critical */});
  }, [user?.id]);

  // Derived KPI values from real inverter data
  const totalPowerKw = inverters.reduce((sum, inv) => {
    return sum + (inv?.productionState?.productionRate ?? 0);
  }, 0);

  const totalLifetimeKwh = inverters.reduce((sum, inv) => {
    return sum + (inv?.productionState?.totalLifetimeProduction ?? 0);
  }, 0);

  const connectedCount = inverters.filter(
    (inv) => inv.lastSeen && new Date(inv.lastSeen) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Producer Dashboard</h1>
            <p className="mt-1 text-muted-foreground">{user?.fullName ?? 'Solar Producer'}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="lg" onClick={fetchInverters} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to="/submit-batch">
              <Button size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Submit Energy Batch
              </Button>
            </Link>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Live Production"
            value={loading ? '—' : totalPowerKw.toFixed(2)}
            subtitle="kW right now"
            icon={Zap}
          />
          <KPICard
            title="Lifetime Production"
            value={loading ? '—' : totalLifetimeKwh.toLocaleString()}
            subtitle="kWh total"
            icon={TrendingUp}
          />
          <KPICard
            title="Connected Devices"
            value={loading ? '—' : connectedCount}
            subtitle={`of ${inverters.length} inverter${inverters.length !== 1 ? 's' : ''}`}
            icon={Battery}
          />
          <KPICard
            title="Est. Revenue"
            value={loading ? '—' : `$${(totalLifetimeKwh * 0.08).toLocaleString()}`}
            subtitle="USD (at $0.08/kWh)"
            icon={DollarSign}
          />
          {tokenBalance !== null && (
            <KPICard
              title="Token Balance"
              value={tokenBalance.toLocaleString()}
              subtitle="KPWATTS on-chain"
              icon={Zap}
            />
          )}
        </div>

        {/* Inverter Cards */}
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">Your Inverters</h2>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="mr-3 h-6 w-6 animate-spin" />
              Loading your devices...
            </div>
          ) : inverters.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Zap className="mb-4 h-12 w-12 text-muted-foreground/40" />
                <p className="text-lg font-medium text-foreground">No inverters connected yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Go back to the home page and click "Connect Your Device" to link your first inverter.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {inverters.map((inv) => {
                const production = inv.productionState;
                const info = inv.information;
                const isOnline = inv.lastSeen &&
                  new Date(inv.lastSeen) > new Date(Date.now() - 24 * 60 * 60 * 1000);
                const loc = locations[inv.id];

                return (
                  <Card key={inv.id} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">
                            {info?.brand ?? 'Unknown Brand'} {info?.model ?? ''}
                          </CardTitle>
                          <CardDescription className="mt-0.5 text-xs font-mono">
                            {inv.id}
                          </CardDescription>
                        </div>
                        <Badge variant={isOnline ? 'default' : 'secondary'}>
                          {isOnline ? 'Online' : 'Offline'}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="flex flex-col gap-3">
                      {/* Production data */}
                      <div className="rounded-md bg-muted/50 p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Live Output</span>
                          <span className="font-medium">
                            {production?.productionRate != null
                              ? `${production.productionRate} kW`
                              : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Producing</span>
                          <span className="font-medium">
                            {production?.isProducing != null
                              ? (production.isProducing ? 'Yes ✓' : 'No')
                              : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Lifetime Total</span>
                          <span className="font-medium">
                            {production?.totalLifetimeProduction != null
                              ? `${production.totalLifetimeProduction.toLocaleString()} kWh`
                              : '—'}
                          </span>
                        </div>
                        {info?.capacity != null && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Capacity</span>
                            <span className="font-medium">{info.capacity} kW</span>
                          </div>
                        )}
                      </div>

                      {/* Location */}
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {loc ? (
                          <span>
                            {[loc.city, loc.country].filter(Boolean).join(', ') ||
                              (loc.latitude && loc.longitude
                                ? `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`
                                : 'Location available')}
                          </span>
                        ) : (
                          <span className="italic">Location unavailable</span>
                        )}
                      </div>

                      {/* Last seen */}
                      {inv.lastSeen && (
                        <p className="text-xs text-muted-foreground">
                          Last seen: {new Date(inv.lastSeen).toLocaleString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}