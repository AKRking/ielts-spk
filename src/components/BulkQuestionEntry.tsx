import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, ArrowLeft, Plus, Edit3 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface QuestionData {
  part: string;
  q_a: Array<{
    q: string;
    a: string;
  }>;
}

interface BulkQuestionEntryProps {
  onBack: () => void;
}

export const BulkQuestionEntry: React.FC<BulkQuestionEntryProps> = ({ onBack }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Single question form state
  const [singleQuestion, setSingleQuestion] = useState({
    part: '1',
    question: '',
    answer: ''
  });
  
  const [results, setResults] = useState<{
    success: number;
    errors: string[];
    insertedQuestions: Array<{ serial_number: number; question: string }>;
  } | null>(null);

  const extractKeyVocabulary = (answer: string): string[] => {
    // Simple extraction of potential key vocabulary
    const words = answer.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const uniqueWords = [...new Set(words)];
    return uniqueWords.slice(0, 8); // Limit to 8 key words
  };

  const getTimeLimit = (part: number): number => {
    switch (part) {
      case 1: return 90; // 1.5 minutes
      case 2: return 120; // 2 minutes
      case 3: return 150; // 2.5 minutes
      default: return 120;
    }
  };

  const getCategoryFromQuestion = (question: string, part: number): string => {
    const lowerQ = question.toLowerCase();
    
    if (part === 1) {
      if (lowerQ.includes('hometown') || lowerQ.includes('where')) return 'Hometown';
      if (lowerQ.includes('work') || lowerQ.includes('job')) return 'Work/Study';
      if (lowerQ.includes('family')) return 'Family';
      if (lowerQ.includes('hobby') || lowerQ.includes('free time')) return 'Hobbies';
      if (lowerQ.includes('food')) return 'Food';
      if (lowerQ.includes('travel')) return 'Travel';
      return 'General';
    } else if (part === 2) {
      return 'Long Turn';
    } else {
      return 'Discussion';
    }
  };

  const getNextSerialNumber = async (): Promise<number> => {
    const { data, error } = await supabase
      .from('ielts_questions')
      .select('serial_number')
      .order('serial_number', { ascending: false })
      .limit(1);

    if (error) throw error;
    
    return data && data.length > 0 ? data[0].serial_number + 1 : 1;
  };

  const handleSingleQuestionSubmit = async () => {
    if (!singleQuestion.question.trim() || !singleQuestion.answer.trim()) {
      setResults({
        success: 0,
        errors: ['Please fill in both question and answer fields'],
        insertedQuestions: []
      });
      return;
    }

    setIsProcessing(true);
    setResults(null);

    try {
      const part = parseInt(singleQuestion.part);
      const currentSerialNumber = await getNextSerialNumber();

      const questionData = {
        serial_number: currentSerialNumber,
        part: part,
        category: getCategoryFromQuestion(singleQuestion.question, part),
        question: singleQuestion.question.trim(),
        sample_answer: singleQuestion.answer.trim(),
        key_vocabulary: extractKeyVocabulary(singleQuestion.answer),
        time_limit: getTimeLimit(part)
      };

      const { data: insertedData, error } = await supabase
        .from('ielts_questions')
        .insert([questionData])
        .select('serial_number, question');

      if (error) throw error;

      setResults({
        success: 1,
        errors: [],
        insertedQuestions: [{
          serial_number: currentSerialNumber,
          question: singleQuestion.question.trim()
        }]
      });

      // Clear the form after successful insertion
      setSingleQuestion({
        part: '1',
        question: '',
        answer: ''
      });

    } catch (error) {
      console.error('Error adding question:', error);
      setResults({
        success: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        insertedQuestions: []
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!jsonInput.trim()) {
      setResults({
        success: 0,
        errors: ['Please enter JSON data'],
        insertedQuestions: []
      });
      return;
    }

    setIsProcessing(true);
    setResults(null);

    try {
      const data: QuestionData = JSON.parse(jsonInput);
      
      if (!data.part || !data.q_a || !Array.isArray(data.q_a)) {
        throw new Error('Invalid JSON format. Expected format: {"part":"1", "q_a":[{"q":"question", "a":"answer"}]}');
      }

      const part = parseInt(data.part);
      if (![1, 2, 3].includes(part)) {
        throw new Error('Part must be 1, 2, or 3');
      }

      let currentSerialNumber = await getNextSerialNumber();
      const questionsToInsert = [];
      const insertedQuestions = [];

      for (const qa of data.q_a) {
        if (!qa.q || !qa.a) {
          throw new Error('Each question must have both "q" (question) and "a" (answer) fields');
        }

        const questionData = {
          serial_number: currentSerialNumber,
          part: part,
          category: getCategoryFromQuestion(qa.q, part),
          question: qa.q.trim(),
          sample_answer: qa.a.trim(),
          key_vocabulary: extractKeyVocabulary(qa.a),
          time_limit: getTimeLimit(part)
        };

        questionsToInsert.push(questionData);
        insertedQuestions.push({
          serial_number: currentSerialNumber,
          question: qa.q.trim()
        });
        currentSerialNumber++;
      }

      const { data: insertedData, error } = await supabase
        .from('ielts_questions')
        .insert(questionsToInsert)
        .select('serial_number, question');

      if (error) throw error;

      setResults({
        success: questionsToInsert.length,
        errors: [],
        insertedQuestions: insertedQuestions
      });

      setJsonInput(''); // Clear the input after successful insertion

    } catch (error) {
      console.error('Error processing questions:', error);
      setResults({
        success: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        insertedQuestions: []
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const exampleJson = `{
  "part": "1",
  "q_a": [
    {
      "q": "Let's talk about your hometown. Where is your hometown?",
      "a": "I'm from Beijing, the capital city of China. It's a bustling metropolis with a rich history and modern development. I've lived there my entire life and really appreciate the blend of traditional culture and contemporary lifestyle."
    },
    {
      "q": "What do you like about it?",
      "a": "What I love most about Beijing is its incredible diversity. You can visit ancient temples and traditional hutongs in the morning, then enjoy world-class shopping and dining in the evening. The city also has excellent public transportation and countless cultural attractions like museums and theaters."
    }
  ]
}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Practice
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add IELTS Questions</h1>
              <p className="text-gray-600">Add single questions or multiple questions at once</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('single')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'single'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4" />
                    Single Question
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('bulk')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'bulk'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Bulk JSON Import
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Instructions */}
          {activeTab === 'single' ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="font-semibold text-blue-900 mb-3">📝 Single Question Entry</h2>
              <div className="text-blue-800 space-y-2">
                <p>Add individual IELTS questions using the form below. The system will automatically:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Assign the next available serial number</li>
                  <li>Extract key vocabulary from the answer</li>
                  <li>Set appropriate time limits based on part number</li>
                  <li>Categorize the question automatically</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="font-semibold text-blue-900 mb-3">📝 Bulk JSON Import</h2>
              <div className="text-blue-800 space-y-2">
                <p>Paste your JSON data in the format shown below. The system will automatically:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Assign auto-incrementing serial numbers</li>
                  <li>Extract key vocabulary from answers</li>
                  <li>Set appropriate time limits based on part number</li>
                  <li>Categorize questions automatically</li>
                </ul>
              </div>
            </div>
          )}

          {/* Content based on active tab */}
          {activeTab === 'single' ? (
            /* Single Question Form */
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-6">Add New Question</h3>
              <div className="space-y-6">
                {/* Part Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IELTS Part
                  </label>
                  <select
                    value={singleQuestion.part}
                    onChange={(e) => setSingleQuestion(prev => ({ ...prev, part: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="1">Part 1 - Introduction & Interview</option>
                    <option value="2">Part 2 - Long Turn</option>
                    <option value="3">Part 3 - Discussion</option>
                  </select>
                </div>

                {/* Question Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question
                  </label>
                  <textarea
                    value={singleQuestion.question}
                    onChange={(e) => setSingleQuestion(prev => ({ ...prev, question: e.target.value }))}
                    placeholder="Enter the IELTS question here..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                  />
                </div>

                {/* Answer Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sample Answer
                  </label>
                  <textarea
                    value={singleQuestion.answer}
                    onChange={(e) => setSingleQuestion(prev => ({ ...prev, answer: e.target.value }))}
                    placeholder="Enter a sample answer for this question..."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSingleQuestionSubmit}
                    disabled={isProcessing || !singleQuestion.question.trim() || !singleQuestion.answer.trim()}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Adding Question...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Question
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Bulk JSON Import */
            <>
              {/* Example Format */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Example JSON Format:</h3>
                <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto border">
                  <code>{exampleJson}</code>
                </pre>
              </div>

              {/* Input Form */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Enter Your JSON Data:</h3>
                <div className="space-y-4">
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder="Paste your JSON data here..."
                    className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                  
                  <div className="flex justify-end">
                    <button
                      onClick={handleSubmit}
                      disabled={isProcessing || !jsonInput.trim()}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Insert Questions
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Results */}
          {results && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Results:</h3>
              
              {results.success > 0 && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Successfully inserted {results.success} questions!</span>
                  </div>
                  <div className="space-y-1">
                    {results.insertedQuestions.map((q) => (
                      <div key={q.serial_number} className="text-sm text-green-700">
                        #{q.serial_number}: {q.question.substring(0, 80)}...
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Errors occurred:</span>
                  </div>
                  <div className="space-y-1">
                    {results.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700">
                        • {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};