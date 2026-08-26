"use client";

export type NativeAuthDebugEntry = {
  id: number;
  at: string;
  message: string;
};

const entries: NativeAuthDebugEntry[] = [];
const listeners = new Set<(entries: NativeAuthDebugEntry[]) => void>();
let sequence = 0;

function publish() {
  const snapshot = [...entries];
  listeners.forEach((listener) => listener(snapshot));
}

export function logNativeAuthDebug(message: string) {
  const entry = {
    id: ++sequence,
    at: new Date().toISOString().slice(11, 23),
    message,
  };
  entries.push(entry);
  // 최근 시도만 남겨 화면이 끝없이 길어지는 것을 막는다.
  if (entries.length > 80) entries.splice(0, entries.length - 80);
  console.log(`[native-auth-debug ${entry.at}] ${message}`);
  publish();
}

export function subscribeNativeAuthDebug(listener: (entries: NativeAuthDebugEntry[]) => void) {
  listeners.add(listener);
  listener([...entries]);
  return () => {
    listeners.delete(listener);
  };
}

export function clearNativeAuthDebug() {
  entries.splice(0, entries.length);
  publish();
}

// verifier 내용은 민감하므로 절대 화면에 출력하지 않고, storage key 존재 여부만 기록한다.
export function getPkceVerifierStorageStatus(): string {
  if (typeof window === "undefined") return "unavailable (no window)";
  try {
    const matchingKeys: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key?.includes("code-verifier") || key?.includes("code_verifier")) {
        matchingKeys.push(key);
      }
    }
    return matchingKeys.length > 0 ? `yes (${matchingKeys.join(", ")})` : "no";
  } catch (error) {
    return `unreadable (${error instanceof Error ? error.message : String(error)})`;
  }
}
