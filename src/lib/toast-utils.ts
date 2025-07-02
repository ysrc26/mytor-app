// src/lib/toast-utils.ts

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  duration?: number; // במילישניות, ברירת מחדל 4000
  position?: 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right';
  dismissible?: boolean; // האם להציג כפתור X
  persistent?: boolean; // האם להשאיר עד לחיצה ידנית
}

/**
 * מחלקה לניהול Toast notifications
 * מספקת interface נקי וגמיש להצגת הודעות למשתמש
 */
export class ToastManager {
  private static instance: ToastManager;
  private toastContainer: HTMLElement | null = null;
  private toastCounter = 0;

  private constructor() {
    this.createContainer();
  }

  static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  /**
   * יצירת container עבור הtoasts
   */
  private createContainer() {
    if (typeof window === 'undefined') return;

    this.toastContainer = document.createElement('div');
    this.toastContainer.id = 'toast-container';
    this.toastContainer.className = 'fixed top-6 left-1/2 transform -translate-x-1/2 z-[200] space-y-3 pointer-events-none';
    this.toastContainer.setAttribute('aria-live', 'polite');
    this.toastContainer.setAttribute('aria-atomic', 'false');
    
    document.body.appendChild(this.toastContainer);
  }

  /**
   * הצגת toast notification
   */
  show(message: string, type: ToastType = 'success', options: ToastOptions = {}): void {
    if (typeof window === 'undefined') return;

    const {
      duration = 4000,
      position = 'top-center',
      dismissible = true,
      persistent = false
    } = options;

    const toast = this.createToastElement(message, type, dismissible);
    const toastId = ++this.toastCounter;
    toast.setAttribute('data-toast-id', toastId.toString());

    this.addToastToContainer(toast, position);
    this.animateToastIn(toast);

    // הסרה אוטומטית אם לא persistent
    if (!persistent) {
      setTimeout(() => {
        this.removeToast(toast);
      }, duration);
    }

    // הוספת event listener לכפתור סגירה
    if (dismissible) {
      const closeButton = toast.querySelector('[data-toast-close]');
      closeButton?.addEventListener('click', () => {
        this.removeToast(toast);
      });
    }

    // accessibility - קריאת הודעה לscreen readers
    this.announceToScreenReader(message, type);
  }

  /**
   * יצירת אלמנט הtoast
   */
  private createToastElement(message: string, type: ToastType, dismissible: boolean): HTMLElement {
    const toast = document.createElement('div');
    
    const styles = this.getToastStyles(type);
    const icon = this.getToastIcon(type);
    
    toast.className = `
      px-6 py-4 rounded-2xl shadow-2xl font-medium transition-all duration-300 
      flex items-center gap-3 min-w-80 max-w-md pointer-events-auto
      ${styles}
    `;

    toast.innerHTML = `
      <span class="text-xl flex-shrink-0" role="img" aria-hidden="true">${icon}</span>
      <span class="flex-1 text-center break-words">${this.escapeHtml(message)}</span>
      ${dismissible ? `
        <button 
          class="text-white/80 hover:text-white transition-colors ml-2 flex-shrink-0 p-1 rounded hover:bg-white/10" 
          data-toast-close
          aria-label="סגור הודעה"
          type="button"
        >
          ✕
        </button>
      ` : ''}
    `;

    // הוספת attributes לaccessibility
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

    return toast;
  }

  /**
   * קבלת סגנונות לפי סוג הtoast
   */
  private getToastStyles(type: ToastType): string {
    const styles = {
      success: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
      error: 'bg-gradient-to-r from-red-500 to-rose-500 text-white',
      warning: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white',
      info: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
    };
    return styles[type];
  }

  /**
   * קבלת אייקון לפי סוג הtoast
   */
  private getToastIcon(type: ToastType): string {
    const icons = {
      success: '🎉',
      error: '❌', 
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type];
  }

  /**
   * הוספת toast לcontainer
   */
  private addToastToContainer(toast: HTMLElement, position: string): void {
    if (!this.toastContainer) {
      this.createContainer();
    }

    // עדכון מיקום container לפי position
    this.updateContainerPosition(position);
    
    this.toastContainer?.appendChild(toast);
  }

  /**
   * עדכון מיקום הcontainer
   */
  private updateContainerPosition(position: string): void {
    if (!this.toastContainer) return;

    const positionClasses = {
      'top-center': 'fixed top-6 left-1/2 transform -translate-x-1/2',
      'top-right': 'fixed top-6 right-6',
      'bottom-center': 'fixed bottom-6 left-1/2 transform -translate-x-1/2',
      'bottom-right': 'fixed bottom-6 right-6'
    };

    this.toastContainer.className = `${positionClasses[position as keyof typeof positionClasses]} z-[200] space-y-3 pointer-events-none`;
  }

  /**
   * אנימציה להופעת הtoast
   */
  private animateToastIn(toast: HTMLElement): void {
    // התחל מחוץ למסך
    toast.style.transform = 'translate(0, -100px)';
    toast.style.opacity = '0';

    // אנימציה להופעה
    requestAnimationFrame(() => {
      toast.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      toast.style.transform = 'translate(0, 0)';
      toast.style.opacity = '1';
    });
  }

  /**
   * הסרת toast עם אנימציה
   */
  private removeToast(toast: HTMLElement): void {
    if (!toast.parentNode) return;

    toast.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    toast.style.transform = 'translate(0, -100px)';
    toast.style.opacity = '0';

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  /**
   * הכרזה לscreen readers
   */
  private announceToScreenReader(message: string, type: ToastType): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `${type === 'error' ? 'שגיאה: ' : ''}${message}`;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  /**
   * escape HTML לביטחון
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * הסרת כל הtoasts
   */
  clearAll(): void {
    if (!this.toastContainer) return;
    
    const toasts = this.toastContainer.querySelectorAll('[data-toast-id]');
    toasts.forEach(toast => {
      this.removeToast(toast as HTMLElement);
    });
  }
}

// ===================================
// 🎯 Helper functions לשימוש קל
// ===================================

const toastManager = ToastManager.getInstance();

/**
 * הצגת toast הצלחה
 */
export const showSuccessToast = (message: string, options?: ToastOptions) => {
  toastManager.show(message, 'success', options);
};

/**
 * הצגת toast שגיאה
 */
export const showErrorToast = (message: string, options?: ToastOptions) => {
  toastManager.show(message, 'error', options);
};

/**
 * הצגת toast מידע
 */
export const showInfoToast = (message: string, options?: ToastOptions) => {
  toastManager.show(message, 'info', options);
};

/**
 * הצגת toast אזהרה
 */
export const showWarningToast = (message: string, options?: ToastOptions) => {
  toastManager.show(message, 'warning', options);
};

/**
 * פונקציה כללית להצגת toast
 */
export const showToast = (message: string, type: ToastType = 'success', options?: ToastOptions) => {
  toastManager.show(message, type, options);
};

/**
 * הסרת כל הtoasts
 */
export const clearAllToasts = () => {
  toastManager.clearAll();
};

// ===================================
// 🎯 Toast presets לשימושים נפוצים
// ===================================

export const ToastPresets = {
  /**
   * הודעת שמירה מוצלחת
   */
  saved: (itemName = 'הפריט') => 
    showSuccessToast(`${itemName} נשמר בהצלחה`),

  /**
   * הודעת מחיקה מוצלחת
   */
  deleted: (itemName = 'הפריט') => 
    showSuccessToast(`${itemName} נמחק בהצלחה`),

  /**
   * הודעת עדכון מוצלח
   */
  updated: (itemName = 'הפריט') => 
    showSuccessToast(`${itemName} עודכן בהצלחה`),

  /**
   * הודעת שגיאת רשת
   */
  networkError: () => 
    showErrorToast('שגיאת רשת - בדוק את החיבור לאינטרנט'),

  /**
   * הודעת שגיאת הרשאות
   */
  permissionError: () => 
    showErrorToast('אין לך הרשאה לבצע פעולה זו'),

  /**
   * הודעת טעינה
   */
  loading: (message = 'טוען...') => 
    showInfoToast(message, { persistent: true }),

  /**
   * הודעת העתקה ללוח
   */
  copied: () => 
    showSuccessToast('הועתק ללוח!', { duration: 2000 }),

  /**
   * הודעת שדות חסרים
   */
  missingFields: () => 
    showErrorToast('יש למלא את כל השדות הנדרשים'),

  /**
   * הודעת פעולה בוטלה
   */
  cancelled: () => 
    showInfoToast('הפעולה בוטלה', { duration: 2000 })
};