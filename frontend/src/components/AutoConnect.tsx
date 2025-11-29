"use client";

import { useEffect, useState } from "react";
import { useConnect, useAccount, useConnectors } from "wagmi";

export default function AutoConnect() {
  const connectors = useConnectors();
  const { connect } = useConnect();
  const { isConnected } = useAccount();
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isConnected) return;
    if (tried) return;

    const last = window.localStorage.getItem("vhibes:lastConnector");
    if (!last) {
      setTried(true);
      return;
    }

    // Find a matching connector by id, name or uid
    const match = connectors.find((c: any) => {
      const id = c.id ?? "";
      const name = (c.name || "").toLowerCase();
      const uid = c.uid ?? "";
      return (
        id === last ||
        name === last.toLowerCase() ||
        uid === last ||
        id?.toLowerCase() === last.toLowerCase()
      );
    });

    if (match) {
      // attempt connect; wagmi connect returns void, not a Promise
      try {
        connect({ connector: match });
      } catch (e: unknown) {
        // clear stored connector if it fails
        try {
          window.localStorage.removeItem("vhibes:lastConnector");
        } catch (_) {}
      }
    }

    setTried(true);
  }, [connectors, connect, isConnected, tried]);

  return null;
}
