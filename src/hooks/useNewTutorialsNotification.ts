import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const LAST_VIEWED_KEY = 'tutorials_last_viewed';

export function useNewTutorialsNotification() {
  const [hasNewTutorials, setHasNewTutorials] = useState(false);
  const { user } = useAuth();

  const checkForNewTutorials = useCallback(async () => {
    if (!user) {
      setHasNewTutorials(false);
      return;
    }

    const lastViewed = localStorage.getItem(`${LAST_VIEWED_KEY}_${user.id}`);
    
    // Fetch the most recent tutorial
    const { data, error } = await supabase
      .from('tutorials')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      setHasNewTutorials(false);
      return;
    }

    const latestTutorialTime = new Date(data.created_at).getTime();
    const lastViewedTime = lastViewed ? parseInt(lastViewed, 10) : 0;

    setHasNewTutorials(latestTutorialTime > lastViewedTime);
  }, [user]);

  const markAsViewed = useCallback(() => {
    if (user) {
      localStorage.setItem(`${LAST_VIEWED_KEY}_${user.id}`, Date.now().toString());
      setHasNewTutorials(false);
    }
  }, [user]);

  useEffect(() => {
    checkForNewTutorials();
  }, [checkForNewTutorials]);

  // Subscribe to realtime changes for new tutorials
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('tutorials_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tutorials',
        },
        () => {
          setHasNewTutorials(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    hasNewTutorials,
    markAsViewed,
    checkForNewTutorials,
  };
}
