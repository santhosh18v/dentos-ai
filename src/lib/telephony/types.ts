// The shape of a request to place a reminder call.
export interface PlaceCallParams {
  callLogId: string;
  phoneNumber: string;
  patientName: string;
  appointmentTime: string; // human-readable, e.g. "5:00 PM"
  dentistName: string;
  scriptLanguage?: "TELUGU" | "ENGLISH" | "MIXED";
}

// The immediate result of *initiating* a call (not the conversation outcome).
export interface PlaceCallResult {
  success: boolean;
  providerCallId: string; // the provider's own ID for this call
  status: "INITIATED" | "FAILED";
  error?: string;
}

// Every telephony provider (mock, Twilio, Exotel) must implement this.
export interface TelephonyProvider {
  name: string;
  placeCall(params: PlaceCallParams): Promise<PlaceCallResult>;
}
