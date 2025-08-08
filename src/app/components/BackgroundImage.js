'use client';

import { useEffect } from 'react';

export default function BackgroundImage() {
  useEffect(() => {
    // Simple check to ensure background image is properly set
    const checkBackground = () => {
      const computedStyle = window.getComputedStyle(document.body);
      const backgroundImage = computedStyle.backgroundImage;
      
      // If background image is not set or is 'none', apply fallback
      if (!backgroundImage || backgroundImage === 'none') {
        document.body.classList.add('background-fallback');
      } else {
        document.body.classList.remove('background-fallback');
      }
    };
    
    // Check after a short delay to allow CSS to load
    const timeout = setTimeout(checkBackground, 100);
    
    return () => clearTimeout(timeout);
  }, []);

  return null; // This component doesn't render anything visible
}
