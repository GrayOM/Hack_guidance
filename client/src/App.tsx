import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Router as WouterRouter, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Lab from "./pages/Lab";
import Certificate from "./pages/Certificate";
import CertificatePrint from "./pages/CertificatePrint";
import Records from "./pages/Records";
import VerifyCertificate from "./pages/VerifyCertificate";
import Ranking from "./pages/Ranking";
import Problems from "./pages/Problems";
import MyPage from "./pages/MyPage";
import PasswordRecovery from "./pages/PasswordRecovery";
import { PointerAmbient } from "./components/PointerAmbient";
import { SecurityBackdrop } from "./components/SecurityBackdrop";

/**
 * Design reminder — Signal Room Console: dark analytical workspace, not a game interface.
 */
function Routes() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/lab/:id" component={Lab} />
      <Route path="/certificate" component={Certificate} />
      <Route path="/certificate/print/:code" component={CertificatePrint} />
      <Route path="/records" component={Records} />
      <Route path="/verify" component={VerifyCertificate} />
      <Route path="/ranking" component={Ranking} />
      <Route path="/problems" component={Problems} />
      <Route path="/me" component={MyPage} />
      <Route path="/account/password" component={PasswordRecovery} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <SecurityBackdrop />
          <PointerAmbient />
          <Toaster />
          <WouterRouter base={import.meta.env.BASE_URL === "/" ? undefined : import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Routes />
          </WouterRouter>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
