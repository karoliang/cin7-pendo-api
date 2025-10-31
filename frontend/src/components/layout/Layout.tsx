import { Navigation } from '@/components/layout/Navigation';
import { Page, BlockStack, InlineStack, Text } from '@shopify/polaris';

interface LayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  title?: string;
  subtitle?: string;
  primaryAction?: {
    content: string;
    onAction: () => void;
  };
  secondaryActions?: Array<{
    content: string;
    onAction: () => void;
  }>;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  showNavigation = false,
  title,
  subtitle,
  primaryAction,
  secondaryActions
}) => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--p-color-bg)' }}>
      {/* App Header - Brand Banner */}
      <div style={{
        backgroundColor: 'var(--cin7-hept-blue, #0033A0)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        color: 'white'
      }}>
        <div className="mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: '1600px' }}>
          <div className="flex justify-between items-center h-14">
            <InlineStack gap="300" blockAlign="center">
              <h1 className="text-xl font-semibold">
                Pendo Analytics Dashboard
              </h1>
            </InlineStack>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      {showNavigation && (
        <div style={{
          backgroundColor: 'var(--p-color-bg-surface)',
          borderBottom: '1px solid var(--p-color-border)'
        }}>
          <Navigation />
        </div>
      )}

      {/* Main Content with Polaris Page */}
      <div className="mx-auto" style={{ maxWidth: '1600px' }}>
        {title ? (
          <Page
            title={title}
            subtitle={subtitle}
            primaryAction={primaryAction}
            secondaryActions={secondaryActions}
          >
            {children}
          </Page>
        ) : (
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{
        backgroundColor: 'var(--p-color-bg-surface)',
        borderTop: '1px solid var(--p-color-border)',
        marginTop: 'auto'
      }}>
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4" style={{ maxWidth: '1600px' }}>
          <div className="text-center">
            <Text as="p" variant="bodySm" tone="subdued">
              Pendo Analytics Dashboard - Real-time insights and reporting
            </Text>
          </div>
        </div>
      </footer>
    </div>
  );
};