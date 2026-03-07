import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Delete,
  Eye,
  EyeOff,
  Lock,
  Phone,
  Shield,
  User,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useLogin, useSignup } from "../hooks/useQueries";
import { sha256Hex } from "../utils/hash";

// ─── Login Tab ────────────────────────────────────────────────────────────────

function LoginTab() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const { mutateAsync: login, isPending } = useLogin();

  const handleLogin = async () => {
    if (!phone.trim() || !/^\d{10}$/.test(phone.trim())) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    setError("");
    try {
      const passwordHash = await sha256Hex(password);
      const profile = await login({ phone: phone.trim(), passwordHash });
      if (!profile) {
        setError("Invalid phone number or password. Please try again.");
        return;
      }
      // Query invalidation in the hook will refresh hasAccount + callerProfile → routing happens automatically
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(msg);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Phone */}
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="login-phone"
          className="text-sm font-semibold text-foreground"
        >
          Mobile Number
        </Label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 select-none pointer-events-none">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-muted-foreground">
              +91
            </span>
            <span className="w-px h-4 bg-border" />
          </div>
          <Input
            id="login-phone"
            data-ocid="auth.phone_input"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
              if (error) setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && void handleLogin()}
            placeholder="Enter 10-digit number"
            className="pl-[4.5rem] h-12 rounded-xl bg-background border-border text-base focus-visible:ring-primary/30"
            autoComplete="tel"
          />
        </div>
      </div>

      {/* Password */}
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="login-password"
          className="text-sm font-semibold text-foreground"
        >
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="login-password"
            data-ocid="auth.password_input"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && void handleLogin()}
            placeholder="Enter your password"
            className="pl-10 pr-10 h-12 rounded-xl bg-background border-border text-base focus-visible:ring-primary/30"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            data-ocid="auth.login_error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-2 p-3 rounded-xl text-sm font-medium"
            style={{
              background: "oklch(0.97 0.03 27 / 0.8)",
              color: "oklch(0.45 0.22 27)",
              border: "1px solid oklch(0.75 0.18 27 / 0.3)",
            }}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Button */}
      <Button
        data-ocid="auth.login_button"
        onClick={() => void handleLogin()}
        disabled={isPending || !phone || !password}
        className="w-full h-12 text-base font-bold rounded-2xl gradient-purple text-white border-0 shadow-purple hover:opacity-90 transition-opacity mt-2"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Signing in...
          </span>
        ) : (
          "Sign In"
        )}
      </Button>
    </div>
  );
}

// ─── Signup Numpad ────────────────────────────────────────────────────────────

function MpinPad({
  pin,
  onDigit,
  onDelete,
  hasError,
}: {
  pin: string;
  onDigit: (d: string) => void;
  onDelete: () => void;
  hasError: boolean;
}) {
  return (
    <div>
      {/* Dots */}
      <div
        className="flex justify-center gap-4 mb-6"
        data-ocid="signup.mpin_input"
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-5 h-5 rounded-full transition-all duration-150 ${
              hasError
                ? "bg-destructive scale-110"
                : i < pin.length
                  ? "bg-primary scale-110"
                  : "bg-muted border-2 border-border"
            }`}
          />
        ))}
      </div>
      {/* Grid */}
      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onDigit(d)}
            className="numpad-btn mx-auto"
          >
            {d}
          </button>
        ))}
        <div />
        <button
          type="button"
          onClick={() => onDigit("0")}
          className="numpad-btn mx-auto"
        >
          0
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={pin.length === 0}
          className="numpad-btn mx-auto disabled:opacity-40"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ─── Signup Tab ───────────────────────────────────────────────────────────────

function SignupTab() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2 / 3 MPIN fields
  const [mpin, setMpin] = useState("");
  const [confirmMpin, setConfirmMpin] = useState("");
  const [mpinError, setMpinError] = useState("");

  const [step1Error, setStep1Error] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutateAsync: signup } = useSignup();

  const handleStep1Next = () => {
    if (!name.trim()) {
      setStep1Error("Please enter your full name.");
      return;
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      setStep1Error("Please enter a valid 10-digit phone number.");
      return;
    }
    if (password.length < 6) {
      setStep1Error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setStep1Error("Passwords do not match.");
      return;
    }
    setStep1Error("");
    setStep(2);
  };

  const handleMpinDigit = (d: string) => {
    if (mpin.length < 4) {
      setMpin((p) => p + d);
      if (mpinError) setMpinError("");
    }
  };

  const handleMpinDelete = () => {
    setMpin((p) => p.slice(0, -1));
  };

  const handleConfirmMpinDigit = (d: string) => {
    if (confirmMpin.length < 4) {
      setConfirmMpin((p) => p + d);
      if (mpinError) setMpinError("");
    }
  };

  const handleConfirmMpinDelete = () => {
    setConfirmMpin((p) => p.slice(0, -1));
  };

  const handleMpinNext = () => {
    if (mpin.length === 4) {
      setConfirmMpin("");
      setMpinError("");
      setStep(3);
    }
  };

  const handleSignup = async () => {
    if (confirmMpin !== mpin) {
      setMpinError("MPINs do not match. Please try again.");
      setConfirmMpin("");
      setStep(2);
      setMpin("");
      return;
    }
    setIsSubmitting(true);
    try {
      const [passwordHash, mpinHash] = await Promise.all([
        sha256Hex(password),
        sha256Hex(mpin),
      ]);
      await signup({
        name: name.trim(),
        phone: phone.trim(),
        passwordHash,
        mpinHash,
      });
      toast.success("Account created! Welcome to SwiftPay.");
      // Query invalidation in hook routes to main app automatically
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Signup failed. Please try again.";
      setMpinError(msg);
      setStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <AnimatePresence mode="wait">
        {/* ── Step 1: Basic Info ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
            className="flex flex-col gap-4"
          >
            {/* Progress */}
            <div className="flex items-center gap-2 mb-1">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                    s <= step ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              Step 1 of 3 — Basic information
            </p>

            {/* Full Name */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="signup-name"
                className="text-sm font-semibold text-foreground"
              >
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="signup-name"
                  data-ocid="auth.name_input"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (step1Error) setStep1Error("");
                  }}
                  placeholder="Enter your full name"
                  className="pl-10 h-12 rounded-xl bg-background border-border text-base focus-visible:ring-primary/30"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="signup-phone"
                className="text-sm font-semibold text-foreground"
              >
                Mobile Number
              </Label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 select-none pointer-events-none">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-muted-foreground">
                    +91
                  </span>
                  <span className="w-px h-4 bg-border" />
                </div>
                <Input
                  id="signup-phone"
                  data-ocid="auth.phone_input"
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                    if (step1Error) setStep1Error("");
                  }}
                  placeholder="Enter 10-digit number"
                  className="pl-[4.5rem] h-12 rounded-xl bg-background border-border text-base focus-visible:ring-primary/30"
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="signup-password"
                className="text-sm font-semibold text-foreground"
              >
                Create Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="signup-password"
                  data-ocid="auth.password_input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (step1Error) setStep1Error("");
                  }}
                  placeholder="Min. 6 characters"
                  className="pl-10 pr-10 h-12 rounded-xl bg-background border-border text-base focus-visible:ring-primary/30"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="signup-confirm-password"
                className="text-sm font-semibold text-foreground"
              >
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="signup-confirm-password"
                  data-ocid="auth.confirm_password_input"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (step1Error) setStep1Error("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleStep1Next()}
                  placeholder="Re-enter your password"
                  className={`pl-10 pr-10 h-12 rounded-xl bg-background border-border text-base focus-visible:ring-primary/30 ${
                    confirmPassword && confirmPassword === password
                      ? "border-green-500 focus-visible:ring-green-500/30"
                      : ""
                  }`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {confirmPassword && confirmPassword === password && (
                <p
                  className="text-xs font-semibold flex items-center gap-1"
                  style={{ color: "oklch(0.55 0.18 145)" }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                </p>
              )}
            </div>

            {/* Error */}
            <AnimatePresence>
              {step1Error && (
                <motion.div
                  data-ocid="auth.signup_error"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-start gap-2 p-3 rounded-xl text-sm font-medium"
                  style={{
                    background: "oklch(0.97 0.03 27 / 0.8)",
                    color: "oklch(0.45 0.22 27)",
                    border: "1px solid oklch(0.75 0.18 27 / 0.3)",
                  }}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {step1Error}
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              data-ocid="auth.signup_next_button"
              onClick={handleStep1Next}
              disabled={!name || !phone || !password || !confirmPassword}
              className="w-full h-12 text-base font-bold rounded-2xl gradient-purple text-white border-0 shadow-purple hover:opacity-90 transition-opacity mt-1"
            >
              Continue
            </Button>
          </motion.div>
        )}

        {/* ── Step 2: Set MPIN ── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
            className="flex flex-col gap-4"
          >
            {/* Progress */}
            <div className="flex items-center gap-2 mb-1">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                    s <= step ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              Step 2 of 3 — Set payment MPIN
            </p>

            {/* Back button */}
            <button
              type="button"
              data-ocid="signup.mpin_back_button"
              onClick={() => {
                setStep(1);
                setMpin("");
                setMpinError("");
              }}
              className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {/* Icon + Title */}
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-14 h-14 rounded-2xl gradient-purple flex items-center justify-center shadow-purple">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-display font-bold text-foreground">
                Create your MPIN
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                Set a 4-digit PIN for payment confirmation
              </p>
            </div>

            {/* MPIN error */}
            <AnimatePresence>
              {mpinError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-start gap-2 p-3 rounded-xl text-sm font-medium"
                  style={{
                    background: "oklch(0.97 0.03 27 / 0.8)",
                    color: "oklch(0.45 0.22 27)",
                    border: "1px solid oklch(0.75 0.18 27 / 0.3)",
                  }}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {mpinError}
                </motion.div>
              )}
            </AnimatePresence>

            <MpinPad
              pin={mpin}
              onDigit={handleMpinDigit}
              onDelete={handleMpinDelete}
              hasError={false}
            />

            <Button
              data-ocid="signup.mpin_confirm_button"
              onClick={handleMpinNext}
              disabled={mpin.length < 4}
              className="w-full h-12 text-base font-bold rounded-2xl gradient-purple text-white border-0 shadow-purple hover:opacity-90 transition-opacity mt-1"
            >
              Confirm MPIN
            </Button>
          </motion.div>
        )}

        {/* ── Step 3: Confirm MPIN ── */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
            className="flex flex-col gap-4"
          >
            {/* Progress */}
            <div className="flex items-center gap-2 mb-1">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                    s <= step ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              Step 3 of 3 — Confirm MPIN
            </p>

            {/* Back button */}
            <button
              type="button"
              onClick={() => {
                setStep(2);
                setConfirmMpin("");
                setMpinError("");
              }}
              className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {/* Icon + Title */}
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-14 h-14 rounded-2xl gradient-purple flex items-center justify-center shadow-purple">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-display font-bold text-foreground">
                Confirm your MPIN
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                Re-enter the 4-digit PIN you just set
              </p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {mpinError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-start gap-2 p-3 rounded-xl text-sm font-medium"
                  style={{
                    background: "oklch(0.97 0.03 27 / 0.8)",
                    color: "oklch(0.45 0.22 27)",
                    border: "1px solid oklch(0.75 0.18 27 / 0.3)",
                  }}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {mpinError}
                </motion.div>
              )}
            </AnimatePresence>

            <MpinPad
              pin={confirmMpin}
              onDigit={handleConfirmMpinDigit}
              onDelete={handleConfirmMpinDelete}
              hasError={!!mpinError}
            />

            <Button
              data-ocid="signup.confirm_mpin_button"
              onClick={() => void handleSignup()}
              disabled={confirmMpin.length < 4 || isSubmitting}
              className="w-full h-12 text-base font-bold rounded-2xl gradient-purple text-white border-0 shadow-purple hover:opacity-90 transition-opacity mt-1"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </span>
              ) : (
                "Create Account"
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main LoginScreen ─────────────────────────────────────────────────────────

export default function LoginScreen() {
  const features = [
    { icon: Zap, text: "Instant Payments", color: "text-brand-yellow" },
    { icon: Shield, text: "Bank-Grade Security", color: "text-brand-green" },
    { icon: Lock, text: "Encrypted & Safe", color: "text-brand-blue" },
  ];

  return (
    <div className="phone-container min-h-screen flex flex-col overflow-hidden relative">
      {/* Top purple section */}
      <div className="gradient-purple pt-12 pb-20 px-6 flex flex-col items-center relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20"
            style={{ background: "oklch(0.65 0.2 290)" }}
          />
          <div
            className="absolute -bottom-10 -left-16 w-48 h-48 rounded-full opacity-15"
            style={{ background: "oklch(0.52 0.18 250)" }}
          />
        </div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center gap-3"
        >
          <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-card-lg border border-white/20">
            <img
              src="/assets/generated/swiftpay-logo.dim_120x120.png"
              alt="SwiftPay"
              className="w-16 h-16 rounded-2xl"
            />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-display font-black text-white tracking-tight">
              SwiftPay
            </h1>
            <p className="text-white/70 text-sm font-medium mt-1">
              India's Most Trusted Payment App
            </p>
          </div>

          <div className="flex gap-5 mt-2">
            {features.map(({ icon: Icon, text, color }) => (
              <div key={text} className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <span className="text-[10px] font-semibold text-white/70 text-center leading-tight">
                  {text}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Wave separator */}
      <div className="relative -mt-10 z-10">
        <svg
          aria-hidden="true"
          viewBox="0 0 430 50"
          className="w-full"
          style={{ display: "block" }}
        >
          <path
            d="M0,20 Q107,50 215,30 Q322,10 430,35 L430,50 L0,50 Z"
            fill="oklch(0.97 0.01 290)"
          />
        </svg>
      </div>

      {/* Bottom content — Login/Signup tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="flex-1 bg-background px-5 pb-10 -mt-2 z-10"
      >
        <Tabs defaultValue="login" className="w-full">
          <TabsList
            className="w-full h-12 rounded-2xl mb-6 p-1"
            style={{ background: "oklch(0.93 0.04 290)" }}
          >
            <TabsTrigger
              data-ocid="auth.login_tab"
              value="login"
              className="flex-1 h-10 rounded-xl text-sm font-bold transition-all data-[state=active]:gradient-purple data-[state=active]:text-white data-[state=active]:shadow-purple"
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger
              data-ocid="auth.signup_tab"
              value="signup"
              className="flex-1 h-10 rounded-xl text-sm font-bold transition-all data-[state=active]:gradient-purple data-[state=active]:text-white data-[state=active]:shadow-purple"
            >
              Create Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-0">
            <LoginTab />
          </TabsContent>
          <TabsContent value="signup" className="mt-0">
            <SignupTab />
          </TabsContent>
        </Tabs>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service &amp; Privacy Policy
        </p>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            Built with love using caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
