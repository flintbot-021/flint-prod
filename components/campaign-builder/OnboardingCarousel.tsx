import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const slides = [
  {
    title: 'Add Sections',
    description: 'Start building your campaign by adding content or question sections from the left menu to your canvas.',
    imageAlt: 'Add sections to canvas',
    image: '/1.png', // Updated to real image
  },
  {
    title: 'Define Variable Names',
    description: 'Each section has a name in its top bar. This name becomes a variable you can use in logic and outputs (e.g., @name, @age). Click the section name to edit it.',
    imageAlt: 'Edit section name',
    image: '/2.png', // Updated to real image
  },
  {
    title: 'Define Logic & Output',
    description: 'Add a Logic section to build an AI prompt using variables from previous sections, and define what output you want (e.g., @score, @recommendation).',
    imageAlt: 'Logic section',
    image: '/3.png', // Updated to real image
  },
  {
    title: 'Showcase Output',
    description: 'Finish with an Output section. Display personalized results using variables and AI outputs. You can use text, images, and dynamic content.',
    imageAlt: 'Output section',
    image: '/4.png', // Updated to real image
  },
  {
    title: 'Get Started',
    description: 'Choose how you want to begin your campaign.',
    imageAlt: 'Choose start method',
    image: '', // No image for this step
  },
];

export function OnboardingCarousel({ isOpen, onClose, onTemplateClick }: { isOpen: boolean; onClose: () => void; onTemplateClick?: () => void }) {
  const [step, setStep] = useState(0);
  const [dontShow, setDontShow] = useState(false);

  useEffect(() => {
    if (isOpen) setStep(0);
  }, [isOpen]);

  useEffect(() => {
    if (dontShow) {
      localStorage.setItem('flint_builder_onboarding_dismissed', '1');
    } else {
      localStorage.removeItem('flint_builder_onboarding_dismissed');
    }
  }, [dontShow]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (dontShow) {
      localStorage.setItem('flint_builder_onboarding_dismissed', '1');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-60">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-8 flex flex-col items-center">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          onClick={handleClose}
          aria-label="Close onboarding"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="w-full flex flex-col items-center">
          {step < slides.length - 1 ? (
            <>
              <img
                src={slides[step].image}
                alt={slides[step].imageAlt}
                className="mb-6 w-full object-contain bg-gray-100 rounded"
              />
              <h2 className="text-2xl font-bold mb-2 text-center">{slides[step].title}</h2>
              <p className="text-gray-600 mb-6 text-center">{slides[step].description}</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-4 text-center">{slides[step].title}</h2>
              <p className="text-gray-600 mb-8 text-center">{slides[step].description}</p>
              <div className="flex flex-col sm:flex-row gap-6 w-full">
                <button
                  className="flex-1 border-2 border-blue-600 rounded-xl p-8 flex flex-col items-center justify-center text-blue-700 font-semibold text-lg shadow-md hover:bg-blue-50 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
                  onClick={() => onTemplateClick && onTemplateClick()}
                >
                  <span className="mb-2 text-3xl">📋</span>
                  Start with Template
                </button>
                <button
                  className="flex-1 border-2 border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-gray-700 font-semibold text-lg shadow-md hover:bg-gray-50 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400"
                  onClick={handleClose}
                >
                  <span className="mb-2 text-3xl">✨</span>
                  Start from Scratch
                </button>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center justify-between w-full mt-4">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Back
          </Button>
          <div className="flex-1 flex justify-center gap-2">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full ${i === step ? 'bg-blue-600' : 'bg-gray-300'}`}
              />
            ))}
          </div>
          {step < slides.length - 1 ? (
            <Button onClick={() => setStep((s) => Math.min(slides.length - 1, s + 1))}>
              Next
            </Button>
          ) : null}
        </div>
        <div className="flex items-center mt-6 w-full">
          <input
            id="dont-show"
            type="checkbox"
            checked={dontShow}
            onChange={(e) => setDontShow(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="dont-show" className="text-gray-500 text-sm cursor-pointer">
            Don&apos;t show this again
          </label>
        </div>
      </div>
    </div>
  );
} 