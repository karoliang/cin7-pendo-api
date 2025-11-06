import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  Page,
  Card,
  Button,
  Text,
  BlockStack,
  InlineStack,
  Icon,
  Banner
} from '@shopify/polaris';
import { LockIcon } from '@shopify/polaris-icons';

export const Login: React.FC = () => {
  const { user, loading, signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // If user is already authenticated, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (err) {
      console.error('Error during sign in:', err);
      setError('Failed to sign in with Google. Please try again.');
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <Page>
        <div className="flex items-center justify-center min-h-screen">
          <Text as="p" variant="bodyLg">Loading...</Text>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md px-4">
          <BlockStack gap="600">
            {/* Logo and Title */}
            <div className="text-center">
              <BlockStack gap="400">
                <div className="flex justify-center">
                  <div className="p-4 bg-[var(--cin7-hept-blue,#0033A0)] rounded-full">
                    <Icon source={LockIcon} tone="base" />
                  </div>
                </div>
                <BlockStack gap="200">
                  <Text as="h1" variant="heading2xl" alignment="center">
                    Cin7 Pendo Analytics
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                    Sign in with your Cin7 Google account
                  </Text>
                </BlockStack>
              </BlockStack>
            </div>

            {/* Login Card */}
            <Card>
              <BlockStack gap="400">
                {error && (
                  <Banner tone="critical" onDismiss={() => setError(null)}>
                    {error}
                  </Banner>
                )}

                <BlockStack gap="300">
                  <Text as="p" variant="bodyMd" alignment="center">
                    Only @cin7.com email addresses are allowed
                  </Text>

                  <Button
                    variant="primary"
                    size="large"
                    onClick={handleGoogleSignIn}
                    loading={isSigningIn}
                    fullWidth
                  >
                    Sign in with Google
                  </Button>
                </BlockStack>

                <div className="pt-4 border-t border-gray-200">
                  <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                    By signing in, you agree to our terms of service and privacy policy
                  </Text>
                </div>
              </BlockStack>
            </Card>

            {/* Footer */}
            <div className="text-center">
              <Text as="p" variant="bodySm" tone="subdued">
                Need help? Contact your IT administrator
              </Text>
            </div>
          </BlockStack>
        </div>
      </div>
    </Page>
  );
};

export default Login;
