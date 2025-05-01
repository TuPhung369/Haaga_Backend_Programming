import React, { useEffect } from 'react';
import addDecorativeElements from './decorative-elements';

// Default implementation, that you can customize
export default function Root({children}) {
  useEffect(() => {
    // Add decorative elements after component mounts
    addDecorativeElements();
  }, []);

  return (
    <div className="content-background-wrapper">
      {/* Add a full-page background div */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, var(--gradient-light-start) 0%, var(--gradient-light-end) 100%)',
          zIndex: -10,
          pointerEvents: 'none',
        }}
      />
      {children}
    </div>
  );
}