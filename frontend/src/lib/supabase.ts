import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Database types for type-safe queries
export type Database = {
  public: {
    Tables: {
      pendo_guides: {
        Row: {
          id: string;
          name: string;
          state: string;
          created_at: string;
          last_updated_at: string;
          views: number;
          completions: number;
          completion_rate: number;
          avg_time_to_complete: number;
          steps: number;
          last_synced: string;
        };
        Insert: Omit<Database['public']['Tables']['pendo_guides']['Row'], 'last_synced'>;
        Update: Partial<Database['public']['Tables']['pendo_guides']['Insert']>;
      };
      pendo_features: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          last_updated_at: string;
          usage_count: number;
          unique_users: number;
          avg_usage_per_user: number;
          last_synced: string;
        };
        Insert: Omit<Database['public']['Tables']['pendo_features']['Row'], 'last_synced'>;
        Update: Partial<Database['public']['Tables']['pendo_features']['Insert']>;
      };
      pendo_pages: {
        Row: {
          id: string;
          name: string;
          url: string;
          created_at: string;
          last_updated_at: string;
          views: number;
          unique_visitors: number;
          avg_time_on_page: number;
          bounce_rate: number;
          last_synced: string;
        };
        Insert: Omit<Database['public']['Tables']['pendo_pages']['Row'], 'last_synced'>;
        Update: Partial<Database['public']['Tables']['pendo_pages']['Insert']>;
      };
      pendo_reports: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          last_success_run_at: string | null;
          configuration: any;
          created_at: string;
          last_updated_at: string;
          last_synced: string;
        };
        Insert: Omit<Database['public']['Tables']['pendo_reports']['Row'], 'last_synced'>;
        Update: Partial<Database['public']['Tables']['pendo_reports']['Insert']>;
      };
      pendo_events: {
        Row: {
          id: string;
          event_type: string;
          entity_id: string;
          entity_type: string;
          visitor_id: string;
          account_id: string;
          browser_time: string;
          remote_ip: string;
          user_agent: string;
          country: string;
          region: string;
          city: string;
          metadata: any;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pendo_events']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['pendo_events']['Insert']>;
      };
    };
  };
};

// Helper function to check authentication status
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return data.session;
};

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return data.user;
};

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Helper function to sign in with Google
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
        hd: 'cin7.com', // Restrict to cin7.com domain
      },
    },
  });

  if (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }

  return data;
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};
