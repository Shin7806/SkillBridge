import AppRoot from "./app/App";

/**
 * Root component. Auth is handled centrally by AuthProvider
 * in app/App.tsx — no duplicate listeners here.
 */
export default function App() {
  return <AppRoot />;
}
