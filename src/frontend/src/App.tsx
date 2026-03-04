import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useCreateOrUpdateProfile,
  useGetCallerProfile,
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
import SetupScreen from "./screens/SetupScreen";
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

function AppContent() {
  const { identity, clear, isInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;

  const {
    data: profile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerProfile();

  const { mutateAsync: createProfile } = useCreateOrUpdateProfile();

  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [activeNavTab, setActiveNavTab] = useState<NavTab>("home");

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

  const handleLogout = useCallback(async () => {
    await clear();
    queryClient.clear();
    setCurrentScreen("home");
    setActiveNavTab("home");
  }, [clear, queryClient]);

  // Show loading state
  if (isInitializing) {
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
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated — show login
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Authenticated but loading profile
  if (profileLoading && !profileFetched) {
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
          <p className="text-sm text-muted-foreground font-medium animate-pulse">
            Loading your account...
          </p>
        </div>
      </div>
    );
  }

  // Authenticated but no profile — show setup
  const showSetup = isAuthenticated && profileFetched && profile === null;
  if (showSetup) {
    return (
      <SetupScreen
        onComplete={async (name, phone) => {
          await createProfile({ name, phone });
        }}
      />
    );
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
