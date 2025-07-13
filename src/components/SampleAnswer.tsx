import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, BookOpen, Clock, Edit3, Save, X, Plus, Trash2 } from 'lucide-react';
import { IELTSQuestion } from '../types';
import { supabase } from '../lib/supabase';
import { RichTextEditor } from './RichTextEditor'; // Correctly named component from your file

interface SampleAnswerProps {
  question: IELTSQuestion;
  onQuestionUpdate?: (updatedQuestion: IELTSQuestion) => void;
}

export const SampleAnswer: React.FC<SampleAnswerProps> = ({ question, onQuestionUpdate }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // State for edited content
  const [editedAnswer, setEditedAnswer] = useState(question.sample_answer);
  const [editedVocabulary, setEditedVocabulary] = useState([...question.key_vocabulary]);
  const [newVocabWord, setNewVocabWord] = useState('');

  // Effect to reset the editing state if the question prop changes from the outside
  useEffect(() => {
    setEditedAnswer(question.sample_answer);
    setEditedVocabulary([...question.key_vocabulary]);
  }, [question]);


  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const { data, error } = await supabase
        .from('ielts_questions')
        .update({
          sample_answer: editedAnswer,
          key_vocabulary: editedVocabulary, // FIX: Also save the updated vocabulary
        })
        .eq('serial_number', question.serial_number)
        .select()
        .single(); // FIX: Use .single() to get one object back, not an array. This is safer.

      if (error) throw error;

      // FIX: This now correctly passes the updated single object to the parent component,
      // which should update its state and pass the new `question` prop back down.
      if (data && onQuestionUpdate) {
        onQuestionUpdate(data);
      } 

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating sample answer:', error);
      alert('Failed to update sample answer. Please try again.');
    } finally {
      setIsSaving(false);
    } 
  };

  const handleCancel = () => {
    // Reset state back to original question data
    setEditedAnswer(question.sample_answer);
    setEditedVocabulary([...question.key_vocabulary]);
    setNewVocabWord('');
    setIsEditing(false);
  };

  const addVocabularyWord = () => {
    if (newVocabWord.trim() && !editedVocabulary.includes(newVocabWord.trim())) {
      setEditedVocabulary([...editedVocabulary, newVocabWord.trim()]);
      setNewVocabWord('');
    }
  };

  const removeVocabularyWord = (index: number) => {
    setEditedVocabulary(editedVocabulary.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // FIX: Prevent form submission on enter
      addVocabularyWord();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
          </div>
          
          <div className="flex items-center gap-">
            {isVisible && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </button>
            )}
            
            <button
              onClick={() => setIsVisible(!isVisible)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{isVisible ? 'Hide' : 'Show'}</span>
            </button>
          </div>
        </div>
      </div>

      {isVisible && (
        <div className="p-6 space-y-6">
          {/* Edit Mode Controls */}
          {isEditing && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-800">
                <Edit3 className="w-4 h-4" />
                <span className="font-medium">Editing Mode</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Sample Answer Text */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Target Duration: {formatTime(question.time_limit)}
              </span>
            </div>
            
            {isEditing ? (
              <RichTextEditor
                value={editedAnswer}
                onChange={setEditedAnswer}
              />
            ) : (
              // FIX: Add a fallback for empty/null answers and use prose for styling
              <div
                className="prose prose-lg prose-gray max-w-none"
                dangerouslySetInnerHTML={{ __html: question.sample_answer || "<p><i>No sample answer provided.</i></p>" }}
              />
            )}
          </div>

          {/* Key Vocabulary */}
          {(question.key_vocabulary.length > 0 || isEditing) && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h4 className="font-semibold text-gray-900">Key Vocabulary & Expressions</h4>
                {isEditing && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newVocabWord}
                      onChange={(e) => setNewVocabWord(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Add new word..."
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={addVocabularyWord}
                      disabled={!newVocabWord.trim()}
                      className="p-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {(isEditing ? editedVocabulary : question.key_vocabulary).map((word, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200 ${
                      isEditing ? 'pr-2' : ''
                    }`}
                  >
                    <span>{word}</span>
                    {isEditing && (
                      <button
                        onClick={() => removeVocabularyWord(index)}
                        className="p-0.5 hover:bg-blue-200 rounded-full transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-blue-700" />
                      </button>
                    )}
                  </div>
                ))}
                
                {(isEditing ? editedVocabulary : question.key_vocabulary).length === 0 && (
                  <p className="text-gray-500 text-sm italic">No vocabulary words added yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Tips */}
          {!isEditing && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-2">💡 Speaking Tips</h4>
              {/* FIX: Use semantic list styling */}
              <ul className="text-yellow-800 text-sm space-y-1 list-disc pl-5">
                <li>Use the key vocabulary naturally in your response.</li>
                <li>Maintain a good pace and clear pronunciation.</li>
                <li>Structure your answer with a clear beginning, middle, and end.</li>
                <li>Practice until you can speak confidently within the time limit.</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};