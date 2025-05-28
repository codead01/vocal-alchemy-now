
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Settings, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useConversation } from '@11labs/react';

interface VoiceChangerProps {
  apiKey: string;
}

const VoiceChanger: React.FC<VoiceChangerProps> = ({ apiKey }) => {
  const [volume, setVolume] = useState([80]);
  const [selectedVoice, setSelectedVoice] = useState('9BWtsMINqrJLrRacOk9x'); // Aria
  const [audioLevel, setAudioLevel] = useState(0);
  const { toast } = useToast();

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to real-time voice changer');
      toast({
        title: "Connected!",
        description: "Real-time voice transformation is now active.",
      });
    },
    onDisconnect: () => {
      console.log('Disconnected from voice changer');
      toast({
        title: "Disconnected",
        description: "Real-time voice transformation stopped.",
      });
    },
    onError: (error) => {
      console.error('Conversation error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to voice transformation service.",
        variant: "destructive"
      });
    },
    overrides: {
      tts: {
        voiceId: selectedVoice
      }
    }
  });

  const voices = [
    { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria - Natural Female' },
    { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger - Professional Male' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah - Friendly Female' },
    { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George - Deep Male' },
    { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam - Young Male' },
    { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte - Elegant Female' }
  ];

  // Request microphone permission on component mount
  useEffect(() => {
    const requestMicPermission = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone permission granted');
      } catch (error) {
        console.error('Microphone permission denied:', error);
        toast({
          title: "Microphone Access Required",
          description: "Please allow microphone access for real-time voice transformation.",
          variant: "destructive"
        });
      }
    };

    requestMicPermission();
  }, [toast]);

  // Update volume when slider changes
  useEffect(() => {
    if (conversation.status === 'connected') {
      conversation.setVolume({ volume: volume[0] / 100 });
    }
  }, [volume, conversation]);

  const startRealTimeVoiceChange = async () => {
    try {
      // For now, we'll use a default agent ID - users will need to create their own agent
      const defaultAgentId = 'your-agent-id-here';
      
      // Create a signed URL for the conversation with agent_id parameter
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${defaultAgentId}`, {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`Failed to get signed URL: ${response.status}`);
      }

      const data = await response.json();
      await conversation.startSession({ 
        authorization: `Bearer ${apiKey}`,
        overrides: {
          tts: {
            voiceId: selectedVoice
          }
        }
      });
    } catch (error) {
      console.error('Error starting real-time voice change:', error);
      toast({
        title: "Setup Required",
        description: "Please create an agent in ElevenLabs dashboard first, then update the agent ID in the code.",
        variant: "destructive"
      });
    }
  };

  const stopRealTimeVoiceChange = async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error('Error stopping conversation:', error);
    }
  };

  // Simulate audio level for visual feedback
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (conversation.status === 'connected') {
      interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);
    } else {
      setAudioLevel(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [conversation.status]);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Main Control Panel */}
      <Card className="p-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border-purple-500/20">
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-bold text-white mb-8">Real-Time Voice Transformer</h2>
          
          {/* Audio Level Visualization */}
          <div className="relative h-32 bg-black/30 rounded-lg overflow-hidden border border-purple-500/30">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex space-x-1 h-full items-end p-4">
                {Array.from({ length: 32 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-t from-purple-600 to-cyan-400 w-2 rounded-t transition-all duration-100"
                    style={{
                      height: `${Math.random() * (conversation.status === 'connected' ? audioLevel : 10) + 5}%`
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent animate-pulse" />
          </div>

          {/* Recording Controls */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={conversation.status === 'connected' ? stopRealTimeVoiceChange : startRealTimeVoiceChange}
              size="lg"
              className={`h-16 w-16 rounded-full transition-all duration-300 ${
                conversation.status === 'connected'
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {conversation.status === 'connected' ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
          </div>

          <p className="text-gray-300">
            {conversation.status === 'connected' 
              ? 'Real-time voice transformation is active - speak into your microphone!' 
              : 'Click microphone to start real-time voice transformation'
            }
          </p>
        </div>
      </Card>

      {/* Voice & Settings Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-slate-800/50 border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2 text-purple-400" />
            Voice Selection
          </h3>
          <Select value={selectedVoice} onValueChange={setSelectedVoice}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {voices.map((voice) => (
                <SelectItem key={voice.id} value={voice.id}>
                  {voice.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        <Card className="p-6 bg-slate-800/50 border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Volume2 className="h-5 w-5 mr-2 text-purple-400" />
            Audio Controls
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Volume: {volume[0]}%</label>
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Status Indicators */}
      <Card className="p-4 bg-slate-800/30 border-slate-700">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${conversation.status === 'connected' ? 'text-green-400' : 'text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full ${conversation.status === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
              <span>Status: {conversation.status === 'connected' ? 'Connected' : 'Disconnected'}</span>
            </div>
            <div className={`flex items-center space-x-2 ${conversation.isSpeaking ? 'text-blue-400' : 'text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full ${conversation.isSpeaking ? 'bg-blue-400 animate-pulse' : 'bg-gray-400'}`} />
              <span>AI Speaking: {conversation.isSpeaking ? 'Yes' : 'No'}</span>
            </div>
          </div>
          <div className="text-gray-400">
            Real-time Voice Transformation
          </div>
        </div>
      </Card>

      {/* Setup Instructions */}
      <Card className="p-4 bg-amber-900/20 border-amber-500/30">
        <div className="text-amber-200 text-sm">
          <p className="font-semibold mb-2">Setup Required:</p>
          <p>To use real-time voice transformation, you need to:</p>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Create a conversational AI agent in your ElevenLabs dashboard</li>
            <li>Copy the agent ID and replace 'your-agent-id-here' in the code</li>
            <li>Configure the agent with your preferred voice and settings</li>
          </ol>
        </div>
      </Card>
    </div>
  );
};

export default VoiceChanger;
