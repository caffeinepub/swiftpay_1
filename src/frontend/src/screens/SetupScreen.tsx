import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2, Phone, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SetupScreenProps {
  onComplete: (name: string, phone: string) => Promise<void>;
}

export default function SetupScreen({ onComplete }: SetupScreenProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      toast.error("Please enter your name");
      return;
    }
    if (!trimmedPhone || !/^\d{10}$/.test(trimmedPhone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setIsLoading(true);
    try {
      await onComplete(trimmedName, trimmedPhone);
      toast.success("Welcome to SwiftPay!");
    } catch (err) {
      toast.error("Failed to create profile. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="phone-container min-h-screen flex flex-col">
      {/* Header */}
      <div className="gradient-purple pt-16 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20"
            style={{ background: "oklch(0.65 0.2 290)" }}
          />
        </div>
        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mb-4 border border-white/20">
            <img
              src="/assets/generated/swiftpay-logo.dim_120x120.png"
              alt="SwiftPay"
              className="w-12 h-12 rounded-xl"
            />
          </div>
          <h1 className="text-3xl font-display font-black text-white">
            Setup your account
          </h1>
          <p className="text-white/70 text-sm mt-1">
            Just a few details to get you started
          </p>
        </div>
      </div>

      {/* Wave */}
      <div className="relative -mt-6 z-10">
        <svg
          aria-hidden="true"
          viewBox="0 0 430 40"
          className="w-full"
          style={{ display: "block" }}
        >
          <path
            d="M0,15 Q107,40 215,20 Q322,5 430,25 L430,40 L0,40 Z"
            fill="oklch(0.97 0.01 290)"
          />
        </svg>
      </div>

      {/* Form */}
      <div className="flex-1 bg-background px-6 pb-10 -mt-2 animate-slide-up">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="name"
              className="text-sm font-semibold text-foreground"
            >
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="name"
                data-ocid="setup.name_input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="pl-10 h-12 rounded-xl border-input bg-card text-base"
                autoComplete="name"
                autoFocus
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="phone"
              className="text-sm font-semibold text-foreground"
            >
              Mobile Number
            </Label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">+91</span>
              </div>
              <Input
                id="phone"
                data-ocid="setup.phone_input"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="10-digit mobile number"
                className="pl-16 h-12 rounded-xl border-input bg-card text-base font-mono"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                pattern="\d{10}"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              A UPI ID will be created based on your phone number
            </p>
          </div>

          {/* What you get */}
          <div className="mt-2 p-4 rounded-2xl bg-brand-purple-xlight border border-primary/10">
            <p className="text-sm font-semibold text-foreground mb-3">
              ✨ What you get
            </p>
            <div className="flex flex-col gap-2">
              {[
                "₹1,000 welcome bonus in your wallet",
                "Instant UPI ID for payments",
                "Send & receive money for free",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            data-ocid="setup.submit_button"
            disabled={isLoading || !name.trim() || phone.length !== 10}
            className="w-full h-13 text-base font-bold rounded-2xl gradient-purple text-white border-0 shadow-purple mt-4 h-14"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Create Account
                <ArrowRight className="w-5 h-5" />
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
