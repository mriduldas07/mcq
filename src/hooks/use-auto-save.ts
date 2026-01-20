"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useDebounce } from './use-debounce';

interface UseAutoSaveOptions {
  data: any;
  onSave: (data: any) => Promise<void>;
  interval?: number;
  enabled?: boolean;
}

export function useAutoSave({
  data,
  onSave,
  interval = 3000,
  enabled = true,
}: UseAutoSaveOptions) {
  const debouncedData = useDebounce(data, interval);
  const previousDataRef = useRef(data);
  const isSavingRef = useRef(false);

  useEffect(() => {
    const saveData = async () => {
      if (!enabled || isSavingRef.current) return;
      
      // Only save if data actually changed
      if (JSON.stringify(debouncedData) === JSON.stringify(previousDataRef.current)) {
        return;
      }

      isSavingRef.current = true;
      
      try {
        await onSave(debouncedData);
        previousDataRef.current = debouncedData;
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        isSavingRef.current = false;
      }
    };

    saveData();
  }, [debouncedData, onSave, enabled]);

  return { isSaving: isSavingRef.current };
}
