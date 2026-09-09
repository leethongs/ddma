"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Bell, MapPin, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("alerts").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setAlerts(data ?? []);
      setLoading(false);
    });
  }, []);

  const severityColor: any = { critical: "border-red-500 bg-red-50 text-red-800", high: "border-orange-500 bg-orange-50 text-orange-800", medium: "border-yellow-500 bg-yellow-50 text-yellow-800", low: "border-blue-500 bg-blue-50 text-blue-800" };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-blue-700 text-white px-5 py-4 flex items-center gap-3 shadow-md sticky top-0 z-10">
        <Link href="/" className="text-blue-200 hover:text-white"><ArrowLeft size={22} /></Link>
        <div>
          <p className="font-bold">Disaster Alerts</p>
          <p className="text-blue-200 text-xs">Official DDMA Broadcasts</p>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-200 animate-pulse rounded-2xl" />)}</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Bell size={48} className="mx-auto mb-4 opacity-20" />
            <p>No alerts at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map(a => (
              <div key={a.id} className={"border-l-4 rounded-2xl p-5 shadow-sm " + (severityColor[a.severity] ?? severityColor.low)}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg leading-tight">{a.title}</h3>
                  {!a.is_active && <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">Ended</span>}
                </div>
                <p className="text-sm opacity-90 mb-3">{a.message}</p>
                <div className="flex justify-between items-center text-xs opacity-70 font-medium">
                  {a.affected_area ? <span className="flex items-center gap-1"><MapPin size={12} /> {a.affected_area}</span> : <span />}
                  <span>{new Date(a.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}