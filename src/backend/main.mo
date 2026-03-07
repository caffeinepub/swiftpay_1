import Map "mo:core/Map";
import Array "mo:core/Array";
import Float "mo:core/Float";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Types
  public type Profile = {
    name : Text;
    phone : Text;
    upiId : Text;
    walletBalance : Float;
  };

  module Profile {
    public func compare(profile1 : Profile, profile2 : Profile) : Order.Order {
      switch (Text.compare(profile1.name, profile2.name)) {
        case (#equal) { Text.compare(profile1.upiId, profile2.upiId) };
        case (order) { order };
      };
    };
  };

  public type Transaction = {
    id : Nat;
    fromUpiId : Text;
    toUpiId : Text;
    amount : Float;
    type_ : TransactionType;
    note : ?Text;
    timestamp : Time.Time;
    status : TransactionStatus;
  };

  module Transaction {
    public func compareByTimestamp(t1 : Transaction, t2 : Transaction) : Order.Order {
      Nat.compare(Int.abs(t1.timestamp), Int.abs(t2.timestamp));
    };
  };

  public type TransactionType = {
    #send;
    #receive;
    #topUp;
    #billPayment;
    #recharge;
  };

  public type TransactionStatus = {
    #success;
    #pending;
    #failed;
  };

  public type Notification = {
    id : Nat;
    message : Text;
    type_ : NotificationType;
    timestamp : Time.Time;
    isRead : Bool;
  };

  public type NotificationType = {
    #transactionAlert;
    #requestReceived;
    #requestAccepted;
  };

  public type MoneyRequest = {
    id : Nat;
    fromUpiId : Text;
    toUpiId : Text;
    amount : Float;
    note : ?Text;
    status : RequestStatus;
    timestamp : Time.Time;
  };

  public type RequestStatus = {
    #pending;
    #accepted;
    #declined;
  };

  public type BillCategory = {
    #mobile;
    #electricity;
    #dth;
    #water;
    #gas;
  };

  public type BillPayment = {
    billNumber : Text;
    provider : Text;
    category : BillCategory;
    amount : Float;
  };

  public type PlatformStats = {
    totalUsers : Nat;
    totalTransactions : Nat;
    totalVolume : Float;
    totalWalletBalance : Float;
  };

  public type Account = {
    phone : Text;
    passwordHash : Text;
    mpinHash : Text;
    principalId : Principal;
  };

  // State
  let profiles = Map.empty<Principal, Profile>();
  let transactions = Map.empty<Nat, Transaction>();
  let notifications = Map.empty<Principal, [Notification]>();
  let moneyRequests = Map.empty<Nat, MoneyRequest>();
  let accounts = Map.empty<Text, Account>();
  let principalToPhone = Map.empty<Principal, Text>();

  // ID Counters
  var nextTransactionId = 1;
  var nextNotificationId = 1;
  var nextRequestId = 1;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Helper Functions
  func getProfileByUpi(upiId : Text) : ?Profile {
    for ((_, profile) in profiles.entries()) {
      if (profile.upiId == upiId) { return ?profile };
    };
    null;
  };

  func getProfileByPhone(phone : Text) : ?Profile {
    for ((_, profile) in profiles.entries()) {
      if (profile.phone == phone) { return ?profile };
    };
    null;
  };

  func getPrincipalByUpiId(upiId : Text) : ?Principal {
    for ((principal, profile) in profiles.entries()) {
      if (profile.upiId == upiId) { return ?principal };
    };
    null;
  };

  func addNotification(principal : Principal, message : Text, type_ : NotificationType) {
    let notification : Notification = {
      id = nextNotificationId;
      message;
      type_;
      timestamp = Time.now();
      isRead = false;
    };
    nextNotificationId += 1;

    let existingNotifications = switch (notifications.get(principal)) {
      case (null) { [] };
      case (?notifs) { notifs };
    };

    let updatedNotifications = existingNotifications.concat([notification]);
    notifications.add(principal, updatedNotifications);
  };

  // Account Management Functions
  public shared ({ caller }) func signup(name : Text, phone : Text, passwordHash : Text, mpinHash : Text) : async () {
    if (accounts.containsKey(phone)) {
      Runtime.trap("Phone number already registered");
    };

    let upiId = phone # "@swiftpay";
    let profile : Profile = {
      name;
      phone;
      upiId;
      walletBalance = 1000.0;
    };

    let account : Account = {
      phone;
      passwordHash;
      mpinHash;
      principalId = caller;
    };

    accounts.add(phone, account);
    profiles.add(caller, profile);
    principalToPhone.add(caller, phone);
    accessControlState.userRoles.add(caller, #user);
  };

  public shared ({ caller }) func login(phone : Text, passwordHash : Text) : async ?Profile {
    switch (accounts.get(phone)) {
      case (null) { null };
      case (?account) {
        if (account.passwordHash != passwordHash) { return null };

        principalToPhone.add(caller, phone);
        if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
          accessControlState.userRoles.add(caller, #user);
        };
        getProfileByPhone(phone);
      };
    };
  };

  public shared ({ caller }) func verifyMpin(mpinHash : Text) : async Bool {
    switch (principalToPhone.get(caller)) {
      case (null) { false };
      case (?phone) {
        switch (accounts.get(phone)) {
          case (null) { false };
          case (?account) { account.mpinHash == mpinHash };
        };
      };
    };
  };

  public query ({ caller }) func hasAccount() : async Bool {
    principalToPhone.containsKey(caller);
  };

  public shared ({ caller }) func changePassword(oldPasswordHash : Text, newPasswordHash : Text) : async () {
    switch (principalToPhone.get(caller)) {
      case (null) { Runtime.trap("Account not found") };
      case (?phone) {
        switch (accounts.get(phone)) {
          case (null) { Runtime.trap("Account not found") };
          case (?account) {
            if (account.passwordHash != oldPasswordHash) {
              Runtime.trap("Incorrect old password");
            };
            let updatedAccount : Account = {
              phone = account.phone;
              passwordHash = newPasswordHash;
              mpinHash = account.mpinHash;
              principalId = account.principalId;
            };
            accounts.add(phone, updatedAccount);
          };
        };
      };
    };
  };

  public shared ({ caller }) func changeMpin(oldMpinHash : Text, newMpinHash : Text) : async () {
    switch (principalToPhone.get(caller)) {
      case (null) { Runtime.trap("Account not found") };
      case (?phone) {
        switch (accounts.get(phone)) {
          case (null) { Runtime.trap("Account not found") };
          case (?account) {
            if (account.mpinHash != oldMpinHash) {
              Runtime.trap("Incorrect old MPIN");
            };
            let updatedAccount : Account = {
              phone = account.phone;
              passwordHash = account.passwordHash;
              mpinHash = newMpinHash;
              principalId = account.principalId;
            };
            accounts.add(phone, updatedAccount);
          };
        };
      };
    };
  };

  // Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?Profile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    profiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?Profile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    profiles.get(user);
  };

  // Lookup profile by UPI ID without authentication
  public query ({ caller }) func lookupProfileByUpiId(upiId : Text) : async ?{ name : Text; upiId : Text } {
    switch (getProfileByUpi(upiId)) {
      case (null) { null };
      case (?profile) {
        ?{
          name = profile.name;
          upiId = profile.upiId;
        };
      };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(name : Text, phone : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    let upiId = phone # "@swiftpay";
    let existingProfile = profiles.get(caller);
    let walletBalance = switch (existingProfile) {
      case (null) { 1000.0 };
      case (?profile) { profile.walletBalance };
    };

    let profile : Profile = {
      name;
      phone;
      upiId;
      walletBalance;
    };

    profiles.add(caller, profile);
  };

  // Public phone lookup function
  public query ({ caller }) func lookupProfileByPhone(phone : Text) : async ?{ name : Text; upiId : Text } {
    switch (getProfileByPhone(phone)) {
      case (null) { null };
      case (?profile) {
        ?{
          name = profile.name;
          upiId = profile.upiId;
        };
      };
    };
  };

  public shared ({ caller }) func createOrUpdateProfile(name : Text, phone : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create or update profiles");
    };

    let upiId = phone # "@swiftpay";
    let existingProfile = profiles.get(caller);
    let walletBalance = switch (existingProfile) {
      case (null) { 1000.0 };
      case (?profile) { profile.walletBalance };
    };

    let profile : Profile = {
      name;
      phone;
      upiId;
      walletBalance;
    };

    profiles.add(caller, profile);
  };

  public query ({ caller }) func getProfile() : async ?Profile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    profiles.get(caller);
  };

  public query ({ caller }) func getWalletBalance() : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view wallet balance");
    };

    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) { profile.walletBalance };
    };
  };

  public query ({ caller }) func getWalletBalanceByUpiId(upiId : Text) : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view wallet balances");
    };

    switch (getProfileByUpi(upiId)) {
      case (null) { Runtime.trap("UPI ID not found") };
      case (?profile) { profile.walletBalance };
    };
  };

  public query ({ caller }) func getWalletBalanceByPhone(phone : Text) : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view wallet balances");
    };

    switch (getProfileByPhone(phone)) {
      case (null) { Runtime.trap("Phone number not found") };
      case (?profile) { profile.walletBalance };
    };
  };

  public shared ({ caller }) func topUpWallet(amount : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can top up wallet");
    };

    if (amount <= 0.0) {
      Runtime.trap("Amount must be positive");
    };

    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) {
        let newBalance = profile.walletBalance + amount;
        let updatedProfile : Profile = {
          name = profile.name;
          phone = profile.phone;
          upiId = profile.upiId;
          walletBalance = newBalance;
        };
        profiles.add(caller, updatedProfile);

        let transaction : Transaction = {
          id = nextTransactionId;
          fromUpiId = profile.upiId;
          toUpiId = profile.upiId;
          amount;
          type_ = #topUp;
          note = ?"Wallet Top-up";
          timestamp = Time.now();
          status = #success;
        };

        transactions.add(nextTransactionId, transaction);
        nextTransactionId += 1;

        addNotification(caller, "Wallet topped up with " # amount.toText(), #transactionAlert);
      };
    };
  };

  public shared ({ caller }) func sendMoney(to : Text, amount : Float, note : ?Text, confirmedByMpin : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send money");
    };

    if (not confirmedByMpin) {
      Runtime.trap("MPIN verification failed");
    };

    if (amount <= 0.0) {
      Runtime.trap("Amount must be positive");
    };

    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Sender profile not found") };
      case (?senderProfile) {
        if (senderProfile.walletBalance < amount) {
          Runtime.trap("Insufficient funds");
        };

        let recipientProfileOpt = if (to.contains(#char '@')) {
          getProfileByUpi(to);
        } else {
          getProfileByPhone(to);
        };

        let recipientProfile = switch (recipientProfileOpt) {
          case (null) { Runtime.trap("Recipient not found") };
          case (?profile) { profile };
        };

        let updatedSender : Profile = {
          name = senderProfile.name;
          phone = senderProfile.phone;
          upiId = senderProfile.upiId;
          walletBalance = senderProfile.walletBalance - amount;
        };
        profiles.add(caller, updatedSender);

        let updatedRecipient : Profile = {
          name = recipientProfile.name;
          phone = recipientProfile.phone;
          upiId = recipientProfile.upiId;
          walletBalance = recipientProfile.walletBalance + amount;
        };

        switch (getPrincipalByUpiId(recipientProfile.upiId)) {
          case (null) { Runtime.trap("Recipient principal not found") };
          case (?recipientPrincipal) {
            profiles.add(recipientPrincipal, updatedRecipient);

            let transaction : Transaction = {
              id = nextTransactionId;
              fromUpiId = senderProfile.upiId;
              toUpiId = recipientProfile.upiId;
              amount;
              type_ = #send;
              note;
              timestamp = Time.now();
              status = #success;
            };
            transactions.add(nextTransactionId, transaction);

            let receivedTransaction : Transaction = {
              id = nextTransactionId + 1;
              fromUpiId = senderProfile.upiId;
              toUpiId = recipientProfile.upiId;
              amount;
              type_ = #receive;
              note;
              timestamp = Time.now();
              status = #success;
            };
            transactions.add(nextTransactionId + 1, receivedTransaction);

            nextTransactionId += 2;

            addNotification(caller, "Sent " # amount.toText() # " to " # recipientProfile.name, #transactionAlert);
            addNotification(recipientPrincipal, "Received " # amount.toText() # " from " # senderProfile.name, #transactionAlert);
          };
        };
      };
    };
  };

  public query ({ caller }) func getTransactionHistory() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transaction history");
    };

    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) {
        let userTransactions = transactions.values().toArray().filter(
          func(tx : Transaction) : Bool {
            tx.fromUpiId == profile.upiId or tx.toUpiId == profile.upiId
          }
        );
        userTransactions;
      };
    };
  };

  public query ({ caller }) func getRecentTransactions() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };

    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) {
        let userTransactions = transactions.values().toArray().filter(
          func(tx : Transaction) : Bool {
            tx.fromUpiId == profile.upiId or tx.toUpiId == profile.upiId
          }
        );

        let sorted = userTransactions.sort(Transaction.compareByTimestamp);
        let reversed = sorted.reverse();

        if (reversed.size() <= 5) {
          reversed;
        } else {
          Array.tabulate<Transaction>(5, func(i : Nat) : Transaction { reversed[i] });
        };
      };
    };
  };

  public shared ({ caller }) func requestMoney(to : Text, amount : Float, note : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can request money");
    };

    if (amount <= 0.0) {
      Runtime.trap("Amount must be positive");
    };

    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Requester profile not found") };
      case (?requesterProfile) {
        let recipientProfileOpt = if (to.contains(#char '@')) {
          getProfileByUpi(to);
        } else {
          getProfileByPhone(to);
        };

        let recipientProfile = switch (recipientProfileOpt) {
          case (null) { Runtime.trap("Recipient not found") };
          case (?profile) { profile };
        };

        let request : MoneyRequest = {
          id = nextRequestId;
          fromUpiId = requesterProfile.upiId;
          toUpiId = recipientProfile.upiId;
          amount;
          note;
          status = #pending;
          timestamp = Time.now();
        };

        moneyRequests.add(nextRequestId, request);
        nextRequestId += 1;

        switch (getPrincipalByUpiId(recipientProfile.upiId)) {
          case (null) { };
          case (?recipientPrincipal) {
            addNotification(recipientPrincipal, requesterProfile.name # " requested " # amount.toText(), #requestReceived);
          };
        };
      };
    };
  };

  public query ({ caller }) func getPendingMoneyRequests() : async [MoneyRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view money requests");
    };

    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) {
        let pendingRequests = moneyRequests.values().toArray().filter(
          func(req : MoneyRequest) : Bool {
            req.toUpiId == profile.upiId and req.status == #pending
          }
        );
        pendingRequests;
      };
    };
  };

  public shared ({ caller }) func acceptRequest(requestId : Nat, confirmedByMpin : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can accept requests");
    };

    if (not confirmedByMpin) {
      Runtime.trap("MPIN verification failed");
    };

    switch (moneyRequests.get(requestId)) {
      case (null) { Runtime.trap("Request not found") };
      case (?request) {
        if (request.status != #pending) {
          Runtime.trap("Request is not pending");
        };

        switch (profiles.get(caller)) {
          case (null) { Runtime.trap("Profile not found") };
          case (?profile) {
            if (request.toUpiId != profile.upiId) {
              Runtime.trap("Unauthorized: Not authorized to accept this request");
            };

            if (profile.walletBalance < request.amount) {
              Runtime.trap("Insufficient funds");
            };

            let updatedProfile : Profile = {
              name = profile.name;
              phone = profile.phone;
              upiId = profile.upiId;
              walletBalance = profile.walletBalance - request.amount;
            };
            profiles.add(caller, updatedProfile);

            let requesterProfileOpt = getProfileByUpi(request.fromUpiId);
            let requesterProfile = switch (requesterProfileOpt) {
              case (null) { Runtime.trap("Requester profile not found") };
              case (?prof) { prof };
            };

            let updatedRequester : Profile = {
              name = requesterProfile.name;
              phone = requesterProfile.phone;
              upiId = requesterProfile.upiId;
              walletBalance = requesterProfile.walletBalance + request.amount;
            };

            switch (getPrincipalByUpiId(requesterProfile.upiId)) {
              case (null) { Runtime.trap("Requester principal not found") };
              case (?requesterPrincipal) {
                profiles.add(requesterPrincipal, updatedRequester);

                let sendTransaction : Transaction = {
                  id = nextTransactionId;
                  fromUpiId = profile.upiId;
                  toUpiId = request.fromUpiId;
                  amount = request.amount;
                  type_ = #send;
                  note = ?"Accepted request";
                  timestamp = Time.now();
                  status = #success;
                };
                transactions.add(nextTransactionId, sendTransaction);

                let receiveTransaction : Transaction = {
                  id = nextTransactionId + 1;
                  fromUpiId = profile.upiId;
                  toUpiId = request.fromUpiId;
                  amount = request.amount;
                  type_ = #receive;
                  note = ?"Accepted request";
                  timestamp = Time.now();
                  status = #success;
                };
                transactions.add(nextTransactionId + 1, receiveTransaction);

                let updatedRequest : MoneyRequest = {
                  id = request.id;
                  fromUpiId = request.fromUpiId;
                  toUpiId = request.toUpiId;
                  amount = request.amount;
                  note = request.note;
                  status = #accepted;
                  timestamp = request.timestamp;
                };
                moneyRequests.add(requestId, updatedRequest);
                nextTransactionId += 2;

                addNotification(caller, "Request accepted for " # request.amount.toText(), #transactionAlert);
                addNotification(requesterPrincipal, profile.name # " accepted your request", #requestAccepted);
              };
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func declineRequest(requestId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can decline requests");
    };

    switch (moneyRequests.get(requestId)) {
      case (null) { Runtime.trap("Request not found") };
      case (?request) {
        if (request.status != #pending) {
          Runtime.trap("Request is not pending");
        };

        switch (profiles.get(caller)) {
          case (null) { Runtime.trap("Profile not found") };
          case (?profile) {
            if (request.toUpiId != profile.upiId) {
              Runtime.trap("Unauthorized: Not authorized to decline this request");
            };

            let updatedRequest : MoneyRequest = {
              id = request.id;
              fromUpiId = request.fromUpiId;
              toUpiId = request.toUpiId;
              amount = request.amount;
              note = request.note;
              status = #declined;
              timestamp = request.timestamp;
            };
            moneyRequests.add(requestId, updatedRequest);
          };
        };
      };
    };
  };

  public shared ({ caller }) func payBill(billPayment : BillPayment) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can pay bills");
    };

    if (billPayment.amount <= 0.0) {
      Runtime.trap("Amount must be positive");
    };

    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) {
        if (profile.walletBalance < billPayment.amount) {
          Runtime.trap("Insufficient funds");
        };

        let updatedProfile : Profile = {
          name = profile.name;
          phone = profile.phone;
          upiId = profile.upiId;
          walletBalance = profile.walletBalance - billPayment.amount;
        };
        profiles.add(caller, updatedProfile);

        let transaction : Transaction = {
          id = nextTransactionId;
          fromUpiId = profile.upiId;
          toUpiId = billPayment.provider;
          amount = billPayment.amount;
          type_ = #billPayment;
          note = ?("Bill payment: " # billPayment.billNumber);
          timestamp = Time.now();
          status = #success;
        };
        transactions.add(nextTransactionId, transaction);
        nextTransactionId += 1;

        addNotification(caller, "Bill paid: " # billPayment.amount.toText(), #transactionAlert);
      };
    };
  };

  public query ({ caller }) func getNotifications() : async [Notification] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view notifications");
    };

    switch (notifications.get(caller)) {
      case (null) { [] };
      case (?notifs) { notifs };
    };
  };

  public shared ({ caller }) func markNotificationAsRead(notificationId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark notifications as read");
    };

    switch (notifications.get(caller)) {
      case (null) { Runtime.trap("No notifications found") };
      case (?notifs) {
        let updatedNotifs = notifs.map(
          func(notif : Notification) : Notification {
            if (notif.id == notificationId) {
              {
                id = notif.id;
                message = notif.message;
                type_ = notif.type_;
                timestamp = notif.timestamp;
                isRead = true;
              };
            } else {
              notif;
            };
          }
        );
        notifications.add(caller, updatedNotifs);
      };
    };
  };

  public query ({ caller }) func getUnreadNotificationCount() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view notification count");
    };

    switch (notifications.get(caller)) {
      case (null) { 0 };
      case (?notifs) {
        notifs.filter<Notification>(func(n : Notification) : Bool { not n.isRead }).size();
      };
    };
  };

  // Admin Panel Functions
  public query ({ caller }) func getAllUsers() : async [(Principal, Profile)] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };

    profiles.toArray();
  };

  public query ({ caller }) func getAllTransactions() : async [Transaction] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all transactions");
    };

    transactions.values().toArray();
  };

  public query ({ caller }) func getPlatformStats() : async PlatformStats {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view platform stats");
    };

    let totalUsers = profiles.size();
    let totalTransactions = transactions.size();

    let totalVolume = transactions.values().toArray().foldLeft(
      0.0,
      func(acc, tx) { acc + tx.amount },
    );

    let totalWalletBalance = profiles.values().toArray().foldLeft(
      0.0,
      func(acc, profile) { acc + profile.walletBalance },
    );

    {
      totalUsers;
      totalTransactions;
      totalVolume;
      totalWalletBalance;
    };
  };

  public shared ({ caller }) func adminAdjustUserBalance(userPrincipal : Principal, newBalance : Float) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can adjust user balances");
    };

    switch (profiles.get(userPrincipal)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        let updatedProfile : Profile = {
          name = profile.name;
          phone = profile.phone;
          upiId = profile.upiId;
          walletBalance = newBalance;
        };
        profiles.add(userPrincipal, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func adminAssignUserRole(targetUser : Principal, role : AccessControl.UserRole) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can assign roles");
    };
    AccessControl.assignRole(accessControlState, caller, targetUser, role);
  };
};
