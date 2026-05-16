import { Outlet, Navigate } from "react-router-dom";
import { Navigation, TopNav } from "../components/Navigation";
import { SidebarProvider } from "../contexts/SidebarContext";
import { useAuth } from "../contexts/AuthContext";
// ❌ REMOVE THIS
// import { useOnboarding } from "../../hooks/useOnboarding";
import { Toaster } from "react-hot-toast";

export default function AppLayout() {
  const { user, loading } = useAuth();

  console.log("[AppLayout] loading:", loading, "user:", !!user);

  // While checking auth, show a loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading…</span>
        </div>
      </div>
    );
  }

  // No session after loading finishes → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-background">
        <Navigation />

        <div className="flex flex-col min-h-screen md:ml-64">
          <TopNav />

          <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}