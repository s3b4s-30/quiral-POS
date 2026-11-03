import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/themePalettes.css";
import { initThemePalette } from "./utils/themePalettes";

// Inicializar paleta cromática persistente de inmediato sin flash
initThemePalette();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Desvanecer splash screen nativo tras renderizar
requestAnimationFrame(() => {
  const splash = document.getElementById("quiral-splash-screen");
  if (splash) {
    splash.classList.add("splash-hidden");
    setTimeout(() => splash.remove(), 400);
  }
});
