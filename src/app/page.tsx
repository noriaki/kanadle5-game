'use client';

import React, { useState } from 'react';
import { GameBoard, HiraganaKeyboard } from "@/components";

type CharacterState = 'default' | 'correct' | 'present' | 'absent';

export default function Home() {
  const [currentInput, setCurrentInput] = useState<string>('');
  const [characterStates, setCharacterStates] = useState<Record<string, CharacterState>>({});
  const [isGameDisabled, setIsGameDisabled] = useState<boolean>(false);

  /**
   * Handle character input from keyboard
   */
  const handleKeyPress = (character: string) => {
    if (currentInput.length < 5) {
      setCurrentInput(prev => prev + character);
    }
  };

  /**
   * Handle backspace from keyboard
   */
  const handleBackspace = () => {
    setCurrentInput(prev => prev.slice(0, -1));
  };

  /**
   * Handle enter from keyboard
   */
  const handleEnter = () => {
    if (currentInput.length === 5) {
      // TODO: Implement game logic integration
      console.log('Submitting word:', currentInput);
      
      // Demo: Update character states for visual feedback
      const newStates: Record<string, CharacterState> = {};
      [...currentInput].forEach((char, index) => {
        // Simple demo logic - alternate between states
        newStates[char] = index % 3 === 0 ? 'correct' : index % 3 === 1 ? 'present' : 'absent';
      });
      setCharacterStates(prev => ({ ...prev, ...newStates }));
      
      // For demo purposes, clear input after submission
      setCurrentInput('');
    }
  };

  /**
   * Toggle game disabled state for testing
   */
  const toggleGameState = () => {
    setIsGameDisabled(prev => !prev);
  };

  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-4 pb-8 gap-8 sm:p-8 font-[family-name:var(--font-geist-sans)]">
      <header className="w-full text-center py-4">
        <h1 className="text-3xl font-bold">Kanadle5</h1>
      </header>
      <main className="flex flex-col items-center justify-center w-full gap-8">
        <GameBoard />
        
        {/* Current input display */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Current Input:</p>
          <div className="text-2xl font-mono border-2 border-gray-300 rounded px-4 py-2 min-w-[200px] bg-gray-50">
            {currentInput || '・・・・・'}
          </div>
          
          {/* Demo controls */}
          <div className="mt-4">
            <button
              onClick={toggleGameState}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              {isGameDisabled ? 'Enable Game' : 'Disable Game'}
            </button>
          </div>
        </div>
        
        <HiraganaKeyboard
          onKeyPress={handleKeyPress}
          onBackspace={handleBackspace}
          onEnter={handleEnter}
          characterStates={characterStates}
          disabled={isGameDisabled}
        />
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center p-4 text-sm text-gray-500">
        <p>© 2025 Kanadle5 Game</p>
      </footer>
    </div>
  );
}
