"use client";
import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Show splash screen for 2.5 seconds total
    const t1 = setTimeout(() => setFading(true), 2500);
    const t2 = setTimeout(() => setVisible(false), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-100'} overflow-hidden`}>
       
       {/* Background Expanding Rings Animation */}
       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-[300px] h-[300px] bg-red-50 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] opacity-40"></div>
          <div className="absolute w-[450px] h-[450px] border border-red-100 rounded-full animate-[spin_8s_linear_infinite]"></div>
          <div className="absolute w-[600px] h-[600px] border border-slate-50 rounded-full animate-[spin_12s_linear_infinite_reverse]"></div>
       </div>

       {/* Logo with slight float animation */}
       <div className="relative z-10 mb-8 animate-[bounce_3s_ease-in-out_infinite]">
         <div className="absolute inset-0 bg-white shadow-2xl shadow-red-200/50 rounded-full scale-75 blur-xl"></div>
         <img src="https://i.postimg.cc/Z5XsVQZC/Pink-Circle-Lotus-Yoga-Instructor-Logo.png" alt="DDMA Logo" className="relative w-48 h-48 object-contain drop-shadow-xl" />
       </div>

       {/* Text with slide-up fade-in */}
       <div className="relative z-10 flex flex-col items-center animate-[slideUp_0.8s_ease-out]">
         <h1 className="text-3xl font-black text-slate-800 tracking-widest uppercase mb-1">DDMA, Tuensang</h1>
         <p className="text-slate-500 text-sm font-medium tracking-widest uppercase mb-12">Disaster Management</p>
       </div>
       
       {/* Beautiful Loading Bar */}
       <div className="relative z-10 w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden">
         <div className="h-full bg-red-600 rounded-full animate-[loadBar_2s_ease-out_forwards]"></div>
       </div>

       <style jsx>{`
         @keyframes slideUp {
           from { opacity: 0; transform: translateY(20px); }
           to { opacity: 1; transform: translateY(0); }
         }
         @keyframes loadBar {
           0% { width: 0%; }
           20% { width: 15%; }
           50% { width: 60%; }
           100% { width: 100%; }
         }
       `}</style>
    </div>
  );
}