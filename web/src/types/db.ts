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

// A typed `Database` interface will replace these once generated from the
// live Supabase project (see src/lib/supabase.ts).
