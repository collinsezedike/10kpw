import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useUser } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';

/**
 * Reads the user's role from Clerk unsafeMetadata once the session is loaded
 * and redirects to the correct dashboard. Used as the post-auth landing point
 * for both email sign-in and OAuth (so we never rely on a local `selectedRole`
 * state that the user may not have explicitly set on the login form).
 */
export default function DashboardRedirect() {
  const { isLoaded, isSignedIn, user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      navigate('/auth', { replace: true });
      return;
    }
    const role = user.unsafeMetadata?.role as string | undefined;
    navigate(role === 'buyer' ? '/buyer-dashboard' : '/producer-dashboard', { replace: true });
  }, [isLoaded, isSignedIn, user]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
