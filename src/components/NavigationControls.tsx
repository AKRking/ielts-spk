import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, SkipForward, Search } from 'lucide-react';

interface NavigationControlsProps {
  currentIndex: number;
  totalQuestions: number;
  onNext: () => boolean;
  onPrevious: () => boolean;
  onJumpToQuestion: (serialNumber: number) => boolean;
  onNavigationStart?: () => void;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  currentIndex,
  totalQuestions,
  onNext,
  onPrevious,
  onJumpToQuestion,
  onNavigationStart,
}) => {
  const [jumpInput, setJumpInput] = useState('');
  const [jumpError, setJumpError] = useState('');

  const handleJump = () => {
    const questionNumber = parseInt(jumpInput);
    
    if (isNaN(questionNumber)) {
      setJumpError('Please enter a valid number');
      return;
    }
    
    if (questionNumber < 1 || questionNumber > totalQuestions) {
      setJumpError(`Please enter a number between 1 and ${totalQuestions}`);
      return;
    }
    
    onNavigationStart?.();
    const success = onJumpToQuestion(questionNumber);
    if (success) {
      setJumpInput('');
      setJumpError('');
    } else {
      setJumpError('Question not found');
    }
  };

  const handleNext = () => {
    onNavigationStart?.();
    onNext();
  };

  const handlePrevious = () => {
    onNavigationStart?.();
    onPrevious();
  };
  const handleInputChange = (value: string) => {
    setJumpInput(value);
    setJumpError('');
  };

  /**
   * Handles clicks on the progress bar to seek to a specific question.
   */
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left; // Click position relative to the bar
    const barWidth = rect.width;

    // Calculate the percentage of the bar that was clicked
    const clickFraction = clickX / barWidth;
    
    // Determine the target question number.
    // We use Math.ceil so clicking anywhere in a segment jumps to that question's number.
    const targetQuestion = Math.ceil(clickFraction * totalQuestions);

    // Clamp the value to ensure it's within the valid range [1, totalQuestions]
    const clampedQuestion = Math.max(1, Math.min(targetQuestion, totalQuestions));
    
    onNavigationStart?.();
    onJumpToQuestion(clampedQuestion);
  };


  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <div className="space-y-6">
        {/* Question Jump */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Quick Navigation</h3>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="number"
                  value={jumpInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJump()}
                  placeholder={`Jump to... (1-${totalQuestions})`}
                  min="1"
                  max={totalQuestions}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    jumpError ? 'border-red-500 ring-red-500' : 'border-gray-300'
                  }`}
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              {jumpError && (
                <p className="text-red-600 text-sm mt-1">{jumpError}</p>
              )}
            </div>
            <button
              onClick={handleJump}
              disabled={!jumpInput.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <SkipForward className="w-4 h-4" />
              Jump
            </button>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <button
            onClick={handlePrevious}
            disabled={currentIndex <= 1}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg font-medium transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              Question {currentIndex} of {totalQuestions}
            </div>
            <div className="text-sm text-gray-600">
              {Math.round((currentIndex / totalQuestions) * 100)}% Complete
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex >= totalQuestions}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium text-gray-600">
            <span>Overall Progress</span>
            <span>{Math.round((currentIndex / totalQuestions) * 100)}%</span>
          </div>
          <div 
            className="w-full bg-gray-200 rounded-full h-2.5 cursor-pointer group"
            onClick={handleProgressBarClick}
            title="Click to jump to a question"
          >
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 pointer-events-none"
              style={{ width: `${(currentIndex / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};