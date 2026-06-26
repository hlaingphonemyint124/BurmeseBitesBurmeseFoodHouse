import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function usePageTransition() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('enter');

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage('exit');
    }
  }, [location]);

  const onAnimationEnd = () => {
    if (transitionStage === 'exit') {
      setTransitionStage('enter');
      setDisplayLocation(location);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  return { displayLocation, transitionStage, onAnimationEnd };
}
