import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Square, Settings, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface VoiceChangerProps {
  apiKey: string;
}

const VoiceChanger: React.FC<VoiceChangerProps> = ({ apiKey }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([80]);
  const [pitch, setPitch] = useState([0]);
  const [selectedVoice, setSelectedVoice] = useState('9BWtsMINqrJLrRacOk9x'); // Aria
  const [audioLevel, setAudioLevel] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const voices = [
    { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria - Natural Female' },
    { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger - Professional Male' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah - Friendly Female' },
    { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George - Deep Male' },
    { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam - Young Male' },
    { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte - Elegant Female' }
  ];

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const setupAudioContext = async (stream: MediaStream) => {
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    
    const source = audioContextRef.current.createMediaStreamSource(stream);
    source.connect(analyserRef.current);
    
    analyserRef.current.fftSize = 256;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateAudioLevel = () => {
      if (analyserRef.current && isRecording) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        setAudioLevel(average);
        requestAnimationFrame(updateAudioLevel);
      }
    };
    
    updateAudioLevel();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      setupAudioContext(stream);
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Failed to access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      console.log('Recording stopped');
    }
  };

  const processVoice = async () => {
    if (audioChunksRef.current.length === 0) {
      toast({
        title: "No Recording",
        description: "Please record some audio first.",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    console.log('Processing voice transformation...');
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      console.log('Audio blob size:', audioBlob.size);
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('model_id', 'eleven_english_sts_v2');
      
      // Use the speech-to-speech endpoint instead of text-to-speech
      const response = await fetch(`https://api.elevenlabs.io/v1/speech-to-speech/${selectedVoice}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
        },
        body: formData
      });

      console.log('API response status:', response.status);

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audio = new Audio(audioUrl);
        audio.volume = volume[0] / 100;
        audio.play();
        setIsPlaying(true);
        
        audio.onended = () => setIsPlaying(false);
        
        toast({
          title: "Voice Transformed!",
          description: "Your voice has been successfully transformed.",
        });
      } else {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        toast({
          title: "Transformation Failed",
          description: "Failed to transform voice. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing voice:', error);
      toast({
        title: "Processing Error",
        description: "An error occurred while processing your voice.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Main Control Panel */}
      <Card className="p-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border-purple-500/20">
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-bold text-white mb-8">Voice Transformer</h2>
          
          {/* Audio Level Visualization */}
          <div className="relative h-32 bg-black/30 rounded-lg overflow-hidden border border-purple-500/30">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex space-x-1 h-full items-end p-4">
                {Array.from({ length: 32 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-t from-purple-600 to-cyan-400 w-2 rounded-t transition-all duration-100"
                    style={{
                      height: `${Math.random() * (isRecording ? audioLevel : 10) + 5}%`
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
              onClick={isRecording ? stopRecording : startRecording}
              size="lg"
              className={`h-16 w-16 rounded-full transition-all duration-300 ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
            
            <Button
              onClick={processVoice}
              disabled={audioChunksRef.current.length === 0 || isProcessing}
              size="lg"
              className="h-16 px-8 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>
          </div>

          <p className="text-gray-300">
            {isRecording ? 'Recording... Click microphone to stop' : 'Click microphone to start recording'}
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
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Pitch: {pitch[0]}</label>
              <Slider
                value={pitch}
                onValueChange={setPitch}
                min={-12}
                max={12}
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
            <div className={`flex items-center space-x-2 ${isRecording ? 'text-red-400' : 'text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-400 animate-pulse' : 'bg-gray-400'}`} />
              <span>Recording: {isRecording ? 'Active' : 'Inactive'}</span>
            </div>
            <div className={`flex items-center space-x-2 ${isProcessing ? 'text-yellow-400' : 'text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-yellow-400 animate-pulse' : 'bg-gray-400'}`} />
              <span>Processing: {isProcessing ? 'Active' : 'Ready'}</span>
            </div>
          </div>
          <div className="text-gray-400">
            Audio Level: {Math.round(audioLevel)}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VoiceChanger;
