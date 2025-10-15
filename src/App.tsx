import { ThemeProvider } from "./components/theme-provider";
import { ImpactTreeApp } from "./components/ImpactTreeApp";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="impact-tree-theme">
      <ImpactTreeApp />
    </ThemeProvider>
  );
}

export default App;
