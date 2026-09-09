export async function burnGeotag(
  imageFile: File,
  lat: number,
  lng: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      const now = new Date();
      const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      const latStr = lat >= 0 ? lat.toFixed(6) + "\u00b0N" : Math.abs(lat).toFixed(6) + "\u00b0S";
      const lngStr = lng >= 0 ? lng.toFixed(6) + "\u00b0E" : Math.abs(lng).toFixed(6) + "\u00b0W";

      const line1 = "\uD83D\uDCCD " + latStr + "  " + lngStr;
      const line2 = "\uD83D\uDD50 " + dateStr + " " + timeStr + "  |  DDMA Field Report";

      const barH = Math.max(60, img.height * 0.07);
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.fillRect(0, img.height - barH, img.width, barH);

      const fs1 = Math.max(16, img.width * 0.03);
      const fs2 = Math.max(13, img.width * 0.024);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold " + fs1 + "px monospace";
      ctx.fillText(line1, 16, img.height - barH + barH * 0.42);
      ctx.font = fs2 + "px monospace";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(line2, 16, img.height - barH + barH * 0.82);

      URL.revokeObjectURL(url);
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      }, "image/jpeg", 0.92);
    };
    img.onerror = reject;
    img.src = url;
  });
}