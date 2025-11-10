# Frequently Asked Questions (FAQ)

## 🚀 Getting Started

### Q: What are the system requirements for developing with cin7-pendo-api?
**A:**
- **Node.js**: 18.14.0 or later (recommended: 20.x)
- **npm**: 9.0.0 or later
- **Git**: Latest stable version
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+
- **IDE**: VS Code recommended with listed extensions

### Q: How do I get a Pendo API key?
**A:**
1. Log into your Pendo.io account
2. Navigate to Settings → Integrations → API Keys
3. Generate a new integration key
4. Copy the key and add it to your `.env` file as `VITE_PENDO_API_KEY`
5. Ensure your Pendo subscription has the necessary API access

### Q: I'm getting CORS errors. How do I fix them?
**A:**
1. Ensure your `.env` file has the correct `VITE_PENDO_API_BASE_URL`
2. Check that your Pendo API key is valid and not expired
3. Verify you're not using the API key in client-side code directly
4. For local development, ensure your dev server is running on port 5173

### Q: The build fails with TypeScript errors. What should I do?
**A:**
```bash
# Check TypeScript version
npx tsc --version

# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Check specific errors
npm run type-check
```

## 🔧 Development

### Q: How do I add a new analytics chart?
**A:** Follow these steps:
1. Create the chart component in `frontend/src/components/charts/`
2. Use Recharts for consistency with existing charts
3. Add proper TypeScript interfaces
4. Include loading and error states
5. Add to lazy loading in `frontend/src/components/charts/LazyCharts.tsx`
6. Add tests in `frontend/src/components/charts/__tests__/`

### Q: What's the best way to handle API errors?
**A:** Use our established patterns:
```typescript
const { data, error, isLoading } = useApiData();

if (error) {
  return <ErrorDisplay error={error} onRetry={refetch} />;
}

if (isLoading) {
  return <InlineSpinner />;
}
```

### Q: How do I add a new Pendo API endpoint?
**A:**
1. Add the endpoint to `frontend/src/lib/pendo-api.ts`
2. Create a corresponding React Query hook in `frontend/src/hooks/`
3. Add proper TypeScript interfaces
4. Include error handling and rate limiting
5. Add tests for the new functionality

### Q: Why are my React components re-rendering too much?
**A:** Common causes and solutions:
- Missing `React.memo` for expensive components
- Not using `useMemo` for expensive calculations
- Not using `useCallback` for event handlers
- Creating new objects/arrays in render

## 🧪 Testing

### Q: How do I run tests for a specific component?
**A:**
```bash
# Run tests for a specific file
npm test -- --testPathPattern=KPICard.test.tsx

# Run tests in watch mode
npm run test:watch

# Run with coverage for specific file
npm test -- --coverage --testPathPattern=useGuideData.test.ts
```

### Q: My tests are failing with act() warnings. How do I fix this?
**A:** Wrap state updates in `act()`:
```typescript
import { render, act } from '@testing-library/react';

test('component updates correctly', async () => {
  const { result } = renderHook(() => useYourHook());

  await act(async () => {
    await result.current.someAsyncAction();
  });

  expect(result.current.value).toBe(expectedValue);
});
```

### Q: How do I mock API calls in tests?
**A:** Use Jest mocks:
```typescript
// Mock the API module
jest.mock('@/lib/pendo-api', () => ({
  getAggregation: jest.fn(),
}));

// In your test
import { getAggregation } from '@/lib/pendo-api';

(getAggregation as jest.Mock).mockResolvedValue(mockData);
```

## 🚀 Deployment

### Q: My deployment is failing on Netlify. What should I check?
**A:** Common issues:
1. **Environment Variables**: Ensure all required env vars are set in Netlify
2. **Build Command**: Verify it matches `cd frontend && npm ci && npm run build`
3. **Node Version**: Ensure Node.js 20 is specified in `netlify.toml`
4. **TypeScript Errors**: Check for strict type issues
5. **Bundle Size**: Ensure assets aren't too large

### Q: How do I add environment variables for production?
**A:**
1. Go to Netlify → Site → Settings → Build & Deploy → Environment
2. Add variables:
   - `VITE_PENDO_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Ensure they're marked as "Deploy context" = Production

### Q: The deployed site shows old code. How do I force a refresh?
**A:**
1. Check that your latest changes are pushed to main branch
2. Clear Netlify cache: Site → Settings → Build & Deploy → Post-processing → Asset Optimization
3. Force deploy: Trigger a manual deploy in Netlify dashboard

## 🔒 Security

### Q: Is my Pendo API key secure?
**A:** Follow these security practices:
- **Never** commit API keys to version control
- Use environment variables (`.env` files)
- Use different keys for development and production
- Rotate keys regularly
- Monitor API usage for unusual activity

### Q: How do I handle user authentication?
**A:** The project uses Supabase authentication:
```typescript
import { supabase } from '@/lib/supabase';

const { user, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
});
```

### Q: What are the Row Level Security (RLS) policies?
**A:** RLS policies in Supabase ensure users can only access data they're authorized to see. Check the `supabase/migrations/` directory for current policies.

## 📊 Performance

### Q: My dashboard is loading slowly. How can I optimize it?
**A:** Try these optimizations:
1. **Code Splitting**: Lazy load heavy components
2. **React.memo**: Wrap expensive components
3. **useMemo/useCallback**: Optimize renders
4. **Bundle Analysis**: Check for large dependencies
5. **API Caching**: Implement proper caching with TanStack Query

### Q: How do I check bundle size?
**A:**
```bash
# Analyze bundle
npm run build:analyze

# Check bundle sizes
npm run build
du -k dist/assets/*.js
```

### Q: What's causing memory leaks in my application?
**A:** Common causes:
- Unremoved event listeners in useEffect
- Uncleared intervals/timeouts
- Unsubscribed observables
- Retained DOM references

## 🎨 UI/UX

### Q: How do I add a new Polaris component?
**A:**
```tsx
import { Button, Card, Text } from '@shopify/polaris';

export const MyComponent = () => {
  return (
    <Card>
      <Text as="h2">Title</Text>
      <Button onClick={handleClick}>Action</Button>
    </Card>
  );
};
```

### Q: My styles aren't applying correctly. Why?
**A:** Check:
1. **Tailwind Configuration**: Ensure class names are in `tailwind.config.js`
2. **CSS Priority**: Polaris styles may override custom styles
3. **Dark Mode**: Ensure dark mode compatibility
4. **Import Order**: Check CSS import order in `main.tsx`

### Q: How do I make components mobile-responsive?
**A:** Use Tailwind responsive prefixes:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card className="w-full">
    <CardContent className="p-4 md:p-6">
      <Text variant="headingSm" className="text-sm md:text-base">
        Responsive text
      </Text>
    </CardContent>
  </Card>
</div>
```

## 🔧 Troubleshooting

### Q: "Cannot find module" errors?
**A:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript configuration
npx tsc --noEmit
```

### Q: Vite dev server is slow?
**A:**
1. Check for large dependencies in `package.json`
2. Update to latest Vite version
3. Enable HMR optimization
4. Check file watchers and exclusions

### Q: Pendo API is returning rate limit errors?
**A:**
1. Implement rate limiting in your code
2. Use caching with TanStack Query
3. Batch requests when possible
4. Check your Pendo subscription limits

### Q: Supabase connection issues?
**A:**
1. Verify Supabase URL and anon key in `.env`
2. Check Row Level Security policies
3. Ensure network allows Supabase connections
4. Test connection with Supabase client library

## 🤝 Contributing

### Q: How do I find issues to work on?
**A:**
1. Look for issues with "good first issue" label
2. Check issues with "help wanted" label
3. Filter by your expertise (frontend, backend, docs)
4. Ask maintainers for suggestions

### Q: What if I'm stuck on an issue?
**A:**
1. Check related issues and pull requests
2. Search documentation and code comments
3. Ask for help in GitHub discussions
4. Tag maintainers in comments for specific questions

### Q: How do I request code review?
**A:**
1. Submit your pull request with comprehensive description
2. Tag relevant maintainers using `@username`
3. Provide screenshots and testing results
4. Be responsive to review feedback

## 📈 Analytics

### Q: How do I access Pendo analytics data?
**A:**
```typescript
import { useGuideData } from '@/hooks/useSupabaseData';

const { data: guides, isLoading, error } = useGuideData(startDate, endDate);
```

### Q: What data is available from Pendo?
**A:**
- **Guides**: Onboarding guides and walkthroughs
- **Features**: Feature usage and adoption metrics
- **Pages**: Page views and navigation patterns
- **Events**: Custom events and user actions
- **Reports**: Aggregate analytics and insights

### Q: How do I create custom analytics visualizations?
**A:** Use Recharts library:
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const CustomChart = ({ data }) => (
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="value" stroke="#8884d8" />
  </LineChart>
);
```

## 🔗 External Services

### Q: How do I integrate with external analytics tools?
**A:**
1. Create Netlify Edge Functions for API integrations
2. Use environment variables for API keys
3. Implement proper error handling and retry logic
4. Add monitoring and logging

### Q: Can I use this with Google Analytics?
**A:** Yes, but ensure compliance with:
- Data privacy regulations
- Cookie consent requirements
- Pendo's terms of service
- Cin7's data governance policies

## 📞 Support

### Q: Where can I get more help?
**A:**
- **GitHub Issues**: Report bugs and request features
- **GitHub Discussions**: Ask questions and share ideas
- **Documentation**: Check README and component docs
- **Code Review**: Request reviews from maintainers

### Q: How do I report security issues?
**A:**
- **Critical Issues**: Use GitHub's "Security advisories"
- **General Security**: Create issue with "security" label
- **Emergencies**: Contact security@cin7.com directly

---

## 🎓 Learning Resources

### Q: Where can I learn more about the technologies used?
**A:**
- **React 19**: [React Documentation](https://react.dev/)
- **TypeScript**: [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- **Shopify Polaris**: [Polaris Documentation](https://polaris.shopify.com/)
- **TanStack Query**: [TanStack Query Docs](https://tanstack.com/query/latest/)
- **Supabase**: [Supabase Documentation](https://supabase.com/docs/)
- **Netlify**: [Netlify Docs](https://docs.netlify.com/)

### Q: Are there tutorials for this specific project?
**A:**
- **Component Development**: Check `frontend/COMPONENT_ENGINEERING.md`
- **API Integration**: Review pendop-client usage examples
- **Testing**: Look at existing test files for patterns
- **Deployment**: Check `netlify.toml` and deployment scripts

---

## 💡 Tips and Best Practices

### General Tips
- **Start Small**: Begin with small, focused changes
- **Test Early**: Write tests alongside code
- **Document**: Update docs as you develop
- **Review**: Review your own code before submitting
- **Communicate**: Ask questions and share progress

### Code Quality
- **Type Safety**: Use TypeScript properly
- **Performance**: Optimize for user experience
- **Accessibility**: Ensure WCAG compliance
- **Security**: Follow security best practices
- **Maintainability**: Write clean, readable code

### Collaboration
- **Be Respectful**: Treat everyone with respect
- **Be Helpful**: Assist others when possible
- **Be Patient**: Learning takes time
- **Be Constructive**: Provide helpful feedback
- **Be Professional**: Maintain professional conduct

---

*Have a question not covered here? [Open an issue](https://github.com/karoliang/cin7-pendo-api/issues/new/choose) or start a [discussion](https://github.com/karoliang/cin7-pendo-api/discussions)!*