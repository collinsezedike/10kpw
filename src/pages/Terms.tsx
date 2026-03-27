export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-16">
        <div className="container mx-auto max-w-3xl lg:px-8">
          <h1 className="text-4xl font-bold text-foreground">Terms of Service</h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: March 2026</p>
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="container mx-auto max-w-3xl space-y-10 lg:px-8">
          {[
            {
              title: '1. Acceptance of Terms',
              body: 'By accessing or using the KPWATTS platform, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.',
            },
            {
              title: '2. Platform Use',
              body: 'KPWATTS provides a marketplace for tokenised renewable energy credits (RECs). Producers may list verified energy generation; buyers may purchase and retire these credits. All transactions are recorded on the Solana blockchain and are irreversible.',
            },
            {
              title: '3. Eligibility',
              body: 'You must be at least 18 years of age and have the legal authority to enter into contracts on behalf of your organisation to use this platform.',
            },
            {
              title: '4. Token Retirement',
              body: 'Once energy credits are retired, the action is permanent and cannot be reversed. Retired tokens are burned on-chain and cannot be transferred or reused. You are responsible for retiring the correct quantity.',
            },
            {
              title: '5. Payment',
              body: 'Payments are processed via Interswitch. KPWATTS does not store payment card details. All pricing is displayed in USD. Exchange rates may apply depending on your payment method.',
            },
            {
              title: '6. Verification',
              body: 'KPWATTS relies on IoT meter data via the Enode API to verify energy generation. While we take reasonable steps to validate data, we cannot guarantee the accuracy of third-party data sources.',
            },
            {
              title: '7. Limitation of Liability',
              body: 'KPWATTS is provided "as is". To the maximum extent permitted by law, KPWATTS disclaims all warranties and shall not be liable for any indirect, incidental, or consequential damages.',
            },
            {
              title: '8. Changes',
              body: 'We reserve the right to update these terms at any time. Continued use of the platform after changes constitutes acceptance of the revised terms.',
            },
            {
              title: '9. Contact',
              body: 'For questions about these terms, contact us at legal@kpwatts.io.',
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
