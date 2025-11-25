
import { AppConfig, Deposit, DepositProvider, DepositStatus, Reservation, ReservationStatus } from './types';

export const APP_CONFIG: AppConfig = {
  tnc_current_version: "v1.2",
  tnc_pdf_url: "#",
  deposit_amount_cents: 3000,
  deposit_release_hours_after_checkout: 72
};

// Mock Database - Populated for Demo/Testing
export const MOCK_RESERVATIONS: Reservation[] = [
  {
    reservation_id: "12345",
    property_id: "prop_001",
    guest_details: {
      firstName: "Alex",
      lastName: "Rivera",
      email: "alex.rivera@example.com",
      phone: "+65 9123 4567"
    },
    dates: {
      checkin: "2024-03-20",
      checkout: "2024-03-24"
    },
    pms_status: ReservationStatus.BOOKED,
    
    // Pre-check-in flags
    pre_checkin_started: false,
    pre_checkin_complete: false,
    steps: {
      guest_details_complete: false,
      passport_complete: false,
      tnc_accepted: false,
      deposit_status: DepositStatus.PENDING
    },

    // Portal Info (revealed after check-in)
    access_code: "8822#",
    wifi_ssid: "CoZzzee_Guest",
    wifi_pass: "SleepTight"
  }
];

export const MOCK_DEPOSITS: Deposit[] = [];
