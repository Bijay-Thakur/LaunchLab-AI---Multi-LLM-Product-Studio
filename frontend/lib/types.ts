export type Research = {
  summary: string;
  problemValidation: string[];
  targetUsers: string[];
  painPoints: string[];
  existingSolutions: string[];
  marketGap: string;
  ethicalConcerns: string[];
  recommendedMvp: string;
};

export type Feature = { name: string; description: string };

export type Blueprint = {
  productName: string;
  onelinePitch: string;
  targetUsers: string[];
  coreFeatures: Feature[];
  userJourney: string[];
  mvpScope: string[];
  pagesNeeded: string[];
  successMetrics: string[];
};

export type BrandCampaign = {
  brandName: string;
  tagline: string;
  mission: string;
  heroHeadline: string;
  heroSubheadline: string;
  ctaPrimary: string;
  ctaSecondary: string;
  posterCopy: string;
  socialCaption: string;
  launchAnnouncement: string;
  voiceAndTone: string[];
};

export type VisualPrompts = {
  heroImage: string;
  campaignPoster: string;
  uiMoodboard: string;
  architectureDiagram: string;
};

export type EvaluationScores = {
  productMarketFit: number;
  userEmpathy: number;
  technicalFeasibility: number;
  ethicalSafety: number;
  accessibility: number;
  campaignQuality: number;
  overallReadiness: number;
};

export type Evaluation = {
  scores: EvaluationScores;
  strengths: string[];
  weaknesses: string[];
  recommendedImprovements: string[];
  judgeNotes: string;
};

export type WorkflowStage = {
  stage: string;
  owner: string;
  model: string;
  description: string;
};

export type GenerationMode = "live" | "partial-fallback" | "mock-fallback";

export type GenerationError = { step: string; error: string };

export type WorkflowVersion = "v1" | "v2";

export type WorkflowMode = "manual" | "langgraph";

export type GraphMetadata = {
  graphType: string;
  description: string;
  nodes: string[];
  edges: [string, string][];
  nodesRun: string[];
};

export type ImageType =
  | "heroImage"
  | "campaignPoster"
  | "uiMoodboard"
  | "architectureDiagram"
  | "socialGraphic";

export type ImageStatus =
  | "generated"
  | "disabled"
  | "permission_denied"
  | "billing_limit"
  | "quota_exceeded"
  | "rate_limited"
  | "model_unavailable"
  | "invalid_request"
  | "timeout"
  | "fallback"
  | "error"
  | "loading"
  | "idle";

export type ProviderWarning = {
  provider: string;
  step: string;
  code: string;
  message: string;
};

export type GeneratedImage = {
  type: ImageType;
  title: string;
  prompt: string;
  imageUrl?: string | null;
  imageBase64?: string | null;
  status: ImageStatus;
  message?: string | null;
  error?: string | null;
  generatedAt?: string | null;
};

export type ProductPackage = {
  rawIdea: string;
  research: Research;
  blueprint: Blueprint;
  claudeBuildPrompt: string;
  brandCampaign: BrandCampaign;
  visualPrompts: VisualPrompts;
  evaluation: Evaluation;
  workflow: WorkflowStage[];
  mode?: GenerationMode;
  errors?: GenerationError[];
  liveSteps?: number;
  totalSteps?: number;
  images?: GeneratedImage[];
  version?: WorkflowVersion;
  workflowMode?: WorkflowMode;
  fallbackSteps?: string[];
  providerWarnings?: ProviderWarning[];
  graphMetadata?: GraphMetadata;
};

export type TabId =
  | "raw"
  | "research"
  | "blueprint"
  | "claude"
  | "brand"
  | "visual"
  | "evaluation"
  | "workflow";
