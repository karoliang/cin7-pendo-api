---
name: 🐛 Bug Report
about: Create a report to help us improve
title: "[BUG] "
labels: bug, needs-triage
assignees: ''
---

## Bug Description
A clear and concise description of what the bug is.

## Component Information
- **Component Path**: `frontend/src/components/path/Component.tsx`
- **Component Type**: Functional Component / Custom Hook / Context Provider
- **Props Interface**: List key props and their types

## Environment
- **React**: 19.1.1
- **TypeScript**: ~5.9.3
- **Browser**: [Chrome/Firefox/Safari + Version]
- **Device**: [Desktop/Mobile + OS]
- **Deployment**: [Development/Staging/Production]

## Current Behavior
Describe what is happening now, including any error messages or unexpected behavior.

## Expected Behavior
Describe what should happen instead.

## Reproduction Steps
Provide detailed steps to reproduce the issue:

1. Navigate to `/route`
2. Click on `[element]`
3. Fill in form with `[data]`
4. Submit and observe `[error]`

## Code Example
```tsx
// Minimal reproducible example
<Component
  prop1="value"
  prop2={data}
  onAction={handleAction}
/>
```

## Console & Network Errors
<details>
<summary>Console Errors</summary>

```
[Paste console errors here]
```
</details>

<details>
<summary>Network Requests</summary>

```
[Paste network request/response details here]
```
</details>

## Visual Evidence
[Add screenshots or screen recordings if applicable]

## Pendo API Context (if applicable)
- **API Endpoint**: `GET /api/pendo/endpoint`
- **Authentication**: Using integration key `your-pendo-integration-key`
- **Rate Limit Status**: [Current usage/limits]
- **Data Sync Status**: [Last sync with Supabase]

## Debug Information
- **React DevTools**: Component state and props
- **Supabase Console**: Database queries and errors
- **Netlify Logs**: Edge Function logs (if applicable)

## Workaround
[Describe any temporary workarounds if available]

## Impact Assessment
- **Severity**: Critical/High/Medium/Low
- **Users Affected**: [Internal team/External customers/Specific user groups]
- **Business Impact**: [Effect on Cin7 operations/analytics]

## Acceptance Criteria
- [ ] Bug reproduction confirmed in development environment
- [ ] Root cause identified and documented
- [ ] Fix implemented and tested
- [ ] No regression in related functionality
- [ ] Performance impact assessed and acceptable

## Additional Context
Add any other context about the problem here, including:
- Recent changes that might be related
- Similar issues encountered before
- Relevant documentation or references

---
**Troubleshooting Checklist**
- [ ] Issue reproducible in multiple browsers
- [ ] Console errors documented
- [ ] Network requests inspected
- [ ] Component props and state examined
- [ ] Recent changes identified
- [ ] Regression testing performed
- [ ] Workaround documented if available