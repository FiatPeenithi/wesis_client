import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import api from '../lib/api';

export function useUnreadCount() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const userId = user?.id ?? null;

  const fetchCount = useCallback(() => {
    if (!userId) return Promise.resolve();
    return api
      .get(`/notifications/user/${userId}/unread-count`)
      .then((res) => {
        setUnread(res.data.data.count ?? 0);
      })
      .catch(() => {
        setUnread(0);
      });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    api
      .get(`/notifications/user/${userId}/unread-count`)
      .then((res) => {
        if (active) setUnread(res.data.data.count ?? 0);
      })
      .catch(() => {
        if (active) setUnread(0);
      });
    return () => {
      active = false;
    };
  }, [userId, location.pathname]);

  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount, userId]);

  return { unread, refresh: fetchCount };
}
