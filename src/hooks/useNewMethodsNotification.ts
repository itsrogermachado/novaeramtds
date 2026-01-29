import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const LAST_VIEWED_KEY = 'methods_last_viewed';

export function useNewMethodsNotification() {
  const [hasNewMethods, setHasNewMethods] = useState(false);
  const { user, isVip, isAdmin } = useAuth();

  const checkForNewMethods = useCallback(async () => {
    if (!user || (!isVip && !isAdmin)) {
      setHasNewMethods(false);
      return;
    }

    const lastViewed = localStorage.getItem(`${LAST_VIEWED_KEY}_${user.id}`);
    
    // Fetch the most recent method post
    const { data, error } = await supabase
      .from('method_posts')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      setHasNewMethods(false);
      return;
    }

    const latestPostTime = new Date(data.created_at).getTime();
    const lastViewedTime = lastViewed ? parseInt(lastViewed, 10) : 0;

    setHasNewMethods(latestPostTime > lastViewedTime);
  }, [user, isVip, isAdmin]);

  const markAsViewed = useCallback(() => {
    if (user) {
      localStorage.setItem(`${LAST_VIEWED_KEY}_${user.id}`, Date.now().toString());
      setHasNewMethods(false);
    }
  }, [user]);

  useEffect(() => {
    checkForNewMethods();
  }, [checkForNewMethods]);

  // Subscribe to realtime changes for new posts
  useEffect(() => {
    if (!user || (!isVip && !isAdmin)) return;

    const channel = supabase
      .channel('method_posts_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'method_posts',
        },
        () => {
          setHasNewMethods(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isVip, isAdmin]);

  return {
    hasNewMethods,
    markAsViewed,
    checkForNewMethods,
  };
}
