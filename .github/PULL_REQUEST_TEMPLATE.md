## 📋 Pull Request Summary

### Description
[Brief description of the changes made in this PR]

### Type of Change
- [ ] 🐛 **Bug Fix** (non-breaking change that fixes an issue)
- [ ] ✨ **New Feature** (non-breaking change that adds functionality)
- [ ] 💥 **Breaking Change** (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 **Documentation** (documentation only changes)
- [ ] 🎨 **Style** (formatting, missing semi colons, etc; no code change)
- [ ] ♻️ **Refactor** (non-breaking change that improves code quality)
- [ ] ⚡ **Performance** (code change that improves performance)
- [ ] 🔒 **Security** (security-related changes)

### Related Issues
- Closes #[issue_number]
- Fixes #[issue_number]
- Resolves #[issue_number]

---

## 🔍 Code Review Checklist

### General Requirements
- [ ] **Code Quality**: Code follows project conventions and style guides
- [ ] **Self-Review**: I have reviewed my own code and it meets quality standards
- [ ] **Comments**: Added comments for complex logic, business rules, and important decisions
- [ ] **Documentation**: Updated relevant documentation (README, API docs, component docs)

### Testing Requirements
- [ ] **Unit Tests**: Added or updated unit tests for new functionality
- [ ] **Integration Tests**: Added or updated integration tests where applicable
- [ ] **Manual Testing**: Manually tested the changes in multiple browsers
- [ ] **Edge Cases**: Considered and tested edge cases and error conditions
- [ ] **Performance**: Tested performance impact (bundle size, render time, API response)

### Security & Accessibility
- [ ] **Security Review**: Considered security implications and no sensitive data exposed
- [ ] **Input Validation**: Properly validated and sanitized user inputs
- [ ] **Accessibility**: Changes are accessible (WCAG 2.1 AA compliance)
- [ ] **Error Handling**: Appropriate error handling and user feedback

### React & TypeScript Specific
- [ ] **Type Safety**: All TypeScript types are correct and comprehensive
- [ ] **React Best Practices**: Follows React 19 best practices and patterns
- [ ] **State Management**: Proper use of TanStack Query and Zustand
- [ ] **Component Design**: Components are well-designed and reusable
- [ ] **Performance**: Used React.memo, useMemo, useCallback where appropriate

### API & Database
- [ ] **API Integration**: Pendo API integration follows best practices
- [ ] **Error Handling**: Proper error handling for API calls and database operations
- [ ] **Data Validation**: Proper validation of data from external APIs
- [ ] **Performance**: Database queries and API calls are optimized
- [ ] **Security**: No hardcoded secrets, proper authentication/authorization

---

## 🧪 Testing

### Test Coverage
- **Files Modified**: [List of files changed]
- **Test Coverage**: [Current coverage % → Target coverage %]
- **New Tests**: [Number of new test files/cases added]
- **Existing Tests**: [All existing tests still pass]

### Test Environment
- [ ] **Development**: Tests pass in development environment
- [ ] **Staging**: Tests pass in staging environment (if applicable)
- [ ] **Multiple Browsers**: Tested in Chrome, Firefox, Safari
- [ ] **Mobile**: Tested on mobile devices if UI changes

### Performance Testing
- [ ] **Bundle Size**: Checked bundle size impact ([before KB] → [after KB])
- [ ] **Load Time**: Measured page load time impact
- [ ] **Memory Usage**: Checked for memory leaks or excessive usage
- [ ] **API Performance**: Verified API response times are acceptable

---

## 🔧 Technical Details

### Changes Made
```typescript
// Example: Key changes summary
interface NewFeatureProps {
  data: PendoData[];
  onAction: (action: ActionType) => void;
}

// Before
const OldComponent = ({ data }: Props) => {
  return <div>{data.length} items</div>;
};

// After
const EnhancedComponent: React.FC<NewFeatureProps> = ({ data, onAction }) => {
  const filteredData = useMemo(() =>
    data.filter(item => item.isActive), [data]
  );

  return (
    <div>
      <h2>{filteredData.length} active items</h2>
      <ActionButtons onAction={onAction} />
    </div>
  );
};
```

### API Changes
```typescript
// New or modified API endpoints
export const newApiEndpoint = async (params: NewApiParams) => {
  const response = await fetch('/api/pendo/new-endpoint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Pendo-Integration-Key': process.env.VITE_PENDO_API_KEY
    },
    body: JSON.stringify(params)
  });
  return response.json();
};
```

### Database Changes
```sql
-- New tables or schema changes
CREATE TABLE new_feature_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id TEXT NOT NULL,
  metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- New indexes for performance
CREATE INDEX idx_new_feature_feature_id ON new_feature_table(feature_id);
```

### Configuration Changes
```typescript
// Updated configuration
const config = {
  api: {
    timeout: 10000, // Increased from 5000
    retryAttempts: 3,
    retryDelay: 1000
  },
  features: {
    newFeatureEnabled: process.env.VITE_NEW_FEATURE_ENABLED === 'true'
  }
};
```

---

## 📊 Impact Analysis

### User Impact
- **New Features**: [Description of new functionality for users]
- **Improved Experience**: [How this improves user experience]
- **Breaking Changes**: [Any changes that affect existing user workflows]
- **Migration Needed**: [Whether users need to take any action]

### Business Impact
- **Analytics Enhancement**: [How this improves Cin7 analytics capabilities]
- **Performance Improvement**: [Performance benefits for business operations]
- **Data Quality**: [Improvements to data accuracy or completeness]
- **Cost Impact**: [Any cost implications (positive or negative)]

### Technical Impact
- **Dependencies**: [New dependencies or changes to existing ones]
- **Performance**: [Performance implications (CPU, memory, network)]
- **Scalability**: [How this affects system scalability]
- **Maintainability**: [Impact on code maintainability]

---

## 📸 Screenshots / Visual Evidence

### UI Changes
[Add screenshots for UI changes, showing before/after if applicable]

### Performance Metrics
[Add performance graphs or metrics showing improvements]

### Test Results
[Add test results or coverage reports]

---

## 🔗 References

### Related Documentation
- **API Documentation**: [Link to relevant API docs]
- **Component Documentation**: [Link to component docs]
- **Architecture Decisions**: [Link to ADRs or design docs]
- **Related Issues**: [Links to related GitHub issues]

### External Resources
- **Library Documentation**: [Links to library documentation]
- **Best Practices**: [Links to relevant best practices]
- **Standards**: [Links to relevant standards or specifications]

### Internal References
- **Similar Implementation**: [Link to similar code in the codebase]
- **Related Components**: [Link to related React components]
- **Configuration**: [Link to relevant configuration files]

---

## 🚀 Deployment

### Deployment Checklist
- [ ] **Environment Variables**: All required environment variables documented
- [ ] **Database Migrations**: Database migrations tested and ready
- [ ] **Asset Optimization**: Assets optimized for production
- [ ] **Configuration**: Production configuration verified
- [ ] **Monitoring**: Monitoring and alerting configured
- [ ] **Rollback Plan**: Rollback procedure documented

### Post-Deployment
- [ ] **Smoke Tests**: Basic functionality tests after deployment
- [ ] **Performance Monitoring**: Performance metrics monitored
- [ ] **Error Monitoring**: Error rates monitored
- [ ] **User Feedback**: User feedback collected
- [ ] **Analytics**: Usage analytics tracked

---

## 💬 Reviewer Guidelines

### Areas Requiring Special Attention
- **Security Implications**: [Any security considerations for reviewers]
- **Performance Impact**: [Areas where performance review is critical]
- **Breaking Changes**: [Breaking changes that need careful review]
- **Complex Logic**: [Complex business logic that needs thorough review]

### Review Focus
- **Code Quality**: Overall code quality and maintainability
- **TypeScript Types**: Type safety and proper type definitions
- **React Patterns**: React best practices and patterns
- **Test Coverage**: Adequate test coverage and quality
- **Documentation**: Documentation completeness and accuracy

---

## Additional Notes

### Challenges Faced
[Describe any challenges encountered during development]

### Lessons Learned
[Share any insights or lessons learned]

### Future Improvements
[Ideas for future enhancements or follow-up work]

### Acknowledgments
[Thanks to anyone who helped or provided feedback]

---

**🎯 Thank you for your contribution to the cin7-pendo-api project!**

This PR helps improve Cin7's analytics capabilities and provides better insights for decision-making. Your contribution is valuable for enhancing the platform's functionality and user experience.