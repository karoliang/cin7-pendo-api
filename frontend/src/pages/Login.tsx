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
                    <InlineStack gap="200" blockAlign="center">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.20454Z" fill="#4285F4"/>
                        <path d="M8.99999 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 8.99999 14.4204C6.65589 14.4204 4.67181 12.8372 3.96408 10.71H0.957275V13.0418C2.43817 15.9831 5.48181 18 8.99999 18Z" fill="#34A853"/>
                        <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957273C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
                        <path d="M8.99999 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 8.99999 0C5.48181 0 2.43817 2.01682 0.957275 4.95818L3.96408 7.29C4.67181 5.16273 6.65589 3.57955 8.99999 3.57955Z" fill="#EA4335"/>
                      </svg>
                      <Text as="span">Sign in with Google</Text>
                    </InlineStack>
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
