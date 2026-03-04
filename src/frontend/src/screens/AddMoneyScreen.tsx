import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Building2, Check, Loader2, PlusCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Screen } from "../App";
import { useGetWalletBalance, useTopUpWallet } from "../hooks/useQueries";
import { formatAmount } from "../utils/format";

interface AddMoneyScreenProps {
  navigate: (screen: Screen) => void;
}

const BANKS = [
  {
    id: "sbi",
    name: "State Bank of India",
    icon: "🏦",
    color: "bg-[oklch(0.9_0.06_145)]",
  },
  {
    id: "hdfc",
    name: "HDFC Bank",
    icon: "🏛️",
    color: "bg-[oklch(0.9_0.05_250)]",
  },
  {
    id: "icici",
    name: "ICICI Bank",
    icon: "🏢",
    color: "bg-[oklch(0.9_0.06_355)]",
  },
  {
    id: "axis",
    name: "Axis Bank",
    icon: "🏗️",
    color: "bg-[oklch(0.9_0.06_52)]",
  },
];

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

export default function AddMoneyScreen({ navigate }: AddMoneyScreenProps) {
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  const { data: balance } = useGetWalletBalance();
  const { mutateAsync: topUp, isPending } = useTopUpWallet();

  const handleAddMoney = async () => {
    if (!selectedBank) {
      toast.error("Please select a bank account");
      return;
    }
    const amt = Number.parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amt < 10) {
      toast.error("Minimum top-up amount is ₹10");
      return;
    }
    if (amt > 100000) {
      toast.error("Maximum top-up amount is ₹1,00,000");
      return;
    }

    try {
      await topUp(amt);
      toast.success(`${formatAmount(amt)} added to wallet!`);
      navigate("home");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Top-up failed";
      toast.error(msg);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div
        className="px-5 pt-12 pb-8 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.6 0.18 52) 0%, oklch(0.52 0.2 38) 100%)",
        }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-15"
            style={{ background: "oklch(0.75 0.18 52)" }}
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
            Add Money
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Current balance:{" "}
            <span className="text-white font-semibold">
              {formatAmount(balance ?? 0)}
            </span>
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

      <div className="flex-1 px-5 py-4 -mt-2 flex flex-col gap-5">
        {/* Bank Selection */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold text-foreground">
            Select Bank Account
          </Label>
          <div className="bg-card rounded-2xl overflow-hidden card-shadow">
            {BANKS.map((bank, idx) => (
              <button
                type="button"
                key={bank.id}
                onClick={() => setSelectedBank(bank.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors tap-highlight ${
                  idx < BANKS.length - 1 ? "border-b border-border/50" : ""
                } ${selectedBank === bank.id ? "bg-brand-purple-xlight" : "hover:bg-muted/50"}`}
              >
                <div
                  className={`w-10 h-10 rounded-xl ${bank.color} flex items-center justify-center text-lg`}
                >
                  {bank.icon}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-foreground">
                    {bank.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    XXXX XXXX XXXX {1234 + idx * 1111}
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedBank === bank.id
                      ? "border-primary bg-primary"
                      : "border-border"
                  }`}
                >
                  {selectedBank === bank.id && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold text-foreground">
            Amount (₹)
          </Label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">
              ₹
            </span>
            <Input
              data-ocid="addmoney.amount_input"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value.replace(/[^0-9.]/g, ""))
              }
              placeholder="Enter amount"
              className="pl-8 h-12 rounded-xl bg-card text-base font-mono text-xl font-bold"
              type="text"
              inputMode="decimal"
            />
          </div>

          {/* Preset chips */}
          <div className="grid grid-cols-4 gap-2">
            {PRESET_AMOUNTS.map((pa) => (
              <button
                type="button"
                key={pa}
                onClick={() => setAmount(String(pa))}
                className={`py-2 rounded-xl text-sm font-bold transition-all ${
                  amount === String(pa)
                    ? "text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
                style={
                  amount === String(pa)
                    ? {
                        background:
                          "linear-gradient(135deg, oklch(0.6 0.18 52) 0%, oklch(0.52 0.2 38) 100%)",
                      }
                    : undefined
                }
              >
                ₹{pa >= 1000 ? `${pa / 1000}K` : pa}
              </button>
            ))}
          </div>
        </div>

        {/* Bank info */}
        <div className="bg-muted/50 rounded-2xl p-4 flex items-start gap-3">
          <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Money will be transferred from your selected bank account instantly.
            UPI transfers are free and secure.
          </p>
        </div>

        <div className="mt-auto pt-2">
          <Button
            data-ocid="addmoney.submit_button"
            onClick={handleAddMoney}
            disabled={isPending || !selectedBank || !amount}
            className="w-full h-14 text-base font-bold rounded-2xl text-white border-0"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.6 0.18 52) 0%, oklch(0.52 0.2 38) 100%)",
            }}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding Money...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                Add{" "}
                {amount
                  ? formatAmount(Number.parseFloat(amount) || 0)
                  : "Money"}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
