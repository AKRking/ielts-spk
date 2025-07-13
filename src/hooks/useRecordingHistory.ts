import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserRecording } from '../types';

export const useRecordingHistory = (questionId: string) => {
  const [recordings, setRecordings] = useState<UserRecording[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (questionId) {
      fetchRecordings();
    }
  }, [questionId]);

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('user_recordings')
        .select('*')
        .eq('question_id', questionId)
        .order('created_at', { ascending: false })
        .limit(5); // Show last 5 recordings

      if (fetchError) throw fetchError;
      
      setRecordings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recordings');
    } finally {
      setLoading(false);
    }
  };

  const addRecording = (recording: UserRecording) => {
    setRecordings(prev => [recording, ...prev.slice(0, 4)]); // Keep only 5 most recent
  };

  return {
    recordings,
    loading,
    error,
    refetch: fetchRecordings,
    addRecording,
  };
};