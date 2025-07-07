// src/components/dashboard/AppointmentsControls.tsx
import React from 'react';
import { ChevronDown, ChevronUp, RotateCcw, Users, Clock, TrendingUp } from 'lucide-react';

interface AppointmentsControlsProps {
  // מצב נתונים
  totalCount: number;
  showingCount: number;
  pagination: {
    current_page: number;
    limit: number;
    total_count: number;
    total_pages: number;
    has_more: boolean;
  };
  
  // מצבי טעינה
  loading: boolean;
  loadingMore: boolean;
  
  // טווח תאריכים נוכחי
  dateRange: { start?: string; end?: string };
  
  // פעולות
  onLoadMore: () => void;
  onLoadPrevious: () => void;
  onRefresh: () => void;
  canLoadPrevious?: boolean;
  
  className?: string;
}

export const AppointmentsControls: React.FC<AppointmentsControlsProps> = ({
  totalCount,
  showingCount,
  pagination,
  loading,
  loadingMore,
  dateRange,
  onLoadMore,
  onLoadPrevious,
  onRefresh,
  canLoadPrevious = true,
  className = ''
}) => {

  // פורמט תצוגה של תאריך
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  // טקסט טווח התאריכים
  const getDateRangeText = (): string => {
    if (!dateRange.start && !dateRange.end) return 'כל התורים';
    if (dateRange.start && dateRange.end) {
      if (dateRange.start === dateRange.end) {
        return formatDate(dateRange.start);
      }
      return `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
    }
    if (dateRange.start) return `מ-${formatDate(dateRange.start)}`;
    if (dateRange.end) return `עד ${formatDate(dateRange.end)}`;
    return 'כל התורים';
  };

  // אינדיקטור טעינה עם הודעה
  const LoadingIndicator: React.FC<{ 
    isLoading: boolean; 
    message: string; 
    isMore?: boolean 
  }> = ({ isLoading, message, isMore = false }) => {
    if (!isLoading) return null;
    
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
        isMore ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600'
      }`}>
        <div className="animate-spin">
          <Clock className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium">{message}</span>
      </div>
    );
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 space-y-4 ${className}`}>
      
      {/* שורה עליונה - סטטיסטיקות ורענון */}
      <div className="flex items-center justify-between">
        
        {/* סטטיסטיקות */}
        <div className="flex items-center gap-4">
          
          {/* מונה תורים */}
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-900">
              מציג {showingCount.toLocaleString('he-IL')} 
            </span>
            {pagination.total_count > showingCount && (
              <span className="text-gray-500">
                מתוך {pagination.total_count.toLocaleString('he-IL')}
              </span>
            )}
          </div>

          {/* טווח תאריכים */}
          {(dateRange.start || dateRange.end) && (
            <div className="flex items-center gap-2 text-sm text-gray-600 border-r pr-4">
              <Clock className="h-4 w-4" />
              <span>{getDateRangeText()}</span>
            </div>
          )}

          {/* אחוז מהכל */}
          {pagination.total_count > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <TrendingUp className="h-4 w-4" />
              <span>
                {Math.round((showingCount / pagination.total_count) * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* כפתור רענון */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="רענון נתונים"
        >
          <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          רענון
        </button>
      </div>

      {/* אינדיקטורי טעינה */}
      <div className="space-y-2">
        <LoadingIndicator 
          isLoading={loading} 
          message="טוען תורים..." 
        />
        <LoadingIndicator 
          isLoading={loadingMore} 
          message="טוען עוד תורים..." 
          isMore={true}
        />
      </div>

      {/* כפתורי פעולה */}
      {!loading && (
        <div className="flex items-center gap-3">
          
          {/* טען תורים קודמים */}
          {canLoadPrevious && (
            <button
              onClick={onLoadPrevious}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
            >
              <ChevronUp className="h-4 w-4" />
              טען תורים קודמים
            </button>
          )}

          {/* טען עוד תורים */}
          {pagination.has_more && (
            <button
              onClick={onLoadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed"
            >
              <ChevronDown className="h-4 w-4" />
              {loadingMore ? 'טוען...' : `טען עוד תורים (${pagination.total_count - showingCount})`}
            </button>
          )}

          {/* הודעה אם אין עוד תורים */}
          {!pagination.has_more && showingCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              נטענו כל התורים
            </div>
          )}
        </div>
      )}

      {/* מידע נוסף למפתחים (רק בדיבאג) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="text-xs text-gray-400 border-t pt-2">
          <summary className="cursor-pointer hover:text-gray-600">פרטים טכניים</summary>
          <div className="mt-1 space-y-1">
            <div>עמוד נוכחי: {pagination.current_page}/{pagination.total_pages}</div>
            <div>תורים בעמוד: {pagination.limit}</div>
            <div>סה"כ תורים בDB: {pagination.total_count}</div>
            <div>תורים בזיכרון: {showingCount}</div>
          </div>
        </details>
      )}
    </div>
  );
};