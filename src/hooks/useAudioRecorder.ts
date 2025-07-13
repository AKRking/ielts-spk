import { useState, useRef, useCallback } from 'react';
import { RecordingState } from '../types';

export const useAudioRecorder = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioUrl: null,
    isUploading: false,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      streamRef.current = stream;
      
      // Set up audio level monitoring
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          setAudioLevel(average / 255);
        }
        if (recordingState.isRecording) {
          requestAnimationFrame(updateAudioLevel);
        }
      };
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(blob);
        setRecordingState(prev => ({ ...prev, audioUrl }));
        setAudioLevel(0);
      };
      
      mediaRecorder.start();
      updateAudioLevel();
      
      setRecordingState(prev => ({ ...prev, isRecording: true, duration: 0 }));
      
      intervalRef.current = setInterval(() => {
        setRecordingState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Failed to start recording. Please check microphone permissions.');
    }
  }, [recordingState.isRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop();
      setRecordingState(prev => ({ ...prev, isRecording: false }));
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  }, [recordingState.isRecording]);

  const clearRecording = useCallback(() => {
    if (recordingState.audioUrl) {
      URL.revokeObjectURL(recordingState.audioUrl);
    }
    
    // Stop any active recording
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    // Stop all media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clear intervals and audio context
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Reset all refs
    mediaRecorderRef.current = null;
    analyserRef.current = null;
    chunksRef.current = [];
    
    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioUrl: null,
      isUploading: false,
    });
    
    setAudioLevel(0);
  }, [recordingState.audioUrl]);

  const forceReset = useCallback(() => {
    // Force stop any active recording
    if (mediaRecorderRef.current && recordingState.isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.warn('Error stopping media recorder:', error);
      }
    }
    
    // Force stop all media tracks
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.warn('Error stopping media tracks:', error);
      }
      streamRef.current = null;
    }
    
    // Clear all intervals and timers
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (error) {
        console.warn('Error closing audio context:', error);
      }
      audioContextRef.current = null;
    }
    
    // Clean up audio URL
    if (recordingState.audioUrl) {
      try {
        URL.revokeObjectURL(recordingState.audioUrl);
      } catch (error) {
        console.warn('Error revoking object URL:', error);
      }
    }
    
    // Reset all refs to initial state
    mediaRecorderRef.current = null;
    analyserRef.current = null;
    chunksRef.current = [];
    
    // Reset all state to initial values
    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioUrl: null,
      isUploading: false,
    });
    
    setAudioLevel(0);
  }, [recordingState.audioUrl]);
  const getAudioBlob = useCallback((): Blob | null => {
    if (chunksRef.current.length > 0) {
      return new Blob(chunksRef.current, { type: 'audio/webm' });
    }
    return null;
  }, []);

  return {
    recordingState,
    audioLevel,
    startRecording,
    stopRecording,
    clearRecording,
    forceReset,
    getAudioBlob,
    setIsUploading: (uploading: boolean) => 
      setRecordingState(prev => ({ ...prev, isUploading: uploading })),
  };
};