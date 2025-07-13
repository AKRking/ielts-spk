import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { IELTSQuestion } from '../types';

export const useIELTSQuestions = () => {
  const [questions, setQuestions] = useState<IELTSQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('ielts_questions')
        .select('*')
        .order('serial_number');

      if (fetchError) throw fetchError;
      
      setQuestions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  const jumpToQuestion = (serialNumber: number) => {
    const index = questions.findIndex(q => q.serial_number === serialNumber);
    if (index !== -1) {
      setCurrentQuestionIndex(index);
      return true;
    }
    return false;
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      return true;
    }
    return false;
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      return true;
    }
    return false;
  };

  const currentQuestion = questions[currentQuestionIndex] || null;
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  const updateCurrentQuestion = (updatedQuestion: IELTSQuestion) => {
    setQuestions(prev => 
      prev.map(q => q.id === updatedQuestion.id ? updatedQuestion : q)
    );
  };

  const handleQuestionDeleted = async () => {
    // Refetch questions to update the list
    await fetchQuestions();
    
    // If we deleted the last question and we're not on the first question, go back one
    if (currentQuestionIndex >= questions.length - 1 && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
    // If we deleted all questions, reset to 0
    else if (questions.length <= 1) {
      setCurrentQuestionIndex(0);
    }
  };

  return {
    questions,
    currentQuestion,
    currentQuestionIndex: currentQuestionIndex + 1,
    totalQuestions,
    progress,
    loading,
    error,
    jumpToQuestion,
    nextQuestion,
    previousQuestion,
    refetch: fetchQuestions,
    updateCurrentQuestion,
    handleQuestionDeleted,
  };
};