'use client';

import Link from 'next/link';

export default function VerifyRequestPage() {
  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', textAlign: 'center', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h1>Check your email</h1>
      <p>A sign in link has been sent to your email address.</p>
      <p>
        <Link href="/">Go back to Home</Link>
      </p>
    </div>
  );
}
