"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { generateImage } from "@/lib/api";
import type { GeneratedImage, ImageType, ProductPackage, VisualPrompts } from "@/lib/types";

export type ImageCardState = {
  status: "idle" | "loading" | "generated" | "fallback";
  image?: GeneratedImage;
};

export type ImageCardsByType = Record<ImageType, ImageCardState>;

const ALL_TYPES: ImageType[] = [
  "heroImage",
  "campaignPoster",
  "uiMoodboard",
  "architectureDiagram",
  "socialGraphic",
];

const PROMPT_KEYS: { type: ImageType; key: keyof VisualPrompts }[] = [
  { type: "heroImage", key: "heroImage" },
  { type: "campaignPoster", key: "campaignPoster" },
  { type: "uiMoodboard", key: "uiMoodboard" },
  { type: "architectureDiagram", key: "architectureDiagram" },
];

function emptyCards(): ImageCardsByType {
  return ALL_TYPES.reduce((acc, t) => {
    acc[t] = { status: "idle" };
    return acc;
  }, {} as ImageCardsByType);
}

/** "generated" only counts when actual image bytes are present. */
function bucketStatus(img: GeneratedImage): "generated" | "fallback" {
  if (img.status === "generated" && (img.imageUrl || img.imageBase64)) {
    return "generated";
  }
  return "fallback";
}

function attemptKey(rawIdea: string, type: ImageType, prompt: string) {
  // Cheap stable key. Identical rawIdea + type + prompt = same attempt slot.
  return `${rawIdea}::${type}::${prompt}`;
}

/**
 * Owns image-card state for the active product package.
 *
 * Behavior:
 *   - When a new package arrives, cards reset (and are seeded from pkg.images
 *     if a saved project carried them).
 *   - Auto-fires one image-generation request per (type, prompt) the first
 *     time we see them, guarded by an attempted-keys ref so React strict-mode
 *     double-effects, tab switches, and parent re-renders never duplicate.
 *   - Failures stay in `fallback`; auto-trigger does NOT retry. The user must
 *     click Regenerate.
 *   - Regenerate re-fires explicitly. If the new attempt fails and a previous
 *     image existed, we keep the previous image and surface the error.
 */
export function useImageGeneration(pkg: ProductPackage | null) {
  const [cards, setCards] = useState<ImageCardsByType>(emptyCards);
  const [generatingAll, setGeneratingAll] = useState(false);
  const attemptedRef = useRef<Set<string>>(new Set());

  // Reset + seed when the package object identity changes.
  useEffect(() => {
    attemptedRef.current = new Set<string>();
    if (!pkg) {
      setCards(emptyCards());
      return;
    }

    const seeded = emptyCards();
    if (Array.isArray(pkg.images)) {
      for (const img of pkg.images) {
        if (!img || !img.type) continue;
        seeded[img.type] = { status: bucketStatus(img), image: img };
        // Mark seeded results as attempted so we don't auto-regenerate them.
        const prompt =
          img.prompt ||
          (pkg.visualPrompts as any)?.[img.type] ||
          "";
        attemptedRef.current.add(attemptKey(pkg.rawIdea || "", img.type, prompt));
      }
    }
    setCards(seeded);
  }, [pkg]);

  // Per-type generation. Used by both auto-trigger and manual regenerate.
  const runOne = useCallback(
    async (type: ImageType, prompt: string, opts?: { manual?: boolean }) => {
      if (!prompt || !prompt.trim()) return;
      // Mark loading. If a previous image existed, we keep it on the side so
      // we can restore it if regeneration fails.
      let previous: GeneratedImage | undefined;
      setCards((prev) => {
        previous = prev[type]?.image;
        return { ...prev, [type]: { status: "loading", image: previous } };
      });

      const img = await generateImage(type, prompt);
      const next: GeneratedImage = {
        ...img,
        generatedAt: new Date().toISOString(),
      };

      setCards((prev) => {
        const bucket = bucketStatus(next);
        // If regenerating and the new attempt didn't yield bytes but a
        // previous image existed, keep the previous image visible and tag
        // status as fallback so the user sees the warning without losing art.
        if (
          opts?.manual &&
          bucket === "fallback" &&
          previous &&
          (previous.imageUrl || previous.imageBase64)
        ) {
          return {
            ...prev,
            [type]: { status: "generated", image: previous },
          };
        }
        return { ...prev, [type]: { status: bucket, image: next } };
      });
    },
    [],
  );

  // Auto-trigger generation for the hero image only.
  //
  // Demo policy (intentional): only `heroImage` auto-fires once per (rawIdea,
  // prompt) so paid quota cannot be burned accidentally for four images at
  // a time. Campaign poster, UI moodboard, and architecture diagram require
  // an explicit Generate click. Any retry is also explicit via Regenerate.
  useEffect(() => {
    if (!pkg?.visualPrompts) return;
    const prompt = pkg.visualPrompts.heroImage;
    if (!prompt || !prompt.trim()) return;
    const rawIdea = pkg.rawIdea || "";
    const k = attemptKey(rawIdea, "heroImage", prompt);
    if (attemptedRef.current.has(k)) return;
    attemptedRef.current.add(k);
    void runOne("heroImage", prompt);
  }, [pkg, runOne]);

  const regenerate = useCallback(
    (type: ImageType, prompt: string) => {
      const rawIdea = pkg?.rawIdea || "";
      // Drop the attempted marker so a future auto-trigger pass could retry,
      // but the immediate runOne call is what actually does the work.
      attemptedRef.current.delete(attemptKey(rawIdea, type, prompt));
      // Re-add so background effect doesn't double-fire while we run.
      attemptedRef.current.add(attemptKey(rawIdea, type, prompt));
      return runOne(type, prompt, { manual: true });
    },
    [pkg?.rawIdea, runOne],
  );

  const generateAll = useCallback(async () => {
    if (!pkg?.visualPrompts) return;
    setGeneratingAll(true);
    try {
      await Promise.all(
        PROMPT_KEYS.map(({ type, key }) => {
          const prompt = pkg.visualPrompts[key];
          if (!prompt || !prompt.trim()) return Promise.resolve();
          return regenerate(type, prompt);
        }),
      );
    } finally {
      setGeneratingAll(false);
    }
  }, [pkg, regenerate]);

  /** Snapshot of generated/fallback images suitable for saving with a project. */
  const snapshotImages = useCallback((): GeneratedImage[] => {
    const out: GeneratedImage[] = [];
    for (const t of ALL_TYPES) {
      const c = cards[t];
      if (c?.image && c.status !== "loading") out.push(c.image);
    }
    return out;
  }, [cards]);

  return {
    cards,
    regenerate,
    generateAll,
    generatingAll,
    snapshotImages,
  };
}
