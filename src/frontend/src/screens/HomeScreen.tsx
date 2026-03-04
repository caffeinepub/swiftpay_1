import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Clock,
  Eye,
  EyeOff,
  MoreHorizontal,
  PlusCircle,
  QrCode,
  Smartphone,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";
import type { Screen } from "../App";
import type { Profile, Transaction } from "../backend.d";
import { TransactionType } from "../backend.d";
import {
  useGetPendingMoneyRequests,
  useGetRecentTransactions,
  useGetUnreadNotificationCount,
  useGetWalletBalance,
} from "../hooks/useQueries";
import { formatAmount, formatTimestamp, getInitials } from "../utils/format";

interface HomeScreenProps {
  navigate: (screen: Screen) => void;
  profile: Profile | null | undefined;
}

const quickActions = [
  {
    id: "send",
    label: "Send Money",
    icon: ArrowUpRight,
    bg: "bg-[oklch(0.93_0.06_290)]",
    iconColor: "text-brand-purple",
    ocid: "home.send_button",
    screen: "send" as Screen,
  },
  {
    id: "request",
    label: "Request",
    icon: ArrowDownLeft,
    bg: "bg-[oklch(0.91_0.05_245)]",
    iconColor: "text-brand-blue",
    ocid: "home.request_button",
    screen: "request" as Screen,
  },
  {
    id: "scan",
    label: "Scan & Pay",
    icon: QrCode,
    bg: "bg-[oklch(0.91_0.06_148)]",
    iconColor: "text-brand-green",
    ocid: "home.scan_button",
    screen: "scan" as Screen,
  },
  {
    id: "addMoney",
    label: "Add Money",
    icon: PlusCircle,
    bg: "bg-[oklch(0.93_0.06_52)]",
    iconColor: "text-brand-orange",
    ocid: "home.add_money_button",
    screen: "addMoney" as Screen,
  },
  {
    id: "recharge",
    label: "Recharge",
    icon: Smartphone,
    bg: "bg-[oklch(0.92_0.06_355)]",
    iconColor: "text-brand-pink",
    ocid: "home.recharge_button",
    screen: "bills" as Screen,
  },
  {
    id: "bills",
    label: "Pay Bills",
    icon: Zap,
    bg: "bg-[oklch(0.93_0.06_82)]",
    iconColor: "text-brand-yellow",
    ocid: "home.bills_button",
    screen: "bills" as Screen,
  },
  {
    id: "history",
    label: "History",
    icon: Clock,
    bg: "bg-[oklch(0.91_0.05_188)]",
    iconColor: "text-brand-teal",
    ocid: "home.history_button",
    screen: "history" as Screen,
  },
  {
    id: "more",
    label: "More",
    icon: MoreHorizontal,
    bg: "bg-[oklch(0.93_0.01_290)]",
    iconColor: "text-muted-foreground",
    ocid: "home.more_button",
    screen: "profile" as Screen,
  },
];

function TransactionItem({
  transaction,
}: {
  transaction: Transaction;
}) {
  const isSent =
    transaction.type === TransactionType.send ||
    transaction.type === TransactionType.billPayment ||
    transaction.type === TransactionType.recharge;
  const isReceived =
    transaction.type === TransactionType.receive ||
    transaction.type === TransactionType.topUp;

  const otherParty = isSent ? transaction.toUpiId : transaction.fromUpiId;

  const typeLabel = {
    [TransactionType.send]: "Sent",
    [TransactionType.receive]: "Received",
    [TransactionType.topUp]: "Added",
    [TransactionType.billPayment]: "Bill Payment",
    [TransactionType.recharge]: "Recharge",
  }[transaction.type];

  return (
    <div className="flex items-center gap-3 py-3">
      {/* Avatar */}
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${
          isReceived || transaction.type === TransactionType.topUp
            ? "bg-[oklch(0.91_0.06_148)] text-brand-green"
            : "bg-[oklch(0.93_0.06_290)] text-brand-purple"
        }`}
      >
        {isReceived ? (
          <ArrowDownLeft className="w-5 h-5" />
        ) : (
          <ArrowUpRight className="w-5 h-5" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm truncate">
          {transaction.note || typeLabel}
        </p>
        <p className="text-xs text-muted-foreground truncate">{otherParty}</p>
      </div>

      {/* Amount & date */}
      <div className="text-right flex-shrink-0">
        <p
          className={`font-bold text-sm font-mono ${
            isReceived || transaction.type === TransactionType.topUp
              ? "text-brand-green"
              : "text-brand-red"
          }`}
        >
          {isReceived || transaction.type === TransactionType.topUp ? "+" : "-"}
          {formatAmount(transaction.amount)}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatTimestamp(transaction.timestamp)}
        </p>
      </div>
    </div>
  );
}

export default function HomeScreen({ navigate, profile }: HomeScreenProps) {
  const [balanceVisible, setBalanceVisible] = useState(true);

  const { data: balance, isLoading: balanceLoading } = useGetWalletBalance();
  const { data: recentTxns, isLoading: txnsLoading } =
    useGetRecentTransactions();
  const { data: pendingRequests } = useGetPendingMoneyRequests();
  const { data: unreadCount } = useGetUnreadNotificationCount();

  const unread = Number(unreadCount ?? BigInt(0));

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-purple px-5 pt-12 pb-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-15"
            style={{ background: "oklch(0.65 0.2 290)" }}
          />
          <div
            className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10"
            style={{ background: "oklch(0.52 0.18 250)" }}
          />
        </div>

        <div className="relative z-10">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                <img
                  src="/assets/generated/swiftpay-logo.dim_120x120.png"
                  alt="SwiftPay"
                  className="w-8 h-8 rounded-xl"
                />
              </div>
              <div>
                <p className="text-white/60 text-xs">Good day,</p>
                <p className="text-white font-bold text-sm">
                  {profile?.name ?? "User"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                data-ocid="home.notification_button"
                onClick={() => navigate("notifications")}
                className="relative w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center tap-highlight hover:bg-white/20 transition-colors"
              >
                <Bell className="w-4.5 h-4.5 text-white w-5 h-5" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-red text-white text-[10px] font-bold flex items-center justify-center">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>
              <button
                type="button"
                data-ocid="home.profile_button"
                onClick={() => navigate("profile")}
                className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center font-bold text-white text-sm hover:bg-white/25 transition-colors"
              >
                {getInitials(profile?.name ?? "U")}
              </button>
            </div>
          </div>

          {/* Balance card */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/60 text-xs font-medium">
                Wallet Balance
              </span>
              <button
                type="button"
                onClick={() => setBalanceVisible((v) => !v)}
                className="text-white/60 hover:text-white transition-colors"
              >
                {balanceVisible ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
            </div>

            {balanceLoading ? (
              <Skeleton className="h-9 w-36 bg-white/20 rounded-xl mb-2" />
            ) : (
              <p className="text-4xl font-display font-black text-white tracking-tight mb-1 font-mono">
                {balanceVisible ? formatAmount(balance ?? 0) : "₹ ••••••"}
              </p>
            )}

            <p className="text-white/50 text-xs truncate mb-4">
              UPI: {profile?.upiId ?? "—"}
            </p>

            <div className="flex gap-2">
              <Button
                data-ocid="home.add_money_button"
                onClick={() => navigate("addMoney")}
                size="sm"
                className="flex-1 h-9 text-xs font-bold rounded-xl bg-white text-primary border-0 hover:bg-white/90 shadow-none"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                Add Money
              </Button>
              <Button
                onClick={() => navigate("history")}
                size="sm"
                variant="outline"
                className="flex-1 h-9 text-xs font-bold rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                Statement
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Wave */}
      <div className="-mt-5 relative z-10">
        <svg
          aria-hidden="true"
          viewBox="0 0 430 30"
          className="w-full"
          style={{ display: "block" }}
        >
          <path
            d="M0,10 Q107,30 215,15 Q322,0 430,20 L430,30 L0,30 Z"
            fill="oklch(0.97 0.01 290)"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 bg-background px-4 pt-0 -mt-2">
        {/* Quick Actions */}
        <section className="mb-6">
          <div className="bg-card rounded-2xl p-4 card-shadow">
            <div className="grid grid-cols-4 gap-2">
              {quickActions.map(
                ({ id, label, icon: Icon, bg, iconColor, ocid, screen }) => (
                  <button
                    type="button"
                    key={id}
                    data-ocid={ocid}
                    onClick={() => navigate(screen)}
                    className="quick-action-btn"
                  >
                    <div className={`quick-action-icon ${bg}`}>
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <span className="text-[11px] font-semibold text-foreground text-center leading-tight">
                      {label}
                    </span>
                  </button>
                ),
              )}
            </div>
          </div>
        </section>

        {/* Pending Requests Banner */}
        {pendingRequests && pendingRequests.length > 0 && (
          <button
            type="button"
            onClick={() => navigate("requests")}
            className="w-full mb-4 animate-slide-up"
          >
            <div className="bg-brand-purple-xlight border border-primary/15 rounded-2xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl gradient-purple flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-foreground">
                    {pendingRequests.length} Pending Request
                    {pendingRequests.length > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">Tap to review</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-primary" />
            </div>
          </button>
        )}

        {/* Recent Transactions */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-foreground">
              Recent Transactions
            </h2>
            <button
              type="button"
              onClick={() => navigate("history")}
              className="text-xs font-semibold text-primary flex items-center gap-1"
            >
              See all
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-card rounded-2xl px-4 card-shadow">
            {txnsLoading ? (
              <div className="py-4 flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-11 h-11 rounded-2xl" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 rounded mb-1" />
                      <Skeleton className="h-3 w-24 rounded" />
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-4 w-16 rounded mb-1" />
                      <Skeleton className="h-3 w-10 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentTxns && recentTxns.length > 0 ? (
              <div className="divide-y divide-border/50">
                {recentTxns.slice(0, 5).map((txn) => (
                  <TransactionItem key={String(txn.id)} transaction={txn} />
                ))}
              </div>
            ) : (
              <div
                data-ocid="transactions.empty_state"
                className="py-10 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground text-sm">
                  No transactions yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Send money to get started!
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="py-4 text-center bg-background">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            Built with love using caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
