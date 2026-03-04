import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Camera,
  Loader2,
  QrCode,
  SwitchCamera,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Screen } from "../App";
import type { Profile } from "../backend.d";
import MpinModal from "../components/MpinModal";
import { useGetWalletBalance, useSendMoney } from "../hooks/useQueries";
import { useQRScanner } from "../qr-code/useQRScanner";
import { formatAmount } from "../utils/format";

interface ScanPayScreenProps {
  navigate: (screen: Screen) => void;
  profile: Profile | null | undefined;
}

export default function ScanPayScreen({ navigate }: ScanPayScreenProps) {
  const [scannedValue, setScannedValue] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [showMpin, setShowMpin] = useState(false);
  const [_hasScanStarted, setHasScanStarted] = useState(false);

  const { data: balance } = useGetWalletBalance();
  const { mutateAsync: sendMoney, isPending } = useSendMoney();

  const {
    qrResults,
    isScanning,
    isActive,
    isSupported,
    error,
    isLoading,
    canStartScanning,
    startScanning,
    stopScanning,
    switchCamera,
    clearResults,
    videoRef,
    canvasRef,
  } = useQRScanner({
    facingMode: "environment",
    scanInterval: 200,
    maxResults: 1,
  });

  // Pick up QR scan result
  useEffect(() => {
    if (qrResults.length > 0 && !scannedValue) {
      const result = qrResults[0].data;
      setScannedValue(result);
      void stopScanning();
      toast.success("QR code scanned!");
    }
  }, [qrResults, scannedValue, stopScanning]);

  const handleStartScan = async () => {
    setHasScanStarted(true);
    clearResults();
    setScannedValue(null);
    await startScanning();
  };

  const handleReset = async () => {
    setScannedValue(null);
    setAmount("");
    clearResults();
    await stopScanning();
    setHasScanStarted(false);
  };

  const handlePay = () => {
    const amt = Number.parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (balance !== undefined && amt > balance) {
      toast.error("Insufficient balance");
      return;
    }
    setShowMpin(true);
  };

  const handleMpinConfirm = async (_pin: string) => {
    const amt = Number.parseFloat(amount);
    try {
      await sendMoney({
        to: scannedValue!,
        amount: amt,
        note: "QR Payment",
        confirmedByMpin: true,
      });
      setShowMpin(false);
      toast.success(`${formatAmount(amt)} paid successfully!`);
      navigate("home");
    } catch (err: unknown) {
      setShowMpin(false);
      const msg = err instanceof Error ? err.message : "Payment failed";
      toast.error(msg);
    }
  };

  const isMobile =
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div
        className="px-5 pt-12 pb-8 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.42 0.18 148) 0%, oklch(0.38 0.16 165) 100%)",
        }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-15"
            style={{ background: "oklch(0.58 0.18 148)" }}
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
            Scan & Pay
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Scan any UPI QR code to pay
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
        {!scannedValue ? (
          <div className="flex flex-col gap-4">
            {/* Camera view */}
            <div className="bg-card rounded-3xl overflow-hidden card-shadow relative">
              {isSupported === false ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                    <Camera className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">
                      Camera not supported
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your browser doesn't support camera access
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Video element */}
                  <div className="relative aspect-square bg-black">
                    <video
                      ref={videoRef}
                      className={`w-full h-full object-cover ${isActive ? "block" : "hidden"}`}
                      playsInline
                      muted
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {!isActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center">
                          <QrCode className="w-10 h-10 text-white/40" />
                        </div>
                        <p className="text-white/50 text-sm">Camera is off</p>
                      </div>
                    )}

                    {/* Scan overlay */}
                    {isActive && isScanning && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative w-52 h-52">
                          {/* Corner brackets */}
                          <div className="absolute w-10 h-10 border-white top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl" />
                          <div className="absolute w-10 h-10 border-white top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl" />
                          <div className="absolute w-10 h-10 border-white bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl" />
                          <div className="absolute w-10 h-10 border-white bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl" />
                          {/* Scan line */}
                          <div
                            className="absolute left-2 right-2 h-0.5 bg-white/80 animate-bounce-subtle"
                            style={{ top: "50%" }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Switch camera (mobile only) */}
                    {isActive && isMobile && (
                      <button
                        type="button"
                        onClick={switchCamera}
                        disabled={isLoading}
                        className="absolute top-3 right-3 w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-sm flex items-center justify-center"
                      >
                        <SwitchCamera className="w-5 h-5 text-white" />
                      </button>
                    )}
                  </div>

                  {error && (
                    <div
                      data-ocid="scan.error_state"
                      className="px-4 py-3 bg-destructive/10 border-t border-destructive/20"
                    >
                      <p className="text-sm text-destructive font-medium">
                        {error.message || "Camera error"}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              {!isActive ? (
                <Button
                  onClick={handleStartScan}
                  disabled={!canStartScanning || isLoading}
                  className="flex-1 h-12 rounded-xl font-bold text-white border-0"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.42 0.18 148) 0%, oklch(0.38 0.16 165) 100%)",
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Starting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Start Camera
                    </span>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => void stopScanning()}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl font-bold"
                >
                  <X className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-card rounded-2xl p-4 card-shadow">
              <p className="text-sm font-semibold text-foreground mb-2">
                How to use
              </p>
              <ul className="space-y-1.5">
                {[
                  { num: 1, text: "Tap 'Start Camera' to activate scanner" },
                  { num: 2, text: "Point camera at any UPI QR code" },
                  { num: 3, text: "Enter amount and confirm payment" },
                ].map(({ num, text }) => (
                  <li
                    key={num}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <span className="w-4 h-4 rounded-full gradient-purple text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {num}
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          // Payment form after scan
          <div className="flex flex-col gap-4 animate-scale-in">
            {/* Scanned info */}
            <div className="bg-card rounded-2xl p-4 card-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.42 0.18 148) 0%, oklch(0.38 0.16 165) 100%)",
                  }}
                >
                  <QrCode className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">
                    Paying to
                  </p>
                  <p className="font-bold text-foreground truncate">
                    {scannedValue}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
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
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  placeholder="0.00"
                  className="pl-8 h-14 rounded-xl bg-card text-2xl font-mono font-bold"
                  type="text"
                  inputMode="decimal"
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Available: {formatAmount(balance ?? 0)}
              </p>
            </div>

            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1 h-14 rounded-2xl font-bold"
              >
                Scan Again
              </Button>
              <Button
                onClick={handlePay}
                disabled={!amount || isPending}
                className="flex-1 h-14 rounded-2xl font-bold text-white border-0"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.42 0.18 148) 0%, oklch(0.38 0.16 165) 100%)",
                }}
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Pay Now"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <MpinModal
        open={showMpin}
        onClose={() => setShowMpin(false)}
        onConfirm={handleMpinConfirm}
        isLoading={isPending}
        title="Confirm QR Payment"
        subtitle={`Pay ${formatAmount(Number.parseFloat(amount) || 0)}`}
      />
    </div>
  );
}
