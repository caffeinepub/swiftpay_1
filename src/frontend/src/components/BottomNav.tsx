import { Clock, Home, Inbox, QrCode, User } from "lucide-react";
import type { NavTab } from "../App";

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const tabs: { id: NavTab; label: string; icon: typeof Home; ocid: string }[] = [
  { id: "home", label: "Home", icon: Home, ocid: "nav.home_tab" },
  { id: "history", label: "History", icon: Clock, ocid: "nav.history_tab" },
  { id: "scan", label: "Scan", icon: QrCode, ocid: "nav.scan_tab" },
  { id: "requests", label: "Requests", icon: Inbox, ocid: "nav.requests_tab" },
  { id: "profile", label: "Profile", icon: User, ocid: "nav.profile_tab" },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card border-t border-border z-50">
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {tabs.map(({ id, label, icon: Icon, ocid }) => {
          const isActive = activeTab === id;
          return (
            <button
              type="button"
              key={id}
              data-ocid={ocid}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px] tap-highlight ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {id === "scan" ? (
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center -mt-5 shadow-purple transition-all duration-200 ${
                    isActive
                      ? "gradient-purple scale-105"
                      : "gradient-purple opacity-90"
                  }`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
              ) : (
                <>
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      isActive ? "bg-brand-purple-xlight" : "bg-transparent"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 transition-all duration-200 ${
                        isActive ? "text-primary scale-110" : ""
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-semibold tracking-wide transition-all duration-200 ${
                      isActive ? "text-primary" : ""
                    }`}
                  >
                    {label}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
