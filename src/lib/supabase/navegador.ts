"use client";
import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_PUBLICA, SUPABASE_URL } from "@/lib/env";
import type { Database } from "./tipos";

export function clienteNavegador() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLICA);
}
