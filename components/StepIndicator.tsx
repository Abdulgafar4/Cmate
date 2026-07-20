import { getStepIndex, STEPS, type AppStep } from "@/lib/steps";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  activeStep: AppStep;
}

const CIRCLE_SIZE = "1.75rem"; // size-7

export function StepIndicator({ activeStep }: StepIndicatorProps) {
  const activeIndex = getStepIndex(activeStep);
  const progressRatio = activeIndex / (STEPS.length - 1);

  return (
    <nav aria-label="Download progress steps" className="mb-6 w-full px-1">
      <ol className="relative flex justify-between">
        <div
          className="pointer-events-none absolute top-3.5 h-0.5 bg-border"
          style={{
            left: CIRCLE_SIZE,
            right: CIRCLE_SIZE,
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-3.5 left-7 h-0.5 bg-primary transition-all duration-300"
          style={{
            width:
              activeIndex === 0
                ? "0px"
                : `calc((100% - 2 * ${CIRCLE_SIZE}) * ${progressRatio})`,
          }}
          aria-hidden="true"
        />

        {STEPS.map((step, index) => {
          const isComplete = index < activeIndex;
          const isActive = index === activeIndex;

          return (
            <li
              key={step.id}
              className="relative z-10 flex w-16 flex-col items-center gap-1.5"
            >
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  isComplete && "bg-primary text-primary-foreground",
                  isActive &&
                    "bg-primary text-primary-foreground ring-4 ring-ring",
                  !isComplete &&
                    !isActive &&
                    "border border-border bg-card text-muted-foreground",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {isComplete ? "✓" : index + 1}
              </div>
              <span
                className={cn(
                  "text-center text-[10px] leading-tight font-medium sm:text-[11px]",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
