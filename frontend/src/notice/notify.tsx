// src/notice/notify.ts
export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  return await Notification.requestPermission();
}

type NotifyOpts = {
  title: string;
  body?: string;
  icon?: string;
  tag?: string;
  data?: any;
  silent?: boolean;
};

export async function showDesktopNotification(opts: NotifyOpts): Promise<boolean> {
  if (!("Notification" in window) || Notification.permission !== "granted") return false;

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(opts.title, {
        body: opts.body,
        icon: opts.icon,
        tag: opts.tag,
        data: opts.data,
        silent: opts.silent ?? false,
        renotify: true,
      });
      return true;
    }
  } catch (e) {
    console.warn("[notify] SW showNotification failed:", e);
  }

  try {
    new Notification(opts.title, {
      body: opts.body,
      icon: opts.icon,
      tag: opts.tag,
      silent: opts.silent ?? false,
    });
    return true;
  } catch (e) {
    console.error("[notify] page Notification failed:", e);
    return false;
  }
}
