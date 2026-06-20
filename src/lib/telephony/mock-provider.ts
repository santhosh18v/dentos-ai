import type {
  TelephonyProvider,
  PlaceCallParams,
  PlaceCallResult,
} from "./types";

// Simulates placing a call without dialing anything real.
// Returns INITIATED immediately, as a real provider would.
export class MockTelephonyProvider implements TelephonyProvider {
  name = "mock";

  async placeCall(params: PlaceCallParams): Promise<PlaceCallResult> {
    // Pretend we handed the call off to a phone network.
    console.log(
      `[MockTelephony] "Calling" ${params.patientName} at ${params.phoneNumber} ` +
        `re: appointment at ${params.appointmentTime} with ${params.dentistName}`
    );

    return {
      success: true,
      providerCallId: `mock_${params.callLogId}_${Date.now()}`,
      status: "INITIATED",
    };
  }
}
