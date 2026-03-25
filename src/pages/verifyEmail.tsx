// app/verify-email.tsx
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useSignUp } from '@clerk/clerk-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function VerifyEmail() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { signUp, isLoaded } = useSignUp();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!signUp) return;
        setLoading(true);
        setError('');

        try {
            const result = await signUp.attemptEmailAddressVerification({ code });

            if (result.status === 'complete') {
                // Store role from signup
                localStorage.setItem('userRole', state?.role || 'producer');
                navigate(state?.role === 'producer' ? '/producer-dashboard' : '/buyer-dashboard');
            }
        } catch (err: any) {
            setError(err.errors?.[0]?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    if (!isLoaded) return <div>Loading...</div>;

    return (
        <div className="flex min-h-screen items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Verify your email</CardTitle>
                    <CardDescription>
                        We sent a verification code to {state?.email}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleVerify} className="space-y-4">
                        {error && (
                            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="code">Verification Code</Label>
                            <Input
                                id="code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="123456"
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify Email'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}