'use client';

import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProgressIndicator from './ProgressIndicator';

interface OnboardingData {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  avatar_url: string | null;
  skills: string[];
  experience: 'beginner' | 'intermediate' | 'expert' | '';
  links: {
    portfolio?: string;
    linkedin?: string;
    github?: string;
  };
  gig: {
    title: string;
    description: string;
    price: string;
    timeline: string;
  };
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  currentStep: number;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const initialData: OnboardingData = {
  firstName: '',
  lastName: '',
  email: '',
  bio: '',
  avatar_url: null,
  skills: [],
  experience: '',
  links: {},
  gig: {
    title: '',
    description: '',
    price: '',
    timeline: '',
  },
};

interface OnboardingContainerProps {
  children: ReactNode;
  step: number;
}

export function OnboardingContainer({ children, step }: OnboardingContainerProps) {
  const router = useRouter();
  const [data, setData] = useState<OnboardingData>(initialData);
  const [currentStep, setCurrentStep] = useState(step);

  // Load data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('onboarding_data');
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load onboarding data:', e);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('onboarding_data', JSON.stringify(data));
  }, [data]);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= 3) {
      setCurrentStep(step);
      router.push(`/onboarding/step-${step}`);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      goToStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  const value: OnboardingContextType = {
    data,
    updateData,
    currentStep,
    goToStep,
    nextStep,
    prevStep,
  };

  return (
    <OnboardingContext.Provider value={value}>
      <div className="min-h-screen bg-black flex items-center justify-center px-4 py-8 lg:ml-0">
        <div className="max-w-2xl w-full">
          <ProgressIndicator currentStep={currentStep} />
          {children}
        </div>
      </div>
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within OnboardingContainer');
  }
  return context;
}

