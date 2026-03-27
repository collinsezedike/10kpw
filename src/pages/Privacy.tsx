export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-16">
        <div className="container mx-auto max-w-3xl lg:px-8">
          <h1 className="text-4xl font-bold text-foreground">Privacy Policy</h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: March 2026</p>
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="container mx-auto max-w-3xl space-y-10 lg:px-8">
          {[
            {
              title: '1. Information We Collect',
              body: 'We collect information you provide during registration (name, email, country, organisation role) and information generated through your use of the platform (energy batch submissions, purchase history, retirement records).',
            },
            {
              title: '2. Blockchain Data',
              body: 'Transactions on the Solana blockchain are public and immutable. Wallet addresses, token amounts, and transaction timestamps are permanently visible on-chain. We do not link wallet addresses to personal identity in public data.',
            },
            {
              title: '3. How We Use Your Information',
              body: 'We use your information to operate the platform, process transactions, send verification emails, provide customer support, and improve our services. We do not sell your personal data to third parties.',
            },
            {
              title: '4. Authentication',
              body: 'Authentication is handled by Clerk (clerk.com). Your password is never stored by KPWATTS. Please review Clerk\'s privacy policy for details on how authentication data is handled.',
            },
            {
              title: '5. Payment Data',
              body: 'Payment processing is handled by Interswitch. KPWATTS does not store payment card details. We retain payment reference IDs for transaction reconciliation.',
            },
            {
              title: '6. IoT Device Data',
              body: 'Energy generation data is fetched from connected inverters via the Enode API. This includes production rates, location data, and device identifiers. This data is used solely to verify energy generation for token minting.',
            },
            {
              title: '7. Data Retention',
              body: 'We retain account data for as long as your account is active. On-chain transaction data is permanent by the nature of blockchain technology. You may request deletion of off-chain personal data by contacting privacy@kpwatts.io.',
            },
            {
              title: '8. Security',
              body: 'We use industry-standard security practices including encrypted communications (TLS), secure key management for blockchain operations, and access controls on all backend systems.',
            },
            {
              title: '9. Contact',
              body: 'For privacy-related enquiries, contact privacy@kpwatts.io.',
            },
          ].map(({ title, body }) => (
            <div key={title}>
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
