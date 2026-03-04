import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Clock } from "lucide-react";
import { useState } from "react";
import type { Screen } from "../App";
import type { Profile, Transaction } from "../backend.d";
import { TransactionStatus, TransactionType } from "../backend.d";
import { useGetTransactionHistory } from "../hooks/useQueries";
import { formatAmount, formatFullTimestamp } from "../utils/format";

interface TransactionHistoryScreenProps {
  navigate: (screen: Screen) => void;
  profile: Profile | null | undefined;
}

function TransactionRow({
  transaction,
  index,
}: { transaction: Transaction; index: number }) {
  const isSent =
    transaction.type === TransactionType.send ||
    transaction.type === TransactionType.billPayment ||
    transaction.type === TransactionType.recharge;
  const isTopUp = transaction.type === TransactionType.topUp;
  const isReceived = transaction.type === TransactionType.receive || isTopUp;

  const typeLabel = {
    [TransactionType.send]: "Sent",
    [TransactionType.receive]: "Received",
    [TransactionType.topUp]: "Added Money",
    [TransactionType.billPayment]: "Bill Payment",
    [TransactionType.recharge]: "Recharge",
  }[transaction.type];

  const otherParty = isSent ? transaction.toUpiId : transaction.fromUpiId;

  const statusColor = {
    [TransactionStatus.success]:
      "bg-[oklch(0.91_0.06_148)] text-[oklch(0.4_0.18_145)]",
    [TransactionStatus.pending]:
      "bg-[oklch(0.93_0.06_82)] text-[oklch(0.5_0.18_82)]",
    [TransactionStatus.failed]:
      "bg-[oklch(0.92_0.06_27)] text-[oklch(0.5_0.22_27)]",
  }[transaction.status];

  return (
    <div
      data-ocid={`history.item.${index}`}
      className="flex items-center gap-3 px-4 py-3.5 border-b border-border/50 last:border-0"
    >
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
          isReceived
            ? "bg-[oklch(0.91_0.06_148)] text-[oklch(0.4_0.18_145)]"
            : "bg-[oklch(0.93_0.06_290)] text-[oklch(0.35_0.2_290)]"
        }`}
      >
        {isReceived ? (
          <ArrowDownLeft className="w-5 h-5" />
        ) : (
          <ArrowUpRight className="w-5 h-5" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-semibold text-foreground text-sm truncate">
            {transaction.note || typeLabel}
          </p>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${statusColor}`}
          >
            {transaction.status}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{otherParty}</p>
        <p className="text-[11px] text-muted-foreground/70 mt-0.5">
          {formatFullTimestamp(transaction.timestamp)}
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        <p
          className={`font-bold text-sm font-mono ${
            isReceived
              ? "text-[oklch(0.42_0.18_145)]"
              : "text-[oklch(0.5_0.22_27)]"
          }`}
        >
          {isReceived ? "+" : "-"}
          {formatAmount(transaction.amount)}
        </p>
      </div>
    </div>
  );
}

export default function TransactionHistoryScreen({
  navigate,
}: TransactionHistoryScreenProps) {
  const { data: transactions, isLoading } = useGetTransactionHistory();

  const sentTxns =
    transactions?.filter(
      (t) =>
        t.type === TransactionType.send ||
        t.type === TransactionType.billPayment ||
        t.type === TransactionType.recharge,
    ) ?? [];

  const receivedTxns =
    transactions?.filter(
      (t) =>
        t.type === TransactionType.receive || t.type === TransactionType.topUp,
    ) ?? [];

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
          <h1 className="text-2xl font-display font-black text-white">
            Transactions
          </h1>
          <p className="text-white/60 text-sm mt-1">
            {transactions?.length ?? 0} total transactions
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

      {/* Tabs */}
      <div className="px-4 -mt-2">
        <Tabs defaultValue="all">
          <TabsList className="w-full rounded-2xl bg-card p-1 mb-4 card-shadow">
            <TabsTrigger
              data-ocid="history.all_tab"
              value="all"
              className="flex-1 rounded-xl font-semibold text-sm data-[state=active]:gradient-purple data-[state=active]:text-white data-[state=active]:shadow-purple"
            >
              All ({transactions?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger
              data-ocid="history.sent_tab"
              value="sent"
              className="flex-1 rounded-xl font-semibold text-sm data-[state=active]:gradient-purple data-[state=active]:text-white data-[state=active]:shadow-purple"
            >
              Sent ({sentTxns.length})
            </TabsTrigger>
            <TabsTrigger
              data-ocid="history.received_tab"
              value="received"
              className="flex-1 rounded-xl font-semibold text-sm data-[state=active]:gradient-purple data-[state=active]:text-white data-[state=active]:shadow-purple"
            >
              Received ({receivedTxns.length})
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="bg-card rounded-2xl overflow-hidden card-shadow">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3.5 border-b border-border/50"
                >
                  <Skeleton className="w-11 h-11 rounded-2xl" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 rounded mb-1.5" />
                    <Skeleton className="h-3 w-24 rounded" />
                  </div>
                  <Skeleton className="h-4 w-20 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <TabsContent value="all">
                {transactions && transactions.length > 0 ? (
                  <div className="bg-card rounded-2xl overflow-hidden card-shadow">
                    {transactions.map((txn, i) => (
                      <TransactionRow
                        key={String(txn.id)}
                        transaction={txn}
                        index={i + 1}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    data-ocid="history.empty_state"
                    className="bg-card rounded-2xl p-10 text-center card-shadow"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <p className="font-semibold text-foreground">
                      No transactions yet
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your transaction history will appear here
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="sent">
                {sentTxns.length > 0 ? (
                  <div className="bg-card rounded-2xl overflow-hidden card-shadow">
                    {sentTxns.map((txn, i) => (
                      <TransactionRow
                        key={String(txn.id)}
                        transaction={txn}
                        index={i + 1}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-card rounded-2xl p-10 text-center card-shadow">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                      <ArrowUpRight className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <p className="font-semibold text-foreground">
                      No outgoing transactions
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Send money to see it here
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="received">
                {receivedTxns.length > 0 ? (
                  <div className="bg-card rounded-2xl overflow-hidden card-shadow">
                    {receivedTxns.map((txn, i) => (
                      <TransactionRow
                        key={String(txn.id)}
                        transaction={txn}
                        index={i + 1}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-card rounded-2xl p-10 text-center card-shadow">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                      <ArrowDownLeft className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <p className="font-semibold text-foreground">
                      No incoming transactions
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Received payments will appear here
                    </p>
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      <div className="h-6" />
    </div>
  );
}
