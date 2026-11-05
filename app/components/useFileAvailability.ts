"use client";

import { useEffect, useState } from "react";
import type { ScenarioKey } from "../data";

const known = new Map<string, boolean>();

/**
 * Checks (once per file) which map files of a layer exist in public/Hulu Ganga,
 * so the scenario menus can say "no map file yet" instead of showing an empty map without explanation.
 * undefined = not checked yet.
 */
export function useFileAvailability(files: Record<ScenarioKey, string>) {
  const [have, setHave] = useState<Partial<Record<ScenarioKey, boolean>>>(
    () => {
      const init: Partial<Record<ScenarioKey, boolean>> = {};
      (Object.keys(files) as ScenarioKey[]).forEach((k) => {
        if (known.has(files[k])) init[k] = known.get(files[k]);
      });
      return init;
    },
  );

  useEffect(() => {
    let cancelled = false;
    (Object.keys(files) as ScenarioKey[]).forEach(async (k) => {
      const url = files[k];
      if (!known.has(url)) {
        let ok = false;
        try {
          ok = (await fetch(url, { method: "HEAD" })).ok;
        } catch {
          ok = false;
        }
        known.set(url, ok);
      }
      if (!cancelled) setHave((h) => ({ ...h, [k]: known.get(url) }));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return have;
}
