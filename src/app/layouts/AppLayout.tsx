import { Outlet } from "react-router";
import { Navigation, TopNav } from "../components/Navigation";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { useOnboarding } from "../../hooks/useOnboarding";

export default function AppLayout() {
  useAuthGuard();
  useOnboarding();

  return (
    <div className="flex h-screen bg-background">
      <Navigation />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
