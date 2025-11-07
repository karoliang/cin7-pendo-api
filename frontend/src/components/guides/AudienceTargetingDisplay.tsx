import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/polaris';
import { Badge } from '@/components/polaris';
import { UsersIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface AudienceRule {
  field: string;
  operator: string;
  value: string | string[];
}

interface AudienceTargetingProps {
  audience: any; // The raw audience object from Pendo
}

// Helper function to parse Pendo's targeting DSL
function parseAudienceRules(audience: any): AudienceRule[] {
  const rules: AudienceRule[] = [];

  try {
    // Check if it's the simple format
    if (audience?.id && audience?.name) {
      return [{ field: 'Segment', operator: 'is', value: audience.name }];
    }

    // Parse filter string (like the one in your screenshot)
    if (audience?.filter && typeof audience.filter === 'string') {
      const filterStr = audience.filter;

      // Extract billing_country conditions
      const countryMatches = filterStr.match(/billing_country=="([^"]+)"/g);
      if (countryMatches && countryMatches.length > 0) {
        const countries = countryMatches.map(m => m.match(/"([^"]+)"/)?.[1]).filter(Boolean);
        rules.push({
          field: 'Billing Country',
          operator: 'is one of',
          value: countries.join(', ')
        });
      }

      // Extract visit recency condition
      const visitMatch = filterStr.match(/lastvisit>=dateAdd\(startOfPeriod\(\\?"([^"]+)\\?",now\(\)\),-(\d+),\\?"([^"]+)\\?"\)/);
      if (visitMatch) {
        const [, period, amount, unit] = visitMatch;
        rules.push({
          field: 'Last Visit',
          operator: 'within',
          value: `${amount} ${unit} ago`
        });
      }
    }

    // Parse select fields
    if (audience?.select) {
      const fields = Array.isArray(audience.select)
        ? audience.select.join(', ')
        : JSON.stringify(audience.select);
      rules.push({
        field: 'Tracked Fields',
        operator: 'includes',
        value: fields
      });
    }

    // Parse identified condition
    if (audience?.identified) {
      rules.push({
        field: 'User Type',
        operator: 'is',
        value: audience.identified
      });
    }
  } catch (error) {
    console.error('Error parsing audience rules:', error);
  }

  return rules.length > 0
    ? rules
    : [{ field: 'All Users', operator: 'included', value: 'Everyone' }];
}

// Helper to format operator display
function formatOperator(operator: string): string {
  const operatorMap: Record<string, string> = {
    'eq': 'equals',
    'ne': 'does not equal',
    'in': 'is one of',
    'nin': 'is not one of',
    'contains': 'contains',
    'gt': 'is greater than',
    'lt': 'is less than',
    '=': 'equals',
    '!=': 'does not equal',
    'is': 'is',
    'is one of': 'is one of',
    'within': 'within',
    'includes': 'includes'
  };
  return operatorMap[operator.toLowerCase()] || operator;
}

export const AudienceTargetingDisplay: React.FC<AudienceTargetingProps> = ({ audience }) => {
  const rules = parseAudienceRules(audience);
  const hasComplexRules = audience && typeof audience === 'object' &&
                          (audience.filter || audience.source || audience.eval);

  return (
    <div className="space-y-4">
      {/* Summary Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <UsersIcon className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Targeting Rules</h4>
            <p className="text-sm text-blue-800">
              This guide will be shown to users matching the following criteria:
            </p>
          </div>
        </div>
      </div>

      {/* Rules Display */}
      <div className="space-y-3">
        {rules.map((rule, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-medium text-gray-900">{rule.field}</span>
              <span className="text-gray-600 mx-2">{formatOperator(rule.operator)}</span>
              <Badge variant="info">
                {Array.isArray(rule.value) ? rule.value.join(', ') : rule.value}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Technical Details - Collapsible */}
      {hasComplexRules && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900">
            View Technical Configuration
          </summary>
          <div className="mt-3 bg-gray-100 border border-gray-300 rounded-lg p-4">
            <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono overflow-x-auto">
              {JSON.stringify(audience, null, 2)}
            </pre>
          </div>
        </details>
      )}

      {/* Helpful Context */}
      <div className="text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="font-medium text-amber-900 mb-1">About Audience Targeting</p>
        <p className="text-amber-800">
          These rules are evaluated in real-time when a user visits your application.
          The guide will automatically appear to users who meet all the criteria above.
        </p>
      </div>
    </div>
  );
};
