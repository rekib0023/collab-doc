import { useCallback } from 'react';
import { useToast as useToastUI, ToastVariant } from '@/components/ui/toast';

/**
 * Custom hook for consistent toast notifications throughout the app
 * Provides convenient methods for different types of notifications
 */
export const useToast = () => {
  const { addToast } = useToastUI();
  
  const showToast = useCallback((
    title: string, 
    description?: string, 
    variant: ToastVariant = 'default'
  ) => {
    addToast({
      title,
      description,
      variant,
      // Default duration is 5000ms (5 seconds)
      // Can be adjusted based on message importance
      duration: variant === 'error' ? 7000 : 5000,
    });
  }, [addToast]);
  
  // Convenience methods for different toast types
  const success = useCallback((title: string, description?: string) => {
    showToast(title, description, 'success');
  }, [showToast]);
  
  const error = useCallback((title: string, description?: string) => {
    showToast(title, description, 'error');
  }, [showToast]);
  
  const warning = useCallback((title: string, description?: string) => {
    showToast(title, description, 'warning');
  }, [showToast]);
  
  const info = useCallback((title: string, description?: string) => {
    showToast(title, description, 'info');
  }, [showToast]);

  return {
    showToast,
    success,
    error,
    warning,
    info
  };
};

export default useToast;
