
export enum ReservationStatus {
  BOOKED = 'confirmed',
  PRE_CHECKIN_IN_PROGRESS = 'pre_checkin_in_progress',
  PRE_CHECKIN_COMPLETE = 'pre_checkin_complete',
  IN_HOUSE = 'checked_in',
  CHECKED_OUT = 'checked_out'
}

export enum DepositStatus {
  PENDING = 'pending',
  INITIATED = 'initiated',
  AUTHORIZED = 'authorized',
  RELEASE_SCHEDULED = 'scheduled',
  RELEASED = 'released',
  ERROR = 'error'
}

export enum DepositProvider {
  STRIPE = 'stripe',
  ALIPAY = 'alipay'
}

export interface GuestDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  arrivalTime?: string;
  purpose?: string;
  // OCR Extracted Fields
  passportNumber?: string;
  nationality?: string;
  dateOfBirth?: string;
}

export interface Reservation {
  reservation_id: string;
  property_id: string;
  data_source?: 'cloudbeds' | 'demo_fallback' | 'mock' | 'cache'; // New field to track origin
  guest_details: GuestDetails;
  dates: {
    checkin: string;
    checkout: string;
  };
  pms_status: ReservationStatus;
  
  // Pre-check-in flags
  pre_checkin_started: boolean;
  pre_checkin_complete: boolean;
  steps: {
    guest_details_complete: boolean;
    passport_complete: boolean;
    tnc_accepted: boolean;
    deposit_status: DepositStatus;
  };

  // Data urls/storage paths
  passport_image_url?: string;
  tnc_signature_image_url?: string;
  
  // Portal Info
  access_code?: string;
  wifi_ssid?: string;
  wifi_pass?: string;
}

export interface Deposit {
  reservation_id: string;
  provider: DepositProvider;
  amount_cents: number;
  currency: string;
  status: DepositStatus;
  release_status: 'none' | 'scheduled' | 'released' | 'error';
  last_error?: string;
  payment_intent_id?: string;
  authorized_at?: string;
  release_at?: string;
}

export interface AppConfig {
  tnc_current_version: string;
  tnc_pdf_url: string; // In a real app, this would be a link to a file
  deposit_amount_cents: number;
  deposit_release_hours_after_checkout: number;
}