import React from 'react';
import { Clock, BookOpen, Hash, Trash2 } from 'lucide-react';
import { IELTSQuestion } from '../types';
import { supabase } from '../lib/supabase';

interface QuestionDisplayProps {
  question: IELTSQuestion;
  currentIndex: number;
  totalQuestions: number;
  onQuestionDeleted?: () => void;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  currentIndex,
  totalQuestions,
  onQuestionDeleted,
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPartColor = (part: number) => {
    switch (part) {
      case 1: return 'bg-blue-100 text-blue-800';
      case 2: return 'bg-green-100 text-green-800';
      case 3: return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('ielts_questions')
        .delete()
        .eq('id', question.id);

      if (error) throw error;

      // Show success feedback
      alert(`Question #${question.serial_number} deleted successfully!`);
      
      // Notify parent component to refresh the questions list
      onQuestionDeleted?.();
      
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleDeleteClick = () => {
    setShowConfirm(true);
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
  };

  return (
    <div className="bg-white rounded-xl px-3  p-1 border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Hash className="w-5 h-5" />
            <span className="font-semibold">{question.serial_number}</span>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPartColor(question.part)}`}>
            Part {question.part}
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm">{question.category}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">{formatTime(question.time_limit)}</span>
          </div>
          
          {/* Delete Button */}
          <div className="relative">
            {!showConfirm ? (
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="flex items-center gap-1 px-3 py-1 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 rounded-lg transition-colors text-sm font-medium"
                title="Delete this question"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-2">
                <span className="text-red-800 text-sm font-medium">Delete?</span>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded text-xs font-medium transition-colors"
                >
                  {isDeleting ? 'Deleting...' : 'Yes'}
                </button>
                <button
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                  className="px-2 py-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 rounded text-xs font-medium transition-colors"
                >
                  No
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Question {currentIndex} of {totalQuestions}</span>
          <span>{Math.round((currentIndex / totalQuestions) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentIndex / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 leading-relaxed">
          {question.question}
        </h2>
      </div>

      {/* Guidelines */}
      {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Speaking Guidelines:</h3>
        <ul className="text-blue-800 text-sm space-y-1">
          {question.part === 1 && (
            <>
              <li>• Speak for 1-2 minutes</li>
              <li>• Give clear, detailed answers</li>
              <li>• Use appropriate vocabulary and expressions</li>
            </>
          )}
          {question.part === 2 && (
            <>
              <li>• Speak for exactly 2 minutes</li>
              <li>• Cover all points mentioned in the task</li>
              <li>• Organize your response clearly</li>
              <li>• Use varied vocabulary and complex structures</li>
            </>
          )}
          {question.part === 3 && (
            <>
              <li>• Speak for 2-3 minutes</li>
              <li>• Provide detailed, analytical responses</li>
              <li>• Express and justify opinions</li>
              <li>• Use advanced vocabulary and complex ideas</li>
            </>
          )}
        </ul>
      </div> */}
    </div>
  );
};