
import React, { useState } from 'react';
import VoiceChanger from '@/components/VoiceChanger';
import ApiKeyInput from '@/components/ApiKeyInput';

const Index = () => {
  const [apiKey, setApiKey] = useState<string>('');

  const handleApiKeySubmit = (key: string) => {
    setApiKey(key);
    // Store in localStorage for persistence
    localStorage.setItem('elevenlabs_api_key', key);
  };

  // Check for existing API key on load
  React.useEffect(() => {
    const savedApiKey = localStorage.getItem('elevenlabs_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  if (!apiKey) {
    return <ApiKeyInput onApiKeySubmit={handleApiKeySubmit} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8">
      <div className="container mx-auto">
        <VoiceChanger apiKey={apiKey} />
        
        {/* Reset API Key Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => {
              setApiKey('');
              localStorage.removeItem('elevenlabs_api_key');
            }}
            className="text-purple-400 hover:text-purple-300 text-sm underline"
          >
            Change API Key
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
