import { Link, useLocation, useNavigate } from 'react-router';
import { Moon, Sun, Zap, LogOut, LayoutDashboard, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useUser, useClerk } from '@clerk/clerk-react';
import { Button } from './ui/button';
import { useEffect, useRef, useState } from 'react';

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();

  const [popupOpen, setPopupOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  const role = user?.unsafeMetadata?.role as string | undefined;
  const country = user?.unsafeMetadata?.country as string | undefined;
  const dashboardRoute = role === 'producer' ? '/producer-dashboard' : '/buyer-dashboard';
  const dashboardLabel = role === 'producer' ? 'Producer Dashboard' : 'Buyer Dashboard';

  const handleSignOut = async () => {
    setPopupOpen(false);
    await signOut();
    navigate('/');
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPopupOpen(false);
      }
    };
    if (popupOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popupOpen]);

  const userInitial =
    user?.firstName?.charAt(0) ??
    user?.emailAddresses[0]?.emailAddress?.charAt(0)?.toUpperCase() ??
    '?';

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Left — Logo + Nav */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold text-foreground">KPWATTS</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <Link to="/marketplace">
                <Button variant={isActive('/marketplace') ? 'secondary' : 'ghost'} size="sm">
                  Marketplace
                </Button>
              </Link>
              {isSignedIn && role && (
                <Link to={dashboardRoute}>
                  <Button variant={isActive(dashboardRoute) ? 'secondary' : 'ghost'} size="sm">
                    {dashboardLabel}
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Right — Theme + Auth */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            {!isLoaded ? null : isSignedIn ? (
              <div className="relative" ref={popupRef}>
                {/* Avatar trigger button */}
                <button
                  onClick={() => setPopupOpen((prev) => !prev)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground ring-2 ring-transparent hover:ring-primary/40 transition-all"
                >
                  {userInitial}
                </button>

                {/* Popup */}
                {popupOpen && (
                  <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-border bg-card shadow-xl">
                    {/* Header */}
                    <div className="flex items-start justify-between p-4 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                          {userInitial}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {user.firstName
                              ? `${user.firstName} ${user.lastName ?? ''}`.trim()
                              : 'Account'}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {user.emailAddresses[0]?.emailAddress}
                          </p>
                          {country && (
                            <p className="truncate text-xs text-muted-foreground mt-0.5">
                              {country}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setPopupOpen(false)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Role badge */}
                    {role && (
                      <div className="mx-4 mb-3 rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                        Signed in as{' '}
                        <span className="font-medium capitalize text-foreground">{role}</span>
                      </div>
                    )}

                    <div className="border-t border-border" />

                    {/* Actions */}
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setPopupOpen(false);
                          navigate(dashboardRoute);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        {dashboardLabel}
                      </button>

                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm">Connect</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}