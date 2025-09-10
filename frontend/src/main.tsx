import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
//import Test from './Test.tsx'
import Detail from "./Detail.tsx";
import "./App.css";
//import TestAPI from "./test_component/TestAPI.tsx";
//import ShodoAdviceLauncher from "./shodo/ShodoAdviceLauncher";
import SWMessageBridge from "./notice/SWMessageBridge.tsx"; // ← スクロール対応(通知機能)

// ブラウザが Service Worker をサポートしていれば、public/sw.js を登録
if ("serviceWorker" in navigator) {
  const swUrl = `${import.meta.env.BASE_URL}sw.js`; // public/sw.js を読み込むURLを作成
  navigator.serviceWorker // SW をブラウザに登録
    .register(swUrl)
    .then(() => console.log("SW registered:", swUrl))
    .catch((e) => console.error("SW registration failed", e));
}


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Detail />
    <SWMessageBridge /> {/* ← 通知クリック時のスクロール係 */}
  </StrictMode>
);
