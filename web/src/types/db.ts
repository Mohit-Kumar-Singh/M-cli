// Hand-written for Milestone 0/1. Replace with generated types once the
// Supabase project exists:  supabase gen types typescript --linked > db.ts

export type Role = "owner" | "delivery_runner" | "dairy_hand";

export type AnimalStatus =
  | "heifer"
  | "milking"
  | "dry"
  | "pregnant"
  | "sick"
  | "sold"
  | "dead";

export type RetailCustomerType = "casual" | "regular";
export type OrderSource = "standing" | "bot" | "manual";
export type OrderStatus = "pending" | "delivered" | "skipped" | "cancelled";
export type PaymentMethod = "upi" | "cash" | "none";

export interface Profile {
  id: string;
  full_name: string | null;
  role: Role;
  created_at: string;
}

export interface Animal {
  id: string;
  tag_no: string;
  name: string | null;
  breed: string | null;
  sex: "female" | "male";
  dob: string | null;
  source: "born_on_farm" | "purchased" | null;
  purchase_date: string | null;
  purchase_cost: number | null;
  dam_id: string | null;
  status: AnimalStatus;
  lactation_number: number | null;
  photo_path: string | null;
  disposal_date: string | null;
  disposal_reason: string | null;
  sale_amount: number | null;
  notes: string | null;
  created_at: string;
}

export interface MilkProduction {
  id: string;
  date: string;
  session: "morning" | "evening";
  animal_id: string | null;
  qty_kg: number;
  recorded_by: string | null;
  created_at: string;
}

export interface WholesaleCustomer {
  id: string;
  name: string;
  shop: string | null;
  phone: string | null;
  address: string | null;
  rate_per_kg: number;
  payment_terms: string | null;
  notes: string | null;
  created_at: string;
}

export interface WholesaleDelivery {
  id: string;
  date: string;
  customer_id: string;
  qty_kg: number;
  rate_per_kg: number;
  amount: number;
  paid: boolean;
  payment_method: PaymentMethod;
  amount_received: number | null;
  notes: string | null;
  created_at: string;
}

export interface RetailCustomer {
  id: string;
  name: string;
  phone: string | null;
  address_text: string | null;
  area: string | null;
  type: RetailCustomerType;
  status: "active" | "inactive";
  fixed_daily_qty_kg: number | null;
  price_per_kg: number;
  regular_since: string | null;
  price_lock_until: string | null;
  payment_mode: "per_delivery" | "recharge" | "monthly";
  referral_source: string | null;
  round_sequence: number | null;
  notes: string | null;
  created_at: string;
}

export interface RetailOrder {
  id: string;
  customer_id: string;
  delivery_date: string;
  product: string;
  ordered_qty_kg: number;
  source: OrderSource;
  status: OrderStatus;
  delivered_qty_kg: number | null;
  delivered_at: string | null;
  delivered_by: string | null;
  paid: boolean;
  payment_method: PaymentMethod;
  amount_collected: number | null;
  created_at: string;
}

export interface DailyBalance {
  date: string;
  produced_kg: number | null;
  sellable_kg: number | null;
  wholesale_kg: number | null;
  retail_kg: number | null;
  own_use_kg: number | null;
  wastage_kg: number | null;
  buffer_start_kg: number | null;
  buffer_end_kg: number | null;
  cash_total: number | null;
  upi_total: number | null;
  unpaid_total: number | null;
  notes: string | null;
}

// ---------------------------------------------------------------------------
// Milestone 2 — Feed, Expenses, Health (migration 0002)
// ---------------------------------------------------------------------------
export type FeedCategory =
  | "green_fodder"
  | "dry_fodder"
  | "concentrate"
  | "mineral"
  | "other";
export type FeedScope = "herd" | "group" | "animal";
export type ExpenseCategory =
  | "labour"
  | "electricity"
  | "water"
  | "equipment"
  | "maintenance"
  | "transport"
  | "vet"
  | "feed"
  | "rent"
  | "misc";
export type ExpenseCadence = "weekly" | "monthly";
export type HealthScope = "animal" | "herd";
export type HealthEventType =
  | "vaccination"
  | "deworming"
  | "illness"
  | "treatment"
  | "vet_visit"
  | "injury";

export interface FeedItem {
  id: string;
  name: string;
  category: FeedCategory;
  unit: string;
  current_stock: number;
  notes: string | null;
  created_at: string;
}

export interface FeedPurchase {
  id: string;
  date: string;
  feed_item_id: string;
  qty: number;
  cost: number;
  supplier: string | null;
  notes: string | null;
  created_at: string;
}

export interface FeedConsumption {
  id: string;
  date: string;
  feed_item_id: string;
  qty: number;
  scope: FeedScope;
  animal_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  paid_to: string | null;
  payment_method: PaymentMethod;
  linked_ref: string | null;
  notes: string | null;
  created_at: string;
}

export interface ExpenseTemplate {
  id: string;
  label: string;
  category: ExpenseCategory;
  amount: number;
  cadence: ExpenseCadence;
  active: boolean;
  notes: string | null;
  created_at: string;
}

export interface HealthEvent {
  id: string;
  scope: HealthScope;
  animal_id: string | null;
  event_type: HealthEventType;
  event_date: string;
  product_used: string | null;
  dose: string | null;
  milk_withdrawal_until: string | null;
  meat_withdrawal_until: string | null;
  cost: number;
  vet_name: string | null;
  next_due_date: string | null;
  notes: string | null;
  created_at: string;
}
