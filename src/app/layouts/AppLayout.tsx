import { Outlet } from "react-router-dom";
import { Navigation, TopNav } from "../components/Navigation";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { useOnboarding } from "../../hooks/useOnboarding";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      {/* SIDEBAR */}
      <Navigation />

      {/* RIGHT SIDE */}
      <div className="flex flex-col min-h-screen md:ml-64">
        <TopNav />

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}