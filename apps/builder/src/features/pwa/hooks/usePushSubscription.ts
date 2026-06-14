import { useCallback, useEffect, useState } from "react";

type Status = "idle" | "loading" | "subscribed" | "denied" | "unsupported" | "error";

export function usePushSubscription(workspaceId: string | null) {
  const [status, setStatus] = useState<Status>("idle");

  const subscribe = useCallback(async () => {
    if (!workspaceId) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    setStatus("loading");
    try {
      const keyRes = await fetch("/api/push/vapid-key");
      if (!keyRes.ok) { setStatus("error"); return; }
      const { publicKey } = await keyRes.json();

      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setStatus("denied"); return; }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, subscription: sub.toJSON() }),
      });
      setStatus("subscribed");
    } catch (err) {
      console.error("[push] subscription error:", err);
      setStatus("error");
    }
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    Notification.permission === "granted" && setStatus("subscribed");
  }, [workspaceId]);

  return { status, subscribe };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
