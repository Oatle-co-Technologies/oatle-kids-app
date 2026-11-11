export default function WelcomeScreen() {
  return (
    <main className="startup-screen" aria-labelledby="startup-title">
      <div className="startup-content">
        <img src="/oatle-kids-wordmark.webp" alt="" width="200" fetchPriority="high" />
        <h1 id="startup-title">Welcome to Oatle Kids</h1>
        <p>A universe of learning opportunities</p>
        <p className="startup-status" role="status">
          <span className="startup-orbit" aria-hidden="true" />
          Your multiverse is loading…
        </p>
      </div>
    </main>
  );
}
