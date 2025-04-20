
import React from 'react';
import MacOSWindow from '@/components/MacOSWindow';
import Terminal from '@/components/Terminal';
import { Square } from 'lucide-react';

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-white">macOS Terminal Web</h1>
        <p className="text-gray-400">Access your terminal from anywhere</p>
      </header>
      
      <div className="flex-1 flex items-center justify-center">
        <MacOSWindow className="w-full max-w-4xl h-[70vh]" title="user@macos-web ~ — bash">
          <Terminal className="h-full" />
        </MacOSWindow>
      </div>
      
      <footer className="mt-6 text-center text-gray-500 text-sm">
        <p>A modern terminal experience powered by Flask and xterm.js</p>
        <p className="mt-1">© 2025 macOS Terminal Web</p>
      </footer>
    </div>
  );
};

export default Index;
