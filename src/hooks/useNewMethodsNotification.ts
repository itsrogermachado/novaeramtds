import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const LAST_VIEWED_KEY = 'methods_last_viewed';

export function useNewMethodsNotification() {
  const [newMethodsCount, setNewMethodsCount] = useState(0);
  const { user } = useAuth();

  const checkForNewMethods = useCallback(async () => {
    if (!user) {
      setNewMethodsCount(0);
      return;
    }

    const lastViewed = localStorage.getItem(`${LAST_VIEWED_KEY}_${user.id}`);
    const lastViewedTime = lastViewed ? parseInt(lastViewed, 10) : 0;
    const lastViewedDate = new Date(lastViewedTime).toISOString();
    
    // Count new method posts since last viewed
    const { count, error } = await supabase
      .from('method_posts')
      .select('*', { count: 'exact', head: true })
      .gt('created_at', lastViewedDate);

    if (error) {
      setNewMethodsCount(0);
      return;
    }

    setNewMethodsCount(count || 0);
  }, [user]);

  const markAsViewed = useCallback(() => {
    if (user) {
      localStorage.setItem(`${LAST_VIEWED_KEY}_${user.id}`, Date.now().toString());
      setNewMethodsCount(0);
    }
  }, [user]);

  useEffect(() => {
    checkForNewMethods();
  }, [checkForNewMethods]);

  // Subscribe to realtime changes for new posts
  useEffect(() => {
    if (!user) return;

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
          setNewMethodsCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    newMethodsCount,
    hasNewMethods: newMethodsCount > 0,
    markAsViewed,
    checkForNewMethods,
  };
}
