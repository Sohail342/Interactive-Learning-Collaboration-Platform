import { TopBar } from "../components/TopBar";

export function Landing() {
  return (
    <div className="app-page">
      <TopBar />
      <main className="landing-main">
        <section className="feature-panel" id="meetings">
          <span className="feature-kicker">Live classrooms</span>
          <h2>Meetings</h2>
          <p>Host live classes and video rooms where every student can see, hear, and join in one session.</p>
          <div className="feature-mock" aria-hidden="true">
            <div className="mock-window">
              <div className="mock-chrome">
                <span className="mock-dot" />
                <span className="mock-dot" />
                <span className="mock-dot" />
              </div>
              <div className="mock-grid">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div className="mock-tile" key={index}>
                    <span className="mock-avatar" />
                    <span className="mock-name" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="feature-panel" id="collaborate">
          <span className="feature-kicker">Shared workspace</span>
          <h2>Collaborate</h2>
          <p>Keep the conversation going with chat and a shared board that stays with the meeting.</p>
          <div className="feature-mock" aria-hidden="true">
            <div className="mock-window">
              <div className="mock-chrome">
                <span className="mock-dot" />
                <span className="mock-dot" />
                <span className="mock-dot" />
              </div>
              <div className="mock-chat">
                <div className="mock-bubble">
                  <div className="mock-line" />
                  <div className="mock-line short" />
                </div>
                <div className="mock-bubble alt">
                  <div className="mock-line" />
                  <div className="mock-line short" />
                </div>
                <div className="mock-bubble">
                  <div className="mock-line" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="feature-panel" id="learn">
          <span className="feature-kicker">Practice & progress</span>
          <h2>Learn</h2>
          <p>Turn timed Sudoku into clear progress with scores and reports students and teachers can trust.</p>
          <div className="feature-mock" aria-hidden="true">
            <div className="mock-window">
              <div className="mock-chrome">
                <span className="mock-dot" />
                <span className="mock-dot" />
                <span className="mock-dot" />
              </div>
              <div className="mock-report">
                <div className="mock-card">
                  <div className="mock-line" />
                  <div className="mock-line short" />
                  <div className="mock-line" />
                  <div className="mock-line short" />
                </div>
                <div className="mock-card">
                  <div className="mock-bars">
                    <div className="mock-bar" style={{ height: "38%" }} />
                    <div className="mock-bar" style={{ height: "68%" }} />
                    <div className="mock-bar" style={{ height: "52%" }} />
                    <div className="mock-bar" style={{ height: "86%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
