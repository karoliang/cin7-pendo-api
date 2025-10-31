import { Navigation } from '@/components/layout/Navigation';
import { Cin7Button } from '@/components/polaris/Cin7Button';
import { Page, Layout as PolarisLayout } from '@shopify/polaris';

interface LayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, showNavigation = false }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Pendo Analytics Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Cin7Button variant="outline">Export</Cin7Button>
              <Cin7Button>Refresh</Cin7Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      {showNavigation && <Navigation />}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500">
            Pendo Analytics Dashboard - Real-time insights and reporting
          </div>
        </div>
      </footer>
    </div>
  );
};