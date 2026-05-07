'use client';

import React, { useState } from 'react';
import { useTimer } from '@/hooks/useTimer';

/**
 * Advanced Timer Component with preset options
 * Features: 5 min, 10 min, 20 min, and custom timer
 */
const AdvancedTimer = ({ onComplete = null, showProgress = true, preset = 5 }) => {
  const [customMinutes, setCustomMinutes] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const timer = useTimer(preset * 60, onComplete);

  const presetOptions = [5, 10, 20];

  const handlePreset = (minutes) => {
    timer.setTimerDuration(minutes);
    setShowCustomInput(false);
  };

  const handleCustomTimer = () => {
    const minutes = parseInt(customMinutes, 10);
    if (minutes > 0 && minutes <= 1440) {
      // Max 24 hours
      timer.setTimerDuration(minutes);
      setCustomMinutes('');
      setShowCustomInput(false);
    }
  };

  const toggleShowCustom = () => {
    setShowCustomInput(!showCustomInput);
    setCustomMinutes('');
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg shadow-xl">
      {/* Timer Display */}
      <div className="mb-8">
        <div className="text-6xl font-bold text-center text-cyan-400 font-mono mb-4">
          {timer.formattedTime}
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-300"
              style={{ width: `${timer.progressPercentage}%` }}
            ></div>
          </div>
        )}

        {/* Status */}
        <div className="text-center mt-4">
          {timer.isComplete ? (
            <p className="text-lg font-semibold text-green-400">✓ Time's up!</p>
          ) : timer.isActive ? (
            <p className="text-sm text-blue-400">⏱️ Running...</p>
          ) : (
            <p className="text-sm text-gray-400">⏸️ Paused</p>
          )}
        </div>
      </div>

      {/* Preset Options */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {presetOptions.map((minutes) => (
          <button
            key={minutes}
            onClick={() => handlePreset(minutes)}
            className={`py-2 px-3 rounded-lg font-semibold transition-all duration-200 ${
              !timer.isActive && timer.seconds === minutes * 60 && !showCustomInput
                ? 'bg-cyan-500 text-black'
                : 'bg-slate-700 text-white hover:bg-slate-600'
            }`}
          >
            {minutes}m
          </button>
        ))}
      </div>

      {/* Custom Timer Input */}
      <div className="mb-4">
        {showCustomInput ? (
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max="1440"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              placeholder="Enter minutes"
              className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              onKeyPress={(e) => e.key === 'Enter' && handleCustomTimer()}
            />
            <button
              onClick={handleCustomTimer}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
            >
              Set
            </button>
            <button
              onClick={toggleShowCustom}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={toggleShowCustom}
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all"
          >
            Custom Timer
          </button>
        )}
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {timer.isActive ? (
          <button
            onClick={timer.pauseTimer}
            className="py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg font-semibold transition-all"
          >
            Pause
          </button>
        ) : (
          <button
            onClick={timer.startTimer}
            className="py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all"
          >
            Start
          </button>
        )}

        {timer.isActive && (
          <button
            onClick={timer.resumeTimer}
            className="py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all"
          >
            Resume
          </button>
        )}

        <button
          onClick={() => timer.resetTimer(preset * 60)}
          className="py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all"
        >
          Reset
        </button>
      </div>

      {/* Info */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Maximum custom timer: 24 hours
      </div>
    </div>
  );
};

export default AdvancedTimer;
