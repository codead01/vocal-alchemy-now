
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Key, ExternalLink } from 'lucide-react';

interface ApiKeyInputProps {
  onApiKeySubmit: (apiKey: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeySubmit }) => {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onApiKeySubmit(apiKey.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <Card className="w-full max-w-md p-8 bg-slate-800/80 border-purple-500/20 backdrop-blur-sm">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto">
            <Key className="h-8 w-8 text-white" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Voice Changer</h1>
            <p className="text-gray-300">Enter your ElevenLabs API key to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter your ElevenLabs API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
            />
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
              disabled={!apiKey.trim()}
            >
              Start Voice Changing
            </Button>
          </form>

          <div className="text-center">
            <a 
              href="https://elevenlabs.io/app/settings/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 text-sm flex items-center justify-center space-x-1"
            >
              <span>Get your API key from ElevenLabs</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="bg-slate-700/50 p-4 rounded-lg">
            <p className="text-xs text-gray-400 leading-relaxed">
              Your API key is stored locally and used only to communicate with ElevenLabs' voice transformation service. 
              It's never sent to any other servers.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ApiKeyInput;
