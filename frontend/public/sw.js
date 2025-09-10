/* public/sw.js */
// 即時有効化
self.addEventListener("install", () => self.skipWaiting()); //インストール後すぐに新しい SW を有効化。
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim())); //アクティブ化された SW がすぐにページをコントロールできるようにする

// 通知クリックでタブに戻す＋ページへ合図（任意のスクロール指示）
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const targetUrl = data.url || "/";

  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true }); //開いているタブ（client）を探す
    let client = all[0];

    if (client) { //既存のタブがあればフォーカスし、メッセージを送る（ここでスクロール先の情報を渡す）
      await client.focus();
      client.postMessage({ type: "NOTIFY_CLICK", payload: { scrollTarget: data.scrollTarget } });
    } else { //タブが無ければ新規にウィンドウを開く
      await self.clients.openWindow(targetUrl);
    }
  })());
});
