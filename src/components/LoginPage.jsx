import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
} from "../pwa";

function LoginPage({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(
    getDeferredInstallPrompt
  );
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [showAndroidInstall, setShowAndroidInstall] = useState(() => {
    const isNativeApp = Boolean(
      window.Capacitor?.isNativePlatform?.()
    );
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    const isAndroid = /Android/i.test(window.navigator.userAgent);

    return isAndroid && !isNativeApp && !isStandalone;
  });
  const [chromeLaunchUrl] = useState(() => {
    const currentUrl = new URL(window.location.href);
    const fallbackUrl = encodeURIComponent(currentUrl.href);
    const path = `${currentUrl.host}${currentUrl.pathname}${currentUrl.search}`;

    return `intent://${path}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${fallbackUrl};end`;
  });

  useEffect(() => {
    const handleInstallReady = (event) => {
      setInstallPrompt(event.detail);
      setShowInstallHelp(false);
      setShowAndroidInstall(true);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setShowInstallHelp(false);
      setShowAndroidInstall(false);
    };

    window.addEventListener(
      "oatle-install-ready",
      handleInstallReady
    );
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "oatle-install-ready",
        handleInstallReady
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      setShowInstallHelp(true);
      return;
    }

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;

      setShowInstallHelp(choice.outcome !== "accepted");
    } catch {
      setShowInstallHelp(true);
    } finally {
      clearDeferredInstallPrompt();
      setInstallPrompt(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    if (isSignUp) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      setLoading(false);

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.session && data.user) {
        onLogin(data.user);
        return;
      }

      setMessage(
        "Account created! Check your email to confirm your account, then log in."
      );

      setIsSignUp(false);
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
          <div className="login-logo">
  <img
    src="/icons/oatle-kids-512.png"
    alt="Oatle Kids"
    className="login-logo-image"
  />
</div>
        <p className="eyebrow">
          {isSignUp ? "JOIN THE ADVENTURE" : "WELCOME, CAPTAIN"}
        </p>

        <h1>{isSignUp ? "Create your account!" : "Welcome back!"}</h1>

        <p className="login-intro">
          {isSignUp
            ? "Create an account to start your space learning adventure."
            : "Log in to continue your space learning adventure."}
        </p>

        {showAndroidInstall && (
          <section className="pwa-install-panel" aria-label="Install Oatle Kids">
            <p>Want Oatle Kids on this device?</p>
            <button
              className="pwa-install-button"
              type="button"
              onClick={handleInstall}
            >
              Install Oatle Kids
            </button>
            {showInstallHelp && (
              <div className="pwa-install-help">
                <p>
                  This browser has not made Android&apos;s install window
                  available yet. Open the page directly in Chrome, then tap
                  <strong> Install Oatle Kids</strong> again.
                </p>
                <a
                  className="pwa-open-chrome-button"
                  href={chromeLaunchUrl}
                >
                  Open in Chrome
                </a>
                <p>
                  If you are already in Chrome, refresh once. You can also use
                  Chrome&apos;s three-dot menu and choose
                  <strong> Add to Home screen</strong>.
                </p>
              </div>
            )}
          </section>
        )}

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

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              minLength={6}
              required
            />
          </label>

          {error && <p className="login-error">{error}</p>}

          {message && <p className="login-message">{message}</p>}

          <button
            className="primary-button login-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? isSignUp
                ? "Creating..."
                : "Launching..."
              : isSignUp
                ? "Create Account 🚀"
                : "Log In 🚀"}
          </button>
        </form>

        {!isSignUp && (
          <button
            className="text-button"
            type="button"
            onClick={() => {
              setError("");
              setMessage("");
              // Password reset will be added next.
            }}
          >
            Forgot password?
          </button>
        )}

        <p className="login-signup">
          {isSignUp
            ? "Already have an account? "
            : "Don't have an account? "}

          <button
            className="text-button"
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
              setMessage("");
              setEmail("");
              setPassword("");
            }}
          >
            {isSignUp ? "Log in" : "Sign up"}
          </button>
        </p>
      </div>
    </main>
  );
}

export default LoginPage;
