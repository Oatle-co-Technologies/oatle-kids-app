import { useState } from "react";
import PasswordField from "./PasswordField";
import { supabase } from "../lib/supabase";
function LoginPage({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(() => new URLSearchParams(window.location.search).get('auth') === 'signup');
  const [isResetRequest, setIsResetRequest] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    if (isResetRequest) {
      try {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/app.html?reset=1`,
        });
        if (resetError) setError(resetError.message);
        else setMessage("If an account exists for this email, you’ll receive a password reset link. Check your inbox and spam folder.");
      } catch {
        setError("We couldn't request a reset link. Check your connection and try again.");
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      if (isSignUp) {
        const { data, error: signupError } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { data: { email_marketing_opt_in: marketingConsent, email_marketing_version: '2026-11-10' }, emailRedirectTo: `${window.location.origin}/app.html` },
        });
        if (signupError) { setError(signupError.message); return; }
        if (data.session) onLogin(data.user);
        else setMessage('Check your email to confirm your account, then log in to choose a subscription or enter your promo code.');
      } else {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (loginError) { setError(loginError.message); return; }
        onLogin(data.user);
      }
    } catch {
      setError("We couldn't connect. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-card">
        <a href="/" style={{ display: "inline-block", marginBottom: "16px" }}>About Oatle Kids</a>
          <div className="login-logo">
  <img
    src="/icons/oatle-kids-512.png"
    alt="Oatle Kids"
    className="login-logo-image"
  />
</div>
        <p className="eyebrow">
          {isResetRequest ? "ACCOUNT RECOVERY" : isSignUp ? "JOIN THE ADVENTURE" : "WELCOME BACK"}
        </p>

        <h1>{isResetRequest ? "Forgot your password?" : isSignUp ? "Create your account!" : "Log in to Oatle Kids"}</h1>

        <p className="login-intro">
          {isResetRequest
            ? "Enter your account email and we’ll send you a password reset link."
            : isSignUp
            ? "Create your parent account, then choose Single Child at R120/month or Family at R200/month, or use a promo code."
            : "Sign in to continue your adventures. New here? Create a parent account below."}
        </p>


        <aside className="pwa-install-panel" aria-label="Install Oatle Kids">
          <p>Keep Oatle Kids on your home screen</p>
          <a className="pwa-open-chrome-button" href="/#install">How to install Oatle Kids</a>
          <p className="pwa-install-help">On iPhone or iPad, use Safari’s Share menu → Add to Home Screen. You can also keep playing in this browser.</p>
        </aside>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Your email"
              autoComplete="email"
              required
            />
          </label>

          {!isResetRequest && (
            <PasswordField
              key={isSignUp ? "signup" : "login"}
              id="login-password"
              label="Password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="Your password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              minLength={6}
              required
            />
          )}

          {isSignUp && !isResetRequest && <label className="signup-terms"><input type="checkbox" required />
            <span>I agree to the <a href="/terms.html" target="_blank" rel="noopener noreferrer">Terms</a> and <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</span>
          </label>}
          {isSignUp && !isResetRequest && <label className="signup-terms"><input type="checkbox" checked={marketingConsent} onChange={e => setMarketingConsent(e.target.checked)} />
            <span>Yes, email me Oatle Kids news, offers and subscription reminders (optional). I can unsubscribe at any time. Assessment reports are separate.</span>
          </label>}
          {error && <p className="login-error" role="alert">{error}</p>}

          {message && <p className="login-message" role="status">{message}</p>}

          <button
            className="primary-button login-button"
            type="submit"
            disabled={loading}
          >
            {isResetRequest ? (loading ? "Sending..." : "Send reset link") : loading
              ? isSignUp
                ? "Creating..."
                : "Launching..."
              : isSignUp
                ? "Create Account"
                : "Log In"}
          </button>
        </form>

        {!isSignUp && !isResetRequest && (
          <button
            className="text-button"
            type="button"
            onClick={() => {
              setError("");
              setMessage("");
              setIsResetRequest(true);
              setPassword("");
            }}
          >
            Forgot password?
          </button>
        )}

        {isResetRequest ? (
          <button className="text-button" type="button" disabled={loading} onClick={() => {
            setIsResetRequest(false);
            setError("");
            setMessage("");
          }}>Back to log in</button>
        ) : <p className="login-signup">{isSignUp ? 'Already have an account?' : 'New to Oatle Kids?'}{' '}
          <button className="text-button" type="button" disabled={loading} onClick={() => {
            setIsSignUp(value => !value); setError(''); setMessage(''); setPassword('');
          }}>{isSignUp ? 'Log in' : 'Create an account'}</button>
        </p>}
      </div>
    </main>
  );
}

export default LoginPage;
