import React from 'react';
import { Mic, GraduationCap, Plus } from 'lucide-react';
import { useIELTSQuestions } from './hooks/useIELTSQuestions';
import { useRecordingHistory } from './hooks/useRecordingHistory';
import { QuestionDisplay } from './components/QuestionDisplay';
import { QuestionSearch } from './components/QuestionSearch';
import { SampleAnswer } from './components/SampleAnswer';
import { AudioRecorder } from './components/AudioRecorder';
import { RecordingHistory } from './components/RecordingHistory';
import { NavigationControls } from './components/NavigationControls';
import { BulkQuestionEntry } from './components/BulkQuestionEntry';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { UserRecording } from './types';

function App() {
  const [showBulkEntry, setShowBulkEntry] = React.useState(false);
  
  const {
    questions,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    loading,
    error,
    jumpToQuestion,
    nextQuestion,
    previousQuestion,
    refetch,
    updateCurrentQuestion,
    handleQuestionDeleted,
  } = useIELTSQuestions();

  const {
    recordings,
    loading: recordingsLoading,
    error: recordingsError,
    addRecording,
  } = useRecordingHistory(currentQuestion?.id || '');

  const handleRecordingComplete = (recording: UserRecording) => {
    console.log('Recording completed:', recording);
    addRecording(recording);
  };

  const handleNavigationStart = () => {
    // This will trigger the AudioRecorder to reset via the question.id change
    // The actual navigation will happen after the reset
  };
  if (showBulkEntry) {
    return <BulkQuestionEntry onBack={() => setShowBulkEntry(false)} />;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refetch} />;
  }

  if (!currentQuestion) {
    return (
      <ErrorMessage 
        message="No questions available. Please check your database connection." 
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GraduationCap className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  IELTS Speaking Practice Simulator
                </h1>
                <p className="text-gray-600">
                  Practice with authentic IELTS speaking questions and record your responses
                </p>
              </div>
            </div>
            
            <div className="hidden sm:flex items-center gap-2 text-gray-600">
              <Mic className="w-5 h-5" />
              <span className="font-medium">Audio Recording Enabled</span>
            </div>
            
            <div className="flex items-center gap-4">
              <QuestionSearch
                questions={questions}
                onQuestionSelect={jumpToQuestion}
                currentQuestionId={currentQuestion?.id}
              />
              
              <button
                onClick={() => setShowBulkEntry(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Questions
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Question and Sample Answer */}
          <div className="lg:col-span-2 space-y-8">
            <QuestionDisplay
              question={currentQuestion}
              currentIndex={currentQuestionIndex}
              totalQuestions={totalQuestions}
              onQuestionDeleted={handleQuestionDeleted}
            />
            
            <SampleAnswer 
              question={currentQuestion} 
              onQuestionUpdate={updateCurrentQuestion}
            />
          </div>

          {/* Right Column - Recording and Navigation */}
          <div className="space-y-8">
             <NavigationControls
              currentIndex={currentQuestionIndex}
              totalQuestions={totalQuestions}
              onNext={nextQuestion}
              onPrevious={previousQuestion}
              onJumpToQuestion={jumpToQuestion}
              onNavigationStart={handleNavigationStart}
            />
            <AudioRecorder
              question={currentQuestion}
              onRecordingComplete={handleRecordingComplete}
              onQuestionChange={() => {
                // Recording has been reset for new question
                console.log('Recording reset for question:', currentQuestion.serial_number);
              }}
            />
            
            <RecordingHistory
              recordings={recordings}
              loading={recordingsLoading}
              error={recordingsError}
            />
            
           
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p>© 2025 IELTS Speaking Practice Simulator. Practice makes perfect!</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;