import { useState, useCallback } from 'react';

/**
 * Custom hook for managing dialog/modal state
 * Provides convenient functions for opening, closing and toggling dialogs
 */
export const useDialog = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle
  };
};

export default useDialog;
