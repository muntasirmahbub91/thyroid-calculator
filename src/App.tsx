// src/App.tsx
import { useState } from "react";
import ThyroidCalculator from "./ThyroidCalculator";
import WelcomeScreen from "./WelcomeScreen";

export default function App() {
  const [transitioning, setTransitioning] = useState(false);
  const [started, setStarted] = useState(false);

  const handleStart = () => {
    setTransitioning(true);
    setTimeout(() => setStarted(true), 600);
  };

  return (
    <div className="app-root">
      <div className="phone-frame">
        {!started && (
          <WelcomeScreen transitioning={transitioning} onStart={handleStart} />
        )}
        {started && <ThyroidCalculator />}
      </div>
    </div>
  );
}