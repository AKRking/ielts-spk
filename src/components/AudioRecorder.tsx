import React, { useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Trash2, Upload, Download } from 'lucide-react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { supabase } from '../lib/supabase';
import { IELTSQuestion, UserRecording } from '../types';

interface AudioRecorderProps {
  question: IELTSQuestion;
  maxDuration?: number;
  onRecordingComplete?: (recording: UserRecording) => void;
  onQuestionChange?: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  question,
  maxDuration,
  onRecordingComplete,
  onQuestionChange,
}) => {
  const {
    recordingState,
    audioLevel,
    startRecording,
    stopRecording,
    clearRecording,
    forceReset,
    getAudioBlob,
    setIsUploading,
  } = useAudioRecorder();

  // Reset recording when question changes
  useEffect(() => {
    forceReset();
    onQuestionChange?.();
  }, [onQuestionChange]);
  const timeLimit = maxDuration || question.time_limit;

  // Auto-stop recording when time limit reached
  useEffect(() => {
    if (recordingState.isRecording && recordingState.duration >= timeLimit) {
      stopRecording();
    }
  }, [recordingState.duration, recordingState.isRecording, timeLimit, stopRecording]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimeRemaining = () => {
    return Math.max(0, timeLimit - recordingState.duration);
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to start recording');
    }
  };

  const handleSaveRecording = async () => {
    const audioBlob = getAudioBlob();
    if (!audioBlob) return console.log("no audio  blob");

    try {
      setIsUploading(true);
      
      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `recording-${question.serial_number}-${timestamp}.webm`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(filename, audioBlob, {
          contentType: 'audio/webm',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('recordings')
        .getPublicUrl(uploadData.path);

      // Save recording metadata to database
      const { data: recordingData, error: dbError } = await supabase
        .from('user_recordings')
        .insert({
          user_id: null, // Allow anonymous users
          question_id: question.id,
          audio_url: publicUrl,
          duration: recordingState.duration,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      if (recordingData) {
        onRecordingComplete?.(recordingData);
      }
      
      // alert('Recording saved successfully!');
       
    } catch (error) {
      console.error('Error saving recording:', error);
      alert('Failed to save recording. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadRecording = () => {
    if (recordingState.audioUrl) {
      const a = document.createElement('a');
      a.href = recordingState.audioUrl;
      a.download = `ielts-recording-q${question.serial_number}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Recording Studio</h3>
          <p className="text-gray-600">Practice your response and save your recording</p>
        </div>

        {/* Audio Level Indicator */}
        {recordingState.isRecording && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Audio Level</span>
              <span className="text-sm text-gray-500">{Math.round(audioLevel * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-100"
                style={{ width: `${audioLevel * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Timer Display */}
        <div className="text-center">
          <div className="inline-flex items-center gap-4 bg-gray-50 rounded-lg px-6 py-4">
            <div className="text-center">
              <div className="text-2xl font-mono font-bold text-gray-900">
                {formatTime(recordingState.duration)}
              </div>
              <div className="text-sm text-gray-600">Recorded</div>
            </div>
            
            <div className="w-px h-8 bg-gray-300" />
            
            <div className="text-center">
              <div className={`text-2xl font-mono font-bold ${getTimeRemaining() < 30 ? 'text-red-600' : 'text-gray-600'}`}>
                {formatTime(getTimeRemaining())}
              </div>
              <div className="text-sm text-gray-600">Remaining</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{Math.round((recordingState.duration / timeLimit) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                recordingState.duration >= timeLimit ? 'bg-red-500' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min((recordingState.duration / timeLimit) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Recording Controls */}
        <div className="flex justify-center gap-4">
          {!recordingState.isRecording ? (
            <button
              onClick={handleStartRecording}
              disabled={recordingState.duration >= timeLimit}
              className="flex items-center gap-3 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
            >
              <Mic className="w-5 h-5" />
              Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center gap-3 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
            >
              <MicOff className="w-5 h-5" />
              Stop Recording
            </button>
          )}

          {recordingState.audioUrl && (
            <button
              onClick={clearRecording}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        {/* Playback Controls */}
        {recordingState.audioUrl && (
          <div className="border-t border-gray-200 pt-6">
            <div className="flex flex-col items-center gap-4">
              <audio
                controls
                src={recordingState.audioUrl}
                className="w-full max-w-md"
              />
              
              <div className="flex gap-3">
                <button
                  onClick={handleSaveRecording}
                  disabled={recordingState.isUploading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {recordingState.isUploading ? 'Saving...' : 'Save Recording'}
                </button>
                
                <button
                  onClick={downloadRecording}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recording Status */}
        {recordingState.isRecording && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              Recording in progress...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};