import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, Shield, Zap } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginScreen() {
  const { login, isLoggingIn } = useInternetIdentity();

  const features = [
    { icon: Zap, text: "Instant Payments", color: "text-brand-yellow" },
    { icon: Shield, text: "Bank-Grade Security", color: "text-brand-green" },
    { icon: Lock, text: "Encrypted & Safe", color: "text-brand-blue" },
  ];

  return (
    <div className="phone-container min-h-screen flex flex-col overflow-hidden relative">
      {/* Top purple section */}
      <div className="gradient-purple pt-16 pb-24 px-6 flex flex-col items-center relative overflow-hidden">
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
        <div className="relative z-10 flex flex-col items-center gap-3 animate-scale-in">
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
        </div>
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

      {/* Bottom content */}
      <div className="flex-1 bg-background px-6 pb-10 flex flex-col -mt-2 z-10 animate-slide-up">
        {/* Features */}
        <div className="flex flex-col gap-4 mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground">
            Fast. Safe. Simple.
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Send money, pay bills, recharge mobiles — all in one place. Join
            millions of users who trust SwiftPay.
          </p>

          <div className="flex gap-6 mt-2">
            {features.map(({ icon: Icon, text, color }) => (
              <div key={text} className="flex flex-col items-center gap-1.5">
                <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <span className="text-[11px] font-semibold text-foreground text-center leading-tight">
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8 p-4 rounded-2xl bg-muted/50">
          {[
            { value: "100M+", label: "Users" },
            { value: "₹50B+", label: "Transacted" },
            { value: "4.9★", label: "Rated" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-lg font-display font-black text-foreground">
                {value}
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                {label}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1" />

        {/* Login button */}
        <Button
          onClick={login}
          disabled={isLoggingIn}
          className="w-full h-14 text-base font-bold rounded-2xl gradient-purple text-white border-0 shadow-purple hover:opacity-90 transition-opacity"
          data-ocid="auth.login_button"
        >
          {isLoggingIn ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Connecting...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Get Started
              <ArrowRight className="w-5 h-5" />
            </span>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          By continuing, you agree to our Terms of Service &amp; Privacy Policy
        </p>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
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
      </div>
    </div>
  );
}
