import { ThemeProvider } from "./components/theme-provider";
import { ImpactTreeApp } from "./components/ImpactTreeApp";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="impact-tree-theme">
        <ImpactTreeApp />
        <Toaster />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
