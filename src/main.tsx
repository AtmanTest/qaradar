import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

// PWA : service worker (app shell hors-ligne) — production uniquement
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* hors contexte sécurisé ou hébergement sans SW : l'app reste fonctionnelle */
    });
  });
}
