/**
 * Central environment configuration.
 *
 * Public values (NEXT_PUBLIC_*) are safe in the browser. Everything else is
 * read on the SERVER ONLY — API keys must never be shipped to the client.
 * When a group of variables is missing, that integration is "not configured"
 * and the app falls back to its clearly-labelled DEMO mode.
 */

export const publicConfig = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  paddleClientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "",
};

/** Server-only config. Import ONLY from route handlers / server code. */
export function serverConfig() {
  return {
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    elevenlabsApiKey: process.env.ELEVENLABS_API_KEY ?? "",
    elevenlabsAgentIdDispatcher: process.env.ELEVENLABS_AGENT_ID_DISPATCHER ?? "",
    elevenlabsAgentIdBrand: process.env.ELEVENLABS_AGENT_ID_BRAND ?? "",
    elevenlabsAgentPhoneNumberId:
      process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID ?? "",
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
    paddleApiKey: process.env.PADDLE_API_KEY ?? "",
    paddleWebhookSecret: process.env.PADDLE_WEBHOOK_SECRET ?? "",
  };
}

export function isSupabaseConfigured(): boolean {
  return Boolean(publicConfig.supabaseUrl && publicConfig.supabaseAnonKey);
}

export function isElevenLabsConfigured(): boolean {
  const c = serverConfig();
  return Boolean(
    c.elevenlabsApiKey && c.elevenlabsAgentPhoneNumberId &&
      (c.elevenlabsAgentIdDispatcher || c.elevenlabsAgentIdBrand),
  );
}

export function isPaddleConfigured(): boolean {
  return Boolean(publicConfig.paddleClientToken);
}

/** True when no real integrations are wired up — the UI shows DEMO badges. */
export function isDemoMode(): boolean {
  return !isSupabaseConfigured() && !isPaddleConfigured();
}
