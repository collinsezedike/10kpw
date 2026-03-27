import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Zap } from 'lucide-react';
import { useSignIn, useSignUp } from '@clerk/clerk-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  handleEmailSignIn,
  handleEmailSignUp,
  handleOAuthSignIn,
  // handleSolanaSignIn,
} from '../libs/auth.helper';

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const AppleIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
    <path d="M14.95 10.94c-.02-1.48.66-2.61 1.69-3.44-.63-.94-1.6-1.49-2.72-1.53-1.14-.1-2.23.68-2.81.68-.58 0-1.48-.66-2.44-.64-1.25.02-2.41.74-3.06 1.88-1.31 2.3-.33 5.7.93 7.57.62.92 1.36 1.95 2.34 1.91.93-.04 1.29-.61 2.42-.61 1.13 0 1.45.61 2.43.59 1.01-.02 1.65-.9 2.26-1.83.71-1.05 1-2.07 1.02-2.12-.02-.01-1.96-.77-1.98-3.04zM12.95 5.3c.52-.64.86-1.51.75-2.4-.74.03-1.62.51-2.13 1.14-.48.58-.88 1.47-.75 2.33.81.06 1.6-.43 2.13-1.07z" />
  </svg>
);

// const SolanaIcon = () => (
//   <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
//     <path d="M20.12 5.5H4.53c-.46 0-.7.55-.37.88l3.82 3.82c.16.16.38.25.6.25h15.58c.46 0 .7-.55.37-.88l-3.82-3.82c-.16-.16-.38-.25-.6-.25z" />
//     <path d="M3.88 9.56c-.16.16-.25.38-.25.6v.01c0 .22.09.44.25.6l3.82 3.82c.16.16.38.25.6.25h15.58c.46 0 .7-.55.37-.88l-3.82-3.82c-.16-.16-.38-.25-.6-.25H3.88z" />
//     <path d="M8.58 13.5H4.53c-.46 0-.7.55-.37.88l3.82 3.82c.16.16.38.25.6.25h15.58c.46 0 .7-.55.37-.88l-3.82-3.82c-.16-.16-.38-.25-.6-.25z" />
//   </svg>
// );

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roleFromParams = searchParams.get('role');

  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [selectedRole, setSelectedRole] = useState(roleFromParams || 'producer');

  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();

  if (!signInLoaded || !signUpLoaded) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  const sharedParams = { navigate, setError, setIsConnecting };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">KPWATTS</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Welcome to KPWATTS</CardTitle>
            <CardDescription>Sign in or create an account to continue</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Email/Password Tabs */}
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleEmailSignIn({ signIn, email, password, selectedRole, ...sharedParams });
                  }}
                  className="space-y-4 pt-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isConnecting}>
                    {isConnecting ? 'Signing in...' : 'Login'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleEmailSignUp({ signUp, email, password, name, country, selectedRole, ...sharedParams });
                  }}
                  className="space-y-4 pt-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">Organization Name</Label>
                    <Input
                      id="name"
                      placeholder="Your Company"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      placeholder="Kenya"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>I am a</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={selectedRole === 'producer' ? 'default' : 'outline'}
                        onClick={() => setSelectedRole('producer')}
                      >
                        Producer
                      </Button>
                      <Button
                        type="button"
                        variant={selectedRole === 'buyer' ? 'default' : 'outline'}
                        onClick={() => setSelectedRole('buyer')}
                      >
                        Buyer
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isConnecting}>
                    {isConnecting ? 'Creating account...' : 'Register'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Social Login */}
            <div className="space-y-3">
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-border" />
                <span className="mx-3 shrink-0 text-xs uppercase text-muted-foreground">
                  Or sign in with
                </span>
                <div className="flex-grow border-t border-border" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleOAuthSignIn({ signIn, strategy: 'oauth_google', setError, setIsConnecting })}
                  disabled={isConnecting}
                >
                  <GoogleIcon />
                  <span className="ml-2">Google</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOAuthSignIn({ signIn, strategy: 'oauth_apple', setError, setIsConnecting })}
                  disabled={isConnecting}
                >
                  <AppleIcon />
                  <span className="ml-2">Apple</span>
                </Button>
              </div>
            </div>

            {/* Wallet Login — visually separated */}
            <div className="space-y-3">
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-border" />
                <span className="mx-3 shrink-0 text-xs uppercase text-muted-foreground">
                  Or connect wallet
                </span>
                <div className="flex-grow border-t border-border" />
              </div>

              {/* <Button
                variant="outline"
                className="w-full border-violet-500/40 bg-violet-500/5 text-foreground hover:bg-violet-500/10 hover:border-violet-500/60"
                onClick={() => handleSolanaSignIn({ signIn, selectedRole, navigate, setError, setIsConnecting })}
                disabled={isConnecting}
              >
                <SolanaIcon />
                <span className="ml-2">Phantom / Solana Wallet</span>
              </Button> */}
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="underline underline-offset-4 hover:text-foreground">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="underline underline-offset-4 hover:text-foreground">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}