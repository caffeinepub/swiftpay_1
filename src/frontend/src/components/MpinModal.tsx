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
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
}

export default function MpinModal({
  open,
  onClose,
  onConfirm,
  isLoading = false,
  title = "Enter MPIN",
  subtitle = "Enter your 4-digit security PIN",
}: MpinModalProps) {
  const [pin, setPin] = useState("");

  // Reset PIN every time the modal opens
  useEffect(() => {
    if (open) setPin("");
  }, [open]);

  const handleDigit = (d: string) => {
    if (pin.length < 4) {
      setPin((p) => p + d);
    }
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
  };

  const handleConfirm = () => {
    if (pin.length === 4) {
      onConfirm(pin);
      setPin("");
    }
  };

  const handleClose = () => {
    setPin("");
    onClose();
  };

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
            className="flex justify-center gap-4 mb-6"
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  i < pin.length
                    ? "bg-primary scale-110"
                    : "bg-muted border-2 border-border"
                }`}
              />
            ))}
          </div>

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => handleDigit(d)}
                disabled={isLoading}
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
              disabled={isLoading}
              className="numpad-btn mx-auto disabled:opacity-50"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading || pin.length === 0}
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
              disabled={isLoading}
              className="flex-1 h-12 rounded-xl font-bold"
            >
              Cancel
            </Button>
            <Button
              data-ocid="mpin.confirm_button"
              onClick={handleConfirm}
              disabled={pin.length < 4 || isLoading}
              className="flex-1 h-12 rounded-xl font-bold gradient-purple text-white border-0 shadow-purple"
            >
              {isLoading ? (
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
