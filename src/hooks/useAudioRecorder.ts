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
      console.log('🎤 Starting recording...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      streamRef.current = stream;
      console.log('📡 Stream obtained');
      
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
      
      console.log('📹 MediaRecorder created');
      
      mediaRecorder.ondataavailable = (event) => {
        console.log('📦 Data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log('⏹️ MediaRecorder stopped');
        console.log('📦 Total chunks:', chunksRef.current.length);
        
        // Add a small delay to ensure all data is collected
        setTimeout(() => {
          console.log('📦 Final chunks after delay:', chunksRef.current.length);
          
          if (chunksRef.current.length === 0) {
            console.error('❌ No audio chunks available!');
            // Set state to not recording even if no audio
            setRecordingState(prev => ({ ...prev, isRecording: false }));
            return;
          }
          
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          console.log('🎵 Blob created, size:', blob.size);
          
          if (blob.size === 0) {
            console.error('❌ Blob has no size!');
            setRecordingState(prev => ({ ...prev, isRecording: false }));
            return;
          }
          
          const audioUrl = URL.createObjectURL(blob);
          console.log('🔗 Audio URL created:', audioUrl);
          
          setRecordingState(prev => {
            console.log('📊 Updating state - audioUrl:', audioUrl, 'isRecording: false');
            return { ...prev, audioUrl, isRecording: false };
          });
          setAudioLevel(0);
        }, 100); // Small delay to ensure all chunks are collected
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
      };
      
      mediaRecorder.start(100); // Collect data every 100ms instead of 1000ms
      console.log('🔴 Recording started with 100ms intervals');
      updateAudioLevel();
      
      setRecordingState(prev => ({ ...prev, isRecording: true, duration: 0 }));
      
      intervalRef.current = setInterval(() => {
        setRecordingState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      throw new Error('Failed to start recording. Please check microphone permissions.');
    }
  }, [recordingState.isRecording]);

  const stopRecording = useCallback(() => {
    console.log('🛑 Stop recording called');
    console.log('📊 Current state:', {
      isRecording: recordingState.isRecording,
      mediaRecorderExists: !!mediaRecorderRef.current,
      mediaRecorderState: mediaRecorderRef.current?.state,
      chunksLength: chunksRef.current.length
    });
    
    if (mediaRecorderRef.current && recordingState.isRecording) {
      console.log('⏹️ Stopping MediaRecorder...');
      
      // Clear the interval first
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('⏰ Interval cleared');
      }
      
      // Stop the recorder
      if (mediaRecorderRef.current.state === 'recording') {
        console.log('📹 Calling MediaRecorder.stop()');
        
        // Add a timeout fallback in case onstop doesn't fire
        const fallbackTimeout = setTimeout(() => {
          console.log('⚠️ FALLBACK: onstop didn\'t fire within 2 seconds');
          handleStopFallback();
        }, 2000);
        
        // Override the onstop to clear the timeout
        const originalOnStop = mediaRecorderRef.current.onstop;
        mediaRecorderRef.current.onstop = (event) => {
          clearTimeout(fallbackTimeout);
          if (originalOnStop) {
            originalOnStop.call(mediaRecorderRef.current, event);
          }
        };
        
        mediaRecorderRef.current.stop();
        console.log('📹 MediaRecorder.stop() called');
      } else {
        console.log('⚠️ MediaRecorder not in recording state:', mediaRecorderRef.current.state);
        // If not recording, handle stop manually
        handleStopFallback();
      }
      
      // Stop the stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('🚫 Track stopped');
        });
      }
      
      // Close audio context
      if (audioContextRef.current) {
        // audioContextRef.current.close();
        console.log('🔊 AudioContext closed');
      }
    } else {
      console.log('⚠️ Cannot stop - not recording or no MediaRecorder');
    }
  }, [recordingState.isRecording]);

  const handleStopFallback = useCallback(() => {
    console.log('🔄 Executing stop fallback');
    
    if (chunksRef.current.length > 0) {
      console.log('📦 Creating blob from', chunksRef.current.length, 'chunks');
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      console.log('🎵 Fallback blob created, size:', blob.size);
      
      const audioUrl = URL.createObjectURL(blob);
      console.log('🔗 Fallback audio URL created:', audioUrl);
      
      setRecordingState(prev => {
        console.log('📊 Fallback: Updating state - audioUrl:', audioUrl, 'isRecording: false');
        return { ...prev, audioUrl, isRecording: false };
      });
    } else {
      console.log('❌ No chunks available for fallback');
      setRecordingState(prev => ({ ...prev, isRecording: false }));
    }
    
    setAudioLevel(0);
  }, []);

  const clearRecording = useCallback(() => {
    console.log('🧹 Clearing recording...');
    
    if (recordingState.audioUrl) {
      URL.revokeObjectURL(recordingState.audioUrl);
      console.log('🔗 Audio URL revoked');
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
    console.log('✅ Recording cleared');
  }, [recordingState.audioUrl, recordingState.isRecording]);

  const forceReset = useCallback(() => {
    console.log('🔄 Force reset called...');
    
    // Force stop any active recording
    if (mediaRecorderRef.current && recordingState.isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.warn('⚠️ Error stopping media recorder:', error);
      }
    }
    
    // Force stop all media tracks
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.warn('⚠️ Error stopping media tracks:', error);
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
        
        // audioContextRef.current.close();
      } catch (error) {
        console.warn('⚠️ Error closing audio context:', error);
      }
      audioContextRef.current = null;
    }
    
    // Clean up audio URL
    if (recordingState.audioUrl) {
      try {
        URL.revokeObjectURL(recordingState.audioUrl);
      } catch (error) {
        console.warn('⚠️ Error revoking object URL:', error);
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
    console.log('✅ Force reset completed');
  }, [recordingState.audioUrl, recordingState.isRecording]);

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