// supabaseService.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

class SupabaseService {
  static client = null;

  static getClient() {
    if (!SupabaseService.client) {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) {
        throw new Error(
          "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
        );
      }

      SupabaseService.client = createClient(url, key);
    }

    return SupabaseService.client;
  }
}

export default SupabaseService;
