// src/WelcomeScreen.tsx
import React from "react";

type Props = { transitioning: boolean; onStart: () => void };

export default function WelcomeScreen({ transitioning, onStart }: Props) {
  return (
    <section
      aria-label="Welcome"
      className={`welcome-screen ${transitioning ? "fade-out" : "fade-in"}`}
    >
      <img className="welcome-image" src="/welcome.png?v=2" alt="Welcome" />
      <button type="button" className="start-button" onClick={onStart}>
        Start Now
      </button>
    </section>
  );
}