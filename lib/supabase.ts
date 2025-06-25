import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  category: string;
  active: boolean;
}

export interface Professional {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  active: boolean;
}

export type Appointment = {
  id: string;
  created_at: string;
  appointment_date: string;
  appointment_time: string;
  client_name: string;
  client_phone: string;
  service_id: string;
  professional_id: string;
  status: string;
  service?: {
    name: string;
  };
  professional?: {
    name: string;
  };
};
