export type UserRole = "landlord" | "tenant";

export type PropertyType = "residential" | "commercial" | "mixed";

export type UnitStatus = "vacant" | "occupied" | "maintenance";

export type LeaseStatus = "active" | "expired" | "terminated" | "pending";

export type RentCycleStatus =
  | "due"
  | "paid"
  | "late"
  | "pending_verification"
  | "failed"
  | "partial";

export type PaymentMethod =
  | "bkash"
  | "nagad"
  | "rocket"
  | "card"
  | "bank_transfer"
  | "manual";

export type PaymentStatus =
  | "initiated"
  | "success"
  | "failed"
  | "cancelled"
  | "refunded";

export type VerificationStatus = "pending" | "approved" | "rejected";

export type ApplicationStatus = "pending" | "approved" | "rejected";

export type ReminderType =
  | "upcoming_due"
  | "overdue"
  | "payment_received"
  | "verification_needed";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Landlord {
  id: string;
  user_id: string;
  company_name: string | null;
  address: string | null;
  nid_number: string | null;
  subscription_tier: string;
  max_properties: number;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  landlord_id: string;
  name: string;
  address: string;
  city: string;
  area: string | null;
  property_type: PropertyType;
  total_units: number;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  property_id: string;
  landlord_id: string;
  unit_number: string;
  floor: number | null;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number | null;
  monthly_rent: number;
  status: UnitStatus;
  is_listed: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  user_id: string | null;
  landlord_id: string;
  full_name: string;
  email: string | null;
  phone: string;
  nid_number: string | null;
  emergency_contact: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lease {
  id: string;
  tenant_id: string;
  unit_id: string;
  landlord_id: string;
  monthly_rent: number;
  security_deposit: number;
  start_date: string;
  end_date: string | null;
  rent_due_day: number;
  advance_months: number;
  status: LeaseStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RentCycle {
  id: string;
  lease_id: string;
  tenant_id: string;
  landlord_id: string;
  unit_id: string;
  period_start: string;
  period_end: string;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  status: RentCycleStatus;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  rent_cycle_id: string;
  tenant_id: string;
  landlord_id: string;
  amount: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  tran_id: string | null;
  val_id: string | null;
  bank_tran_id: string | null;
  card_type: string | null;
  card_brand: string | null;
  gateway_response: Record<string, unknown> | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ManualPayment {
  id: string;
  payment_id: string;
  screenshot_url: string;
  transaction_reference: string | null;
  sender_number: string | null;
  verification_status: VerificationStatus;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface RentalApplication {
  id: string;
  unit_id: string;
  landlord_id: string;
  full_name: string;
  email: string;
  phone: string;
  message: string | null;
  status: ApplicationStatus;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  rent_cycle_id: string;
  tenant_id: string;
  landlord_id: string;
  reminder_type: ReminderType;
  message: string;
  sent_at: string | null;
  is_read: boolean;
  created_at: string;
}
