import { Link } from 'react-router';
import { Award, Leaf, Package, TrendingUp } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { calculateCO2Offset, calculateTreesEquivalent, calculateHomesEquivalent } from '../data/mockData';

export default function BuyerDashboard() {
  // Mock buyer data
  const totalOwned = 13000;
  const totalRetired = 6500;
  const co2Offset = calculateCO2Offset(totalRetired);
  const treesEquivalent = calculateTreesEquivalent(totalRetired);
  const homesEquivalent = calculateHomesEquivalent(totalRetired);

  const purchaseHistory = [
    {
      id: 'BATCH-2026-001',
      producer: 'SolarTech Kenya',
      country: 'Kenya',
      amount: 6500,
      price: 520,
      date: '2026-02-16',
      status: 'retired' as const,
    },
    {
      id: 'BATCH-2026-002',
      producer: 'WindPower Ghana',
      country: 'Ghana',
      amount: 6500,
      price: 585,
      date: '2026-02-19',
      status: 'active' as const,
    },
  ];

  const retirementHistory = [
    {
      id: 'RET-001',
      batchId: 'BATCH-2026-001',
      amount: 6500,
      co2: calculateCO2Offset(6500),
      date: '2026-02-20',
      certificateUrl: '#',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Buyer Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Your Climate Impact Portfolio</p>
          </div>
          <div className="flex gap-3">
            <Link to="/marketplace">
              <Button variant="outline">
                Browse Marketplace
              </Button>
            </Link>
            <Link to="/retire">
              <Button>
                Retire Tokens
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Tokens Owned"
            value={totalOwned.toLocaleString()}
            subtitle="KPWATTS"
            icon={Package}
          />
          <KPICard
            title="Tokens Retired"
            value={totalRetired.toLocaleString()}
            subtitle="KPWATTS"
            icon={Award}
          />
          <KPICard
            title="CO₂ Offset"
            value={`${co2Offset.toLocaleString()}`}
            subtitle="kg CO₂"
            icon={Leaf}
          />
          <KPICard
            title="Portfolio Value"
            value={`$${(totalOwned * 0.08).toLocaleString()}`}
            subtitle="USD"
            icon={TrendingUp}
          />
        </div>

        {/* Impact Metrics */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Environmental Impact</CardTitle>
            <CardDescription>Your contribution to renewable energy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white dark:bg-green-500">
                  <Leaf className="h-6 w-6" />
                </div>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{treesEquivalent}</p>
                <p className="mt-1 text-sm text-green-700 dark:text-green-300">Trees Planted Equivalent</p>
              </div>

              <div className="rounded-lg border border-border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white dark:bg-blue-500">
                  <Package className="h-6 w-6" />
                </div>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{homesEquivalent}</p>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">Homes Powered (days)</p>
              </div>

              <div className="rounded-lg border border-border bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white dark:bg-purple-500">
                  <Award className="h-6 w-6" />
                </div>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{co2Offset.toLocaleString()}</p>
                <p className="mt-1 text-sm text-purple-700 dark:text-purple-300">kg CO₂ Avoided</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Purchase History */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
              <CardDescription>Your renewable energy credit purchases</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseHistory.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{purchase.id}</p>
                          <p className="text-xs text-muted-foreground">{purchase.producer}</p>
                        </div>
                      </TableCell>
                      <TableCell>{purchase.amount.toLocaleString()} kWh</TableCell>
                      <TableCell>${purchase.price}</TableCell>
                      <TableCell>
                        <StatusBadge status={purchase.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Retirement History */}
          <Card>
            <CardHeader>
              <CardTitle>Retirement History</CardTitle>
              <CardDescription>Tokens permanently retired for impact claims</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {retirementHistory.map((retirement) => (
                  <div
                    key={retirement.id}
                    className="rounded-lg border border-border p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{retirement.batchId}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {retirement.amount.toLocaleString()} kWh retired
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {retirement.co2.toLocaleString()} kg CO₂ offset
                        </p>
                      </div>
                      <StatusBadge status="retired" />
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                      <p className="text-xs text-muted-foreground">
                        {new Date(retirement.date).toLocaleDateString()}
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <a href={retirement.certificateUrl}>
                          Download Certificate
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
