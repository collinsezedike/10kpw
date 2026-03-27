import { ArrowRight, CheckCircle2, Leaf, ShoppingCart, Zap , Loader2} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Link } from 'react-router';
import { useUser } from '@clerk/clerk-react';
import { useState } from 'react';

export default function Landing() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState('');

  const role = user?.unsafeMetadata?.role as string | undefined;
  const isProducer = role === 'producer';

  const handleConnectDevice = async () => {
    setLinkError('');
    setLinking(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE ?? 'http://localhost:3001'}/api/enode/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user!.id }),
      });

      if (!res.ok) throw new Error('Failed to start device linking');

      const { linkUrl } = await res.json();
      window.location.href = linkUrl;
    } catch (err) {
      setLinkError('Could not start device connection. Please try again.');
    } finally {
      setLinking(false);
    }
  };
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background px-4 py-20 lg:py-32">
        <div className="container mx-auto lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground lg:text-6xl">
              Tokenize Renewable Energy Credits
            </h1>
            <p className="mt-6 text-lg text-muted-foreground lg:text-xl">
              KPWATTS connects renewable energy producers in emerging markets with global companies
              seeking verifiable climate impact through blockchain-verified energy credits.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              {!isLoaded ? null : !isSignedIn ? (
              <>
                <Link to="/auth">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/marketplace">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Explore Marketplace
                  </Button>
                </Link>
              </>
              ) : (
              <>
                {isProducer ? (
                  <Button
                    size="lg"
                    className="w-full sm:w-auto"
                    onClick={handleConnectDevice}
                    disabled={linking}
                  >
                    {linking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        Connect Your Device
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Link to="/auth?role=producer">
                    <Button size="lg" className="w-full sm:w-auto">
                      Register as Producer
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
                <Link to="/marketplace">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Explore Marketplace
                  </Button>
                </Link>
              </>
            )}
          </div>
          {linkError && (
            <p className="mt-4 text-sm text-destructive">{linkError}</p>
          )}
        </div>
      </div>
    </section>

      {/* For Producers Section */}
      <section className="px-4 py-20">
        <div className="container mx-auto lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Zap className="h-4 w-4" />
                For Producers
              </div>
              <h2 className="mt-4 text-3xl font-bold text-foreground lg:text-4xl">
                Monetize Your Clean Energy Generation
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Turn your renewable energy generation into tradeable digital assets. Get paid in real-time
                and access global markets without intermediaries.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold text-foreground">Direct Market Access</h3>
                    <p className="text-sm text-muted-foreground">
                      List your energy credits directly to global buyers
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold text-foreground">Instant Settlement</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive payments immediately via blockchain
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold text-foreground">Transparent Tracking</h3>
                    <p className="text-sm text-muted-foreground">
                      All transactions recorded immutably on-chain
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="lg:mt-12">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold">Submit Energy Data</h4>
                      <p className="text-sm text-muted-foreground">
                        Report monthly generation with verification
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold">Mint KPWATTS Tokens</h4>
                      <p className="text-sm text-muted-foreground">
                        1 token = 1 kWh of verified clean energy
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold">List & Earn Revenue</h4>
                      <p className="text-sm text-muted-foreground">
                        Set your price and sell to global buyers
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* For Buyers Section */}
      <section className="bg-muted/30 px-4 py-20">
        <div className="container mx-auto lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <Card className="order-2 lg:order-1 lg:mt-12">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold">Browse Marketplace</h4>
                      <p className="text-sm text-muted-foreground">
                        Filter by country, energy type, and price
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold">Purchase Credits</h4>
                      <p className="text-sm text-muted-foreground">
                        Buy verified renewable energy credits
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold">Retire for Impact</h4>
                      <p className="text-sm text-muted-foreground">
                        Claim environmental benefits with proof
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
                <ShoppingCart className="h-4 w-4" />
                For Buyers
              </div>
              <h2 className="mt-4 text-3xl font-bold text-foreground lg:text-4xl">
                Verifiable Climate Impact at Scale
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Purchase renewable energy credits from verified producers worldwide.
                Every token comes with immutable on-chain proof and transparent provenance.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 text-accent" />
                  <div>
                    <h3 className="font-semibold text-foreground">Fraud Prevention</h3>
                    <p className="text-sm text-muted-foreground">
                      Blockchain prevents double counting and fraud
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 text-accent" />
                  <div>
                    <h3 className="font-semibold text-foreground">ESG Compliance</h3>
                    <p className="text-sm text-muted-foreground">
                      Download certificates for regulatory reporting
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 text-accent" />
                  <div>
                    <h3 className="font-semibold text-foreground">Impact Metrics</h3>
                    <p className="text-sm text-muted-foreground">
                      Track CO₂ offset, trees, and homes powered
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 py-20">
        <div className="container mx-auto lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground lg:text-4xl">
              How KPWATTS Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three simple steps to transparent climate finance
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mt-6 font-semibold">Verify & Mint</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Producers submit verified renewable energy generation data
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                  <ShoppingCart className="h-8 w-8 text-accent" />
                </div>
                <h3 className="mt-6 font-semibold">Trade</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Global buyers purchase tokens representing clean energy
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <Leaf className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="mt-6 font-semibold">Retire & Prove</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Buyers retire tokens permanently for verifiable climate claims
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}