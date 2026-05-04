import { API_URL } from "./constants";
import { buildFallbackPackage } from "./fallbackData";
import type { ProductPackage } from "./types";

export type ApiResult<T> = {
  data: T;
  source: "backend" | "fallback";
  warning?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  const json = await res.json();
  if (json && typeof json === "object" && "ok" in json) {
    if (!json.ok) throw new Error(json.error || "Unknown backend error");
    return json.data as T;
  }
  return json as T;
}

export async function healthCheck(): Promise<boolean> {
  try {
    await request<{ status: string }>("/health");
    return true;
  } catch {
    return false;
  }
}

export async function getSamplePackage(): Promise<ApiResult<ProductPackage>> {
  try {
    const data = await request<ProductPackage>("/sample");
    return { data, source: "backend" };
  } catch (err) {
    return {
      data: buildFallbackPackage(""),
      source: "fallback",
      warning: "Using local fallback data (backend unreachable).",
    };
  }
}

export async function generateProductPackage(
  rawIdea: string,
): Promise<ApiResult<ProductPackage>> {
  if (!rawIdea.trim()) {
    throw new Error("Please enter an idea before generating.");
  }
  try {
    const data = await request<ProductPackage>("/generate", {
      method: "POST",
      body: JSON.stringify({ rawIdea }),
    });
    return { data, source: "backend" };
  } catch (err) {
    return {
      data: buildFallbackPackage(rawIdea),
      source: "fallback",
      warning: "Using local fallback data (backend unreachable).",
    };
  }
}
