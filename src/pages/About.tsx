import { Leaf, Shield, Zap, Globe } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-20">
        <div className="container mx-auto max-w-3xl text-center lg:px-8">
          <h1 className="text-4xl font-bold text-foreground lg:text-5xl">About KPWATTS</h1>
          <p className="mt-6 text-lg text-muted-foreground">
            We are building the infrastructure for a transparent, verifiable renewable energy
            credit market — starting in Africa, scaling globally.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="px-4 py-16">
        <div className="container mx-auto max-w-3xl lg:px-8">
          <h2 className="text-2xl font-bold text-foreground">Our Mission</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Renewable energy producers in emerging markets generate gigawatts of clean power
            every year, yet lack access to the global markets that value it. At the same time,
            companies worldwide need verifiable proof of renewable energy consumption for ESG
            reporting and carbon accounting.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            KPWATTS bridges this gap by tokenising verified energy generation on the Solana
            blockchain — creating an immutable, auditable trail from producer meter to corporate
            retirement certificate.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted/30 px-4 py-16">
        <div className="container mx-auto lg:px-8">
          <h2 className="mb-10 text-center text-2xl font-bold text-foreground">What We Stand For</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Shield, title: 'Transparency', desc: 'Every mint, trade, and retirement is permanently recorded on-chain.' },
              { icon: Zap, title: 'Efficiency', desc: 'Direct market access without intermediaries, powered by Solana.' },
              { icon: Leaf, title: 'Impact', desc: 'Real CO₂ offsets backed by verified generation data from IoT meters.' },
              { icon: Globe, title: 'Inclusion', desc: 'Opening global climate finance to producers in emerging markets.' },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title}>
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team placeholder */}
      <section className="px-4 py-16">
        <div className="container mx-auto max-w-3xl text-center lg:px-8">
          <h2 className="text-2xl font-bold text-foreground">Built by a Team That Cares</h2>
          <p className="mt-4 text-muted-foreground">
            We are engineers, climate advocates, and finance professionals united by a belief
            that blockchain technology can unlock a fairer, greener energy economy.
          </p>
          <p className="mt-6 text-sm text-muted-foreground italic">
            Team profiles coming soon.
          </p>
        </div>
      </section>
    </div>
  );
}
