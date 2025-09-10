import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
//import Test from './Test.tsx'
import Detail from "./Detail.tsx";
import "./App.css";
//import TestAPI from "./test_component/TestAPI.tsx";
//import ShodoAdviceLauncher from "./shodo/ShodoAdviceLauncher";

import SWMessageBridge from "./SWMessageBridge"; // ← スクロール対応するなら

// ★ SW登録（先頭で一度だけ）
if ("serviceWorker" in navigator) {
  const swUrl = `${import.meta.env.BASE_URL}sw.js`;
  navigator.serviceWorker
    .register(swUrl)
    .then(() => console.log("SW registered:", swUrl))
    .catch((e) => console.error("SW registration failed", e));
}


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Detail />
    <SWMessageBridge />
  </StrictMode>
);
