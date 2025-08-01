import { useContext, useEffect } from "react";
import {
  UNSAFE_NavigationContext as NavigationContext
} from "react-router-dom";
import type { Navigator } from "react-router-dom";

export function useBlocker(blocker: (tx: any) => void, when = true) {
  const navigator = useContext(NavigationContext).navigator as Navigator;

  useEffect(() => {
    if (!when) return;

    
    const unblock = (navigator as any).block((tx: any) => {
      const autoUnblockingTx = {
        ...tx,
        retry() {
          unblock();
          tx.retry();
        },
      };
      blocker(autoUnblockingTx);
    });

    return unblock;
  }, [navigator, blocker, when]);
}
