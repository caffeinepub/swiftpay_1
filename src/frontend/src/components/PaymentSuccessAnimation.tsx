import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { playPaymentSuccessSound } from "../utils/paymentSound";

const CONFETTI_DOTS = [
  { id: "c00", angle: 0, delay: 0, dist: 110 },
  { id: "c01", angle: 20, delay: 0.07, dist: 140 },
  { id: "c02", angle: 40, delay: 0.14, dist: 170 },
  { id: "c03", angle: 60, delay: 0, dist: 110 },
  { id: "c04", angle: 80, delay: 0.07, dist: 140 },
  { id: "c05", angle: 100, delay: 0.14, dist: 170 },
  { id: "c06", angle: 120, delay: 0, dist: 110 },
  { id: "c07", angle: 140, delay: 0.07, dist: 140 },
  { id: "c08", angle: 160, delay: 0.14, dist: 170 },
  { id: "c09", angle: 180, delay: 0, dist: 110 },
  { id: "c10", angle: 200, delay: 0.07, dist: 140 },
  { id: "c11", angle: 220, delay: 0.14, dist: 170 },
  { id: "c12", angle: 240, delay: 0, dist: 110 },
  { id: "c13", angle: 260, delay: 0.07, dist: 140 },
  { id: "c14", angle: 280, delay: 0.14, dist: 170 },
  { id: "c15", angle: 300, delay: 0, dist: 110 },
  { id: "c16", angle: 320, delay: 0.07, dist: 140 },
  { id: "c17", angle: 340, delay: 0.14, dist: 170 },
];

interface PaymentSuccessAnimationProps {
  amount: number;
  recipient: string;
  transactionId?: string;
  onDone: () => void;
}

function formatAmount(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PaymentSuccessAnimation({
  amount,
  recipient,
  transactionId,
  onDone,
}: PaymentSuccessAnimationProps) {
  const [phase, setPhase] = useState<"enter" | "show" | "exit">("enter");

  useEffect(() => {
    // Phase: enter → show after 100ms (allow initial render)
    const t1 = setTimeout(() => setPhase("show"), 100);
    // Play PhonePe-style chime sound on mount
    playPaymentSuccessSound();
    return () => clearTimeout(t1);
  }, []);

  return (
    <div
      data-ocid="payment_success.modal"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center payment-success-overlay transition-opacity duration-300 ${
        phase === "show" ? "opacity-100" : "opacity-0"
      }`}
      style={{ background: "oklch(0.42 0.22 290)" }}
    >
      {/* Ripple rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <span className="payment-ripple payment-ripple-1" />
        <span className="payment-ripple payment-ripple-2" />
        <span className="payment-ripple payment-ripple-3" />
      </div>

      {/* Confetti dots */}
      {CONFETTI_DOTS.map((dot) => (
        <span
          key={dot.id}
          className="payment-confetti-dot"
          style={
            {
              "--angle": `${dot.angle}deg`,
              "--delay": `${dot.delay}s`,
              "--dist": `${dot.dist}px`,
            } as React.CSSProperties
          }
        />
      ))}

      {/* Main card */}
      <div
        className={`relative z-10 flex flex-col items-center px-8 transition-all duration-500 ease-out ${
          phase === "show"
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-8 opacity-0 scale-95"
        }`}
      >
        {/* Checkmark circle */}
        <div className="relative mb-6">
          {/* Outer glow ring */}
          <div
            className={`absolute inset-0 rounded-full transition-all duration-700 ${
              phase === "show" ? "scale-150 opacity-0" : "scale-100 opacity-30"
            }`}
            style={{ background: "oklch(0.85 0.12 145 / 40%)" }}
          />
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${
              phase === "show" ? "scale-100" : "scale-0"
            }`}
            style={{ background: "oklch(0.56 0.18 145)" }}
          >
            <CheckCircle2
              className={`w-12 h-12 text-white transition-all duration-600 delay-200 ${
                phase === "show"
                  ? "scale-100 opacity-100"
                  : "scale-50 opacity-0"
              }`}
              strokeWidth={2.5}
            />
          </div>
        </div>

        {/* Status text */}
        <p
          className={`text-white/80 text-base font-semibold mb-2 tracking-wide uppercase transition-all duration-500 delay-150 ${
            phase === "show"
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          Payment Successful
        </p>

        {/* Amount */}
        <div
          className={`mb-2 transition-all duration-500 delay-200 ${
            phase === "show"
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          <span
            className="text-white font-display font-black"
            style={{
              fontSize: "2.8rem",
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            {formatAmount(amount)}
          </span>
        </div>

        {/* Recipient */}
        <p
          className={`text-white/70 text-sm mb-1 transition-all duration-500 delay-250 ${
            phase === "show"
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          Sent to <span className="text-white font-semibold">{recipient}</span>
        </p>

        {/* Transaction ID */}
        {transactionId && (
          <p
            className={`text-white/40 text-xs font-mono mt-1 mb-8 transition-all duration-500 delay-300 ${
              phase === "show"
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            Txn: {transactionId}
          </p>
        )}

        {/* Divider line */}
        <div
          className={`w-48 h-px bg-white/20 mb-8 transition-all duration-500 delay-300 ${
            phase === "show" ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
          }`}
        />

        {/* Done button */}
        <button
          data-ocid="payment_success.close_button"
          type="button"
          onClick={onDone}
          className={`w-48 h-12 rounded-2xl font-bold text-base bg-white text-purple-700 shadow-lg transition-all duration-500 delay-350 hover:bg-white/90 active:scale-95 ${
            phase === "show"
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-6"
          }`}
          style={{ color: "oklch(0.35 0.2 290)" }}
        >
          Done
        </button>

        {/* Share receipt link */}
        <button
          data-ocid="payment_success.secondary_button"
          type="button"
          onClick={onDone}
          className={`mt-3 text-white/60 text-sm underline underline-offset-2 transition-all duration-500 delay-400 hover:text-white/80 ${
            phase === "show" ? "opacity-100" : "opacity-0"
          }`}
        >
          View Receipt
        </button>
      </div>
    </div>
  );
}
