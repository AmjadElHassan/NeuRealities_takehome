import { useEffect, useRef } from 'react';

interface UseSmoothAutoScrollOptions {
  /** Whether auto-scrolling should be active */
  enabled: boolean;
  /** Distance from bottom (in pixels) to trigger auto-scroll */
  threshold?: number;
  /** Scroll behavior: 'smooth' or 'auto' */
  behavior?: ScrollBehavior;
  /** Delay before resetting scroll behavior (ms) */
  resetDelay?: number;
  /** Dependencies that should trigger scroll check */
  dependencies?: any[];
}

/**
 * Custom hook for smooth auto-scrolling to bottom of a container
 * Useful for chat interfaces, logs, or any auto-updating content
 *
 * @param scrollContainerRef - Ref to the scrollable container element
 * @param options - Configuration options for the auto-scroll behavior
 * @returns Object with methods to control scrolling
 */
export const useSmoothAutoScroll = (
  scrollContainerRef: React.RefObject<HTMLElement | null>,
  options: UseSmoothAutoScrollOptions
) => {
  const {
    enabled,
    threshold = 100,
    behavior = 'smooth',
    resetDelay = 100,
    dependencies = []
  } = options;

  const rafIdRef = useRef<number | undefined>(undefined);
  const lastScrollHeightRef = useRef<number>(0);
  const shouldAutoScrollRef = useRef<boolean>(true);

  // Manual scroll to bottom
  const scrollToBottom = (smooth: boolean = true) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollBehavior = smooth ? 'smooth' : 'auto';
    container.style.scrollBehavior = scrollBehavior;
    container.scrollTop = container.scrollHeight - container.clientHeight;

    // Reset scroll behavior after animation
    if (smooth) {
      setTimeout(() => {
        if (container) {
          container.style.scrollBehavior = 'auto';
        }
      }, resetDelay);
    }
  };

  // Check if user is near bottom
  const isNearBottom = (): boolean => {
    const container = scrollContainerRef.current;
    if (!container) return false;

    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const scrollTop = container.scrollTop;
    const maxScrollTop = scrollHeight - clientHeight;
    const distanceFromBottom = maxScrollTop - scrollTop;

    return distanceFromBottom < threshold;
  };

  // Update whether auto-scroll should be active based on scroll position
  const updateAutoScrollState = () => {
    shouldAutoScrollRef.current = isNearBottom();
  };

  // Smooth auto-scroll effect
  useEffect(() => {
    if (!enabled) {
      // Clean up if disabled
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) return;

    // Initialize last scroll height
    lastScrollHeightRef.current = container.scrollHeight;

    const smoothScrollLoop = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const currentScrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const currentScrollTop = container.scrollTop;
      const maxScrollTop = currentScrollHeight - clientHeight;

      // Only scroll if content has grown and auto-scroll is enabled
      if (
        currentScrollHeight !== lastScrollHeightRef.current &&
        shouldAutoScrollRef.current
      ) {
        const distanceFromBottom = maxScrollTop - currentScrollTop;

        // If user is within threshold of bottom, keep them there
        if (distanceFromBottom < threshold) {
          container.style.scrollBehavior = behavior;
          container.scrollTop = maxScrollTop;

          // Reset to instant after animation
          setTimeout(() => {
            if (container) {
              container.style.scrollBehavior = 'auto';
            }
          }, resetDelay);
        }

        lastScrollHeightRef.current = currentScrollHeight;
      }

      rafIdRef.current = requestAnimationFrame(smoothScrollLoop);
    };

    // Start the animation loop
    rafIdRef.current = requestAnimationFrame(smoothScrollLoop);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      // Reset scroll behavior on cleanup
      if (container) {
        container.style.scrollBehavior = 'auto';
      }
    };
  }, [enabled, scrollContainerRef, threshold, behavior, resetDelay, ...dependencies]);

  // Handle manual scroll to detect user intent
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Don't update state while auto-scrolling is active
      if (!enabled) {
        updateAutoScrollState();
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [enabled, scrollContainerRef, threshold]);

  return {
    scrollToBottom,
    isNearBottom,
    updateAutoScrollState,
    shouldAutoScroll: shouldAutoScrollRef.current
  };
};

