import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  SWIFTPAY_LOGGED_IN_KEY,
  useGetCallerProfile,
  useHasAccount,
} from "./hooks/useQueries";

import AddMoneyScreen from "./screens/AddMoneyScreen";
import AdminPanelScreen from "./screens/AdminPanelScreen";
import HomeScreen from "./screens/HomeScreen";
// Screens
import LoginScreen from "./screens/LoginScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import RechargeBillsScreen from "./screens/RechargeBillsScreen";
import RequestMoneyScreen from "./screens/RequestMoneyScreen";
import RequestsScreen from "./screens/RequestsScreen";
import ScanPayScreen from "./screens/ScanPayScreen";
import SendMoneyScreen from "./screens/SendMoneyScreen";
import TransactionHistoryScreen from "./screens/TransactionHistoryScreen";

// Navigation
import BottomNav from "./components/BottomNav";

export type Screen =
  | "home"
  | "send"
  | "request"
  | "addMoney"
  | "history"
  | "scan"
  | "bills"
  | "notifications"
  | "profile"
  | "requests"
  | "admin";

export type NavTab = "home" | "history" | "scan" | "requests" | "profile";

// Shared loading spinner UI
function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="phone-container flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl gradient-purple flex items-center justify-center shadow-purple">
          <img
            src="/assets/generated/swiftpay-logo.dim_120x120.png"
            alt="SwiftPay"
            className="w-12 h-12 rounded-xl"
          />
        </div>
        {message ? (
          <p className="text-sm text-muted-foreground font-medium animate-pulse">
            {message}
          </p>
        ) : (
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
          </div>
        )}
      </div>
    </div>
  );
}

function AppContent() {
  const { isInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerProfile();

  const {
    data: hasAccount,
    isLoading: hasAccountLoading,
    isFetched: hasAccountFetched,
  } = useHasAccount();

  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [activeNavTab, setActiveNavTab] = useState<NavTab>("home");

  // Timeout fallback: if stuck on "Loading your account..." for > 8s, bail out
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track whether we've already shown the session-expired toast
  const sessionExpiredToastShown = useRef(false);

  useEffect(() => {
    // Only start the timer when we have an account and profile hasn't loaded yet
    if (hasAccount && profileLoading && !profileFetched) {
      timeoutRef.current = setTimeout(() => {
        setLoadingTimedOut(true);
      }, 8000);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setLoadingTimedOut(false);
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [hasAccount, profileLoading, profileFetched]);

  // Show session-expired toast when user had a previous session but hasAccount now returns false
  useEffect(() => {
    if (
      hasAccountFetched &&
      hasAccount === false &&
      localStorage.getItem(SWIFTPAY_LOGGED_IN_KEY) === "true" &&
      !sessionExpiredToastShown.current
    ) {
      sessionExpiredToastShown.current = true;
      toast.info("Session expired. Please log in again.");
    }
  }, [hasAccountFetched, hasAccount]);

  const navigate = useCallback((screen: Screen) => {
    setCurrentScreen(screen);
    // Sync nav tab
    if (screen === "home") setActiveNavTab("home");
    else if (screen === "history") setActiveNavTab("history");
    else if (screen === "scan") setActiveNavTab("scan");
    else if (screen === "requests") setActiveNavTab("requests");
    else if (screen === "profile") setActiveNavTab("profile");
  }, []);

  const handleNavTab = useCallback((tab: NavTab) => {
    setActiveNavTab(tab);
    setCurrentScreen(tab as Screen);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(SWIFTPAY_LOGGED_IN_KEY);
    sessionExpiredToastShown.current = false;
    queryClient.clear();
    setCurrentScreen("home");
    setActiveNavTab("home");
  }, [queryClient]);

  // ── Routing ────────────────────────────────────────────────────────────────

  // 1. While II is initializing OR while checking if user has account
  if (isInitializing || (!hasAccountFetched && hasAccountLoading)) {
    return <LoadingSpinner />;
  }

  // 2. No account → show login/signup
  if (hasAccountFetched && !hasAccount) {
    return <LoginScreen />;
  }

  // 3. Has account but profile still loading (with 8s timeout fallback)
  if (hasAccount && profileLoading && !profileFetched && !loadingTimedOut) {
    return <LoadingSpinner message="Loading your account..." />;
  }

  // Main app
  const showBottomNav =
    ["home", "history", "scan", "requests", "profile"].includes(
      currentScreen,
    ) && currentScreen !== "admin";

  return (
    <div className="phone-container relative">
      <div className={showBottomNav ? "pb-20" : ""}>
        {currentScreen === "home" && (
          <HomeScreen navigate={navigate} profile={profile} />
        )}
        {currentScreen === "send" && (
          <SendMoneyScreen navigate={navigate} profile={profile} />
        )}
        {currentScreen === "request" && (
          <RequestMoneyScreen navigate={navigate} profile={profile} />
        )}
        {currentScreen === "addMoney" && <AddMoneyScreen navigate={navigate} />}
        {currentScreen === "history" && (
          <TransactionHistoryScreen navigate={navigate} profile={profile} />
        )}
        {currentScreen === "scan" && (
          <ScanPayScreen navigate={navigate} profile={profile} />
        )}
        {currentScreen === "bills" && (
          <RechargeBillsScreen navigate={navigate} />
        )}
        {currentScreen === "notifications" && (
          <NotificationsScreen navigate={navigate} />
        )}
        {currentScreen === "profile" && (
          <ProfileScreen
            navigate={navigate}
            profile={profile}
            onLogout={handleLogout}
          />
        )}
        {currentScreen === "requests" && (
          <RequestsScreen navigate={navigate} profile={profile} />
        )}
        {currentScreen === "admin" && <AdminPanelScreen navigate={navigate} />}
      </div>

      {showBottomNav && (
        <BottomNav activeTab={activeNavTab} onTabChange={handleNavTab} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <>
      <AppContent />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
          },
        }}
      />
    </>
  );
}
