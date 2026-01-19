import { SignIn } from '@clerk/nextjs';

export default function LoginPage() {
  return (
    <div className="lj-box">
      <div className="lj-box-header">Login</div>
      <div className="lj-box-content" style={{ display: 'flex', justifyContent: 'center' }}>
        <SignIn
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-none',
            },
          }}
        />
      </div>
    </div>
  );
}
