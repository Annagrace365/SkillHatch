import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';

interface SkillInputProps {
  skills: string[];
  onSkillsChange: (skills: string[]) => void;
  suggestions: string[];
  placeholder: string;
  label: string;
}

const SkillInput: React.FC<SkillInputProps> = ({
  skills,
  onSkillsChange,
  suggestions,
  placeholder,
  label
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = suggestions.filter(
        suggestion =>
          suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
          !skills.includes(suggestion)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [inputValue, suggestions, skills]);

  const addSkill = (skill: string) => {
    if (skill.trim() && !skills.includes(skill.trim())) {
      onSkillsChange([...skills, skill.trim()]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onSkillsChange(skills.filter(skill => skill !== skillToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        addSkill(filteredSuggestions[0]);
      } else if (inputValue.trim()) {
        addSkill(inputValue.trim());
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <Sparkles className="text-indigo-600" size={20} />
        <label className="text-lg font-semibold text-gray-800">
          {label}
        </label>
      </div>
      
      {/* Selected Skills */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center px-4 py-2 rounded-2xl text-sm font-semibold bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border border-indigo-200 shadow-md hover:shadow-lg transition-all duration-200"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="ml-3 inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-indigo-200 transition-colors duration-200"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all duration-300 text-lg bg-gradient-to-r from-white to-gray-50 hover:border-gray-300"
        />
        
        {inputValue && (
          <button
            type="button"
            onClick={() => addSkill(inputValue)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-indigo-600 hover:text-indigo-700 transition-colors duration-200 p-2 rounded-xl hover:bg-indigo-50"
          >
            <Plus size={24} />
          </button>
        )}

        {/* Enhanced Suggestions Dropdown */}
        {showSuggestions && (
          <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-64 overflow-y-auto">
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addSkill(suggestion)}
                className="w-full px-6 py-4 text-left hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 first:rounded-t-2xl last:rounded-b-2xl border-b border-gray-100 last:border-b-0 font-medium text-gray-700 hover:text-indigo-700"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillInput;