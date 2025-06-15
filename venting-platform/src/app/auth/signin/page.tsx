'use client';

import { useState, useEffect } from 'react';
import { signIn, getProviders, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [provider, setProvider] = useState<any>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/'); // Redirect to home if already authenticated
    }
  }, [status, router]);

  useEffect(() => {
    (async () => {
      const res = await getProviders();
      if (res && res.email) {
        setProvider(res.email);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider || !email) return;
    await signIn(provider.id, { email, redirect: false });
    // Redirect to a verify request page or show a message
    router.push('/auth/verify-request');
  };

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (status === 'authenticated') {
    return <p>You are already signed in. Redirecting...</p>;
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h1>Sign In</h1>
      {provider && (
        <form onSubmit={handleSubmit}>
          <p>Sign in with your email address for a magic link.</p>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <button
            type="submit"
            style={{ width: '100%', padding: '10px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Sign in with Email
          </button>
        </form>
      )}
      {!provider && status !== 'loading' && (
        <p>Email provider not available. Please check server configuration.</p>
      )}
    </div>
  );
}
