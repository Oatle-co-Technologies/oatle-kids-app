import "./ComingSoon.css";

function ComingSoon() {
  return (
    <main className="coming-soon-page">
      <div className="stars" aria-hidden="true">
        <span>✦</span>
        <span>·</span>
        <span>✧</span>
        <span>·</span>
        <span>✦</span>
        <span>·</span>
        <span>✧</span>
      </div>

      <section className="coming-soon-card">
        <img
          src="/logo.png"
          alt="Oatle Kids"
          className="coming-soon-logo"
        />

        <p className="eyebrow">OATLE KIDS</p>

        <h1>
          Something stellar
          <br />
          is coming.
        </h1>

        <p className="coming-soon-intro">
          We’re working behind the scenes to make your
          learning adventure even better.
        </p>

        <div className="coming-soon-planet" aria-hidden="true">
          🪐
        </div>

        <p className="coming-soon-status">
          <span className="status-dot" />
          COMING SOON
        </p>

        <div className="coming-soon-stores">
          <div className="coming-soon-store">
            <span className="store-icon"></span>
            <div>
              <small>Coming soon to the</small>
              <strong>App Store</strong>
            </div>
          </div>

          <div className="coming-soon-store">
            <span className="store-icon">▶</span>
            <div>
              <small>Coming soon to</small>
              <strong>Google Play</strong>
            </div>
          </div>
        </div>

        <p className="coming-soon-footer">
          Keep your eyes on the stars. 🚀
        </p>
      </section>
    </main>
  );
}

export default ComingSoon;