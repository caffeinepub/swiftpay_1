import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  Loader2,
  MessageSquare,
  User,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Screen } from "../App";
import type { Profile } from "../backend.d";
import MpinModal from "../components/MpinModal";
import PaymentSuccessAnimation from "../components/PaymentSuccessAnimation";
import {
  useGetWalletBalance,
  useLookupProfileByUpiId,
  useSendMoney,
} from "../hooks/useQueries";
import { formatAmount } from "../utils/format";

interface SendMoneyScreenProps {
  navigate: (screen: Screen) => void;
  profile: Profile | null | undefined;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function SendMoneyScreen({ navigate }: SendMoneyScreenProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [showMpin, setShowMpin] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paidRecipient, setPaidRecipient] = useState("");
  const [recipientName, setRecipientName] = useState<string | null>(null);

  const debouncedRecipient = useDebounce(recipient, 300);
  const isUpiFormat = debouncedRecipient.includes("@");

  const { data: balance } = useGetWalletBalance();
  const { mutateAsync: sendMoney, isPending } = useSendMoney();
  const {
    data: lookedUpProfile,
    isFetching: isLookingUp,
    isFetched: isLookupDone,
  } = useLookupProfileByUpiId(isUpiFormat ? debouncedRecipient : "");

  // Update recipientName when lookup resolves
  const prevRecipient = useRef(debouncedRecipient);
  useEffect(() => {
    if (prevRecipient.current !== debouncedRecipient) {
      setRecipientName(null);
      prevRecipient.current = debouncedRecipient;
    }
    if (lookedUpProfile && isUpiFormat) {
      setRecipientName(lookedUpProfile.name);
    } else if (!isUpiFormat && recipient.trim()) {
      setRecipientName(null);
    }
  }, [lookedUpProfile, isUpiFormat, debouncedRecipient, recipient]);

  const isVerified = isUpiFormat && !!lookedUpProfile && !isLookingUp;
  const isNotFound =
    isUpiFormat && isLookupDone && !isLookingUp && !lookedUpProfile;
  const isPayDisabled =
    isPending ||
    !recipient ||
    !amount ||
    (isUpiFormat && (isLookingUp || !isVerified));

  const getAvatarInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const handlePay = () => {
    if (!recipient.trim()) {
      toast.error("Please enter recipient UPI ID or phone number");
      return;
    }
    const amt = Number.parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (balance !== undefined && amt > balance) {
      toast.error("Insufficient wallet balance");
      return;
    }
    setShowMpin(true);
  };

  const handleMpinConfirm = async (_pin: string) => {
    const amt = Number.parseFloat(amount);
    const displayName = recipientName || recipient.trim();
    try {
      await sendMoney({
        to: recipient.trim(),
        amount: amt,
        note: note.trim() || null,
        confirmedByMpin: true,
      });
      setShowMpin(false);
      setPaidAmount(amt);
      setPaidRecipient(displayName);
      setShowSuccess(true);
    } catch (err: unknown) {
      setShowMpin(false);
      const msg = err instanceof Error ? err.message : "Payment failed";
      toast.error(msg);
    }
  };

  const handleSuccessDone = () => {
    setShowSuccess(false);
    navigate("home");
  };

  const quickAmounts = [100, 200, 500, 1000];

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
            Send Money
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Balance:{" "}
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

      {/* Form */}
      <div className="flex-1 px-5 py-4 -mt-2 flex flex-col gap-5">
        {/* Recipient */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold text-foreground">
            To (UPI ID / Phone)
          </Label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-ocid="send.recipient_input"
              value={recipient}
              onChange={(e) => {
                setRecipient(e.target.value);
                setRecipientName(null);
              }}
              placeholder="Enter UPI ID (e.g. 9876543210@swiftpay) or phone"
              className={`pl-10 h-12 rounded-xl bg-card text-base transition-colors ${
                isVerified
                  ? "border-green-500 focus-visible:ring-green-500/30"
                  : isNotFound
                    ? "border-red-500 focus-visible:ring-red-500/30"
                    : ""
              }`}
            />
            {isUpiFormat && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                {isLookingUp ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : isVerified ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : isNotFound ? (
                  <XCircle className="w-4 h-4 text-red-500" />
                ) : null}
              </div>
            )}
          </div>

          {/* UPI lookup feedback */}
          <AnimatePresence mode="wait">
            {isVerified && lookedUpProfile && (
              <motion.div
                key="verified"
                data-ocid="send.recipient_verified_card"
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="flex items-center gap-3 p-3 rounded-xl border border-green-500/30 bg-green-500/8"
                style={{ background: "oklch(0.97 0.04 148 / 0.15)" }}
              >
                <div className="w-10 h-10 rounded-full gradient-purple flex items-center justify-center shrink-0 shadow-sm">
                  <span className="text-white text-sm font-bold">
                    {getAvatarInitials(lookedUpProfile.name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">
                    {lookedUpProfile.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {lookedUpProfile.upiId}
                  </p>
                </div>
                <span
                  className="shrink-0 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
                  style={{
                    color: "oklch(0.55 0.18 148)",
                    background: "oklch(0.55 0.18 148 / 0.12)",
                  }}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              </motion.div>
            )}
            {isNotFound && (
              <motion.p
                key="not-found"
                data-ocid="send.recipient_error"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="text-xs font-semibold flex items-center gap-1.5"
                style={{ color: "oklch(0.55 0.18 25)" }}
              >
                <XCircle className="w-3.5 h-3.5" />
                UPI ID not found. Please check and try again.
              </motion.p>
            )}
          </AnimatePresence>
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
              data-ocid="send.amount_input"
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

          {/* Quick amount chips */}
          <div className="flex gap-2 flex-wrap">
            {quickAmounts.map((qa) => (
              <button
                type="button"
                key={qa}
                onClick={() => setAmount(String(qa))}
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  amount === String(qa)
                    ? "gradient-purple text-white shadow-purple"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                ₹{qa}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold text-foreground">
            Note (optional)
          </Label>
          <div className="relative">
            <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
            <Input
              data-ocid="send.note_input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's this for?"
              className="pl-10 h-12 rounded-xl bg-card text-base"
            />
          </div>
        </div>

        {/* Pay button */}
        <div className="mt-auto pt-4">
          {recipient && amount && (
            <div className="bg-muted/50 rounded-2xl p-4 mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl gradient-purple flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Sending {formatAmount(Number.parseFloat(amount) || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  to {recipientName || recipient}
                </p>
              </div>
            </div>
          )}

          <Button
            data-ocid="send.pay_button"
            onClick={handlePay}
            disabled={isPayDisabled}
            className="w-full h-14 text-base font-bold rounded-2xl gradient-purple text-white border-0 shadow-purple"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </span>
            ) : isLookingUp ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Pay Now
              </span>
            )}
          </Button>
        </div>
      </div>

      <MpinModal
        open={showMpin}
        onClose={() => setShowMpin(false)}
        onConfirm={handleMpinConfirm}
        isLoading={isPending}
        title="Confirm Payment"
        subtitle={`Pay ${formatAmount(Number.parseFloat(amount) || 0)} to ${recipientName || recipient}`}
      />

      {showSuccess && (
        <PaymentSuccessAnimation
          amount={paidAmount}
          recipient={paidRecipient}
          transactionId={`TXN${Date.now().toString(36).toUpperCase()}`}
          onDone={handleSuccessDone}
        />
      )}
    </div>
  );
}
