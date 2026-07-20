export type AppStep = "paste" | "preview" | "download" | "save";

export interface StepItem {
  id: AppStep;
  label: string;
}

export const STEPS: StepItem[] = [
  { id: "paste", label: "Paste link" },
  { id: "preview", label: "Preview" },
  { id: "download", label: "Download" },
  { id: "save", label: "Save" },
];

export function getActiveStep(options: {
  hasInfo: boolean;
  hasJob: boolean;
  jobDone: boolean;
}): AppStep {
  if (options.jobDone) {
    return "save";
  }
  if (options.hasJob) {
    return "download";
  }
  if (options.hasInfo) {
    return "preview";
  }
  return "paste";
}

export function getStepIndex(step: AppStep): number {
  return STEPS.findIndex((item) => item.id === step);
}
