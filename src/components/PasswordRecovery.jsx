import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function PasswordRecovery({ user, onDone }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Use at least 8 characters for your new password.");
      return;
    }
    if (password !== confirmation) {
      setError("The passwords don’t match.");
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setPassword("");
      setConfirmation("");
      setUpdated(true);
    } catch {
      setError("We couldn't update your password. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function returnToLogin() {
    setLoading(true);
    setError("");
    try {
      const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
      if (signOutError) {
        setError("We couldn't sign you out. Please try again.");
        return;
      }
      onDone();
    } catch {
      setError("We couldn't return to login. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <p className="eyebrow">ACCOUNT RECOVERY</p>
        <h1>{updated ? "Password updated" : "Reset your password"}</h1>
        {updated ? (
          <p className="login-message" role="status">Your password has been updated. Return to log in with your new password.</p>
        ) : !user ? (
          <p className="login-error" role="alert">This reset link is invalid or has expired. Return to log in and request a new link using Forgot password.</p>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <label>New password
              <input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} />
            </label>
            <label>Confirm new password
              <input type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={event => setConfirmation(event.target.value)} />
            </label>
            <button className="primary-button login-button" type="submit" disabled={loading}>{loading ? "Updating..." : "Update password"}</button>
          </form>
        )}
        {error && <p className="login-error" role="alert">{error}</p>}
        <button className="text-button" type="button" disabled={loading} onClick={returnToLogin}>Back to log in</button>
      </div>
    </main>
  );
}
