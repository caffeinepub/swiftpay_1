import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Copy,
  Edit2,
  HelpCircle,
  LogOut,
  Phone,
  Shield,
  Star,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Screen } from "../App";
import type { Profile } from "../backend.d";
import { TransactionType } from "../backend.d";
import {
  useCreateOrUpdateProfile,
  useGetTransactionHistory,
  useGetWalletBalance,
  useIsCallerAdmin,
} from "../hooks/useQueries";
import { formatAmount, getInitials } from "../utils/format";

interface ProfileScreenProps {
  navigate: (screen: Screen) => void;
  profile: Profile | null | undefined;
  onLogout: () => void;
}

export default function ProfileScreen({
  navigate,
  profile,
  onLogout,
}: ProfileScreenProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.name ?? "");
  const [editPhone, setEditPhone] = useState(profile?.phone ?? "");

  const { data: transactions } = useGetTransactionHistory();
  const { data: balance } = useGetWalletBalance();
  const { data: isAdmin } = useIsCallerAdmin();
  const { mutateAsync: updateProfile, isPending } = useCreateOrUpdateProfile();

  const totalSent =
    transactions
      ?.filter(
        (t) =>
          t.type === TransactionType.send ||
          t.type === TransactionType.billPayment ||
          t.type === TransactionType.recharge,
      )
      .reduce((sum, t) => sum + t.amount, 0) ?? 0;

  const totalReceived =
    transactions
      ?.filter(
        (t) =>
          t.type === TransactionType.receive ||
          t.type === TransactionType.topUp,
      )
      .reduce((sum, t) => sum + t.amount, 0) ?? 0;

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    if (!/^\d{10}$/.test(editPhone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    try {
      await updateProfile({ name: editName.trim(), phone: editPhone });
      toast.success("Profile updated!");
      setIsEditing(false);
    } catch (_err) {
      toast.error("Failed to update profile");
    }
  };

  const handleCopyUpiId = () => {
    if (profile?.upiId) {
      void navigator.clipboard.writeText(profile.upiId);
      toast.success("UPI ID copied!");
    }
  };

  const initials = getInitials(profile?.name ?? "U");

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-purple px-5 pt-12 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-8 -right-8 w-48 h-48 rounded-full opacity-15"
            style={{ background: "oklch(0.65 0.2 290)" }}
          />
        </div>
        <div className="relative z-10 flex flex-col items-center">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-3xl gradient-purple border-4 border-white/30 flex items-center justify-center font-display font-black text-3xl text-white shadow-card-lg mb-3">
            {initials}
          </div>
          <h1 className="text-xl font-display font-black text-white">
            {profile?.name}
          </h1>
          <button
            type="button"
            onClick={handleCopyUpiId}
            className="flex items-center gap-1.5 mt-1 text-white/60 text-sm hover:text-white transition-colors"
          >
            {profile?.upiId}
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="relative z-10 px-4 -mt-6">
        <div className="bg-card rounded-2xl p-4 card-shadow-lg grid grid-cols-3 gap-2 divide-x divide-border">
          <div className="text-center px-2">
            <p className="text-xs text-muted-foreground font-medium mb-1">
              Balance
            </p>
            <p className="font-display font-black text-sm text-foreground font-mono">
              {formatAmount(balance ?? 0)}
            </p>
          </div>
          <div className="text-center px-2">
            <p className="text-xs text-muted-foreground font-medium mb-1">
              Sent
            </p>
            <p className="font-display font-black text-sm text-[oklch(0.5_0.22_27)] font-mono">
              {formatAmount(totalSent)}
            </p>
          </div>
          <div className="text-center px-2">
            <p className="text-xs text-muted-foreground font-medium mb-1">
              Received
            </p>
            <p className="font-display font-black text-sm text-[oklch(0.42_0.18_145)] font-mono">
              {formatAmount(totalReceived)}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 flex flex-col gap-4 pb-6">
        {/* Profile info / Edit */}
        <div className="bg-card rounded-2xl overflow-hidden card-shadow">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <span className="text-sm font-bold text-foreground">
              Profile Details
            </span>
            <button
              type="button"
              data-ocid="profile.edit_button"
              onClick={() => {
                if (isEditing) {
                  setEditName(profile?.name ?? "");
                  setEditPhone(profile?.phone ?? "");
                  setIsEditing(false);
                } else {
                  setEditName(profile?.name ?? "");
                  setEditPhone(profile?.phone ?? "");
                  setIsEditing(true);
                }
              }}
              className="flex items-center gap-1.5 text-primary text-sm font-semibold"
            >
              <Edit2 className="w-3.5 h-3.5" />
              {isEditing ? "Cancel" : "Edit"}
            </button>
          </div>

          {isEditing ? (
            <div className="p-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Name
                </Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-11 rounded-xl bg-muted text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Phone
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                    +91
                  </span>
                  <Input
                    value={editPhone}
                    onChange={(e) =>
                      setEditPhone(
                        e.target.value.replace(/\D/g, "").slice(0, 10),
                      )
                    }
                    className="pl-12 h-11 rounded-xl bg-muted text-sm font-mono"
                    type="tel"
                    inputMode="numeric"
                  />
                </div>
              </div>
              <Button
                onClick={handleSaveProfile}
                disabled={isPending}
                className="w-full h-11 rounded-xl font-bold gradient-purple text-white border-0 shadow-purple"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Save Changes
                  </span>
                )}
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-sm font-semibold text-foreground">
                    {profile?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-semibold text-foreground font-mono">
                    +91 {profile?.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-purple-xlight flex items-center justify-center">
                    <span className="text-primary text-xs font-black">@</span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">UPI ID</p>
                    <p className="text-sm font-semibold text-foreground font-mono">
                      {profile?.upiId}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpiId}
                  className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Admin Panel button (only for admins) */}
        {isAdmin && (
          <button
            type="button"
            data-ocid="profile.admin_panel_button"
            onClick={() => navigate("admin")}
            className="w-full flex items-center gap-3 px-4 py-4 bg-gradient-to-r from-[oklch(0.42_0.22_290)] to-[oklch(0.35_0.2_270)] rounded-2xl text-white shadow-purple hover:opacity-90 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-white">Admin Panel</p>
              <p className="text-xs text-white/70">
                Manage users, transactions & roles
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/60" />
          </button>
        )}

        {/* Quick links */}
        <div className="bg-card rounded-2xl overflow-hidden card-shadow">
          {[
            {
              icon: ArrowUpRight,
              label: "Transaction History",
              sub: "View all transactions",
              action: () => navigate("history"),
              iconBg: "bg-[oklch(0.93_0.06_290)]",
              iconColor: "text-brand-purple",
            },
            {
              icon: Shield,
              label: "Privacy & Security",
              sub: "Manage your security",
              action: () => toast.info("Coming soon!"),
              iconBg: "bg-[oklch(0.91_0.06_148)]",
              iconColor: "text-brand-green",
            },
            {
              icon: HelpCircle,
              label: "Help & Support",
              sub: "Get help with payments",
              action: () => toast.info("Coming soon!"),
              iconBg: "bg-[oklch(0.91_0.05_245)]",
              iconColor: "text-brand-blue",
            },
            {
              icon: Star,
              label: "Rate SwiftPay",
              sub: "Tell us how we're doing",
              action: () => toast.info("Thank you!"),
              iconBg: "bg-[oklch(0.93_0.06_82)]",
              iconColor: "text-brand-yellow",
            },
          ].map((item, idx, arr) => (
            <button
              type="button"
              key={item.label}
              onClick={item.action}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/30 transition-colors tap-highlight ${
                idx < arr.length - 1 ? "border-b border-border/50" : ""
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl ${item.iconBg} flex items-center justify-center`}
              >
                <item.icon className={`w-4 h-4 ${item.iconColor}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <Button
          onClick={onLogout}
          variant="outline"
          className="w-full h-12 rounded-2xl font-bold text-destructive border-destructive/20 hover:bg-destructive/5"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>

        {/* Version */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            SwiftPay v1.0.0 · Powered by Internet Computer
          </p>
          <p className="text-xs text-muted-foreground mt-1">
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
    </div>
  );
}
