export type IncidentStatus = "pending" | "under_review" | "approved" | "rejected";
export interface Incident {
  id: string;
  created_at: string;
  victim_name: string;
  contact_number: string;
  aadhaar_number?: string;
  address?: string;
  damage_type: string;
  damage_details?: string;
  photo_url?: string;
  latitude?: number;
  longitude?: number;
  location_address?: string;
  status: IncidentStatus;
  rejection_reason?: string;
  compensation_amount?: number;
  compensation_form_url?: string;
}
export interface Setting { key: string; value: string; }