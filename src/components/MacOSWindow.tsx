
import React, { ReactNode } from 'react';

interface MacOSWindowProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

const MacOSWindow: React.FC<MacOSWindowProps> = ({ 
  children, 
  title = "Terminal", 
  className = "" 
}) => {
  return (
    <div className={`flex flex-col overflow-hidden rounded-lg shadow-xl bg-[#1e1e1e] border border-[#363636] ${className}`}>
      {/* macOS window title bar */}
      <div className="flex items-center px-4 py-2 bg-[#2d2d2d] border-b border-[#363636]">
        <div className="flex space-x-2 mr-4">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
          <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
        </div>
        <div className="flex-1 text-center text-sm text-gray-400 font-medium">
          {title}
        </div>
        <div className="w-12"></div> {/* Spacer to balance the window controls */}
      </div>
      
      {/* Window content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default MacOSWindow;
