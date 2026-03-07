import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Delete, Lock } from "lucide-react";
import { useEffect, useState } from "react";

interface MpinModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (mpin: string) => void;
  onVerify?: (mpinHash: string) => Promise<boolean>;
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
}

export default function MpinModal({
  open,
  onClose,
  onConfirm,
  onVerify,
  isLoading = false,
  title = "Enter MPIN",
  subtitle = "Enter your 4-digit security PIN",
}: MpinModalProps) {
  const [pin, setPin] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shake, setShake] = useState(false);

  // Reset PIN every time the modal opens
  useEffect(() => {
    if (open) {
      setPin("");
      setHasError(false);
      setShake(false);
    }
  }, [open]);

  const handleDigit = (d: string) => {
    if (pin.length < 4 && !isVerifying) {
      setPin((p) => p + d);
      if (hasError) setHasError(false);
    }
  };

  const handleDelete = () => {
    if (!isVerifying) {
      setPin((p) => p.slice(0, -1));
      if (hasError) setHasError(false);
    }
  };

  const handleConfirm = async () => {
    if (pin.length !== 4 || isVerifying) return;

    if (onVerify) {
      setIsVerifying(true);
      try {
        const { sha256Hex } = await import("../utils/hash");
        const mpinHash = await sha256Hex(pin);
        const valid = await onVerify(mpinHash);
        if (!valid) {
          setHasError(true);
          setShake(true);
          setTimeout(() => setShake(false), 600);
          setPin("");
          return;
        }
        onConfirm(pin);
        setPin("");
      } catch {
        setHasError(true);
        setShake(true);
        setTimeout(() => setShake(false), 600);
        setPin("");
      } finally {
        setIsVerifying(false);
      }
    } else {
      onConfirm(pin);
      setPin("");
    }
  };

  const handleClose = () => {
    setPin("");
    setHasError(false);
    onClose();
  };

  const busy = isLoading || isVerifying;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        data-ocid="mpin.dialog"
        className="max-w-[320px] rounded-3xl p-0 overflow-hidden border-0"
      >
        <div className="gradient-purple px-6 pt-8 pb-6">
          <DialogHeader>
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
            </div>
            <DialogTitle className="text-white text-center font-display font-bold text-xl">
              {title}
            </DialogTitle>
            <p className="text-white/70 text-center text-sm mt-1">{subtitle}</p>
          </DialogHeader>
        </div>

        <div className="bg-card px-6 py-6">
          {/* PIN Dots */}
          <div
            data-ocid="mpin.input"
            className={`flex justify-center gap-4 mb-2 transition-transform ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  hasError
                    ? "bg-destructive scale-110"
                    : i < pin.length
                      ? "bg-primary scale-110"
                      : "bg-muted border-2 border-border"
                }`}
              />
            ))}
          </div>

          {/* Error message */}
          {hasError && (
            <p
              data-ocid="mpin.verify_error"
              className="text-center text-xs font-semibold mb-4"
              style={{ color: "oklch(0.55 0.22 27)" }}
            >
              Incorrect MPIN. Please try again.
            </p>
          )}
          {!hasError && <div className="mb-4" />}

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => handleDigit(d)}
                disabled={busy}
                className="numpad-btn mx-auto disabled:opacity-50"
              >
                {d}
              </button>
            ))}
            {/* Bottom row */}
            <div />
            <button
              type="button"
              onClick={() => handleDigit("0")}
              disabled={busy}
              className="numpad-btn mx-auto disabled:opacity-50"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy || pin.length === 0}
              className="numpad-btn mx-auto disabled:opacity-50"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              data-ocid="mpin.cancel_button"
              variant="outline"
              onClick={handleClose}
              disabled={busy}
              className="flex-1 h-12 rounded-xl font-bold"
            >
              Cancel
            </Button>
            <Button
              data-ocid="mpin.confirm_button"
              onClick={() => void handleConfirm()}
              disabled={pin.length < 4 || busy}
              className="flex-1 h-12 rounded-xl font-bold gradient-purple text-white border-0 shadow-purple"
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : (
                "Confirm"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
