import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PolarisProvider } from '@/components/polaris/PolarisProvider'
import { pendoAPI } from '@/lib/pendo-api'
import '@shopify/polaris/build/esm/styles.css'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
  },
})

// Expose test helper for debugging aggregation API in console
if (typeof window !== 'undefined') {
  (window as any).testPendoAggregation = async () => {
    console.log('🧪 Running Pendo Aggregation API Test...');
    const result = await pendoAPI.testAggregationAPI();
    if (result) {
      console.log('✅ Test passed! Aggregation API is accessible.');
    } else {
      console.log('❌ Test failed! Check console logs above for details.');
    }
    return result;
  };
  console.log('💡 Debug helper available: Run window.testPendoAggregation() in console to test aggregation API');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PolarisProvider>
        <QueryClientProvider client={queryClient}>
          <App />
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </PolarisProvider>
    </BrowserRouter>
  </StrictMode>,
)
