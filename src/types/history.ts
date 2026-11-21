export type HistoryEventType =
  | 'POST_CREATE'
  | 'POST_UPDATE'
  | 'POST_DELETE'
  | 'POST_FEATURE'
  | 'POST_DUPLICATE'
  | 'CATEGORY_ADD'
  | 'CATEGORY_DELETE'
  | 'CATEGORY_RENAME'
  | 'CATEGORY_REORDER'
  | 'CATEGORY_RESET'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_UPDATE'
  | 'DB_TEST'
  | 'CACHE_CLEAR'
  | 'SYSTEM_RESTORE'
  | 'BACKUP_EXPORT'
  | 'BACKUP_IMPORT'
  | 'ADMIN_ACTION';

export type HistoryEventLevel = 'info' | 'success' | 'warning' | 'error';

export interface HistoryEvent {
  id: string;
  type: HistoryEventType;
  title: string;
  description: string;
  actor: string;
  timestamp: string;
  level: HistoryEventLevel;
  targetId?: string;
  details?: Record<string, any>;
}
