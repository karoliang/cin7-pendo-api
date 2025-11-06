/**
 * FeatureCorrelationMatrix Component
 *
 * Displays a visual matrix showing which features are commonly used together.
 * Since Pendo API doesn't provide direct correlation data, this component calculates
 * correlations based on usage similarity patterns.
 *
 * The algorithm:
 * 1. Analyzes the top 10 features by usage count
 * 2. For each feature, finds up to 3 related features based on similarity
 * 3. Similarity is calculated using usage counts (60% weight) and visitor counts (40% weight)
 * 4. Features with 30%+ similarity are considered related
 *
 * Strength levels:
 * - Strong: 70%+ similarity, 3+ related features
 * - Medium: 40-69% similarity, 2+ related features
 * - Weak: 30-39% similarity, or fewer related features
 *
 * @example
 * ```tsx
 * <FeatureCorrelationMatrix
 *   features={pendoFeatures}
 *   loading={isLoading}
 * />
 * ```
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InlineSpinner } from '@/components/ui/Spinner';
import type { Feature } from '@/types/pendo';

interface FeatureCorrelationMatrixProps {
  features: Feature[];
  loading?: boolean;
}

interface FeatureCorrelation {
  feature: Feature;
  related: RelatedFeature[];
  strength: 'strong' | 'medium' | 'weak';
}

interface RelatedFeature {
  feature: Feature;
  similarity: number;
  strength: 'strong' | 'medium' | 'weak';
}

/**
 * Calculate correlation strength based on usage similarity
 */
const calculateCorrelations = (features: Feature[]): FeatureCorrelation[] => {
  // Filter and sort features by usage count
  const sortedFeatures = [...features]
    .filter(f => f.usageCount > 0)
    .sort((a, b) => b.usageCount - a.usageCount);

  // Get top 10 features for the matrix
  const topFeatures = sortedFeatures.slice(0, 10);

  return topFeatures.map(feature => {
    // Find related features based on usage similarity
    const relatedFeatures = sortedFeatures
      .filter(f => f.id !== feature.id)
      .map(f => {
        // Calculate similarity score (0-100) based on usage patterns
        const usageDiff = Math.abs(f.usageCount - feature.usageCount);
        const usageRange = feature.usageCount;
        const usageSimilarity = usageRange > 0
          ? Math.max(0, 100 - (usageDiff / usageRange) * 100)
          : 0;

        // Also consider visitor count similarity
        const visitorDiff = Math.abs(f.visitorCount - feature.visitorCount);
        const visitorRange = feature.visitorCount;
        const visitorSimilarity = visitorRange > 0
          ? Math.max(0, 100 - (visitorDiff / visitorRange) * 100)
          : 0;

        // Combined similarity score (weighted average)
        const similarity = (usageSimilarity * 0.6) + (visitorSimilarity * 0.4);

        // Determine strength
        let strength: 'strong' | 'medium' | 'weak';
        if (similarity >= 70) strength = 'strong';
        else if (similarity >= 40) strength = 'medium';
        else strength = 'weak';

        return {
          feature: f,
          similarity,
          strength
        };
      })
      // Only keep features with meaningful similarity
      .filter(r => r.similarity >= 30)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);

    // Determine overall strength for this feature
    let overallStrength: 'strong' | 'medium' | 'weak';
    if (relatedFeatures.length >= 3 && relatedFeatures[0].similarity >= 70) {
      overallStrength = 'strong';
    } else if (relatedFeatures.length >= 2 && relatedFeatures[0].similarity >= 40) {
      overallStrength = 'medium';
    } else {
      overallStrength = 'weak';
    }

    return {
      feature,
      related: relatedFeatures,
      strength: overallStrength
    };
  });
};

/**
 * Get color classes based on strength
 */
const getStrengthColor = (strength: 'strong' | 'medium' | 'weak') => {
  switch (strength) {
    case 'strong':
      return {
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-300',
        badge: 'bg-green-500'
      };
    case 'medium':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-300',
        badge: 'bg-blue-500'
      };
    case 'weak':
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-300',
        badge: 'bg-gray-500'
      };
  }
};

/**
 * Get arrow style based on strength
 */
const getArrowStyle = (strength: 'strong' | 'medium' | 'weak') => {
  const colors = getStrengthColor(strength);
  return `${colors.text} font-bold`;
};

export const FeatureCorrelationMatrix: React.FC<FeatureCorrelationMatrixProps> = ({
  features,
  loading
}) => {
  const correlations = React.useMemo(() => {
    return calculateCorrelations(features);
  }, [features]);

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feature Correlation Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-12">
            <InlineSpinner message="Analyzing feature correlations..." size="md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (correlations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feature Correlation Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p>No feature data available to analyze correlations.</p>
            <p className="text-sm mt-2">Features need usage data to calculate relationships.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Correlation Matrix</CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Shows features commonly used together based on similar usage patterns.
          Correlations are calculated from usage counts and visitor patterns.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Correlation List */}
          {correlations.map((correlation, index) => {
            const colors = getStrengthColor(correlation.strength);

            return (
              <div
                key={correlation.feature.id}
                className={`border ${colors.border} ${colors.bg} rounded-lg p-4 transition-all duration-200 hover:shadow-md`}
              >
                {/* Main Feature */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`flex items-center justify-center w-8 h-8 ${colors.badge} text-white rounded-full font-bold text-sm`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm truncate">{correlation.feature.name}</h4>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {correlation.feature.usageCount.toLocaleString()} uses • {' '}
                        {correlation.feature.visitorCount.toLocaleString()} visitors
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.text} ${colors.bg} border ${colors.border}`}>
                      {correlation.strength}
                    </span>
                  </div>
                </div>

                {/* Related Features */}
                {correlation.related.length > 0 && (
                  <div className="pl-11 space-y-2">
                    <p className="text-xs font-medium text-gray-600 mb-2">Related features:</p>
                    {correlation.related.map((related, relIndex) => {
                      const relatedColors = getStrengthColor(related.strength);

                      return (
                        <div
                          key={related.feature.id}
                          className="flex items-center gap-2 text-sm bg-white rounded p-2 border border-gray-200"
                        >
                          <span className={getArrowStyle(related.strength)}>→</span>
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">{related.feature.name}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({related.feature.usageCount.toLocaleString()} uses)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">
                              {related.similarity.toFixed(0)}% similar
                            </span>
                            <span className={`w-2 h-2 rounded-full ${relatedColors.badge}`}></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* No related features message */}
                {correlation.related.length === 0 && (
                  <div className="pl-11 text-xs text-gray-500 italic">
                    No strongly related features found
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <p className="text-sm text-gray-600">Features Analyzed</p>
            <p className="text-2xl font-bold text-gray-900">{correlations.length}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Avg Correlations</p>
            <p className="text-2xl font-bold text-blue-600">
              {(
                correlations.reduce((sum, c) => sum + c.related.length, 0) / correlations.length
              ).toFixed(1)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Strong Correlations</p>
            <p className="text-2xl font-bold text-green-600">
              {correlations.filter(c => c.strength === 'strong').length}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-xs mt-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Strong (70%+ similarity)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Medium (40-69% similarity)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span className="text-gray-600">Weak (30-39% similarity)</span>
          </div>
        </div>

        {/* Explanation */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>How correlations are calculated:</strong> Features are considered related when they have similar usage patterns
            (usage counts and visitor counts). A higher similarity percentage indicates features that are likely used together or
            by similar user groups.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
