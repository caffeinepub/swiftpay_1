import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Array "mo:core/Array";

module {
  type Profile = {
    name : Text;
    phone : Text;
    upiId : Text;
    walletBalance : Float;
  };

  type Transaction = {
    id : Nat;
    fromUpiId : Text;
    toUpiId : Text;
    amount : Float;
    type_ : { #send; #receive; #topUp; #billPayment; #recharge };
    note : ?Text;
    timestamp : Int;
    status : { #success; #pending; #failed };
  };

  type Notification = {
    id : Nat;
    message : Text;
    type_ : { #transactionAlert; #requestReceived; #requestAccepted };
    timestamp : Int;
    isRead : Bool;
  };

  type MoneyRequest = {
    id : Nat;
    fromUpiId : Text;
    toUpiId : Text;
    amount : Float;
    note : ?Text;
    status : { #pending; #accepted; #declined };
    timestamp : Int;
  };

  type BillPayment = {
    billNumber : Text;
    provider : Text;
    category : { #mobile; #electricity; #dth; #water; #gas };
    amount : Float;
  };

  type Account = {
    phone : Text;
    passwordHash : Text;
    mpinHash : Text;
    principalId : Principal;
  };

  type OldActor = {
    profiles : Map.Map<Principal, Profile>;
    transactions : Map.Map<Nat, Transaction>;
    notifications : Map.Map<Principal, [Notification]>;
    moneyRequests : Map.Map<Nat, MoneyRequest>;
    accounts : Map.Map<Text, Account>;
    nextTransactionId : Nat;
    nextNotificationId : Nat;
    nextRequestId : Nat;
    principalToPhone : Map.Map<Principal, Text>;
  };

  type NewActor = {
    profiles : Map.Map<Principal, Profile>;
    transactions : Map.Map<Nat, Transaction>;
    notifications : Map.Map<Principal, [Notification]>;
    moneyRequests : Map.Map<Nat, MoneyRequest>;
    accounts : Map.Map<Text, Account>;
    nextTransactionId : Nat;
    nextNotificationId : Nat;
    nextRequestId : Nat;
    principalToPhone : Map.Map<Principal, Text>;
  };

  public func run(old : OldActor) : NewActor {
    old;
  };
};
