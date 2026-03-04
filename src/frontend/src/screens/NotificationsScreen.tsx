import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Bell,
  CheckCheck,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import type { Screen } from "../App";
import { NotificationType } from "../backend.d";
import {
  useGetNotifications,
  useMarkNotificationAsRead,
} from "../hooks/useQueries";
import { formatTimestamp } from "../utils/format";

interface NotificationsScreenProps {
  navigate: (screen: Screen) => void;
}

export default function NotificationsScreen({
  navigate,
}: NotificationsScreenProps) {
  const { data: notifications, isLoading } = useGetNotifications();
  const { mutateAsync: markRead } = useMarkNotificationAsRead();

  const handleMarkRead = async (id: bigint) => {
    try {
      await markRead(id);
    } catch (_err) {
      toast.error("Failed to mark as read");
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.transactionAlert:
        return <ArrowUpRight className="w-4 h-4" />;
      case NotificationType.requestReceived:
        return <ArrowDownLeft className="w-4 h-4" />;
      case NotificationType.requestAccepted:
        return <CheckCheck className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getIconStyle = (type: NotificationType) => {
    switch (type) {
      case NotificationType.transactionAlert:
        return "bg-[oklch(0.93_0.06_290)] text-brand-purple";
      case NotificationType.requestReceived:
        return "bg-[oklch(0.91_0.05_245)] text-brand-blue";
      case NotificationType.requestAccepted:
        return "bg-[oklch(0.91_0.06_148)] text-brand-green";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-purple px-5 pt-12 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-15"
            style={{ background: "oklch(0.65 0.2 290)" }}
          />
        </div>
        <div className="relative z-10">
          <button
            type="button"
            onClick={() => navigate("home")}
            className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mb-4 tap-highlight hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-black text-white">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-white/15 text-white text-xs font-bold">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-white/60 text-sm mt-1">
            {notifications?.length ?? 0} total notifications
          </p>
        </div>
      </div>

      {/* Wave */}
      <div className="-mt-4 relative z-10">
        <svg
          aria-hidden="true"
          viewBox="0 0 430 25"
          className="w-full"
          style={{ display: "block" }}
        >
          <path
            d="M0,8 Q107,25 215,12 Q322,0 430,16 L430,25 L0,25 Z"
            fill="oklch(0.97 0.01 290)"
          />
        </svg>
      </div>

      <div className="px-4 py-4 -mt-2">
        {isLoading ? (
          <div className="bg-card rounded-2xl overflow-hidden card-shadow">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-4 py-4 border-b border-border/50"
              >
                <Skeleton className="w-10 h-10 rounded-2xl flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full rounded mb-2" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div
            data-ocid="notifications.list"
            className="bg-card rounded-2xl overflow-hidden card-shadow"
          >
            {notifications.map((notification, idx) => (
              <button
                type="button"
                key={String(notification.id)}
                data-ocid={`notifications.item.${idx + 1}`}
                onClick={() =>
                  !notification.isRead && handleMarkRead(notification.id)
                }
                className={`w-full flex items-start gap-3 px-4 py-4 text-left transition-colors tap-highlight ${
                  idx < notifications.length - 1
                    ? "border-b border-border/50"
                    : ""
                } ${!notification.isRead ? "bg-brand-purple-xlight hover:bg-accent" : "hover:bg-muted/30"}`}
              >
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${getIconStyle(notification.type)}`}
                >
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm leading-relaxed ${!notification.isRead ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}
                  >
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimestamp(notification.timestamp)}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        ) : (
          <div
            data-ocid="notifications.empty_state"
            className="bg-card rounded-2xl p-10 text-center card-shadow"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
              <Bell className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">No notifications</p>
            <p className="text-sm text-muted-foreground mt-1">
              You'll see payment alerts and request updates here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
