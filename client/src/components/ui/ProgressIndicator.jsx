import React from 'react';

export function ProgressIndicator({ steps, currentStep, onStepClick }) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 w-full z-0" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-600 transition-all duration-300 z-0"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, idx) => {
          const stepNumber = idx + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div
              key={step.title || idx}
              className={`flex flex-col items-center relative z-10 ${
                onStepClick && isCompleted ? 'cursor-pointer' : ''
              }`}
              onClick={() => onStepClick && isCompleted && onStepClick(stepNumber)}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 ${
                  isCompleted
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-50'
                    : isCurrent
                    ? 'bg-white text-indigo-600 border-2 border-indigo-600 ring-4 ring-indigo-50'
                    : 'bg-white text-slate-400 border-2 border-slate-200'
                }`}
              >
                {isCompleted ? '✓' : stepNumber}
              </div>
              <span
                className={`text-xs mt-1.5 font-medium hidden sm:block ${
                  isCurrent ? 'text-indigo-600 font-semibold' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EmptyState({
  icon = '🎙️',
  title = 'No items found',
  description = 'Get started by creating your first item.',
  action = null,
  className = '',
}) {
  return (
    <div className={`text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 ${className}`}>
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 leading-relaxed">{description}</p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
}
