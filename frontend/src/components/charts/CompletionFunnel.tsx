import React from 'react';
import type { ComprehensiveGuideData, GuideStep } from '@/types/enhanced-pendo';
import { InlineSpinner } from '@/components/ui/Spinner';

interface CompletionFunnelProps {
  guide: ComprehensiveGuideData;
  loading?: boolean;
}

interface FunnelStep {
  step: number;
  name: string;
  users: number;
  completionRate: number;
  dropOffRate: number;
  isEstimated?: boolean;
}

/**
 * Estimate funnel steps from guide totals when step-level data is unavailable
 */
const estimateFunnel = (guide: ComprehensiveGuideData): FunnelStep[] => {
  const steps = guide.stepCount || 3;
  const totalViews = guide.viewedCount;
  const totalCompletions = guide.completedCount;

  // Distribute drop-off evenly across steps
  const dropPerStep = (totalViews - totalCompletions) / steps;

  return Array.from({ length: steps }, (_, i) => {
    const users = Math.round(totalViews - (dropPerStep * i));
    const prevUsers = i > 0 ? Math.round(totalViews - (dropPerStep * (i - 1))) : totalViews;
    const dropOffRate = i > 0 ? ((prevUsers - users) / prevUsers) * 100 : 0;

    return {
      step: i + 1,
      name: `Step ${i + 1}`,
      users,
      completionRate: (users / totalViews) * 100,
      dropOffRate,
      isEstimated: true
    };
  });
};

/**
 * Convert GuideStep data to FunnelStep format
 */
const convertStepsToFunnel = (steps: GuideStep[], totalViews: number): FunnelStep[] => {
  return steps
    .sort((a, b) => a.order - b.order)
    .map((step, index) => {
      const users = step.viewedCount;
      const prevUsers = index > 0 ? steps[index - 1].viewedCount : totalViews;
      const dropOffRate = index > 0 ? ((prevUsers - users) / prevUsers) * 100 : 0;

      return {
        step: step.order,
        name: step.name,
        users: step.viewedCount,
        completionRate: (step.viewedCount / totalViews) * 100,
        dropOffRate,
        isEstimated: false
      };
    });
};

/**
 * Get color based on completion rate
 */
const getStepColor = (completionRate: number): string => {
  if (completionRate >= 75) return 'bg-green-500';
  if (completionRate >= 50) return 'bg-yellow-500';
  if (completionRate >= 25) return 'bg-orange-500';
  return 'bg-red-500';
};

/**
 * Get drop-off color based on drop-off rate
 */
const getDropOffColor = (dropOffRate: number): string => {
  if (dropOffRate >= 40) return 'text-red-600';
  if (dropOffRate >= 20) return 'text-orange-600';
  if (dropOffRate >= 10) return 'text-yellow-600';
  return 'text-green-600';
};

export const CompletionFunnel: React.FC<CompletionFunnelProps> = ({ guide, loading }) => {
  // Determine if we have real step data or need to estimate
  const hasStepData = guide.steps && guide.steps.length > 0;

  // Generate funnel data
  const funnelSteps = React.useMemo(() => {
    if (hasStepData) {
      return convertStepsToFunnel(guide.steps, guide.viewedCount);
    } else {
      return estimateFunnel(guide);
    }
  }, [guide, hasStepData]);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <InlineSpinner message="Loading funnel data..." size="md" />
      </div>
    );
  }

  // Don't render if guide has only 1 step or no steps
  if (funnelSteps.length <= 1) {
    return null;
  }

  // Calculate max width for the first step (100%)
  const maxUsers = funnelSteps[0].users;

  return (
    <div className="space-y-4">
      {/* Data Quality Badge */}
      {funnelSteps[0].isEstimated && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
          <p className="text-yellow-800">
            <strong>Note:</strong> Step-level data unavailable. Funnel is estimated based on total views and completions with evenly distributed drop-off.
          </p>
        </div>
      )}

      {/* Funnel Visualization */}
      <div className="space-y-2">
        {funnelSteps.map((step, index) => {
          const widthPercentage = (step.users / maxUsers) * 100;
          const isFirstStep = index === 0;
          const isLastStep = index === funnelSteps.length - 1;

          return (
            <div key={step.step} className="relative">
              {/* Funnel Bar */}
              <div
                className="relative mx-auto transition-all duration-300 hover:opacity-90"
                style={{
                  width: `${widthPercentage}%`,
                  minWidth: '30%'
                }}
              >
                {/* Trapezoid shape using CSS clip-path */}
                <div
                  className={`
                    ${getStepColor(step.completionRate)}
                    text-white rounded-md shadow-md
                    flex items-center justify-between
                    px-4 py-4
                    transition-transform duration-200 hover:scale-[1.02]
                  `}
                  style={{
                    clipPath: isLastStep
                      ? 'polygon(5% 0%, 95% 0%, 95% 100%, 5% 100%)'
                      : 'polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)'
                  }}
                >
                  {/* Left side: Step info */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 bg-white bg-opacity-30 rounded-full font-bold text-sm">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm truncate">{step.name}</div>
                      <div className="text-xs opacity-90">
                        {step.users.toLocaleString()} users ({step.completionRate.toFixed(1)}%)
                      </div>
                    </div>
                  </div>

                  {/* Right side: Drop-off indicator (if not first step) */}
                  {!isFirstStep && (
                    <div className="text-right ml-2">
                      <div className="text-xs opacity-90">Drop-off</div>
                      <div className="font-bold text-sm">
                        {step.dropOffRate.toFixed(1)}%
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Drop-off arrow and label (between steps) */}
              {!isLastStep && (
                <div className="flex items-center justify-center mt-1 mb-1">
                  <div className={`text-sm font-medium ${getDropOffColor(funnelSteps[index + 1].dropOffRate)}`}>
                    ↓ {funnelSteps[index + 1].dropOffRate.toFixed(1)}% drop-off
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
        <div className="text-center">
          <p className="text-sm text-gray-600">Started</p>
          <p className="text-2xl font-bold text-gray-900">
            {funnelSteps[0].users.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">100%</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-600">
            {funnelSteps[funnelSteps.length - 1].users.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {funnelSteps[funnelSteps.length - 1].completionRate.toFixed(1)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Total Drop-off</p>
          <p className="text-2xl font-bold text-red-600">
            {(funnelSteps[0].users - funnelSteps[funnelSteps.length - 1].users).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {((1 - funnelSteps[funnelSteps.length - 1].completionRate / 100) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs mt-4 pt-4 border-t">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-gray-600">75-100% completion</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span className="text-gray-600">50-74% completion</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span className="text-gray-600">25-49% completion</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-gray-600">&lt;25% completion</span>
        </div>
      </div>
    </div>
  );
};
