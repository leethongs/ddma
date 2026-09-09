export async function burnGeotag(
  imageFile: File,
  lat: number,
  lng: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);
    img.onload = () => {
      const MAX_DIM = 1280;
      let w = img.width;
      let h = img.height;
      
      // Downscale to prevent mobile browser memory crash
      if (w > MAX_DIM || h > MAX_DIM) {
        if (w > h) {
          h = Math.round((MAX_DIM / w) * h);
          w = MAX_DIM;
        } else {
          w = Math.round((MAX_DIM / h) * w);
          h = MAX_DIM;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("No 2d context"));
      
      ctx.drawImage(img, 0, 0, w, h);

      const now = new Date();
      const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      const latStr = lat >= 0 ? lat.toFixed(6) + "\u00b0N" : Math.abs(lat).toFixed(6) + "\u00b0S";
      const lngStr = lng >= 0 ? lng.toFixed(6) + "\u00b0E" : Math.abs(lng).toFixed(6) + "\u00b0W";

      const line1 = "\uD83D\uDCCD " + latStr + "  " + lngStr;
      const line2 = "\uD83D\uDD50 " + dateStr + " " + timeStr + "  |  DDMA Field Report";

      const barH = Math.max(40, h * 0.08);
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.fillRect(0, h - barH, w, barH);

      const fs1 = Math.max(12, w * 0.035);
      const fs2 = Math.max(10, w * 0.028);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold " + fs1 + "px monospace";
      ctx.fillText(line1, 16, h - barH + barH * 0.45);
      ctx.font = fs2 + "px monospace";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(line2, 16, h - barH + barH * 0.82);

      URL.revokeObjectURL(url);
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      }, "image/jpeg", 0.85);
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });
}