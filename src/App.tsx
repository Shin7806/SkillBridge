import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes, useLocation, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "./components/kit";
import { SIGNED_OUT_FLAG, signOut } from "./lib/api";
import { useAuth } from "./lib/auth";

const Landing = lazy(() => import("./pages/landing"));
const AppShell = lazy(() => import("./layouts/app-shell"));
const Welcome = lazy(() => import("./pages/welcome"));
const Home = lazy(() => import("./pages/home"));
const Discover = lazy(() => import("./pages/discover"));
const PersonPage = lazy(() => import("./pages/person"));
const Swaps = lazy(() => import("./pages/swaps"));
const SwapDetail = lazy(() => import("./pages/swap-detail"));
const Messages = lazy(() => import("./pages/messages"));
const SessionsPage = lazy(() => import("./pages/sessions"));
const Notifications = lazy(() => import("./pages/notifications"));
const Profile = lazy(() => import("./pages/me"));
const Settings = lazy(() => import("./pages/settings"));
const NotFound = lazy(() => import("./pages/not-found"));
const auth = () => import("./pages/auth");
const Login = lazy(() => auth().then((m) => ({ default: m.Login })));
const Signup = lazy(() => auth().then((m) => ({ default: m.Signup })));
const ForgotPassword = lazy(() => auth().then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => auth().then((m) => ({ default: m.ResetPassword })));
const AuthCallback = lazy(() => auth().then((m) => ({ default: m.AuthCallback })));
const info = () => import("./pages/info");
const About = lazy(() => info().then((m) => ({ default: m.About })));
const Help = lazy(() => info().then((m) => ({ default: m.Help })));
const Privacy = lazy(() => info().then((m) => ({ default: m.Privacy })));
const Terms = lazy(() => info().then((m) => ({ default: m.Terms })));

export function FullScreenLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="grid min-h-dvh place-items-center text-sm text-muted-foreground">
      <span className="inline-flex items-center gap-2.5">
        <Loader2 className="size-4 animate-spin" aria-hidden /> {label}…
      </span>
    </div>
  );
}

/** Signed-in users only. Sends others to log in and remembers where they were going. */
function RequireAuth() {
  const { user, profile, loading, profileError, refreshProfile } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenLoader />;
  if (!user) {
    const deliberate = sessionStorage.getItem(SIGNED_OUT_FLAG) === "1";
    return <Navigate to="/login" replace state={deliberate ? null : { from: location.pathname + location.search }} />;
  }
  if (!profile) {
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <div className="max-w-sm space-y-4">
          <h1 className="text-xl font-bold">We couldn't load your profile</h1>
          <p className="text-sm text-muted-foreground">{profileError?.message ?? "Check your connection and try again."}</p>
          <div className="flex justify-center gap-2">
            <Button onClick={() => refreshProfile()}>Try again</Button>
            <Button variant="ghost" onClick={() => signOut().catch(() => undefined)}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }
  return <Outlet />;
}

/** The app proper is only for people who have a name and skills on both sides. */
function RequireOnboarded() {
  const { profile } = useAuth();
  return profile?.onboarding_completed ? <Outlet /> : <Navigate to="/welcome" replace />;
}

function OnboardingOnly() {
  const { profile } = useAuth();
  return profile?.onboarding_completed ? <Navigate to="/home" replace /> : <Outlet />;
}

function PublicOnly() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenLoader />;
  const from = (location.state as { from?: string } | null)?.from;
  if (user) sessionStorage.removeItem(SIGNED_OUT_FLAG);
  return user ? <Navigate to={from && from.startsWith("/") ? from : "/home"} replace /> : <Outlet />;
}

function OldProfileRedirect() {
  const { id } = useParams();
  return <Navigate to={`/people/${id}`} replace />;
}

export default function App() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/help" element={<Help />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<PublicOnly />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<OnboardingOnly />}>
            <Route path="/welcome" element={<Welcome />} />
          </Route>
          <Route element={<RequireOnboarded />}>
            <Route element={<AppShell />}>
              <Route path="/home" element={<Home />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/people/:id" element={<PersonPage />} />
              <Route path="/swaps" element={<Swaps />} />
              <Route path="/swaps/:id" element={<SwapDetail />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/messages/:id" element={<Messages />} />
              <Route path="/sessions" element={<SessionsPage />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
        </Route>

        {/* Addresses from the previous version of the app */}
        <Route path="/dashboard" element={<Navigate to="/home" replace />} />
        <Route path="/matching" element={<Navigate to="/discover" replace />} />
        <Route path="/requests/*" element={<Navigate to="/swaps" replace />} />
        <Route path="/request" element={<Navigate to="/discover?tab=asks" replace />} />
        <Route path="/chat/*" element={<Navigate to="/messages" replace />} />
        <Route path="/me" element={<Navigate to="/profile" replace />} />
        <Route path="/setup" element={<Navigate to="/welcome" replace />} />
        <Route path="/profile/:id" element={<OldProfileRedirect />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
