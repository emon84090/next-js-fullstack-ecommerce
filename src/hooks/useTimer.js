import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for advanced timer functionality
 * @param {number} initialSeconds - Initial time in seconds
 * @param {function} onComplete - Callback when timer completes
 * @returns {object} Timer state and controls
 */
export const useTimer = (initialSeconds = 0, onComplete = null) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);

  useEffect(() => {
    let interval = null;

    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds - 1);
      }, 1000);
    } else if (seconds === 0 && isActive) {
      setIsActive(false);
      onComplete?.();
    }

    return () => clearInterval(interval);
  }, [isActive, seconds, onComplete]);

  const startTimer = useCallback(() => {
    setIsActive(true);
  }, []);

  const pauseTimer = useCallback(() => {
    setIsActive(false);
  }, []);

  const resumeTimer = useCallback(() => {
    setIsActive(true);
  }, []);

  const resetTimer = useCallback((newSeconds = initialSeconds) => {
    setIsActive(false);
    setSeconds(newSeconds);
    setTotalSeconds(newSeconds);
  }, [initialSeconds]);

  const setTimerDuration = useCallback((minutes) => {
    const totalSecs = minutes * 60;
    setSeconds(totalSecs);
    setTotalSeconds(totalSecs);
    setIsActive(false);
  }, []);

  // Format seconds to MM:SS format
  const formatTime = (secs) => {
    const minutes = Math.floor(secs / 60);
    const remainingSeconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = totalSeconds > 0 ? ((totalSeconds - seconds) / totalSeconds) * 100 : 0;

  return {
    seconds,
    formattedTime: formatTime(seconds),
    isActive,
    isComplete: seconds === 0,
    progressPercentage,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    setTimerDuration,
    formatTime,
  };
};
