import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";
import { validateAndGetConfig } from "../utils/environment";

const config = validateAndGetConfig();

export const supabase = createClient<Database>(
  config.supabaseUrl,
  config.supabaseAnonKey
);
