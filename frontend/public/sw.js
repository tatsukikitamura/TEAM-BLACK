/* public/sw.js */
// 即時有効化
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// 通知クリックでタブに戻す＋ページへ合図（任意のスクロール指示）
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const targetUrl = data.url || "/";

  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    let client = all[0];

    if (client) {
      await client.focus();
      client.postMessage({ type: "NOTIFY_CLICK", payload: { scrollTarget: data.scrollTarget } });
    } else {
      await self.clients.openWindow(targetUrl);
    }
  })());
});
