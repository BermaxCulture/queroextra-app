// supabase/functions/validapay-client/index.ts
// -------------------------------------------------
// Valida Pay HTTP client for Edge Functions.
// Provides a cached OAuth2 client‑credentials token and a helper
// to perform authenticated requests to the Valida Pay API.
// -------------------------------------------------

// Environment variables (configured in Supabase Dashboard – sandbox)
// VALIDAPAY_BASE_URL   – e.g. "https://sandbox.validapay.com.br"
// VALIDAPAY_AUTH_URL   – e.g. "https://sandbox.validapay.com.br"
// VALIDAPAY_CLIENT_ID  – OAuth2 client id
// VALIDAPAY_CLIENT_SECRET – OAuth2 client secret

interface TokenResponse {
  access_token: string;
  token_type: string; // usually "Bearer"
  expires_in: number; // seconds
  scope?: string;
}

// In‑memory cache for the token – lives for the lifetime of the Deno isolate.
let cachedToken: string | null = null;
let tokenExpiresAt = 0; // epoch ms when token becomes invalid

/**
 * Fetch a new token from Valida Pay using the client_credentials grant.
 * The result is cached for the duration of the token (expires_in).
 */
export async function getValidaPayToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 5_000) {
    // Return cached token if still valid (5s safety margin).
    return cachedToken;
  }

  const authUrl = Deno.env.get("VALIDAPAY_AUTH_URL");
  const clientId = Deno.env.get("VALIDAPAY_CLIENT_ID");
  const clientSecret = Deno.env.get("VALIDAPAY_CLIENT_SECRET");

  if (!authUrl || !clientId || !clientSecret) {
    throw new Error(
      "Valida Pay credentials missing – ensure VALIDAPAY_AUTH_URL, VALIDAPAY_CLIENT_ID and VALIDAPAY_CLIENT_SECRET are set in Supabase env variables",
    );
  }

  const tokenEndpoint = `${authUrl.replace(/\/+$/, "")}/auth/token`;
  const credentials = btoa(`${clientId}:${clientSecret}`);
  const body = new URLSearchParams({ grant_type: "client_credentials" });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body,
  });

  if (!response.ok) {
    // Propagate the HTTP error – the caller can interpret 401 / 400.
    const errorText = await response.text();
    throw new Error(`Valida Pay token request failed (${response.status}): ${errorText}`);
  }

  const data: TokenResponse = await response.json();
  cachedToken = data.access_token;
  // expires_in is in seconds – store as epoch ms.
  tokenExpiresAt = now + data.expires_in * 1000;
  return cachedToken;
}

/**
 * Perform an authenticated request against the Valida Pay API.
 *
 * @param path – API path *relative* to VALIDAPAY_BASE_URL, e.g. "/v1/wallet/withdraw"
 * @param options – Fetch init options (method, body, headers, etc.)
 * @param subAccountNumber – Optional value for the X-Sub-Account header.
 */
export async function validaPayFetch(
  path: string,
  options: RequestInit = {},
  subAccountNumber?: string,
): Promise<Response> {
  const baseUrl = Deno.env.get("VALIDAPAY_BASE_URL");
  if (!baseUrl) {
    throw new Error(
      "VALIDAPAY_BASE_URL not set – configure it in Supabase environment variables",
    );
  }

  const token = await getValidaPayToken();

  const url = `${baseUrl.replace(/\/+$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers: HeadersInit = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (subAccountNumber) {
    headers.set("X-Sub-Account", subAccountNumber);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(url, fetchOptions);

  // Let the caller handle status codes. For 401 we simply return the response.
  return response;
}

// -------------------------------------------------
// Export a tiny helper for JSON responses – useful for other Edge Functions.
export async function validaPayJson<T>(
  path: string,
  options: RequestInit = {},
  subAccountNumber?: string,
): Promise<T> {
  const resp = await validaPayFetch(path, options, subAccountNumber);
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Valida Pay request failed (${resp.status}): ${txt}`);
  }
  return (await resp.json()) as T;
}

// -------------------------------------------------
// Example usage (commented – remove when copying to production):
/*
import { getValidaPayToken, validaPayFetch } from "./index.ts";

export async function handler(req: Request) {
  // Example: forward a request to Valida Pay's wallet endpoint
  const response = await validaPayFetch("/v1/wallet/balance", {
    method: "GET",
  });
  return new Response(await response.text(), { status: response.status });
}
*/
