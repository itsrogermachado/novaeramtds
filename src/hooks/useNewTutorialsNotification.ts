import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const LAST_VIEWED_KEY = 'tutorials_last_viewed';

export function useNewTutorialsNotification() {
  const [newTutorialsCount, setNewTutorialsCount] = useState(0);
  const { user } = useAuth();

  const checkForNewTutorials = useCallback(async () => {
    if (!user) {
      setNewTutorialsCount(0);
      return;
    }

    const lastViewed = localStorage.getItem(`${LAST_VIEWED_KEY}_${user.id}`);
    const lastViewedTime = lastViewed ? parseInt(lastViewed, 10) : 0;
    const lastViewedDate = new Date(lastViewedTime).toISOString();
    
    // Count new tutorials since last viewed
    const { count, error } = await supabase
      .from('tutorials')
      .select('*', { count: 'exact', head: true })
      .gt('created_at', lastViewedDate);

    if (error) {
      setNewTutorialsCount(0);
      return;
    }

    setNewTutorialsCount(count || 0);
  }, [user]);

  const markAsViewed = useCallback(() => {
    if (user) {
      localStorage.setItem(`${LAST_VIEWED_KEY}_${user.id}`, Date.now().toString());
      setNewTutorialsCount(0);
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
          setNewTutorialsCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    newTutorialsCount,
    hasNewTutorials: newTutorialsCount > 0,
    markAsViewed,
    checkForNewTutorials,
  };
}
