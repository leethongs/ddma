"use client";
import { useState, useRef, useEffect } from "react";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { burnGeotag } from "@/lib/geotag";
import { Camera, MapPin, CheckCircle, ArrowLeft, Loader, AlertCircle, FileText, User, X } from "lucide-react";
import Link from "next/link";

const damageTypes = ["Flood", "Cyclone", "Earthquake", "Fire", "Landslide", "Other"];

type PhotoItem = { file: File, blob: Blob | null, preview: string };

export default function ReportPage() {
  const [step, setStep] = useState<number | "done">(1);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [claimId, setClaimId] = useState("");
  const [error, setError] = useState("");
  
  // WebRTC Camera State
  const [showWebcam, setShowWebcam] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    victim_name: "", contact_number: "", aadhaar_number: "", address: "",
    damage_type: "Flood", damage_details: "",
  });

  async function startCamera() {
    setShowWebcam(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: { ideal: "environment" } },
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      alert("Camera access denied by browser. Please use Gallery.");
      setShowWebcam(false);
    }
  }

  function stopCamera() {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowWebcam(false);
  }

  function takeSnap() {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob(blob => {
      if (blob) {
        const file = new File([blob], "snap-" + Date.now() + ".jpg", { type: "image/jpeg" });
        stopCamera();
        processFile(file);
      }
    }, "image/jpeg", 0.9);
  }

  function processFile(file: File) {
    if (!file) return;
    setGpsLoading(true);
    setGpsError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        try {
          const blob = await burnGeotag(file, lat, lng);
          setPhotos(p => [...p, { file, blob, preview: URL.createObjectURL(blob) }]);
        } catch {
          setPhotos(p => [...p, { file, blob: null, preview: URL.createObjectURL(file) }]);
        }
        setGpsLoading(false);
      },
      (err) => {
        setGpsError("Warning: GPS Location blocked or turned off in phone menu. You can still proceed without coordinates.");
        setGpsLoading(false);
        setPhotos(p => [...p, { file, blob: null, preview: URL.createObjectURL(file) }]);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  function removePhoto(index: number) {
    setPhotos(p => p.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const uploadedUrls: string[] = [];
      
      for (const p of photos) {
        const uploadBlob = p.blob ?? p.file;
        const fname = "incident-" + Date.now() + "-" + Math.random().toString(36).substring(7) + ".jpg";
        const { error: uploadErr } = await supabaseAdmin.storage.from("incident-photos").upload(fname, uploadBlob, { contentType: "image/jpeg" });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabaseAdmin.storage.from("incident-photos").getPublicUrl(fname);
        uploadedUrls.push(urlData.publicUrl);
      }

      const { data, error: dbErr } = await supabaseAdmin.from("incidents").insert([{
        victim_name: form.victim_name,
        contact_number: form.contact_number,
        aadhaar_number: form.aadhaar_number || null,
        address: form.address,
        damage_type: form.damage_type,
        damage_details: form.damage_details,
        photo_url: uploadedUrls.join(",") || null,
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

  const canProceedStep1 = photos.length > 0 && !gpsLoading;
  const canProceedStep2 = form.victim_name.trim() && form.contact_number.trim().length === 10 && form.address.trim();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      
      {/* Fullscreen WebRTC Camera UI */}
      {showWebcam && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex justify-between items-center p-4 text-white z-10 absolute top-0 w-full bg-gradient-to-b from-black/60 to-transparent">
            <button onClick={stopCamera} className="p-2 bg-black/50 rounded-full"><X size={24} /></button>
            <p className="font-bold">In-App Camera</p>
            <div className="w-10"></div>
          </div>
          <video ref={videoRef} playsInline autoPlay className="flex-1 w-full h-full object-cover" />
          <div className="absolute bottom-0 w-full p-8 flex justify-center bg-gradient-to-t from-black/80 to-transparent">
            <button onClick={takeSnap} className="w-20 h-20 bg-white rounded-full border-4 border-slate-300 shadow-xl flex items-center justify-center active:scale-95 transition-transform">
              <div className="w-16 h-16 bg-white border border-slate-200 rounded-full"></div>
            </button>
          </div>
        </div>
      )}

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
            <div key={s} className={"h-1.5 flex-1 rounded-full transition-all " + (Number(step) >= s ? "bg-white" : "bg-blue-900")} />
          ))}
        </div>
      )}

      <main className="flex-1 px-5 py-6 max-w-lg mx-auto w-full">
        {/* STEP 1: Photo + GPS */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">Take Photos</h2>
              <p className="text-slate-500 text-sm">Upload multiple photos. They will be automatically geotagged.</p>
            </div>

            <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
              if (e.target.files) {
                Array.from(e.target.files).forEach(file => processFile(file));
              }
            }} />

            {photos.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                {photos.map((p, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden shadow-md h-40">
                    <img src={p.preview} alt={`Damage ${i+1}`} className="w-full h-full object-cover" />
                    <button onClick={() => removePhoto(i)} className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-white hover:bg-red-600 transition-colors shadow-sm">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {gpsLoading && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-center gap-3">
                <Loader size={20} className="text-blue-600 animate-spin" />
                <p className="text-blue-700 text-sm font-medium">Processing Geotag...</p>
              </div>
            )}

            {gpsError && (
              <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <AlertCircle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-800 text-sm font-medium">{gpsError}</p>
              </div>
            )}

            {coords && !gpsLoading && photos.length > 0 && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3">
                <MapPin size={16} className="text-green-600 flex-shrink-0" />
                <p className="text-green-700 text-sm font-medium text-xs sm:text-sm">Geotag active: {coords.lat.toFixed(4)}&deg;N, {coords.lng.toFixed(4)}&deg;E</p>
              </div>
            )}

            {photos.length < 5 && (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={startCamera} className="border-2 border-dashed border-blue-300 rounded-2xl py-6 flex flex-col items-center gap-2 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 transition-colors">
                  <Camera size={28} className="text-blue-500" />
                  <p className="text-blue-700 font-bold text-sm">Add Camera</p>
                </button>
                <button onClick={() => galleryRef.current?.click()} className="border-2 border-dashed border-slate-300 rounded-2xl py-6 flex flex-col items-center gap-2 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  <p className="text-slate-700 font-bold text-sm">Add Gallery</p>
                </button>
              </div>
            )}
            {photos.length >= 5 && <p className="text-center text-xs text-slate-400">Maximum 5 photos allowed.</p>}

            <button onClick={() => setStep(2)} disabled={!canProceedStep1} className="w-full bg-blue-700 text-white py-4 rounded-2xl font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-800 active:bg-blue-900 transition-colors shadow-md mt-4">
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
              <textarea placeholder="e.g. House completely flooded, 2 acres crop destroyed..." value={form.damage_details}
                onChange={e => setForm(p => ({ ...p, damage_details: e.target.value }))}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-blue-500 transition-colors h-32 resize-none bg-white" />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
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
              <p className="text-slate-500 text-base">Your damage report has been received.</p>
            </div>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5">
              <p className="text-blue-600 text-sm font-semibold mb-1">Claim Reference</p>
              <p className="text-3xl font-bold text-blue-700 tracking-widest font-mono">{claimId}</p>
              <p className="text-blue-500 text-xs mt-2">Track using mobile: {form.contact_number}</p>
            </div>
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