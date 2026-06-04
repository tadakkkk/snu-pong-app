import * as amplitude from "@amplitude/analytics-browser";

let initialized = false;

export function initAnalytics() {
  if (initialized) return;
  const key = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
  if (!key) return;
  amplitude.init(key, {
    autocapture: true,
    defaultTracking: true,
  });
  initialized = true;
}

export function logEvent(name: string, props?: Record<string, unknown>) {
  if (!initialized) return;
  amplitude.track(name, props);
}

export function identifyUser(userId: string) {
  if (!initialized) return;
  amplitude.setUserId(userId);
}
