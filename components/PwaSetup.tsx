"use client";
import { useEffect } from "react";
export function PwaSetup() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => console.log("SW failed"));
    }
  }, []);
  return null;
}