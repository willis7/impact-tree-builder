import { ThemeProvider } from "./components/theme-provider";
import { ImpactTreeApp } from "./components/ImpactTreeApp";
import { ErrorBoundary } from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="impact-tree-theme">
        <ImpactTreeApp />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
