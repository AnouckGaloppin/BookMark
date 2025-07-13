import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setProgress } from './progressSlice';
import { progressSync, ProgressUpdateMessage, ProgressSyncMessage, ProgressSyncResponse } from './crossTabSync';

export function useCrossTabSync() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Listen for progress updates from other tabs
    progressSync.onMessage((message: ProgressUpdateMessage | ProgressSyncMessage | ProgressSyncResponse) => {
      console.log('📡 Cross-tab: Received progress update from other tab:', message);
      
      if (message.type === 'PROGRESS_UPDATE') {
        // Update Redux state with the progress from other tab
        dispatch(setProgress({ 
          bookId: message.bookId, 
          pages: message.pages 
        }));
        console.log('🔄 Cross-tab: Updated Redux state with progress from other tab');
      }
    });

    // Cleanup on unmount
    return () => {
      // Note: We don't close the channel here as it might be used by other components
    };
  }, [dispatch]);
} 