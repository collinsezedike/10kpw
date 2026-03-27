import { BookOpen, Code2, FileText, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const sections = [
  {
    icon: Zap,
    title: 'Getting Started',
    items: [
      'Create an account as a Producer or Buyer',
      'Producers: connect your inverter via the Enode integration',
      'Buyers: browse the marketplace and purchase energy credits',
    ],
  },
  {
    icon: FileText,
    title: 'For Producers',
    items: [
      'Submit your monthly energy generation batch',
      'Tokens are minted 1:1 with verified kWh (1 token = 1 kWh)',
      'List your tokens on the marketplace at your chosen price',
      'Receive payment via Interswitch once a buyer purchases',
    ],
  },
  {
    icon: BookOpen,
    title: 'For Buyers',
    items: [
      'Browse listings filtered by country, energy type, and price',
      'Purchase credits — payment is processed via Interswitch',
      'Retire tokens to claim your CO₂ offset certificate',
      'Download your retirement certificate for ESG reporting',
    ],
  },
  {
    icon: Code2,
    title: 'On-Chain Architecture',
    items: [
      'Smart contract deployed on Solana (program ID: 3UDZv3u377JyurUCrg8ntMH3yx55Yrkv71JNKjyntqau)',
      'Tokens are zero-decimal SPL tokens — each unit = 1 kWh',
      'Listings held in escrow PDAs until purchase is confirmed',
      'All retirements emit on-chain events with meter IDs',
    ],
  },
];

export default function Documentation() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-20">
        <div className="container mx-auto max-w-3xl text-center lg:px-8">
          <h1 className="text-4xl font-bold text-foreground lg:text-5xl">Documentation</h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Everything you need to know about using the KPWATTS platform.
          </p>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="container mx-auto max-w-4xl lg:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            {sections.map(({ icon: Icon, title, items }) => (
              <Card key={title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="h-5 w-5 text-primary" />
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="mt-12 text-center text-sm text-muted-foreground italic">
            Full API reference and integration guides coming soon.
          </p>
        </div>
      </section>
    </div>
  );
}
