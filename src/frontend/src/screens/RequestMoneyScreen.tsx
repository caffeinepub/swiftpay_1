import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowDownLeft,
  ArrowLeft,
  Loader2,
  MessageSquare,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Screen } from "../App";
import type { Profile } from "../backend.d";
import { useRequestMoney } from "../hooks/useQueries";
import { formatAmount } from "../utils/format";

interface RequestMoneyScreenProps {
  navigate: (screen: Screen) => void;
  profile: Profile | null | undefined;
}

export default function RequestMoneyScreen({
  navigate,
}: RequestMoneyScreenProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const { mutateAsync: requestMoney, isPending } = useRequestMoney();

  const handleRequest = async () => {
    if (!recipient.trim()) {
      toast.error("Please enter UPI ID or phone number");
      return;
    }
    const amt = Number.parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      await requestMoney({
        to: recipient.trim(),
        amount: amt,
        note: note.trim() || null,
      });
      toast.success("Money request sent!");
      navigate("home");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Request failed";
      toast.error(msg);
    }
  };

  const quickAmounts = [200, 500, 1000, 2000];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div
        className="px-5 pt-12 pb-8 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.52 0.18 250) 0%, oklch(0.42 0.2 270) 100%)",
        }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-15"
            style={{ background: "oklch(0.65 0.18 250)" }}
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
            Request Money
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Ask someone to send you money
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

      {/* Form */}
      <div className="flex-1 px-5 py-4 -mt-2 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold text-foreground">
            From (UPI ID / Phone)
          </Label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-ocid="request.recipient_input"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter UPI ID or phone number"
              className="pl-10 h-12 rounded-xl bg-card text-base"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold text-foreground">
            Amount (₹)
          </Label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">
              ₹
            </span>
            <Input
              data-ocid="request.amount_input"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value.replace(/[^0-9.]/g, ""))
              }
              placeholder="0.00"
              className="pl-8 h-12 rounded-xl bg-card text-base font-mono text-xl font-bold"
              type="text"
              inputMode="decimal"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {quickAmounts.map((qa) => (
              <button
                type="button"
                key={qa}
                onClick={() => setAmount(String(qa))}
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  amount === String(qa)
                    ? "text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
                style={
                  amount === String(qa)
                    ? {
                        background:
                          "linear-gradient(135deg, oklch(0.52 0.18 250) 0%, oklch(0.42 0.2 270) 100%)",
                      }
                    : undefined
                }
              >
                ₹{qa}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold text-foreground">
            Note (optional)
          </Label>
          <div className="relative">
            <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for request"
              className="pl-10 h-12 rounded-xl bg-card text-base"
            />
          </div>
        </div>

        {recipient && amount && (
          <div className="bg-[oklch(0.91_0.05_245/0.5)] rounded-2xl p-4 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.52 0.18 250) 0%, oklch(0.42 0.2 270) 100%)",
              }}
            >
              <ArrowDownLeft className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Requesting {formatAmount(Number.parseFloat(amount) || 0)}
              </p>
              <p className="text-xs text-muted-foreground">from {recipient}</p>
            </div>
          </div>
        )}

        <div className="mt-auto pt-4">
          <Button
            data-ocid="request.request_button"
            onClick={handleRequest}
            disabled={isPending || !recipient || !amount}
            className="w-full h-14 text-base font-bold rounded-2xl text-white border-0"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.52 0.18 250) 0%, oklch(0.42 0.2 270) 100%)",
            }}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending Request...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5" />
                Send Request
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
