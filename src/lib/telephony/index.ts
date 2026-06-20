import type { TelephonyProvider } from "./types";
import { MockTelephonyProvider } from "./mock-provider";

// The single switch point. To go live later, swap this line for
// `new TwilioProvider(...)` or `new ExotelProvider(...)`.
// Nothing else in the app changes.
export const telephony: TelephonyProvider = new MockTelephonyProvider();

export * from "./types";
