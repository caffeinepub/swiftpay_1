import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface Notification {
    id: bigint;
    type: NotificationType;
    isRead: boolean;
    message: string;
    timestamp: Time;
}
export interface MoneyRequest {
    id: bigint;
    status: RequestStatus;
    note?: string;
    fromUpiId: string;
    toUpiId: string;
    timestamp: Time;
    amount: number;
}
export interface BillPayment {
    provider: string;
    billNumber: string;
    category: BillCategory;
    amount: number;
}
export interface Profile {
    name: string;
    upiId: string;
    phone: string;
    walletBalance: number;
}
export interface PlatformStats {
    totalWalletBalance: number;
    totalVolume: number;
    totalUsers: bigint;
    totalTransactions: bigint;
}
export interface Transaction {
    id: bigint;
    status: TransactionStatus;
    note?: string;
    type: TransactionType;
    fromUpiId: string;
    toUpiId: string;
    timestamp: Time;
    amount: number;
}
export enum BillCategory {
    dth = "dth",
    gas = "gas",
    electricity = "electricity",
    mobile = "mobile",
    water = "water"
}
export enum NotificationType {
    requestAccepted = "requestAccepted",
    requestReceived = "requestReceived",
    transactionAlert = "transactionAlert"
}
export enum RequestStatus {
    pending = "pending",
    accepted = "accepted",
    declined = "declined"
}
export enum TransactionStatus {
    pending = "pending",
    success = "success",
    failed = "failed"
}
export enum TransactionType {
    billPayment = "billPayment",
    topUp = "topUp",
    receive = "receive",
    send = "send",
    recharge = "recharge"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    acceptRequest(requestId: bigint, confirmedByMpin: boolean): Promise<void>;
    adminAdjustUserBalance(userPrincipal: Principal, newBalance: number): Promise<void>;
    adminAssignUserRole(targetUser: Principal, role: UserRole): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    changeMpin(oldMpinHash: string, newMpinHash: string): Promise<void>;
    changePassword(oldPasswordHash: string, newPasswordHash: string): Promise<void>;
    createOrUpdateProfile(name: string, phone: string): Promise<void>;
    declineRequest(requestId: bigint): Promise<void>;
    getAllTransactions(): Promise<Array<Transaction>>;
    getAllUsers(): Promise<Array<[Principal, Profile]>>;
    getCallerUserProfile(): Promise<Profile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getNotifications(): Promise<Array<Notification>>;
    getPendingMoneyRequests(): Promise<Array<MoneyRequest>>;
    getPlatformStats(): Promise<PlatformStats>;
    getProfile(): Promise<Profile | null>;
    getRecentTransactions(): Promise<Array<Transaction>>;
    getTransactionHistory(): Promise<Array<Transaction>>;
    getUnreadNotificationCount(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<Profile | null>;
    getWalletBalance(): Promise<number>;
    getWalletBalanceByPhone(phone: string): Promise<number>;
    getWalletBalanceByUpiId(upiId: string): Promise<number>;
    hasAccount(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    login(phone: string, passwordHash: string): Promise<Profile | null>;
    lookupProfileByPhone(phone: string): Promise<{
        name: string;
        upiId: string;
    } | null>;
    lookupProfileByUpiId(upiId: string): Promise<{
        name: string;
        upiId: string;
    } | null>;
    markNotificationAsRead(notificationId: bigint): Promise<void>;
    payBill(billPayment: BillPayment): Promise<void>;
    requestMoney(to: string, amount: number, note: string | null): Promise<void>;
    saveCallerUserProfile(name: string, phone: string): Promise<void>;
    sendMoney(to: string, amount: number, note: string | null, confirmedByMpin: boolean): Promise<void>;
    signup(name: string, phone: string, passwordHash: string, mpinHash: string): Promise<void>;
    topUpWallet(amount: number): Promise<void>;
    verifyMpin(mpinHash: string): Promise<boolean>;
}
