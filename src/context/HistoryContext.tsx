import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HistoryEvent, HistoryEventType, HistoryEventLevel } from '../types/history';

interface HistoryContextType {
  historyEvents: HistoryEvent[];
  addHistoryEvent: (event: {
    type: HistoryEventType;
    title: string;
    description: string;
    actor?: string;
    level?: HistoryEventLevel;
    targetId?: string;
    details?: Record<string, any>;
  }) => Promise<void>;
  clearHistory: () => Promise<void>;
  deleteHistoryEvent: (id: string) => Promise<void>;
  exportHistoryJson: () => string;
}

const HistoryContext = createContext<HistoryContextType | null>(null);

const HISTORY_STORAGE_KEY = '@app_blog_admin_history_v1';

// Seed events demonstrating rich initial activity
const INITIAL_HISTORY: HistoryEvent[] = [
  {
    id: 'hist-seed-1',
    type: 'ADMIN_ACTION',
    title: 'Admin Console Initialized',
    description: 'Chronicle Admin Console and Full Control permissions granted.',
    actor: 'System Admin',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    level: 'success',
    details: { environment: 'Production / Local Hybrid', version: '2.4.0' },
  },
  {
    id: 'hist-seed-2',
    type: 'DB_TEST',
    title: 'Database Health Check Executed',
    description: 'Verified Supabase connection and PostgreSQL table status.',
    actor: 'System',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    level: 'info',
    details: { endpoint: 'ftpwzsyajenwjfgoddwy.supabase.co', status: 'Healthy' },
  },
  {
    id: 'hist-seed-3',
    type: 'POST_FEATURE',
    title: 'Post Featured',
    description: 'Marked "The Architectural Shift in Mobile Intelligence" as Featured Hero Story.',
    actor: 'Elena Vance (Admin)',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    level: 'info',
    targetId: 'post-1',
    details: { category: 'AI & Tech', likes: 384 },
  },
  {
    id: 'hist-seed-4',
    type: 'CATEGORY_ADD',
    title: 'Category Initialized',
    description: 'Editorial categories configured: AI & Tech, Design, Engineering, Culture, Business.',
    actor: 'Admin',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    level: 'success',
  },
];

export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [historyEvents, setHistoryEvents] = useState<HistoryEvent[]>(INITIAL_HISTORY);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setHistoryEvents(parsed);
          }
        }
      } catch (err) {
        console.warn('Failed to load history events from AsyncStorage', err);
      }
    })();
  }, []);

  const saveEvents = async (events: HistoryEvent[]) => {
    try {
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(events));
    } catch (err) {
      console.warn('Failed to save history events', err);
    }
  };

  const addHistoryEvent = useCallback(
    async (eventData: {
      type: HistoryEventType;
      title: string;
      description: string;
      actor?: string;
      level?: HistoryEventLevel;
      targetId?: string;
      details?: Record<string, any>;
    }) => {
      const newEvent: HistoryEvent = {
        id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: eventData.type,
        title: eventData.title,
        description: eventData.description,
        actor: eventData.actor || 'Admin',
        timestamp: new Date().toISOString(),
        level: eventData.level || 'info',
        targetId: eventData.targetId,
        details: eventData.details,
      };

      setHistoryEvents((prev) => {
        const updated = [newEvent, ...prev];
        saveEvents(updated);
        return updated;
      });
    },
    []
  );

  const clearHistory = async () => {
    setHistoryEvents([]);
    try {
      await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (err) {
      console.warn('Failed to clear history events', err);
    }
  };

  const deleteHistoryEvent = async (id: string) => {
    setHistoryEvents((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      saveEvents(updated);
      return updated;
    });
  };

  const exportHistoryJson = (): string => {
    return JSON.stringify(historyEvents, null, 2);
  };

  return (
    <HistoryContext.Provider
      value={{
        historyEvents,
        addHistoryEvent,
        clearHistory,
        deleteHistoryEvent,
        exportHistoryJson,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
};
