import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  ChevronRight,
  Droplets,
  Flame,
  Loader2,
  Smartphone,
  Tv,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Screen } from "../App";
import { BillCategory } from "../backend.d";
import PaymentSuccessAnimation from "../components/PaymentSuccessAnimation";
import { usePayBill } from "../hooks/useQueries";
import { formatAmount } from "../utils/format";

interface RechargeBillsScreenProps {
  navigate: (screen: Screen) => void;
}

const CATEGORIES = [
  {
    id: BillCategory.mobile,
    label: "Mobile",
    icon: Smartphone,
    bg: "bg-[oklch(0.92_0.06_355)]",
    iconColor: "text-brand-pink",
    gradient:
      "linear-gradient(135deg, oklch(0.65 0.22 355) 0%, oklch(0.55 0.2 340) 100%)",
    providers: ["Airtel", "Jio", "BSNL", "Vi", "MTNL"],
    placeholder: "Enter mobile number",
    fieldLabel: "Mobile Number",
  },
  {
    id: BillCategory.electricity,
    label: "Electricity",
    icon: Zap,
    bg: "bg-[oklch(0.93_0.06_82)]",
    iconColor: "text-brand-yellow",
    gradient:
      "linear-gradient(135deg, oklch(0.7 0.2 82) 0%, oklch(0.62 0.18 65) 100%)",
    providers: ["BESCOM", "MSEDCL", "TNEB", "WBSEDCL", "UPPCL"],
    placeholder: "Enter consumer number",
    fieldLabel: "Consumer Number",
  },
  {
    id: BillCategory.dth,
    label: "DTH",
    icon: Tv,
    bg: "bg-[oklch(0.91_0.05_245)]",
    iconColor: "text-brand-blue",
    gradient:
      "linear-gradient(135deg, oklch(0.52 0.18 250) 0%, oklch(0.44 0.16 265) 100%)",
    providers: ["Tata Sky", "Dish TV", "Airtel Digital TV", "Sun Direct"],
    placeholder: "Enter subscriber ID",
    fieldLabel: "Subscriber ID",
  },
  {
    id: BillCategory.water,
    label: "Water",
    icon: Droplets,
    bg: "bg-[oklch(0.91_0.05_188)]",
    iconColor: "text-brand-teal",
    gradient:
      "linear-gradient(135deg, oklch(0.52 0.16 185) 0%, oklch(0.46 0.14 200) 100%)",
    providers: ["Delhi Jal Board", "MCGM", "BWSSB", "CMWSSB"],
    placeholder: "Enter account number",
    fieldLabel: "Account Number",
  },
  {
    id: BillCategory.gas,
    label: "Gas",
    icon: Flame,
    bg: "bg-[oklch(0.93_0.06_52)]",
    iconColor: "text-brand-orange",
    gradient:
      "linear-gradient(135deg, oklch(0.62 0.19 52) 0%, oklch(0.54 0.17 38) 100%)",
    providers: ["Indane", "HP Gas", "Bharat Gas", "Mahanagar Gas"],
    placeholder: "Enter consumer number",
    fieldLabel: "Consumer Number",
  },
];

export default function RechargeBillsScreen({
  navigate,
}: RechargeBillsScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    (typeof CATEGORIES)[0] | null
  >(null);
  const [provider, setProvider] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paidProvider, setPaidProvider] = useState("");

  const { mutateAsync: payBill, isPending } = usePayBill();

  const handlePay = async () => {
    if (!provider) {
      toast.error("Please select a provider");
      return;
    }
    if (!billNumber.trim()) {
      toast.error("Please enter the bill/account number");
      return;
    }
    const amt = Number.parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      await payBill({
        provider,
        billNumber: billNumber.trim(),
        category: selectedCategory!.id,
        amount: amt,
      });
      setPaidAmount(amt);
      setPaidProvider(provider);
      setShowSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment failed";
      toast.error(msg);
    }
  };

  const resetForm = () => {
    setProvider("");
    setBillNumber("");
    setAmount("");
  };

  if (showSuccess) {
    return (
      <PaymentSuccessAnimation
        amount={paidAmount}
        recipient={paidProvider}
        transactionId={`TXN${Date.now().toString(36).toUpperCase()}`}
        onDone={() => {
          setShowSuccess(false);
          navigate("home");
        }}
      />
    );
  }

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
            onClick={
              selectedCategory
                ? () => {
                    setSelectedCategory(null);
                    resetForm();
                  }
                : () => navigate("home")
            }
            className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mb-4 tap-highlight hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <h1 className="text-2xl font-display font-black text-white">
            {selectedCategory ? selectedCategory.label : "Recharge & Bills"}
          </h1>
          <p className="text-white/60 text-sm mt-1">
            {selectedCategory
              ? `Pay your ${selectedCategory.label.toLowerCase()} bill`
              : "Pay all your utility bills"}
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

      <div className="flex-1 px-4 py-4 -mt-2">
        {!selectedCategory ? (
          // Category grid
          <div className="grid grid-cols-1 gap-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat);
                    resetForm();
                  }}
                  className="bg-card rounded-2xl px-4 py-4 flex items-center gap-4 card-shadow hover:shadow-card-lg transition-shadow tap-highlight"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl ${cat.bg} flex items-center justify-center`}
                  >
                    <Icon className={`w-6 h-6 ${cat.iconColor}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-foreground">{cat.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {cat.providers.slice(0, 3).join(", ")} +more
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        ) : (
          // Bill payment form
          <div className="flex flex-col gap-5 animate-slide-up">
            {/* Provider selection */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-foreground">
                Provider
              </Label>
              <div className="bg-card rounded-2xl overflow-hidden card-shadow">
                {selectedCategory.providers.map((p, idx) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setProvider(p)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors tap-highlight text-left ${
                      idx < selectedCategory.providers.length - 1
                        ? "border-b border-border/50"
                        : ""
                    } ${provider === p ? "bg-brand-purple-xlight" : "hover:bg-muted/50"}`}
                  >
                    <span
                      className={`font-semibold text-sm ${provider === p ? "text-primary" : "text-foreground"}`}
                    >
                      {p}
                    </span>
                    {provider === p && (
                      <div className="w-5 h-5 rounded-full gradient-purple flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Bill number */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-foreground">
                {selectedCategory.fieldLabel}
              </Label>
              <Input
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                placeholder={selectedCategory.placeholder}
                className="h-12 rounded-xl bg-card text-base"
              />
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
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  placeholder="Enter bill amount"
                  className="pl-8 h-12 rounded-xl bg-card text-base font-mono text-xl font-bold"
                  type="text"
                  inputMode="decimal"
                />
              </div>
              <div className="flex gap-2">
                {[99, 199, 299, 499].map((a) => (
                  <button
                    type="button"
                    key={a}
                    onClick={() => setAmount(String(a))}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      amount === String(a)
                        ? "text-white shadow-sm"
                        : "bg-muted text-muted-foreground"
                    }`}
                    style={
                      amount === String(a)
                        ? { background: selectedCategory.gradient }
                        : undefined
                    }
                  >
                    ₹{a}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handlePay}
              disabled={isPending || !provider || !billNumber || !amount}
              className="w-full h-14 text-base font-bold rounded-2xl text-white border-0 mt-2"
              style={{ background: selectedCategory.gradient }}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Pay{" "}
                  {amount
                    ? formatAmount(Number.parseFloat(amount) || 0)
                    : "Bill"}
                </span>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
