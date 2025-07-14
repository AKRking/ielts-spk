import React, { useState, useEffect, useRef } from 'react';
import { Search, Hash, BookOpen } from 'lucide-react';
import { IELTSQuestion } from '../types';

interface QuestionSearchProps {
  questions: IELTSQuestion[];
  onQuestionSelect: (serialNumber: number) => void;
  currentQuestionId?: string;
}

export const QuestionSearch: React.FC<QuestionSearchProps> = ({
  questions,
  onQuestionSelect,
  currentQuestionId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredQuestions, setFilteredQuestions] = useState<IELTSQuestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter questions based on search term
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = questions.filter(question => {
        const searchLower = searchTerm.toLowerCase();
        return (
          question.question.toLowerCase().includes(searchLower) ||
          question.category.toLowerCase().includes(searchLower) ||
          question.serial_number.toString().includes(searchTerm) ||
          question.part.toString().includes(searchTerm)
        );
      }).slice(0, 8); // Limit to 8 results
      
      setFilteredQuestions(filtered);
      setSelectedIndex(-1);
    } else {
      setFilteredQuestions([]);
    }
  }, [searchTerm, questions]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredQuestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredQuestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredQuestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredQuestions.length) {
          handleQuestionSelect(filteredQuestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleQuestionSelect = (question: IELTSQuestion) => {
    onQuestionSelect(question.serial_number);
    setSearchTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    setIsOpen(value.trim().length > 0);
  };

  const getPartColor = (part: number) => {
    switch (part) {
      case 1: return 'bg-blue-100 text-blue-800';
      case 2: return 'bg-green-100 text-green-800';
      case 3: return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const highlightMatch = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => searchTerm.trim() && setIsOpen(true)}
          placeholder="Search questions..."
          className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>

      {/* Search Results Dropdown */}
      {isOpen && filteredQuestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {filteredQuestions.map((question, index) => (
            <div
              key={question.id}
              onClick={() => handleQuestionSelect(question)}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                index === selectedIndex ? 'bg-blue-50' : ''
              } ${question.id === currentQuestionId ? 'bg-green-50' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Hash className="w-3 h-3" />
                    <span className="text-sm font-medium">{question.serial_number}</span>
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPartColor(question.part)}`}>
                    P{question.part}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-600 font-medium">
                      {highlightMatch(question.category, searchTerm)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 line-clamp-2">
                    {highlightMatch(question.question, searchTerm)}
                  </p>
                </div>
              </div>
              
              {question.id === currentQuestionId && (
                <div className="mt-2 text-xs text-green-600 font-medium">
                  Currently viewing
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && searchTerm.trim() && filteredQuestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 text-center">
          <div className="text-gray-500 text-sm">
            No questions found for "{searchTerm}"
          </div>
        </div>
      )}
    </div>
  );
};