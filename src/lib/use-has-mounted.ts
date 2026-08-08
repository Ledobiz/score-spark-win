import { useSyncExternalStore } from "react";

const subscribeNoop = () => () => {};

/** True only after client hydration — avoids a light/dark icon mismatch on first paint. */
export function useHasMounted() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}
