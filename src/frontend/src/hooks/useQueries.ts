import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BillPayment,
  MoneyRequest,
  Notification,
  PlatformStats,
  Profile,
  Transaction,
} from "../backend.d";
import { UserRole } from "../backend.d";
import { useActor } from "./useActor";

// ─── Profile ────────────────────────────────────────────────────────────────

export function useGetProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<Profile | null>({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetCallerProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<Profile | null>({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      try {
        return await actor.getCallerUserProfile();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useCreateOrUpdateProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, phone }: { name: string; phone: string }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.createOrUpdateProfile(name, phone);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
      queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
    },
  });
}

// ─── Wallet ──────────────────────────────────────────────────────────────────

export function useGetWalletBalance() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<number>({
    queryKey: ["walletBalance"],
    queryFn: async () => {
      if (!actor) return 0;
      return actor.getWalletBalance();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 30000,
  });
}

export function useTopUpWallet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number) => {
      if (!actor) throw new Error("Actor not available");
      await actor.topUpWallet(amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["recentTransactions"] });
    },
  });
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export function useGetTransactionHistory() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTransactionHistory();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetRecentTransactions() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Transaction[]>({
    queryKey: ["recentTransactions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRecentTransactions();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSendMoney() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      to,
      amount,
      note,
      confirmedByMpin,
    }: {
      to: string;
      amount: number;
      note: string | null;
      confirmedByMpin: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.sendMoney(to, amount, note, confirmedByMpin);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["recentTransactions"] });
    },
  });
}

export function useRequestMoney() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      to,
      amount,
      note,
    }: {
      to: string;
      amount: number;
      note: string | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.requestMoney(to, amount, note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
    },
  });
}

// ─── Money Requests ───────────────────────────────────────────────────────────

export function useGetPendingMoneyRequests() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<MoneyRequest[]>({
    queryKey: ["pendingRequests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingMoneyRequests();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 15000,
  });
}

export function useAcceptRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      confirmedByMpin,
    }: {
      requestId: bigint;
      confirmedByMpin: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.acceptRequest(requestId, confirmedByMpin);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
      queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["recentTransactions"] });
    },
  });
}

export function useDeclineRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      await actor.declineRequest(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
    },
  });
}

// ─── Bills ────────────────────────────────────────────────────────────────────

export function usePayBill() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (billPayment: BillPayment) => {
      if (!actor) throw new Error("Actor not available");
      await actor.payBill(billPayment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["recentTransactions"] });
    },
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function useGetNotifications() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getNotifications();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 30000,
  });
}

export function useGetUnreadNotificationCount() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["unreadNotifications"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getUnreadNotificationCount();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 30000,
  });
}

export function useMarkNotificationAsRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      await actor.markNotificationAsRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotifications"] });
    },
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<UserRole>({
    queryKey: ["callerUserRole"],
    queryFn: async () => {
      if (!actor) return UserRole.guest;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetAllUsers() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Array<[Principal, Profile]>>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetAllTransactions() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Transaction[]>({
    queryKey: ["allTransactions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTransactions();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetPlatformStats() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<PlatformStats | null>({
    queryKey: ["platformStats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPlatformStats();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAdminAdjustBalance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userPrincipal,
      newBalance,
    }: {
      userPrincipal: Principal;
      newBalance: number;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.adminAdjustUserBalance(userPrincipal, newBalance);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["platformStats"] });
    },
  });
}

export function useAdminAssignRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      targetUser,
      role,
    }: {
      targetUser: Principal;
      role: UserRole;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.adminAssignUserRole(targetUser, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["callerUserRole"] });
    },
  });
}

// ─── UPI Lookup ───────────────────────────────────────────────────────────────

export function useLookupProfileByUpiId(upiId: string) {
  const { actor } = useActor();
  return useQuery<{ name: string; upiId: string } | null>({
    queryKey: ["lookupUpi", upiId],
    queryFn: async () => {
      if (!actor || !upiId.trim()) return null;
      return actor.lookupProfileByUpiId(upiId.trim());
    },
    enabled: !!actor && upiId.trim().includes("@"),
    retry: false,
    staleTime: 10000,
  });
}

export function useLookupProfileByPhone(phone: string) {
  const { actor } = useActor();
  return useQuery<{ name: string; upiId: string } | null>({
    queryKey: ["lookupPhone", phone],
    queryFn: async () => {
      if (!actor || !phone.trim()) return null;
      return actor.lookupProfileByPhone(phone.trim());
    },
    enabled: !!actor && /^\d{10}$/.test(phone.trim()),
    retry: false,
    staleTime: 10000,
  });
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const SWIFTPAY_LOGGED_IN_KEY = "swiftpay_logged_in";

export function useSignup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      phone,
      passwordHash,
      mpinHash,
    }: {
      name: string;
      phone: string;
      passwordHash: string;
      mpinHash: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.signup(name, phone, passwordHash, mpinHash);
    },
    onSuccess: () => {
      localStorage.setItem(SWIFTPAY_LOGGED_IN_KEY, "true");
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
      queryClient.invalidateQueries({ queryKey: ["hasAccount"] });
      void queryClient.refetchQueries({ queryKey: ["hasAccount"] });
      void queryClient.refetchQueries({ queryKey: ["callerProfile"] });
    },
  });
}

export function useLogin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      phone,
      passwordHash,
    }: {
      phone: string;
      passwordHash: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.login(phone, passwordHash);
    },
    onSuccess: (data) => {
      if (data) {
        localStorage.setItem(SWIFTPAY_LOGGED_IN_KEY, "true");
      }
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
      queryClient.invalidateQueries({ queryKey: ["hasAccount"] });
      void queryClient.refetchQueries({ queryKey: ["hasAccount"] });
      void queryClient.refetchQueries({ queryKey: ["callerProfile"] });
    },
  });
}

export function useVerifyMpin() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (mpinHash: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.verifyMpin(mpinHash);
    },
  });
}

export function useHasAccount() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["hasAccount"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.hasAccount();
    },
    enabled: !!actor && !actorFetching,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useChangePassword() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      oldPasswordHash,
      newPasswordHash,
    }: {
      oldPasswordHash: string;
      newPasswordHash: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.changePassword(oldPasswordHash, newPasswordHash);
    },
  });
}

export function useChangeMpin() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      oldMpinHash,
      newMpinHash,
    }: {
      oldMpinHash: string;
      newMpinHash: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.changeMpin(oldMpinHash, newMpinHash);
    },
  });
}
