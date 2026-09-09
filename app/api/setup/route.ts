import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  "https://yfkvfrlyzdxggamiievt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlma3Zmcmx5emR4Z2dhbWlpZXZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODkyNjczNCwiZXhwIjoyMTA0NTAyNzM0fQ.W-XYcsx6417xUwd7kFxPkv5sXgT95ETnUMr4x5k5ZWI"
);
export async function GET() {
  // Seed default settings if empty
  const { data: existing } = await supabase.from("settings").select("key").limit(1);
  if (existing !== null && existing.length === 0) {
    await supabase.from("settings").upsert([
      { key: "sos_number", value: "1078" },
      { key: "district_name", value: "District Disaster Management Authority" },
      { key: "helpline_info", value: "Available 24x7" },
    ]);
  }
  return NextResponse.json({ ok: true });
}