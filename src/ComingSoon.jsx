import "./ComingSoon.css";

function ComingSoon() {
  return (
    <main className="coming-soon">
      <div className="coming-soon-content">

        <img
          src="/logo.png"
          alt="Oatle Kids"
          className="coming-soon-logo"
        />

        <h1>Coming Soon</h1>

        <p>
          We’re working behind the scenes to make Oatle Kids
          even better.
        </p>

        <p className="coming-soon-subtitle">
          An educational digital adventure for little learners.
        </p>

        <div className="store-badges">
          <div className="store-badge">
            <span>Coming soon to</span>
            <strong>App Store</strong>
          </div>

          <div className="store-badge">
            <span>Coming soon to</span>
            <strong>Google Play</strong>
          </div>
        </div>

      </div>
    </main>
  );
}

export default ComingSoon;