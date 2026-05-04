import { API_URL } from "./constants";
import { buildFallbackPackage } from "./fallbackData";
import type { GeneratedImage, ImageType, ProductPackage, WorkflowMode } from "./types";

export type ApiResult<T> = {
  data: T;
  source: "backend" | "fallback";
  warning?: string;
};

export type HealthStatus = {
  online: boolean;
  providers: { gemini: boolean; openai: boolean; images: boolean };
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

export async function healthCheck(): Promise<HealthStatus> {
  try {
    // /health does not use the {ok, data} envelope
    const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return {
      online: true,
      providers: {
        gemini: !!json?.providers?.gemini,
        openai: !!json?.providers?.openai,
        images: !!json?.providers?.images,
      },
    };
  } catch {
    return { online: false, providers: { gemini: false, openai: false, images: false } };
  }
}

export async function generateImage(
  type: ImageType,
  prompt: string,
): Promise<GeneratedImage> {
  try {
    const res = await fetch(`${API_URL}/images/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ type, prompt }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json?.success && json.image) return json.image as GeneratedImage;
    throw new Error(json?.error || "Image generation failed");
  } catch {
    return {
      type,
      title: type,
      prompt,
      imageUrl: null,
      imageBase64: null,
      status: "fallback",
      message:
        "Image generation is unavailable right now. The prompt is still ready to copy or use manually.",
      error:
        "Image generation is unavailable right now. The prompt is still ready to copy or use manually.",
    };
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
  workflowMode: WorkflowMode = "manual",
): Promise<ApiResult<ProductPackage>> {
  if (!rawIdea.trim()) {
    throw new Error("Please enter an idea before generating.");
  }
  const path = workflowMode === "langgraph" ? "/v2/run-workflow" : "/generate";
  try {
    const data = await request<ProductPackage>(path, {
      method: "POST",
      body: JSON.stringify({ rawIdea }),
    });
    return { data, source: "backend" };
  } catch {
    const fallback = buildFallbackPackage(rawIdea);
    if (workflowMode === "langgraph") {
      fallback.version = "v2";
      fallback.workflowMode = "langgraph";
    } else {
      fallback.version = "v1";
      fallback.workflowMode = "manual";
    }
    return {
      data: fallback,
      source: "fallback",
      warning: "Using local fallback data (backend unreachable).",
    };
  }
}

/** Convenience aliases for the demo. */
export const runManualWorkflow = (rawIdea: string) =>
  generateProductPackage(rawIdea, "manual");
export const runLangGraphWorkflow = (rawIdea: string) =>
  generateProductPackage(rawIdea, "langgraph");
