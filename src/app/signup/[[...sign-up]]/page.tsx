import { SignUp } from '@clerk/nextjs';

export default function SignupPage() {
  return (
    <div className="lj-box">
      <div className="lj-box-header">Create Account</div>
      <div className="lj-box-content" style={{ display: 'flex', justifyContent: 'center' }}>
        <SignUp
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
