import type { UseSignInReturn, UseSignUpReturn } from '@clerk/clerk-react';
import type { NavigateFunction } from 'react-router';

type SignIn = UseSignInReturn['signIn'];
type SignUp = UseSignUpReturn['signUp'];

interface SignInParams {
  signIn: SignIn;
  email: string;
  password: string;
  selectedRole: string;
  navigate: NavigateFunction;
  setError: (msg: string) => void;
  setIsConnecting: (val: boolean) => void;
}

interface SignUpParams {
  signUp: SignUp;
  email: string;
  password: string;
  name: string;
  country: string;
  selectedRole: string;
  navigate: NavigateFunction;
  setError: (msg: string) => void;
  setIsConnecting: (val: boolean) => void;
}

interface OAuthParams {
  signIn: SignIn;
  strategy: 'oauth_google' | 'oauth_apple';
  setError: (msg: string) => void;
  setIsConnecting: (val: boolean) => void;
}

// interface SolanaParams {
//   signIn: SignIn;
//   selectedRole: string;
//   navigate: NavigateFunction;
//   setError: (msg: string) => void;
//   setIsConnecting: (val: boolean) => void;
// }

export const getDashboardRoute = (role: string) =>
  role === 'producer' ? '/producer-dashboard' : '/buyer-dashboard';

export async function handleEmailSignIn({
  signIn,
  email,
  password,
  selectedRole,
  navigate,
  setError,
  setIsConnecting,
}: SignInParams) {
  setError('');
  setIsConnecting(true);
  try {
    const result = await signIn.create({ identifier: email, password });
    if (result.status === 'complete') {
      navigate('/dashboard');
    }
  } catch (err: any) {
    setError(err.errors?.[0]?.message || 'Failed to sign in. Please check your credentials.');
  } finally {
    setIsConnecting(false);
  }
}

export async function handleEmailSignUp({
  signUp,
  email,
  password,
  name,
  country,
  selectedRole,
  navigate,
  setError,
  setIsConnecting,
}: SignUpParams) {
  setError('');
  setIsConnecting(true);
  try {
    await signUp.create({ emailAddress: email, password, firstName: name });

    // Use unsafeMetadata for client-side writable fields (publicMetadata requires backend/API key)
    await signUp.update({
      unsafeMetadata: { role: selectedRole, country },
    });

    await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    navigate('/verify-email', { state: { email, role: selectedRole } });
  } catch (err: any) {
    setError(err.errors?.[0]?.message || 'Failed to create account. Please try again.');
  } finally {
    setIsConnecting(false);
  }
}

export async function handleOAuthSignIn({
  signIn,
  strategy,
  setError,
  setIsConnecting,
}: OAuthParams) {
  setError('');
  setIsConnecting(true);
  try {
    await signIn.authenticateWithRedirect({
      strategy,
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/dashboard',
    });
  } catch (err: any) {
    setError(err.errors?.[0]?.message || 'Sign-in failed. Please try again.');
    setIsConnecting(false);
  }
}

// export async function handleSolanaSignIn({
//   signIn,
//   selectedRole,
//   navigate,
//   setError,
//   setIsConnecting,
// }: SolanaParams) {
//   setError('');
//   setIsConnecting(true);
//   try {
//     const solana = (window as any).solana;

//     if (!solana?.isPhantom) {
//       setError('Phantom wallet not found. Please install it from phantom.app');
//       return;
//     }

//     // 1. Connect and get wallet address
//     await solana.connect();
//     const walletAddress: string = solana.publicKey.toString();

//     // 2. Start sign-in with wallet address as identifier
//     await signIn.create({ identifier: walletAddress });

//     // 3. Request the nonce from Clerk
//     const { nonce } = await signIn.prepareFirstFactor({
//       strategy: 'web3_solana_signature',
//     } as any);

//     // 4. Sign the nonce
//     const encoded = new TextEncoder().encode(nonce);
//     const { signature } = await solana.signMessage(encoded, 'utf8');
//     const hexSignature = Buffer.from(signature).toString('hex');

//     // 5. Verify
//     const result = await signIn.attemptFirstFactor({
//       strategy: 'web3_solana_signature',
//       signature: hexSignature,
//     } as any);

//     if (result.status === 'complete') {
//       localStorage.setItem('userRole', selectedRole);
//       navigate(getDashboardRoute(selectedRole));
//     }
//   } catch (err: any) {
//     setError(err.errors?.[0]?.message || 'Solana sign-in failed. Please try again.');
//   } finally {
//     setIsConnecting(false);
//   }
// }