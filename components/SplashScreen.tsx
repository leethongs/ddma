"use client";
import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Show solid for 1.5s, then fade out for 0.5s
    const t1 = setTimeout(() => setFading(true), 1500);
    const t2 = setTimeout(() => setVisible(false), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-100'}`}>
       <div className="relative mb-6">
         <div className="absolute inset-0 bg-pink-100 rounded-full animate-ping opacity-50"></div>
         <img src="https://i.postimg.cc/Z5XsVQZC/Pink-Circle-Lotus-Yoga-Instructor-Logo.png" alt="DDMA Logo" className="relative w-40 h-40 object-contain drop-shadow-xl" />
       </div>
       <h1 className="text-2xl font-black text-slate-800 tracking-widest uppercase">DDMA, Tuensang</h1>
       
       <div className="mt-8 flex gap-2">
         <div className="w-2.5 h-2.5 bg-slate-300 rounded-full animate-[bounce_1s_infinite_0ms]"></div>
         <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-[bounce_1s_infinite_150ms]"></div>
         <div className="w-2.5 h-2.5 bg-slate-500 rounded-full animate-[bounce_1s_infinite_300ms]"></div>
       </div>
    </div>
  );
}