import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Principal } from "@icp-sdk/core/principal";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Coins,
  Loader2,
  RefreshCw,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Screen } from "../App";
import { TransactionStatus, TransactionType, UserRole } from "../backend.d";
import {
  useAdminAdjustBalance,
  useAdminAssignRole,
  useGetAllTransactions,
  useGetAllUsers,
  useGetPlatformStats,
} from "../hooks/useQueries";
import {
  formatAmount,
  formatFullTimestamp,
  getInitials,
} from "../utils/format";

interface AdminPanelScreenProps {
  navigate: (screen: Screen) => void;
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

function TxTypeBadge({ type }: { type: TransactionType }) {
  const config: Record<TransactionType, { label: string; className: string }> =
    {
      [TransactionType.send]: {
        label: "Send",
        className: "bg-blue-100 text-blue-700 border-blue-200",
      },
      [TransactionType.receive]: {
        label: "Receive",
        className: "bg-green-100 text-green-700 border-green-200",
      },
      [TransactionType.topUp]: {
        label: "Top Up",
        className: "bg-purple-100 text-purple-700 border-purple-200",
      },
      [TransactionType.billPayment]: {
        label: "Bill",
        className: "bg-orange-100 text-orange-700 border-orange-200",
      },
      [TransactionType.recharge]: {
        label: "Recharge",
        className: "bg-cyan-100 text-cyan-700 border-cyan-200",
      },
    };
  const c = config[type] ?? {
    label: type,
    className: "bg-muted text-muted-foreground",
  };
  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-semibold ${c.className}`}
    >
      {c.label}
    </Badge>
  );
}

function TxStatusBadge({ status }: { status: TransactionStatus }) {
  const config: Record<
    TransactionStatus,
    { label: string; className: string }
  > = {
    [TransactionStatus.success]: {
      label: "Success",
      className: "bg-green-100 text-green-700 border-green-200",
    },
    [TransactionStatus.pending]: {
      label: "Pending",
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    },
    [TransactionStatus.failed]: {
      label: "Failed",
      className: "bg-red-100 text-red-700 border-red-200",
    },
  };
  const c = config[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };
  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-semibold ${c.className}`}
    >
      {c.label}
    </Badge>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const config: Record<UserRole, { label: string; className: string }> = {
    [UserRole.admin]: {
      label: "Admin",
      className: "bg-purple-100 text-purple-700 border-purple-200",
    },
    [UserRole.user]: {
      label: "User",
      className: "bg-blue-100 text-blue-700 border-blue-200",
    },
    [UserRole.guest]: {
      label: "Guest",
      className: "bg-gray-100 text-gray-600 border-gray-200",
    },
  };
  const c = config[role] ?? {
    label: role,
    className: "bg-muted text-muted-foreground",
  };
  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-semibold ${c.className}`}
    >
      {c.label}
    </Badge>
  );
}

// ─── Dashboard Tab ─────────────────────────────────────────────────────────────

function DashboardTab() {
  const { data: stats, isLoading, refetch, isFetching } = useGetPlatformStats();

  const statCards = [
    {
      title: "Total Users",
      value: stats ? Number(stats.totalUsers).toLocaleString("en-IN") : "—",
      icon: Users,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      title: "Total Transactions",
      value: stats
        ? Number(stats.totalTransactions).toLocaleString("en-IN")
        : "—",
      icon: Activity,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Volume",
      value: stats ? formatAmount(stats.totalVolume) : "—",
      icon: BarChart3,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Wallet Balance",
      value: stats ? formatAmount(stats.totalWalletBalance) : "—",
      icon: Wallet,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
  ];

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-16"
        data-ocid="admin.dashboard_tab.loading_state"
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">
            Loading stats...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
          Platform Overview
        </h2>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:opacity-70 transition-opacity"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((card) => (
          <Card
            key={card.title}
            className="border border-border/60 card-shadow"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center`}
                >
                  <card.icon className={`w-4.5 h-4.5 ${card.iconColor}`} />
                </div>
              </div>
              <p className="text-lg font-display font-black text-foreground leading-tight font-mono">
                {card.value}
              </p>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                {card.title}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick info box */}
      <div className="bg-brand-purple-xlight rounded-2xl p-4 border border-primary/10">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-primary">Admin Access</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          You have full administrative access. Changes made here affect all
          users on the platform. Use with care.
        </p>
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab() {
  const { data: users, isLoading } = useGetAllUsers();
  const { mutateAsync: adjustBalance, isPending: isAdjusting } =
    useAdminAdjustBalance();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    principal: Principal;
    name: string;
    currentBalance: number;
  } | null>(null);
  const [newBalance, setNewBalance] = useState("");

  const handleOpenAdjust = (
    principal: Principal,
    name: string,
    currentBalance: number,
  ) => {
    setSelectedUser({ principal, name, currentBalance });
    setNewBalance(String(currentBalance));
    setDialogOpen(true);
  };

  const handleConfirmAdjust = async () => {
    if (!selectedUser) return;
    const amount = Number(newBalance);
    if (Number.isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid balance amount");
      return;
    }
    try {
      await adjustBalance({
        userPrincipal: selectedUser.principal,
        newBalance: amount,
      });
      toast.success(
        `Balance updated to ${formatAmount(amount)} for ${selectedUser.name}`,
      );
      setDialogOpen(false);
    } catch (_err) {
      toast.error("Failed to adjust balance. Admin access required.");
    }
  };

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-16"
        data-ocid="admin.users_tab.loading_state"
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">
            Loading users...
          </p>
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div
        className="flex items-center justify-center py-16"
        data-ocid="admin.users.empty_state"
      >
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <Users className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            No users found
          </p>
          <p className="text-xs text-muted-foreground">
            Users will appear here once registered.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4" data-ocid="admin.users_table">
      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-3">
        {users.length} registered users
      </p>
      <div className="flex flex-col gap-2">
        {users.map(([principal, profile], idx) => (
          <div
            key={principal.toString()}
            data-ocid={`admin.users_row.${idx + 1}`}
            className="bg-card rounded-2xl p-3.5 border border-border/60 card-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl gradient-purple flex items-center justify-center text-white font-display font-black text-sm flex-shrink-0">
                {getInitials(profile.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">
                  {profile.name}
                </p>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {profile.upiId}
                </p>
                <p className="text-xs text-muted-foreground">{profile.phone}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <p className="text-sm font-black font-mono text-foreground">
                  {formatAmount(profile.walletBalance)}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  data-ocid={`admin.adjust_balance_button.${idx + 1}`}
                  onClick={() =>
                    handleOpenAdjust(
                      principal,
                      profile.name,
                      profile.walletBalance,
                    )
                  }
                  className="h-7 text-xs rounded-xl border-primary/30 text-primary hover:bg-primary/5 px-3"
                >
                  <Coins className="w-3 h-3 mr-1" />
                  Adjust
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Adjust Balance Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          data-ocid="admin.adjust_balance_dialog"
          className="rounded-2xl max-w-[340px]"
        >
          <DialogHeader>
            <DialogTitle className="font-display font-black">
              Adjust Balance
            </DialogTitle>
            <DialogDescription className="text-sm">
              Update wallet balance for{" "}
              <span className="font-semibold text-foreground">
                {selectedUser?.name}
              </span>
              . Current:{" "}
              <span className="font-mono font-semibold">
                {formatAmount(selectedUser?.currentBalance ?? 0)}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                New Balance (₹)
              </Label>
              <Input
                data-ocid="admin.adjust_balance_input"
                type="number"
                min="0"
                step="0.01"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                className="h-11 rounded-xl bg-muted text-sm font-mono"
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 flex-row">
            <Button
              variant="outline"
              data-ocid="admin.adjust_balance_cancel_button"
              onClick={() => setDialogOpen(false)}
              className="flex-1 rounded-xl h-11"
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin.adjust_balance_confirm_button"
              onClick={handleConfirmAdjust}
              disabled={isAdjusting}
              className="flex-1 rounded-xl h-11 gradient-purple text-white border-0 font-bold shadow-purple"
            >
              {isAdjusting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Transactions Tab ──────────────────────────────────────────────────────────

function TransactionsTab() {
  const { data: transactions, isLoading } = useGetAllTransactions();

  const sorted = transactions
    ? [...transactions].sort((a, b) => Number(b.timestamp - a.timestamp))
    : [];

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-16"
        data-ocid="admin.transactions_tab.loading_state"
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">
            Loading transactions...
          </p>
        </div>
      </div>
    );
  }

  if (!sorted || sorted.length === 0) {
    return (
      <div
        className="flex items-center justify-center py-16"
        data-ocid="admin.transactions.empty_state"
      >
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <Activity className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            No transactions yet
          </p>
          <p className="text-xs text-muted-foreground">
            Platform transactions will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4" data-ocid="admin.transactions_list">
      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-3">
        {sorted.length} total transactions
      </p>
      <div className="flex flex-col gap-2">
        {sorted.map((tx, idx) => (
          <div
            key={tx.id.toString()}
            data-ocid={`admin.transaction_item.${idx + 1}`}
            className="bg-card rounded-2xl p-3.5 border border-border/60 card-shadow"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <TxTypeBadge type={tx.type} />
                <TxStatusBadge status={tx.status} />
              </div>
              <span className="text-sm font-black font-mono text-foreground">
                {formatAmount(tx.amount)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-medium">From:</span>
                <span className="font-mono truncate max-w-[140px]">
                  {tx.fromUpiId}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-medium">To:</span>
                <span className="font-mono truncate max-w-[140px]">
                  {tx.toUpiId}
                </span>
              </div>
              {tx.note && (
                <p className="text-xs text-muted-foreground italic truncate">
                  "{tx.note}"
                </p>
              )}
              <p className="text-[10px] text-muted-foreground/70 mt-1">
                {formatFullTimestamp(tx.timestamp)} · ID #{tx.id.toString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Roles Tab ────────────────────────────────────────────────────────────────

function RolesTab() {
  const { data: users, isLoading } = useGetAllUsers();
  const { mutateAsync: assignRole, isPending: isAssigning } =
    useAdminAssignRole();

  // Track selected roles per user
  const [selectedRoles, setSelectedRoles] = useState<Record<string, UserRole>>(
    {},
  );
  const [updatingPrincipal, setUpdatingPrincipal] = useState<string | null>(
    null,
  );

  const handleRoleChange = (principalStr: string, role: UserRole) => {
    setSelectedRoles((prev) => ({ ...prev, [principalStr]: role }));
  };

  const handleUpdateRole = async (
    principal: Principal,
    principalStr: string,
    currentRole: UserRole,
  ) => {
    const newRole = selectedRoles[principalStr] ?? currentRole;
    setUpdatingPrincipal(principalStr);
    try {
      await assignRole({ targetUser: principal, role: newRole });
      toast.success("Role updated successfully");
    } catch (_err) {
      toast.error("Failed to update role. Admin access required.");
    } finally {
      setUpdatingPrincipal(null);
    }
  };

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-16"
        data-ocid="admin.roles_tab.loading_state"
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">
            Loading users...
          </p>
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div
        className="flex items-center justify-center py-16"
        data-ocid="admin.roles.empty_state"
      >
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <Shield className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            No users found
          </p>
          <p className="text-xs text-muted-foreground">
            Users will appear here once registered.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4" data-ocid="admin.roles_list">
      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-3">
        Manage user roles
      </p>
      <div className="flex flex-col gap-2">
        {users.map(([principal, profile], idx) => {
          const principalStr = principal.toString();
          // We don't have user role in profile data — default to "user" (backend knows actual roles)
          const currentRole = selectedRoles[principalStr] ?? UserRole.user;

          return (
            <div
              key={principalStr}
              data-ocid={`admin.role_row.${idx + 1}`}
              className="bg-card rounded-2xl p-3.5 border border-border/60 card-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl gradient-purple flex items-center justify-center text-white font-display font-black text-sm flex-shrink-0">
                  {getInitials(profile.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">
                    {profile.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {profile.upiId}
                  </p>
                </div>
                <RoleBadge role={currentRole} />
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedRoles[principalStr] ?? UserRole.user}
                  onValueChange={(val) =>
                    handleRoleChange(principalStr, val as UserRole)
                  }
                >
                  <SelectTrigger
                    data-ocid={`admin.role_select.${idx + 1}`}
                    className="flex-1 h-9 rounded-xl text-xs bg-muted"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.admin}>Admin</SelectItem>
                    <SelectItem value={UserRole.user}>User</SelectItem>
                    <SelectItem value={UserRole.guest}>Guest</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  data-ocid={`admin.role_update_button.${idx + 1}`}
                  onClick={() =>
                    handleUpdateRole(principal, principalStr, currentRole)
                  }
                  disabled={isAssigning && updatingPrincipal === principalStr}
                  className="h-9 px-4 rounded-xl text-xs gradient-purple text-white border-0 font-bold shadow-purple"
                >
                  {isAssigning && updatingPrincipal === principalStr ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Update"
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Admin Panel Screen ──────────────────────────────────────────────────

export default function AdminPanelScreen({ navigate }: AdminPanelScreenProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-purple px-4 pt-12 pb-5 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10"
            style={{ background: "oklch(0.85 0.15 290)" }}
          />
          <div
            className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full opacity-10"
            style={{ background: "oklch(0.75 0.2 270)" }}
          />
        </div>
        <div className="relative z-10">
          <button
            type="button"
            data-ocid="admin.back_button"
            onClick={() => navigate("profile")}
            className="flex items-center gap-2 text-white/80 text-sm font-semibold mb-4 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-sm">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-black text-white">
                Admin Panel
              </h1>
              <p className="text-xs text-white/60 font-medium">
                SwiftPay Platform Control
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dashboard" className="flex-1 flex flex-col">
        <div className="sticky top-0 z-10 bg-background border-b border-border/60 shadow-xs">
          <TabsList className="w-full h-12 bg-background rounded-none border-0 p-0 grid grid-cols-4">
            <TabsTrigger
              value="dashboard"
              data-ocid="admin.dashboard_tab"
              className="h-full rounded-none text-xs font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent border-b-2 border-transparent"
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1" />
              Stats
            </TabsTrigger>
            <TabsTrigger
              value="users"
              data-ocid="admin.users_tab"
              className="h-full rounded-none text-xs font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent border-b-2 border-transparent"
            >
              <Users className="w-3.5 h-3.5 mr-1" />
              Users
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              data-ocid="admin.transactions_tab"
              className="h-full rounded-none text-xs font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent border-b-2 border-transparent"
            >
              <Activity className="w-3.5 h-3.5 mr-1" />
              Txns
            </TabsTrigger>
            <TabsTrigger
              value="roles"
              data-ocid="admin.roles_tab"
              className="h-full rounded-none text-xs font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent border-b-2 border-transparent"
            >
              <Shield className="w-3.5 h-3.5 mr-1" />
              Roles
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <TabsContent value="dashboard" className="mt-0">
            <DashboardTab />
          </TabsContent>
          <TabsContent value="users" className="mt-0">
            <UsersTab />
          </TabsContent>
          <TabsContent value="transactions" className="mt-0">
            <TransactionsTab />
          </TabsContent>
          <TabsContent value="roles" className="mt-0">
            <RolesTab />
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Footer */}
      <div className="text-center py-4 px-4 border-t border-border/40">
        <p className="text-[10px] text-muted-foreground">
          SwiftPay Admin Panel · Internet Computer
        </p>
      </div>
    </div>
  );
}
