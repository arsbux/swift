interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps?: number;
}

export default function ProgressIndicator({ currentStep, totalSteps = 3 }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const step = index + 1;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;
        
        return (
          <div
            key={step}
            className={`transition-all duration-300 ${
              isCompleted || isCurrent
                ? 'w-3 h-3 bg-black'
                : 'w-2 h-2 bg-gray-300'
            } rounded-full`}
          />
        );
      })}
    </div>
  );
}

