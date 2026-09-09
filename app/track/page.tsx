"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Incident } from "@/lib/types";
import { ArrowLeft, Search, Clock, CheckCircle, XCircle, AlertCircle, Download, Phone } from "lucide-react";
import Link from "next/link";

const statusConfig = {
  pending:      { label: "Pending Review",  color: "bg-yellow-100 text-yellow-800 border-yellow-200",  icon: Clock,         bar: "bg-yellow-400" },
  under_review: { label: "Under Review",    color: "bg-blue-100 text-blue-800 border-blue-200",         icon: AlertCircle,   bar: "bg-blue-500" },
  approved:     { label: "Approved",        color: "bg-green-100 text-green-800 border-green-200",      icon: CheckCircle,   bar: "bg-green-500" },
  rejected:     { label: "Rejected",        color: "bg-red-100 text-red-800 border-red-200",            icon: XCircle,       bar: "bg-red-500" },
};

export default function TrackPage() {
  const [phone, setPhone] = useState("");
  const [claims, setClaims] = useState<Incident[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (phone.trim().length !== 10) return;
    setLoading(true);
    const { data } = await supabase.from("incidents").select("*").eq("contact_number", phone.trim()).order("created_at", { ascending: false });
    setClaims(data ?? []);
    setSearched(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-blue-700 text-white px-5 py-4 flex items-center gap-3 shadow-md sticky top-0 z-10">
        <Link href="/" className="text-blue-200 hover:text-white"><ArrowLeft size={22} /></Link>
        <div>
          <p className="font-bold">Track My Claim</p>
          <p className="text-blue-200 text-xs">Enter your registered mobile number</p>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 max-w-lg mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"><Phone size={15} className="text-blue-600" />Mobile Number</label>
          <div className="flex gap-3">
            <input type="tel" placeholder="10-digit mobile number" maxLength={10} value={phone} onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-blue-500 transition-colors" />
            <button onClick={handleSearch} disabled={phone.trim().length !== 10 || loading}
              className="bg-blue-700 text-white px-5 rounded-xl font-bold disabled:opacity-40 hover:bg-blue-800 active:bg-blue-900 transition-colors">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search size={20} />}
            </button>
          </div>
        </div>

        {searched && claims.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-slate-100 rounded-full p-5 inline-flex mb-4"><Search size={36} className="text-slate-400" /></div>
            <p className="font-bold text-slate-700 text-lg">No claims found</p>
            <p className="text-slate-400 text-sm mt-1">No incidents registered with {phone}</p>
            <Link href="/report" className="inline-block mt-4 bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-800">Submit a Report</Link>
          </div>
        )}

        <div className="space-y-4">
          {claims.map(claim => {
            const cfg = statusConfig[claim.status] ?? statusConfig.pending;
            const Icon = cfg.icon;
            return (
              <div key={claim.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className={"h-1.5 w-full " + cfg.bar} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-slate-800">{claim.damage_type} Damage</p>
                      <p className="text-slate-400 text-xs mt-0.5">Filed: {new Date(claim.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                    </div>
                    <span className={"flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border " + cfg.color}>
                      <Icon size={12} />{cfg.label}
                    </span>
                  </div>

                  {claim.address && <p className="text-slate-500 text-sm mb-2">📍 {claim.address}</p>}
                  {claim.damage_details && <p className="text-slate-600 text-sm bg-slate-50 rounded-xl p-3 mb-3">{claim.damage_details}</p>}

                  {claim.status === "approved" && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-2">
                      <p className="text-green-700 font-bold text-sm flex items-center gap-2"><CheckCircle size={16} />Claim Approved</p>
                      {claim.compensation_amount && <p className="text-green-600 text-sm mt-1">Compensation Amount: <span className="font-bold">Rs.{claim.compensation_amount.toLocaleString("en-IN")}</span></p>}
                      {claim.compensation_form_url && (
                        <a href={claim.compensation_form_url} target="_blank" className="mt-2 flex items-center gap-2 text-blue-600 text-sm font-semibold hover:underline">
                          <Download size={15} />Download Compensation Form
                        </a>
                      )}
                    </div>
                  )}

                  {claim.status === "rejected" && claim.rejection_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-2">
                      <p className="text-red-700 font-bold text-sm flex items-center gap-2"><XCircle size={16} />Rejection Reason</p>
                      <p className="text-red-600 text-sm mt-1">{claim.rejection_reason}</p>
                    </div>
                  )}

                  {/* Progress Timeline */}
                  <div className="mt-4 flex items-center gap-0">
                    {["pending","under_review","approved"].map((s, i) => {
                      const steps = ["pending","under_review","approved","rejected"];
                      const currentIdx = steps.indexOf(claim.status);
                      const isRejected = claim.status === "rejected";
                      const done = isRejected ? i === 0 : i <= currentIdx;
                      return (
                        <div key={s} className="flex items-center flex-1 last:flex-none">
                          <div className={"w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 " + (done ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400")}>
                            {i + 1}
                          </div>
                          {i < 2 && <div className={"flex-1 h-0.5 " + (done && !isRejected && i < currentIdx ? "bg-blue-600" : "bg-slate-100")} />}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-1">
                    {["Submitted","In Review","Approved"].map(l => <p key={l} className="text-xs text-slate-400 flex-1 text-center first:text-left last:text-right">{l}</p>)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}