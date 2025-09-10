// src/SWMessageBridge.tsx
import { useEffect } from "react";

export default function SWMessageBridge() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handler = (ev: MessageEvent) => {
      if (ev.data?.type === "NOTIFY_CLICK") {
        const sel = ev.data?.payload?.scrollTarget || '[aria-label="AIアドバイス"]';
        const el = document.querySelector(sel);
        if (el) (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, []);

  return null;
}
