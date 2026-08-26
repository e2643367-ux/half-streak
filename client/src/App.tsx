/**
 * HALF / SPLIT style reminder: the application route contains no dashboard chrome;
 * the immersive two-half game canvas is the complete first-screen experience.
 */
import ErrorBoundary from "./components/ErrorBoundary";
import GameCanvas from "./components/GameCanvas";

function App() {
  return (
    <ErrorBoundary>
      <GameCanvas />
    </ErrorBoundary>
  );
}

export default App;
