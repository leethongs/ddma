"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { AlertTriangle, FileText, Search, Phone, Shield, ChevronRight, X, BellRing } from "lucide-react";

interface Alert { id: string; title: string; message: string; severity: string; affected_area?: string; }
interface Setting { key: string; value: string; }

export default function Home() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [showAlerts, setShowAlerts] = useState(true);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    fetch("/api/setup").then(() => {
      supabase.from("alerts").select("*").eq("is_active", true).then(({ data }) => setAlerts(data ?? []));
      supabase.from("settings").select("*").then(({ data }) => {
        const map: Record<string, string> = {};
        (data as Setting[] ?? []).forEach(s => { map[s.key] = s.value; });
        setSettings(map);
      });
    });

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => { if (sub) setSubscribed(true); });
      });
    }
  }, []);

  async function subscribeToPush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return alert("Push notifications are not supported by your browser.");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: "BExP0izqIA9PZNJSuI-YVJ4gv0GXONMPNp-t0RL3LnzJm73Trqr9-5zGDI95cQLZGg7KO03sz1VVYKH7Qc1qJzY"
      });
      const subJson = sub.toJSON();
      await supabase.from("subscriptions").upsert([{
        endpoint: subJson.endpoint,
        keys_auth: subJson.keys?.auth,
        keys_p256dh: subJson.keys?.p256dh
      }]);
      setSubscribed(true);
      alert("Notifications enabled! You will receive critical alerts.");
    } catch (e) {
      console.error(e);
      alert("Failed to enable notifications. Ensure permissions are granted.");
    }
  }

  const sosNumber = settings["sos_number"] ?? "1078";
  const districtName = settings["district_name"] ?? "District Disaster Management Authority";
  const severityColor: Record<string, string> = { critical: "bg-red-600", high: "bg-orange-500", medium: "bg-yellow-500", low: "bg-blue-400" };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-blue-700 text-white px-5 py-4 flex items-center gap-3 shadow-lg">
        <div className="bg-white rounded-xl p-2"><Shield size={22} className="text-blue-700" /></div>
        <div>
          <p className="font-bold text-base leading-tight">DDMA</p>
          <p className="text-blue-200 text-xs leading-tight">{districtName}</p>
        </div>
      </header>

      {showAlerts && alerts.length > 0 && (
        <div className="bg-red-600 text-white px-5 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1">
              <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 animate-pulse" />
              <div className="text-sm">
                <p className="font-semibold">{alerts[0].title}</p>
                <p className="text-red-100 text-xs mt-0.5">{alerts[0].message}</p>
                {alerts.length > 1 && <p className="text-red-200 text-xs mt-1">+{alerts.length - 1} more alert(s) active</p>}
              </div>
            </div>
            <button onClick={() => setShowAlerts(false)} className="text-red-200 hover:text-white flex-shrink-0"><X size={16} /></button>
          </div>
        </div>
      )}

      <main className="flex-1 px-5 py-8">
        <div className="mb-8">
          <a href={"tel:" + sosNumber} className="block w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-2xl py-5 text-center shadow-lg transition-all active:scale-95">
            <div className="flex items-center justify-center gap-3">
              <Phone size={28} className="animate-bounce" />
              <div>
                <p className="text-2xl font-bold tracking-wide">SOS HELPLINE</p>
                <p className="text-red-100 text-sm font-medium">{sosNumber} • Available 24x7</p>
              </div>
            </div>
          </a>
        </div>

        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-3">What do you need?</p>
        <div className="space-y-4 mb-8">
          <Link href="/report" className="block bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white rounded-2xl p-5 shadow-md transition-all active:scale-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 rounded-xl p-3"><FileText size={24} /></div>
                <div>
                  <p className="font-bold text-lg">Report Damage</p>
                  <p className="text-blue-200 text-sm">Submit your disaster damage report</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-blue-300" />
            </div>
          </Link>

          <Link href="/track" className="block bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 transition-all active:scale-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 rounded-xl p-3"><Search size={24} className="text-blue-700" /></div>
                <div>
                  <p className="font-bold text-lg">Track My Claim</p>
                  <p className="text-slate-500 text-sm">Check status by phone number</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300" />
            </div>
          </Link>

          <Link href="/alerts" className="block bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-800 rounded-2xl p-5 shadow-sm border border-blue-100 transition-all active:scale-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-blue-200 rounded-xl p-3"><BellRing size={24} className="text-blue-700" /></div>
                <div>
                  <p className="font-bold text-lg">All Alerts</p>
                  <p className="text-blue-600 text-sm font-medium">View official DDMA broadcasts</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-blue-400" />
            </div>
          </Link>

          {!subscribed && (
            <button onClick={subscribeToPush} className="w-full flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl py-4 font-semibold shadow-md active:scale-95 transition-all mt-4">
              <BellRing size={18} /> Enable Sound Alerts
            </button>
          )}
        </div>

        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-3">Emergency Numbers</p>
        <div className="grid grid-cols-3 gap-3">
          {[["Police", "100", "bg-blue-600"], ["Ambulance", "108", "bg-red-600"], ["Fire", "101", "bg-orange-500"]].map(([name, num, color]) => (
            <a key={num} href={"tel:" + num} className={"rounded-xl p-3 text-center text-white " + color + " active:opacity-80 transition-opacity"}>
              <p className="font-bold text-xl">{num}</p>
              <p className="text-xs opacity-90 mt-0.5">{name}</p>
            </a>
          ))}
        </div>
      </main>

      <footer className="text-center text-slate-400 text-xs py-4 px-5 border-t border-slate-100">
        <p>DDMA • {new Date().getFullYear()} • {settings["helpline_info"] ?? "Available 24x7"}</p>
      </footer>
    </div>
  );
}