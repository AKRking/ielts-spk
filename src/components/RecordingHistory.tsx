import React from 'react';
import { Play, Download, Clock, Calendar } from 'lucide-react';
import { UserRecording } from '../types';

interface RecordingHistoryProps {
  recordings: UserRecording[];
  loading: boolean;
  error: string | null;
}

export const RecordingHistory: React.FC<RecordingHistoryProps> = ({
  recordings,
  loading,
  error,
}) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const downloadRecording = async (recording: UserRecording) => {
    try {
      const response = await fetch(recording.audio_url);
      const blob = await response.blob();
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${formatDate(recording.created_at)}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading recording:', error);
      alert('Failed to download recording');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Previous Recordings</h3>
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 text-sm mt-2">Loading recordings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Previous Recordings</h3>
        <div className="text-center py-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h3 className="font-semibold text-gray-900 mb-4">Previous Recordings</h3>
      
      {recordings.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Play className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500">No recordings yet</p>
          <p className="text-gray-400 text-sm">Your practice recordings will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recordings.map((recording) => (
            <div
              key={recording.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(recording.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(recording.duration)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <audio
                  controls
                  src={recording.audio_url}
                  className="flex-1 h-8"
                  style={{ maxHeight: '32px' }}
                />
                <button
                  onClick={() => downloadRecording(recording)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Download recording"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};