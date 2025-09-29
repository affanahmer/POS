import { useState, useEffect } from 'react';
import { syncService } from '../services/syncService';
import NetInfo from '@react-native-community/netinfo';

// Custom hook for sync functionality
export const useSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const [syncError, setSyncError] = useState(null);

  useEffect(() => {
    // Monitor network connectivity
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });

    return () => unsubscribe();
  }, []);

  const performSync = async (showProgress = false) => {
    if (isSyncing) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      let result;
      if (showProgress) {
        result = await syncService.syncAllWithProgress(progress => {
          console.log(`Sync progress: ${progress.current}/${progress.total}`);
        });
      } else {
        result = await syncService.syncAll();
      }

      if (result.success) {
        setLastSync(new Date().toISOString());
        return result;
      } else {
        setSyncError(result.error || 'Sync failed');
        return result;
      }
    } catch (error) {
      console.error('Sync error:', error);
      setSyncError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsSyncing(false);
    }
  };

  const getSyncStatus = async () => {
    try {
      return await syncService.getSyncStatus();
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        isOnline: false,
        pendingCount: 0,
        lastSync: null,
      };
    }
  };

  return {
    isSyncing,
    isOnline,
    lastSync,
    syncError,
    performSync,
    getSyncStatus,
  };
};