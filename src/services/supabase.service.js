// supabaseService.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load .env variables into process.env
dotenv.config();

class SupabaseService {
  // (public) static field – starts as null and will hold the client once created
  static client = null;

  /**
   * Returns a singleton Supabase client.
   * The client is created only the first time this method is called.
   */
  static getClient() {
    // If we haven't created the client yet, do it now
    if (!SupabaseService.client) {
      // Throw a helpful error if the required env vars are missing
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) {
        throw new Error(
          "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
        );
      }

      SupabaseService.client = createClient(url, key);
    }

    // Return the (now) cached client
    return SupabaseService.client;
  }
}

// Export the class – you can use `import SupabaseService from './supabaseService'`
export default SupabaseService;
