'use client';

import { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui';

interface SkillSelectorProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  maxSkills?: number;
}

const POPULAR_SKILLS = [
  'React', 'Next.js', 'TypeScript', 'JavaScript', 'Node.js',
  'Python', 'Django', 'Flask', 'PHP', 'Laravel',
  'UI Design', 'UX Design', 'Logo Design', 'Brand Identity',
  'Copywriting', 'Content Writing', 'SEO', 'Social Media',
  'WordPress', 'Shopify', 'Webflow', 'Figma',
  'Video Editing', 'Photo Editing', 'Illustration', 'Animation',
  'Data Analysis', 'Excel', 'Google Analytics', 'Marketing',
  'Mobile App Development', 'iOS', 'Android', 'Flutter',
];

export default function SkillSelector({ skills, onChange, maxSkills = 5 }: SkillSelectorProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSkills, setFilteredSkills] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = POPULAR_SKILLS.filter(
        (skill) =>
          skill.toLowerCase().includes(inputValue.toLowerCase()) &&
          !skills.includes(skill)
      );
      setFilteredSkills(filtered.slice(0, 8));
      setShowSuggestions(true);
    } else {
      setFilteredSkills([]);
      setShowSuggestions(false);
    }
  }, [inputValue, skills]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addSkill = (skill: string) => {
    if (skills.length < maxSkills && !skills.includes(skill)) {
      onChange([...skills, skill]);
      setInputValue('');
      setShowSuggestions(false);
      inputRef.current?.focus();
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onChange(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (!skills.includes(trimmed) && skills.length < maxSkills) {
        addSkill(trimmed);
      }
    } else if (e.key === 'Backspace' && !inputValue && skills.length > 0) {
      removeSkill(skills[skills.length - 1]);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap gap-2 mb-3 min-h-[48px] p-2 border border-gray-700 bg-gray-900 rounded-lg focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
        {skills.map((skill) => (
          <button
            key={skill}
            type="button"
            onClick={() => removeSkill(skill)}
            className="inline-flex items-center gap-1 cursor-pointer"
          >
            <Badge
              variant="accent"
              className="flex items-center gap-1"
            >
              {skill}
              <span className="ml-1 text-xs">×</span>
            </Badge>
          </button>
        ))}
        {skills.length < maxSkills && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue && setShowSuggestions(true)}
            placeholder={skills.length === 0 ? 'Add your skills...' : ''}
            className="flex-1 min-w-[120px] outline-none bg-transparent text-sm text-white placeholder:text-gray-400"
          />
        )}
        {skills.length >= maxSkills && (
          <span className="text-xs text-gray-400 self-center">Max {maxSkills} skills</span>
        )}
      </div>

      {showSuggestions && filteredSkills.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredSkills.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => addSkill(skill)}
              className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-800 transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              {skill}
            </button>
          ))}
        </div>
      )}

      {skills.length === 0 && (
        <p className="text-xs text-gray-400 mt-1">Start typing to see suggestions or press Enter to add</p>
      )}
    </div>
  );
}

