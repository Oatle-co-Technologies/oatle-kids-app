import { useEffect } from 'react';

// Let the child see their finished work before the shared planet celebration.
// Leaving or replaying an activity cancels its pending completion.
export default function useLittleMissionCompletion(complete, onComplete) {
  useEffect(() => {
    if (!complete || !onComplete) return undefined;
    const timer = window.setTimeout(onComplete, 1800);
    return () => window.clearTimeout(timer);
  }, [complete, onComplete]);
}
