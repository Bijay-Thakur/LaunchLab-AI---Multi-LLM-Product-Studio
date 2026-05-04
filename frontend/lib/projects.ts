"use client";

import { getSupabase } from "./supabaseClient";
import type { ProductPackage } from "./types";

export type SavedProject = {
  id: string;
  user_id: string;
  title: string;
  raw_idea: string;
  product_name: string | null;
  mode: string | null;
  package_json: ProductPackage;
  created_at: string;
};

const TABLE = "launchlab_projects";

/** Persist a generated package for the signed-in user. */
export async function saveProject(pkg: ProductPackage): Promise<{
  ok: boolean;
  id?: string;
  error?: string;
}> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Supabase not configured." };

  const { data: userData } = await sb.auth.getUser();
  const user = userData?.user;
  if (!user) return { ok: false, error: "Sign in to save your project." };

  const productName = pkg.blueprint?.productName?.trim() || "Untitled product";
  const title = `${productName} - ${pkg.rawIdea?.slice(0, 60) || "draft"}`;

  const row = {
    user_id: user.id,
    title,
    raw_idea: pkg.rawIdea || "",
    product_name: productName,
    mode: pkg.mode ?? null,
    package_json: pkg,
  };

  const { data, error } = await sb.from(TABLE).insert(row).select("id").single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data?.id };
}

/** Latest projects for the signed-in user. Returns [] if not signed in.
 *
 * Defense-in-depth: we filter by the authenticated user_id from the current
 * Supabase session in addition to relying on RLS. RLS is the authoritative
 * boundary; this client filter just makes the contract explicit.
 */
export async function listProjects(limit = 10): Promise<SavedProject[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data: userData } = await sb.auth.getUser();
  const user = userData?.user;
  if (!user) return [];

  const { data, error } = await sb
    .from(TABLE)
    .select("id, user_id, title, raw_idea, product_name, mode, package_json, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data || []) as SavedProject[];
}
