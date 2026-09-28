import "./ComingSoon.css";

function ComingSoon() {
  return (
    <main className="coming-soon">
      <div className="coming-soon-content">
        <img
          src="/oatle-kids-wordmark.png"
          alt="Oatle Kids"
          className="coming-soon-logo"
        />

        <p className="eyebrow">
          OATLE KIDS
        </p>

        <h1>
          Something stellar
          <br />
          is coming.
        </h1>

        <p className="coming-soon-description">
          We’re working behind the scenes to make
          your learning adventure even better.
        </p>

        <div
          className="coming-soon-planet"
          aria-hidden="true"
        >
          🚀
        </div>

        <p className="coming-soon-status">
          COMING SOON
        </p>

        <div className="coming-soon-stores">
          {/* APP STORE */}

          <div className="store-badge">
            <svg
              className="store-icon app-store-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.39 1.8-3.12 1.87-2.38 5.97.48 7.12-.57 1.5-1.32 2.99-2.52 4.09zM12.03 7.25C11.88 5.02 13.69 3.18 15.78 3c.29 2.58-2.34 4.5-3.75 4.25z"
              />
            </svg>

            <div>
              <small>Coming soon to the</small>
              <strong>App Store</strong>
            </div>
          </div>

          {/* GOOGLE PLAY */}

          <div className="store-badge">
            <svg
              className="store-icon google-play-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="#00D7FF"
                d="M2.5 2.8C2.18 3.15 2 3.7 2 4.42v15.16c0 .72.18 1.27.5 1.62L2.58 21.3 13.1 10.78v-.56L2.58 2.7z"
              />

              <path
                fill="#00F076"
                d="M16.6 14.28 13.1 10.78v-.56l3.5-3.5.08.05 4.15 2.36c1.18.67 1.18 1.77 0 2.44z"
              />

              <path
                fill="#FFCC00"
                d="m16.68 14.23-3.58-3.73L2.5 21.2c.32.34.84.38 1.43.05z"
              />

              <path
                fill="#FF3B30"
                d="M16.68 6.77 3.93 2.75c-.59-.33-1.11-.29-1.43.05L13.1 10.5z"
              />
            </svg>

            <div>
              <small>Coming soon to</small>
              <strong>Google Play</strong>
            </div>
          </div>
        </div>

        <p className="coming-soon-footer">
          Keep your eyes on the stars.
        </p>
      </div>
    </main>
  );
}

export default ComingSoon;