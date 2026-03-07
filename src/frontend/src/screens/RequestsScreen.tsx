import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDownLeft,
  ArrowLeft,
  Check,
  Inbox,
  Loader2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Screen } from "../App";
import type { Profile } from "../backend.d";
import MpinModal from "../components/MpinModal";
import {
  useAcceptRequest,
  useDeclineRequest,
  useGetPendingMoneyRequests,
  useVerifyMpin,
} from "../hooks/useQueries";
import { formatAmount, formatTimestamp } from "../utils/format";

interface RequestsScreenProps {
  navigate: (screen: Screen) => void;
  profile: Profile | null | undefined;
}

export default function RequestsScreen({ navigate }: RequestsScreenProps) {
  const [acceptingId, setAcceptingId] = useState<bigint | null>(null);
  const [decliningId, setDecliningId] = useState<bigint | null>(null);
  const [showMpin, setShowMpin] = useState(false);
  const [pendingAcceptId, setPendingAcceptId] = useState<bigint | null>(null);

  const { data: requests, isLoading } = useGetPendingMoneyRequests();
  const { mutateAsync: acceptRequest } = useAcceptRequest();
  const { mutateAsync: declineRequest } = useDeclineRequest();
  const { mutateAsync: verifyMpinMutation } = useVerifyMpin();

  const handleAcceptClick = (requestId: bigint) => {
    setPendingAcceptId(requestId);
    setShowMpin(true);
  };

  const handleMpinConfirm = async (_pin: string) => {
    if (!pendingAcceptId) return;
    setAcceptingId(pendingAcceptId);
    try {
      await acceptRequest({
        requestId: pendingAcceptId,
        confirmedByMpin: true,
      });
      setShowMpin(false);
      setPendingAcceptId(null);
      toast.success("Money request accepted!");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to accept request";
      toast.error(msg);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDecline = async (requestId: bigint) => {
    setDecliningId(requestId);
    try {
      await declineRequest(requestId);
      toast.success("Request declined");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to decline request";
      toast.error(msg);
    } finally {
      setDecliningId(null);
    }
  };

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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-black text-white">
              Money Requests
            </h1>
            {requests && requests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-white/15 text-white text-xs font-bold">
                {requests.length}
              </span>
            )}
          </div>
          <p className="text-white/60 text-sm mt-1">
            Pending payment requests from others
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

      <div className="px-4 py-4 -mt-2">
        {isLoading ? (
          <div className="bg-card rounded-2xl overflow-hidden card-shadow">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 border-b border-border/50">
                <div className="flex items-start gap-3 mb-3">
                  <Skeleton className="w-11 h-11 rounded-2xl flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-28 rounded mb-1.5" />
                    <Skeleton className="h-3 w-36 rounded" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1 rounded-xl" />
                  <Skeleton className="h-10 flex-1 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : requests && requests.length > 0 ? (
          <div className="flex flex-col gap-3">
            {requests.map((req, idx) => (
              <div
                key={String(req.id)}
                data-ocid={`requests.item.${idx + 1}`}
                className="bg-card rounded-2xl overflow-hidden card-shadow"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-11 h-11 rounded-2xl bg-[oklch(0.91_0.05_245)] text-brand-blue flex items-center justify-center flex-shrink-0">
                      <ArrowDownLeft className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-sm">
                        {req.fromUpiId}
                      </p>
                      {req.note && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          "{req.note}"
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatTimestamp(req.timestamp)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-display font-black text-foreground font-mono">
                        {formatAmount(req.amount)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      data-ocid={`requests.decline_button.${idx + 1}`}
                      variant="outline"
                      onClick={() => handleDecline(req.id)}
                      disabled={
                        decliningId === req.id || acceptingId === req.id
                      }
                      className="flex-1 h-10 rounded-xl font-bold text-destructive border-destructive/30 hover:bg-destructive/5"
                    >
                      {decliningId === req.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <X className="w-4 h-4" />
                          Decline
                        </span>
                      )}
                    </Button>
                    <Button
                      data-ocid={`requests.accept_button.${idx + 1}`}
                      onClick={() => handleAcceptClick(req.id)}
                      disabled={
                        acceptingId === req.id || decliningId === req.id
                      }
                      className="flex-1 h-10 rounded-xl font-bold text-white border-0"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.52 0.18 250) 0%, oklch(0.42 0.2 270) 100%)",
                      }}
                    >
                      {acceptingId === req.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Check className="w-4 h-4" />
                          Pay Now
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            data-ocid="requests.empty_state"
            className="bg-card rounded-2xl p-10 text-center card-shadow"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">No pending requests</p>
            <p className="text-sm text-muted-foreground mt-1">
              When someone requests money from you, it'll appear here
            </p>
          </div>
        )}
      </div>

      <MpinModal
        open={showMpin}
        onClose={() => {
          setShowMpin(false);
          setPendingAcceptId(null);
        }}
        onConfirm={handleMpinConfirm}
        onVerify={async (mpinHash) => {
          return await verifyMpinMutation(mpinHash);
        }}
        isLoading={acceptingId !== null}
        title="Confirm Payment"
        subtitle={
          pendingAcceptId
            ? `Pay ${formatAmount(
                requests?.find((r) => r.id === pendingAcceptId)?.amount ?? 0,
              )}`
            : "Enter your 4-digit MPIN"
        }
      />
    </div>
  );
}
