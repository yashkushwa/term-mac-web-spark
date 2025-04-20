
import React, { useState } from 'react';
import MacOSWindow from '@/components/MacOSWindow';
import Terminal from '@/components/Terminal';
import { Terminal as TerminalIcon, Github, Code, Coffee } from 'lucide-react';

const Index = () => {
  const [username, setUsername] = useState(() => {
    // Generate a random username
    const names = ['user', 'guest', 'admin', 'dev', 'root'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    return randomName;
  });
  
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  
  return (
    <div className="flex flex-col min-h-screen app-bg p-4 md:p-8">
      {/* Menu bar */}
      <div className="fixed top-0 left-0 right-0 flex items-center justify-between px-4 py-1 bg-black/80 backdrop-blur-lg text-white text-sm z-10">
        <div className="flex items-center space-x-4">
          <span className="font-bold">macOS Terminal</span>
          <span>File</span>
          <span>Edit</span>
          <span>View</span>
          <span>Shell</span>
          <span>Window</span>
          <span>Help</span>
        </div>
        <div className="flex items-center space-x-3">
          <span>{date}</span>
        </div>
      </div>
      
      <header className="mt-10 mb-6">
        <h1 className="text-3xl font-bold text-white">macOS Terminal Web</h1>
        <p className="text-gray-400">Access your terminal from anywhere</p>
      </header>
      
      <div className="flex-1 flex items-center justify-center">
        <MacOSWindow 
          className="w-full max-w-4xl h-[70vh]" 
          title={`${username}@macos-web ~ — bash — 80×24`}
        >
          <Terminal className="h-full" />
        </MacOSWindow>
      </div>
      
      {/* Dock */}
      <div className="mt-auto mb-4 flex justify-center">
        <div className="macos-dock flex items-end px-4 py-2 space-x-4">
          <div className="dock-item bg-blue-500 p-2 rounded-lg">
            <TerminalIcon className="w-6 h-6 text-white" />
          </div>
          <div className="dock-item bg-purple-500 p-2 rounded-lg">
            <Code className="w-6 h-6 text-white" />
          </div>
          <div className="dock-item bg-gray-700 p-2 rounded-lg">
            <Github className="w-6 h-6 text-white" />
          </div>
          <div className="dock-item bg-amber-500 p-2 rounded-lg">
            <Coffee className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
      
      <footer className="text-center text-gray-500 text-sm">
        <p>A modern terminal experience powered by Flask and xterm.js</p>
        <p className="mt-1">© 2025 macOS Terminal Web</p>
      </footer>
    </div>
  );
};

export default Index;
