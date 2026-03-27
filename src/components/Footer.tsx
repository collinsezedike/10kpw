import { Link } from 'react-router';

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
                <Link to="/submit-batch" className="hover:text-foreground">
                  Submit Energy
                </Link>
              </li>
              <li>
                <Link to="/submit-batch" className="hover:text-foreground">
                  Mint Tokens
                </Link>
              </li>
              <li>
                <Link to="/producer-dashboard" className="hover:text-foreground">
                  Track Revenue
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground">For Buyers</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/marketplace" className="hover:text-foreground">
                  Browse Marketplace
                </Link>
              </li>
              <li>
                <Link to="/marketplace" className="hover:text-foreground">
                  Purchase Credits
                </Link>
              </li>
              <li>
                <Link to="/retire" className="hover:text-foreground">
                  Retire Tokens
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground">Company</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/about" className="hover:text-foreground">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/docs" className="hover:text-foreground">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-foreground">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 flex flex-col items-center gap-2 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <p>© 2026 KPWATTS. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
