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

  async function forceDownload(url: string) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "DDMA_Compensation_Form.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(url, "_blank");
    }
  }

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

      <main className="flex-1 px-5 py-8 max-w-lg mx-auto w-full">
        {/* BIG FRIENDLY HERO SEARCH */}
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={32} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Check Claim Status</h2>
          <p className="text-slate-500 text-sm px-4">Enter the 10-digit mobile number you used when submitting your damage report.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 mb-8 relative">
          <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Phone size={18} className="text-blue-600" /> Mobile Number
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="tel" placeholder="e.g. 9876543210" maxLength={10} value={phone} onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-4 text-lg font-medium text-center sm:text-left focus:outline-none focus:border-blue-500 transition-colors bg-slate-50" />
            <button onClick={handleSearch} disabled={phone.trim().length !== 10 || loading}
              className="bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg disabled:opacity-50 hover:bg-blue-800 active:bg-blue-900 transition-colors shadow-md flex justify-center items-center">
              {loading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Track"}
            </button>
          </div>
        </div>

        {searched && claims.length === 0 && (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="bg-slate-100 rounded-full p-4 inline-flex mb-4"><Search size={28} className="text-slate-400" /></div>
            <p className="font-bold text-slate-700 text-lg">No claims found</p>
            <p className="text-slate-500 text-sm mt-1 mb-6">We couldn't find any reports linked to <br/><span className="font-bold text-slate-700">{phone}</span>.</p>
            <Link href="/report" className="inline-block bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-800 shadow-sm">Submit a New Report</Link>
          </div>
        )}

        <div className="space-y-6">
          {claims.map(claim => {
            const cfg = statusConfig[claim.status] ?? statusConfig.pending;
            const Icon = cfg.icon;
            return (
              <div key={claim.id} className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
                <div className={"h-2 w-full " + cfg.bar} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-bold text-xl text-slate-800">{claim.damage_type} Damage</p>
                      <p className="text-slate-500 text-sm mt-1">Submitted on {new Date(claim.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
                    </div>
                  </div>

                  <div className={"inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border mb-5 " + cfg.color}>
                    <Icon size={18} />{cfg.label}
                  </div>

                  {claim.address && <p className="text-slate-600 text-sm mb-3 flex items-start gap-2"><span className="mt-0.5">📍</span> {claim.address}</p>}
                  {claim.damage_details && <p className="text-slate-600 text-sm bg-slate-50 border border-slate-100 rounded-xl p-4 mb-4">{claim.damage_details}</p>}

                  {claim.status === "approved" && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5 mt-2">
                      <p className="text-green-800 font-bold text-base flex items-center gap-2 mb-2"><CheckCircle size={20} />Claim Approved</p>
                      {claim.compensation_amount && <p className="text-green-700 text-sm">Approved Amount: <span className="font-bold text-lg">Rs. {claim.compensation_amount.toLocaleString("en-IN")}</span></p>}
                      {claim.compensation_form_url && (
                        <button onClick={() => forceDownload(claim.compensation_form_url!)} className="mt-4 w-full flex items-center justify-center gap-2 bg-white border-2 border-green-300 text-green-700 py-3 px-4 rounded-xl font-bold hover:bg-green-100 transition-colors shadow-sm">
                          <Download size={18} />Download Official Form
                        </button>
                      )}
                    </div>
                  )}

                  {claim.status === "rejected" && claim.rejection_reason && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 mt-2">
                      <p className="text-red-800 font-bold text-base flex items-center gap-2 mb-2"><XCircle size={20} />Reason for Rejection</p>
                      <p className="text-red-700 text-sm">{claim.rejection_reason}</p>
                    </div>
                  )}

                  <hr className="my-5 border-slate-100" />

                  {/* Progress Timeline */}
                  <div className="mt-4 flex items-center gap-0">
                    {["pending","under_review","approved"].map((s, i) => {
                      const steps = ["pending","under_review","approved","rejected"];
                      const currentIdx = steps.indexOf(claim.status);
                      const isRejected = claim.status === "rejected";
                      const done = isRejected ? i === 0 : i <= currentIdx;
                      return (
                        <div key={s} className="flex items-center flex-1 last:flex-none">
                          <div className={"w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 z-10 border-4 border-white shadow-sm " + (done ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400")}>
                            {i + 1}
                          </div>
                          {i < 2 && <div className={"flex-1 h-1.5 -mx-2 " + (done && !isRejected && i < currentIdx ? "bg-blue-600" : "bg-slate-200")} />}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-2 px-1">
                    {["Submitted","In Review","Approved"].map(l => <p key={l} className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex-1 text-center first:text-left last:text-right">{l}</p>)}
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