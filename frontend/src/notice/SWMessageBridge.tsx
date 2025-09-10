// src/notice/SWMessageBridge.tsx
import { useEffect } from "react";

export default function SWMessageBridge() {
  useEffect(() => {
    // もしブラウザが serviceWorker に対応してなかったら何もしない
    if (!("serviceWorker" in navigator)) return;


    // SW からメッセージが来たときの受信処理
    const handler = (ev: MessageEvent) => {
      if (ev.data?.type === "NOTIFY_CLICK") {
        // スクロール先のセレクタを取り出す
        const sel = ev.data?.payload?.scrollTarget || '[aria-label="AIアドバイス"]';

        // ページの中からその要素を探す
        const el = document.querySelector(sel);

        // 見つかったらそこへスムーズスクロール
        if (el) (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };


    // メッセージ受信を監視開始
    navigator.serviceWorker.addEventListener("message", handler);

    // コンポーネントが消えるときは監視を外す
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, []);

  return null;// 画面に何も表示しないコンポーネント
}
