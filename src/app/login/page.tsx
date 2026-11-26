import { Suspense } from 'react';
import { LoginForm } from '@/components/LoginForm';

export const metadata = { title: 'Log in or sign up' };

export default function LoginPage() {
  return (
    <div className="container-x" style={{ padding: '40px 0', display: 'grid', placeItems: 'center' }}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
