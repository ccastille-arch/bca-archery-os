import { useEffect, useRef } from 'react';
import { trackScreenView, trackScreenExit } from './analytics';

export function useScreenTracking(screenName: string) {
  const startTime = useRef(Date.now());

  useEffect(() => {
    startTime.current = Date.now();
    trackScreenView(screenName);

    return () => {
      const duration = Date.now() - startTime.current;
      trackScreenExit(screenName, duration);
    };
  }, [screenName]);
}
