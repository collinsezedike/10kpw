export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="font-semibold text-foreground">KPWATTS</h3>
            <p className="mt-4 text-sm text-muted-foreground">
              Tokenizing renewable energy for a sustainable future.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground">For Producers</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground">
                  Submit Energy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Mint Tokens
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Track Revenue
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground">For Buyers</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground">
                  Browse Marketplace
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Purchase Credits
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Retire Tokens
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground">Company</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>© 2026 KPWATTS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
