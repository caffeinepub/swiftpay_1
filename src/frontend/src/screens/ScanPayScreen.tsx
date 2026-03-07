import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ImageUp,
  Loader2,
  QrCode,
  SwitchCamera,
  X,
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
  useVerifyMpin,
} from "../hooks/useQueries";
import { useQRScanner } from "../qr-code/useQRScanner";
import { formatAmount } from "../utils/format";

interface ScanPayScreenProps {
  navigate: (screen: Screen) => void;
  profile: Profile | null | undefined;
}

// Parse UPI deep-link from scanned QR
function parseUpiQR(raw: string): {
  upiId: string;
  name: string | null;
  amount: string | null;
} {
  try {
    if (raw.startsWith("upi://")) {
      const url = new URL(raw);
      return {
        upiId: url.searchParams.get("pa") || raw,
        name: url.searchParams.get("pn"),
        amount: url.searchParams.get("am"),
      };
    }
  } catch {
    // fall through
  }
  return { upiId: raw, name: null, amount: null };
}

function getAvatarInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ScanPayScreen({ navigate }: ScanPayScreenProps) {
  const [scannedUpiId, setScannedUpiId] = useState<string | null>(null);
  const [scannedName, setScannedName] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [showMpin, setShowMpin] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paidRecipient, setPaidRecipient] = useState("");
  const [_hasScanStarted, setHasScanStarted] = useState(false);
  const [isUploadProcessing, setIsUploadProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: balance } = useGetWalletBalance();
  const { mutateAsync: sendMoney, isPending } = useSendMoney();
  const { mutateAsync: verifyMpinMutation } = useVerifyMpin();

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

  // UPI format detection and lookup
  const isUpiFormat = (scannedUpiId ?? "").includes("@");
  const {
    data: lookedUpProfile,
    isFetching: isLookingUp,
    isFetched: isLookupDone,
  } = useLookupProfileByUpiId(isUpiFormat && scannedUpiId ? scannedUpiId : "");

  const isVerified = isUpiFormat && !!lookedUpProfile && !isLookingUp;
  const isNotFound =
    isUpiFormat && isLookupDone && !isLookingUp && !lookedUpProfile;

  // Pick up QR scan result and parse UPI deep-link
  useEffect(() => {
    if (qrResults.length > 0 && !scannedUpiId) {
      const raw = qrResults[0].data;
      const parsed = parseUpiQR(raw);
      setScannedUpiId(parsed.upiId);
      setScannedName(parsed.name);
      if (parsed.amount) setAmount(parsed.amount);
      void stopScanning();
      toast.success("QR code scanned!");
    }
  }, [qrResults, scannedUpiId, stopScanning]);

  const handleStartScan = async () => {
    setHasScanStarted(true);
    clearResults();
    setScannedUpiId(null);
    setScannedName(null);
    setAmount("");
    await startScanning();
  };

  const handleReset = async () => {
    setScannedUpiId(null);
    setScannedName(null);
    setAmount("");
    clearResults();
    await stopScanning();
    setHasScanStarted(false);
  };

  const handleUploadQR = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setIsUploadProcessing(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setIsUploadProcessing(false);
          toast.error("Could not process image");
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (!window.jsQR) {
          setIsUploadProcessing(false);
          toast.error("QR scanner not ready, please try again");
          return;
        }
        const code = window.jsQR(
          imageData.data,
          imageData.width,
          imageData.height,
        );
        setIsUploadProcessing(false);
        if (code?.data) {
          const parsed = parseUpiQR(code.data);
          setScannedUpiId(parsed.upiId);
          setScannedName(parsed.name);
          if (parsed.amount) setAmount(parsed.amount);
          toast.success("QR code detected from image!");
        } else {
          toast.error(
            "No QR code found in the image. Please try a clearer photo.",
          );
        }
      };
      img.onerror = () => {
        setIsUploadProcessing(false);
        toast.error("Could not load image");
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    // reset so same file can be re-uploaded
    e.target.value = "";
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
    const displayName =
      lookedUpProfile?.name || scannedName || scannedUpiId || "";
    try {
      await sendMoney({
        to: scannedUpiId!,
        amount: amt,
        note: "QR Payment",
        confirmedByMpin: true,
      });
      setShowMpin(false);
      setPaidAmount(amt);
      setPaidRecipient(displayName);
      setShowSuccess(true);
    } catch (err) {
      setShowMpin(false);
      toast.error(err instanceof Error ? err.message : "Payment failed");
    }
  };

  const handleSuccessDone = () => {
    setShowSuccess(false);
    navigate("home");
  };

  // Allow payment even if not verified (backend is authoritative for rejection).
  // Only block while actively looking up or if no amount entered.
  const isPayDisabled = isPending || !amount || isLookingUp;

  const isMobile =
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  const displayRecipientName =
    lookedUpProfile?.name || scannedName || scannedUpiId || "";

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
        {!scannedUpiId ? (
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
                      Your browser doesn&apos;t support camera access
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

            {/* Hidden file input for QR upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              data-ocid="scan.upload_button"
            />

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

              <Button
                onClick={handleUploadQR}
                disabled={isUploadProcessing}
                variant="outline"
                className="h-12 px-4 rounded-xl font-bold"
                title="Upload QR from gallery"
              >
                {isUploadProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    <ImageUp className="w-4 h-4" />
                    <span className="hidden sm:inline">Upload QR</span>
                  </span>
                )}
              </Button>
            </div>

            {/* Instructions */}
            <div className="bg-card rounded-2xl p-4 card-shadow">
              <p className="text-sm font-semibold text-foreground mb-2">
                How to use
              </p>
              <ul className="space-y-1.5">
                {[
                  {
                    num: 1,
                    text: "Tap 'Start Camera' to scan live, or 'Upload QR' to pick from gallery",
                  },
                  {
                    num: 2,
                    text: "Point camera at any UPI QR code (or select a QR image)",
                  },
                  { num: 3, text: "Recipient is verified, enter amount & pay" },
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
            {/* Recipient verification card */}
            <div className="bg-card rounded-2xl p-4 card-shadow">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Paying to
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-7 h-7 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Lookup status */}
              <AnimatePresence mode="wait">
                {isLookingUp && (
                  <motion.div
                    key="looking-up"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Verifying recipient...
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {scannedUpiId}
                      </p>
                    </div>
                  </motion.div>
                )}

                {isVerified && lookedUpProfile && (
                  <motion.div
                    key="verified"
                    data-ocid="scan.recipient_verified_card"
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-green-500/30"
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
                      <p className="text-xs text-muted-foreground truncate font-mono">
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
                  <motion.div
                    key="not-found"
                    data-ocid="scan.recipient_error"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-yellow-500/30"
                    style={{ background: "oklch(0.97 0.06 85 / 0.12)" }}
                  >
                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                      <XCircle className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "oklch(0.52 0.16 85)" }}
                      >
                        Recipient not in SwiftPay
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {scannedUpiId}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "oklch(0.52 0.16 85)" }}
                      >
                        Payment may fail. You can still attempt it.
                      </p>
                    </div>
                  </motion.div>
                )}

                {!isUpiFormat && scannedUpiId && (
                  <motion.div
                    key="raw-value"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.42 0.18 148) 0%, oklch(0.38 0.16 165) 100%)",
                      }}
                    >
                      <QrCode className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">
                        {scannedUpiId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Scanned QR value
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Amount input */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-foreground">
                Amount (₹)
              </Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">
                  ₹
                </span>
                <Input
                  data-ocid="scan.amount_input"
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

            {/* Quick amount chips */}
            <div className="flex gap-2 flex-wrap">
              {[100, 200, 500, 1000].map((qa) => (
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

            {/* Pay summary */}
            {amount && scannedUpiId && (
              <div className="bg-muted/50 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl gradient-purple flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Sending {formatAmount(Number.parseFloat(amount) || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    to {displayRecipientName}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1 h-14 rounded-2xl font-bold"
              >
                Scan Again
              </Button>
              <Button
                data-ocid="scan.pay_button"
                onClick={handlePay}
                disabled={isPayDisabled}
                className="flex-1 h-14 rounded-2xl font-bold text-white border-0"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.42 0.18 148) 0%, oklch(0.38 0.16 165) 100%)",
                }}
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isLookingUp ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </span>
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
        onVerify={async (mpinHash) => {
          return await verifyMpinMutation(mpinHash);
        }}
        isLoading={isPending}
        title="Confirm QR Payment"
        subtitle={`Pay ${formatAmount(Number.parseFloat(amount) || 0)} to ${displayRecipientName}`}
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
