import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Page, Text } from '@shopify/polaris';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if we have a session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          navigate('/login', { replace: true });
          return;
        }

        if (session) {
          // Validate email domain
          if (session.user.email && !session.user.email.endsWith('@cin7.com')) {
            console.error('Invalid email domain. Only @cin7.com emails are allowed.');
            await supabase.auth.signOut();
            navigate('/login', { replace: true });
            return;
          }

          // Successful authentication
          console.log('Authentication successful');
          navigate('/dashboard', { replace: true });
        } else {
          // No session found
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        navigate('/login', { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <Page>
      <div className="flex items-center justify-center min-h-screen">
        <Text as="p" variant="bodyLg">Completing sign in...</Text>
      </div>
    </Page>
  );
};

export default AuthCallback;
