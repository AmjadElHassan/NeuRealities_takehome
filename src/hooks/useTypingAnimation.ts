import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTypingAnimationOptions {
  speed?: number; // ms per character
  onComplete?: () => void;
}

export const useTypingAnimation = (
  text: string,
  isTyping: boolean,
  options: UseTypingAnimationOptions = {}
) => {
  const { speed = 30, onComplete } = options;
  const [displayedText, setDisplayedText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const indexRef = useRef(0);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);

  const startAnimation = useCallback(() => {
    if (!text || !isTyping) return;

    setIsAnimating(true);
    indexRef.current = 0;
    setDisplayedText('');
    lastTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current;

      if (deltaTime >= speed) {
        const currentIndex = indexRef.current;

        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          indexRef.current++;
          lastTimeRef.current = currentTime;
        } else {
          // Animation complete
          setIsAnimating(false);
          if (onComplete) {
            onComplete();
          }
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [text, isTyping, speed, onComplete]);

  // Start animation when typing begins
  useEffect(() => {
    if (isTyping && text) {
      startAnimation();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isTyping, text, startAnimation]);

  // Reset when text changes
  useEffect(() => {
    if (!isTyping) {
      setDisplayedText(text);
      setIsAnimating(false);
    }
  }, [text, isTyping]);

  return {
    displayedText,
    isAnimating,
  };
};