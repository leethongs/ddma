import { createClient } from "@supabase/supabase-js";
const URL = "https://yfkvfrlyzdxggamiievt.supabase.co";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlma3Zmcmx5emR4Z2dhbWlpZXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MjY3MzQsImV4cCI6MjEwNDUwMjczNH0.iL4jbZQ9iXqTV3R0-t7d4_wxwpcZUUHYc-GfUaQOfdU";
const SERVICE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlma3Zmcmx5emR4Z2dhbWlpZXZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODkyNjczNCwiZXhwIjoyMTA0NTAyNzM0fQ.W-XYcsx6417xUwd7kFxPkv5sXgT95ETnUMr4x5k5ZWI";
export const supabase = createClient(URL, ANON);
export const supabaseAdmin = createClient(URL, SERVICE);
export { URL as SUPABASE_URL, SERVICE as SERVICE_KEY };