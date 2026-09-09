"use client";
import { useState, useRef } from "react";
import { burnGeotag } from "@/lib/geotag";
import { supabaseAdmin } from "@/lib/supabase";
import { ArrowLeft, Camera, MapPin, User, FileText, CheckCircle, Loader, AlertCircle } from "lucide-react";
import Link from "next/link";

const damageTypes = ["Flood","Cyclone","Earthquake","Landslide","Fire","Drought","Lightning","Other"];
type Step = 1 | 2 | 3 | "done";

export default function ReportPage() {
  const [step, setStep] = useState<Step>(1);
  const [photo, setPhoto] = useState<File | null>(null);
  const [geotaggedBlob, setGeotaggedBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [claimId, setClaimId] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    victim_name: "", contact_number: "", aadhaar_number: "", address: "",
    damage_type: "Flood", damage_details: "",
  });

  async function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setGpsLoading(true);
    setGpsError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        try {
          const blob = await burnGeotag(file, lat, lng);
          setGeotaggedBlob(blob);
          setPhotoPreview(URL.createObjectURL(blob));
        } catch {
          setPhotoPreview(URL.createObjectURL(file));
        }
        setGpsLoading(false);
      },
      (err) => {
        setGpsError("Location denied. Please turn ON your phone's GPS/Location from the top menu, then refresh the page.");
        setGpsLoading(false);
        setPhotoPreview(URL.createObjectURL(file));
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const uploadBlob = geotaggedBlob ?? photo;
      let photoUrl = "";
      if (uploadBlob) {
        const fname = "incident-" + Date.now() + ".jpg";
        const { data, error: uploadErr } = await supabaseAdmin.storage.from("incident-photos").upload(fname, uploadBlob, { contentType: "image/jpeg", upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabaseAdmin.storage.from("incident-photos").getPublicUrl(fname);
        photoUrl = urlData.publicUrl;
      }
      const { data, error: dbErr } = await supabaseAdmin.from("incidents").insert([{
        victim_name: form.victim_name,
        contact_number: form.contact_number,
        aadhaar_number: form.aadhaar_number || null,
        address: form.address,
        damage_type: form.damage_type,
        damage_details: form.damage_details,
        photo_url: photoUrl || null,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        status: "pending",
      }]).select("id").single();
      if (dbErr) throw dbErr;
      setClaimId(data.id.slice(0, 8).toUpperCase());
      setStep("done");
    } catch (e: any) {
      setError(e.message ?? "Submission failed. Please try again.");
    }
    setSubmitting(false);
  }

  const canProceedStep1 = !!photo && !gpsLoading;
  const canProceedStep2 = form.victim_name.trim() && form.contact_number.trim().length === 10 && form.address.trim();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-blue-700 text-white px-5 py-4 flex items-center gap-3 shadow-md sticky top-0 z-10">
        <Link href="/" className="text-blue-200 hover:text-white"><ArrowLeft size={22} /></Link>
        <div>
          <p className="font-bold">Report Damage</p>
          {step !== "done" && <p className="text-blue-200 text-xs">Step {step} of 3</p>}
        </div>
      </header>

      {/* Progress */}
      {step !== "done" && (
        <div className="flex bg-blue-700 pb-3 px-5 gap-2">
          {[1,2,3].map(s => (
            <div key={s} className={"h-1.5 flex-1 rounded-full transition-all " + (Number(step) >= s ? "bg-white" : "bg-blue-500")} />
          ))}
        </div>
      )}

      <main className="flex-1 px-5 py-6 max-w-lg mx-auto w-full">
        {/* STEP 1: Photo + GPS */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">Take a Photo</h2>
              <p className="text-slate-500 text-sm">Photo will be automatically geotagged with your GPS location.</p>
            </div>

            <input ref={fileRef} type="file" accept="image/*"  capture="environment" className="hidden" onChange={handlePhotoCapture} />

            {!photo ? (
              <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-blue-300 rounded-2xl py-14 flex flex-col items-center gap-3 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 transition-colors">
                <Camera size={48} className="text-blue-400" />
                <p className="text-blue-700 font-semibold">Open Camera</p>
                <p className="text-blue-400 text-xs">Tap to take photo of damage</p>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden shadow-md">
                  {gpsLoading ? (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10">
                      <Loader size={32} className="text-white animate-spin mb-2" />
                      <p className="text-white text-sm font-medium">Getting GPS location...</p>
                      <p className="text-slate-300 text-xs mt-1">Burning geotag into photo</p>
                    </div>
                  ) : null}
                  <img src={photoPreview} alt="Captured" className="w-full object-cover max-h-72" />
                </div>

                {gpsError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                    <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm">{gpsError}</p>
                  </div>
                )}

                {coords && !gpsLoading && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3">
                    <MapPin size={16} className="text-green-600" />
                    <p className="text-green-700 text-sm font-medium">{coords.lat.toFixed(5)}&deg;N, {coords.lng.toFixed(5)}&deg;E &mdash; Geotagged &amp; burned into photo</p>
                  </div>
                )}

                <button onClick={() => { setPhoto(null); setPhotoPreview(""); setGeotaggedBlob(null); setCoords(null); setGpsError(""); }} className="text-sm text-slate-500 hover:text-red-600 underline">Retake photo</button>
              </div>
            )}

            <button onClick={() => setStep(2)} disabled={!canProceedStep1} className="w-full bg-blue-700 text-white py-4 rounded-2xl font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-800 active:bg-blue-900 transition-colors shadow-md">
              Next: Personal Details
            </button>
          </div>
        )}

        {/* STEP 2: Personal Details */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2"><User size={20} className="text-blue-700" />Your Details</h2>
              <p className="text-slate-500 text-sm">Use the phone number you want to track your claim with.</p>
            </div>

            {[
              { label: "Full Name *", key: "victim_name", placeholder: "e.g. Ramesh Kumar", type: "text" },
              { label: "Mobile Number * (10 digits)", key: "contact_number", placeholder: "e.g. 9876543210", type: "tel" },
              { label: "Aadhaar Number (optional)", key: "aadhaar_number", placeholder: "XXXX-XXXX-XXXX", type: "text" },
              { label: "Full Address *", key: "address", placeholder: "Village, Block, District...", type: "text" },
            ].map(({ label, key, placeholder, type }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
                <input type={type} placeholder={placeholder} value={(form as any)[key]} maxLength={key === "contact_number" ? 10 : undefined}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-blue-500 transition-colors bg-white" />
              </div>
            ))}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 border-2 border-slate-200 text-slate-600 py-3.5 rounded-2xl font-bold hover:bg-slate-50">Back</button>
              <button onClick={() => setStep(3)} disabled={!canProceedStep2} className="flex-[2] bg-blue-700 text-white py-3.5 rounded-2xl font-bold disabled:opacity-40 hover:bg-blue-800 active:bg-blue-900 transition-colors shadow-md">Next: Damage Info</button>
            </div>
          </div>
        )}

        {/* STEP 3: Damage Details */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2"><FileText size={20} className="text-blue-700" />Damage Details</h2>
              <p className="text-slate-500 text-sm">Describe what was damaged and how severely.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Type of Damage *</label>
              <div className="grid grid-cols-2 gap-2">
                {damageTypes.map(t => (
                  <button key={t} onClick={() => setForm(p => ({ ...p, damage_type: t }))}
                    className={"py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all " + (form.damage_type === t ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 text-slate-600 hover:border-blue-300 bg-white")}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Describe the Damage</label>
              <textarea placeholder="e.g. House completely flooded, 2 acres crop destroyed, livestock lost..." value={form.damage_details}
                onChange={e => setForm(p => ({ ...p, damage_details: e.target.value }))}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-blue-500 transition-colors h-32 resize-none bg-white" />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertCircle size={16} className="text-red-500 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 border-2 border-slate-200 text-slate-600 py-3.5 rounded-2xl font-bold hover:bg-slate-50">Back</button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-[2] bg-blue-700 text-white py-3.5 rounded-2xl font-bold disabled:opacity-60 hover:bg-blue-800 active:bg-blue-900 transition-colors shadow-md flex items-center justify-center gap-2">
                {submitting ? <><Loader size={18} className="animate-spin" />Submitting...</> : "Submit Report"}
              </button>
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {step === "done" && (
          <div className="text-center py-8 space-y-6">
            <div className="flex justify-center">
              <div className="bg-green-100 rounded-full p-6">
                <CheckCircle size={64} className="text-green-600" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Report Submitted!</h2>
              <p className="text-slate-500 text-base">Your damage report has been received by DDMA.</p>
            </div>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5">
              <p className="text-blue-600 text-sm font-semibold mb-1">Your Claim Reference</p>
              <p className="text-3xl font-bold text-blue-700 tracking-widest font-mono">{claimId}</p>
              <p className="text-blue-500 text-xs mt-2">Track using your mobile number: {form.contact_number}</p>
            </div>
            <p className="text-slate-500 text-sm">You will be notified once your claim is reviewed. Average processing time is 3-5 working days.</p>
            <div className="flex flex-col gap-3">
              <Link href="/track" className="block w-full bg-blue-700 text-white py-3.5 rounded-2xl font-bold hover:bg-blue-800 transition-colors shadow-md">Track My Claim</Link>
              <Link href="/" className="block w-full border-2 border-slate-200 text-slate-600 py-3.5 rounded-2xl font-bold hover:bg-slate-50">Back to Home</Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}