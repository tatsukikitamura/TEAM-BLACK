import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
//import Test from './Test.tsx'
import Detail from "./Detail.tsx";
import "./App.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Detail />
  </StrictMode>
);
