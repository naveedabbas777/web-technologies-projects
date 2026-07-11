import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail, fetchSignInMethodsForEmail } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const login = async () => {
    if (!email || !password) return setError('Please enter email and password');
    setError(null);
    setLoading(true);

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods?.length && !methods.includes('password')) {
        setError(`This account is configured for: ${methods.join(', ')}. Use that provider or click "Forgot password?" to set a password.`);
        setLoading(false);
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);
      navigate("/admin");
    } catch (err) {
      console.error('Login error', err.code, err.message);
      let friendly = err.message || 'Sign-in failed';
      if (err.code === 'auth/invalid-credential') {
        friendly = 'Invalid credential — the authentication token or provider is invalid. If you used email/password, try the "Forgot password?" flow or sign in with the provider used to register the account.';
      } else if (err.code === 'auth/wrong-password') {
        friendly = 'Incorrect password. Use "Forgot password?" to reset.';
      } else if (err.code === 'auth/user-not-found') {
        friendly = 'No account found for this email. Please sign up first or check the email address.';
      }
      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!email) return setError('Enter the email address to receive a password reset link');
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setError('Password reset email sent — check your inbox');
    } catch (err) {
      console.error('Reset password error', err.code, err.message);
      setError(err.message || 'Failed to send reset email');
    }
  };

  return (
    <section style={{ padding: '80px 10%' }}>
      <div className="glass" style={{ maxWidth: 420, margin: '0 auto' }}>
        <h2>Admin Login</h2>

        {error && (
          <div className={`status ${error?.toLowerCase().includes('password reset') ? 'success' : 'error'}`}>
            {error}
          </div>
        )}

        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <div style={{ position: 'relative', marginTop: 8 }}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ paddingRight: 44 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(prev => !prev)}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              padding: 4,
              lineHeight: 1,
              cursor: 'pointer'
            }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <button onClick={login} className="btn" disabled={loading || !email || !password}>{loading ? 'Signing in…' : 'Login'}</button>
          <button onClick={resetPassword} className="btn secondary" disabled={!email}>Forgot password?</button>
        </div>

        <p className="lead" style={{ marginTop: 12 }}>
          If you keep seeing "incorrect credentials", verify the user exists in Firebase Console → Authentication and that Email/Password sign-in is enabled.
        </p>
      </div>
    </section>
  );
}

export default Login;
