
import React, { ReactNode, useState } from 'react';
import { X, Minus, Square } from 'lucide-react';

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
  const [isFocused, setIsFocused] = useState(true);
  
  return (
    <div 
      className={`flex flex-col overflow-hidden rounded-lg shadow-2xl ${isFocused ? 'ring-1 ring-gray-400/20' : ''} bg-[#1e1e1e] border border-[#363636] ${className}`}
      onMouseDown={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      tabIndex={0}
    >
      {/* macOS window title bar */}
      <div className="flex items-center px-4 py-2 bg-gradient-to-b from-[#3a3a3a] to-[#2d2d2d] border-b border-[#363636]">
        <div className="flex space-x-2 mr-4">
          <button className="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-90 transition-all flex items-center justify-center group">
            <X className="w-2 h-2 text-[#800500] opacity-0 group-hover:opacity-100" />
          </button>
          <button className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-90 transition-all flex items-center justify-center group">
            <Minus className="w-2 h-2 text-[#9a6500] opacity-0 group-hover:opacity-100" />
          </button>
          <button className="w-3 h-3 rounded-full bg-[#27c93f] hover:brightness-90 transition-all flex items-center justify-center group">
            <Square className="w-2 h-2 text-[#006500] opacity-0 group-hover:opacity-100" />
          </button>
        </div>
        <div className="flex-1 text-center text-sm text-gray-300 font-medium font-mono truncate">
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
