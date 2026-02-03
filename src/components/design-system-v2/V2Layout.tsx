import React from 'react';
import './v2-theme.css';

export const V2Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="v2-root">
            {/* Font Links - Manually injected here to ensure they are available for V2 only, 
          though normally these might go in a customized Document or Root Layout. 
          For now, this ensures the font is available if not globally loaded. */}

            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&family=Inter:wght@900&display=swap" rel="stylesheet" />

            {children}
        </div>
    );
};
