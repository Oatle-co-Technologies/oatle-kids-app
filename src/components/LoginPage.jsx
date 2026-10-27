import { useState } from "react";
import PasswordField from "./PasswordField";
import { supabase } from "../lib/supabase";
function LoginPage({ onLogin }) {
  const isSignUp = false;
  const [isResetRequest, setIsResetRequest] = useState(false);
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

    const { data, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    setLoading(false);

    if (loginError) {
      setError(loginError.message);
      return;
    }

    onLogin(data.user);
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
          {isResetRequest ? "ACCOUNT RECOVERY" : isSignUp ? "JOIN THE ADVENTURE" : "PRIVATE TESTING"}
        </p>

        <h1>{isResetRequest ? "Forgot your password?" : isSignUp ? "Create your account!" : "Invited testers only"}</h1>

        <p className="login-intro">
          {isResetRequest
            ? "Enter your account email and we’ll send you a password reset link."
            : isSignUp
            ? "Create an account to start your space learning adventure."
            : "Oatle Kids is in private testing. Log in with the account you have been given access to."}
        </p>


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
        ) : <p className="login-signup">Public registration is closed. Only approved testers can enter.</p>}
      </div>
    </main>
  );
}

export default LoginPage;
