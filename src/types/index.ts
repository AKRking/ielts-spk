export interface IELTSQuestion {
  id: string;
  serial_number: number;
  part: 1 | 2 | 3;
  category: string;
  question: string;
  sample_answer: string;
  key_vocabulary: string[];
  time_limit: number;
  created_at: string;
}

export interface UserRecording {
  id: string;
  user_id: string;
  question_id: string;
  audio_url: string;
  duration: number;
  created_at: string;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioUrl: string | null;
  isUploading: boolean;
}