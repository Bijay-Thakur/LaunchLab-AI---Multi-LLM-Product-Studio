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

export type ProductPackage = {
  rawIdea: string;
  research: Research;
  blueprint: Blueprint;
  claudeBuildPrompt: string;
  brandCampaign: BrandCampaign;
  visualPrompts: VisualPrompts;
  evaluation: Evaluation;
  workflow: WorkflowStage[];
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
