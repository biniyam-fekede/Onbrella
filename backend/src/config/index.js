/**
 * Backend configuration. Uses env vars with sensible defaults.
 * Extensible: add more config as needed.
 */

const config = {
  port: parseInt(process.env.PORT || "5001", 10),
  hardwareUrl: process.env.HARDWARE_URL || "http://localhost:3000",
  /** Supabase/Postgres connection URL. From Supabase: Project Settings → Database → Connection string (URI). */
  databaseUrl: process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL,
  /** Supabase URL and service role key for admin JWT verification (optional). */
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  /** Stripe configuration (used for rental payments). */
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
};



module.exports = config;
