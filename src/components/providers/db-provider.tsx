"use client";

import * as React from "react";
import { db } from "@/lib/db";

export function DbInitializer({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    db.initSeed()
      .then(() => {
        if (mounted) {
          setIsReady(true);
          // Initial background sync / first login pull
          import("@/lib/drive/sync-engine").then(({ syncEngine }) => {
            syncEngine.performSync();
          }).catch(() => {});
        }
      })
      .catch((err) => {
        console.error("Dexie init failed:", err);
        if (mounted) setIsReady(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return <>{children}</>;
}
