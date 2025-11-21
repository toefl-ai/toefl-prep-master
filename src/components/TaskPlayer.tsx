import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, Volume2, ChevronDown, ChevronUp, Languages } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface TaskPlayerProps {
  title: string;
  transcript: string;
  audioUrl: string;
  taskType: 'lecture' | 'conversation';
  onComplete: () => void;
  onBack?: () => void;
}

export const TaskPlayer = ({ title, transcript, taskType, onComplete, onBack }: TaskPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Estimate duration based on text length (avg speaking rate: 150 words per minute)
    const words = transcript.split(' ').length;
    const estimatedDuration = (words / 150) * 60;
    setDuration(estimatedDuration);

    // Load available voices
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      // Filter only English voices
      const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));
      setAvailableVoices(englishVoices);
      
      // Set default voice (prefer US English)
      if (englishVoices.length > 0 && !selectedVoice) {
        const usVoice = englishVoices.find(v => v.lang === 'en-US');
        setSelectedVoice(usVoice?.name || englishVoices[0].name);
      }
    };

    // Voices might not be loaded immediately
    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (utteranceRef.current) {
        speechSynthesis.cancel();
      }
    };
  }, [transcript]);

  const startSpeech = () => {
    if (!('speechSynthesis' in window)) {
      toast.error('Text-to-speech não é suportado neste navegador');
      return;
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(transcript);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Set selected voice
    if (selectedVoice) {
      const voice = availableVoices.find(v => v.name === selectedVoice);
      if (voice) {
        utterance.voice = voice;
      }
    }

    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentTime(duration);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      onComplete();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      toast.error('Erro ao reproduzir áudio');
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);

    // Simulate progress
    const increment = duration / 100;
    intervalRef.current = window.setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= duration) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          return duration;
        }
        return prev + increment;
      });
    }, (duration * 1000) / 100);
  };

  const togglePlay = () => {
    if (isPlaying) {
      speechSynthesis.pause();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setIsPlaying(false);
    } else {
      if (currentTime === 0 || currentTime >= duration) {
        setCurrentTime(0);
        startSpeech();
      } else {
        speechSynthesis.resume();
        // Resume interval
        const increment = duration / 100;
        intervalRef.current = window.setInterval(() => {
          setCurrentTime(prev => {
            if (prev >= duration) {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
              }
              return duration;
            }
            return prev + increment;
          });
        }, (duration * 1000) / 100);
      }
      setIsPlaying(true);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={taskType === 'lecture' ? 'default' : 'secondary'}>
                {taskType === 'lecture' ? 'Lecture' : 'Conversation'}
              </Badge>
            </div>
            <CardTitle>{title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Voice Selector */}
        {availableVoices.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <span>Select Voice / Accent:</span>
            </div>
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a voice" />
              </SelectTrigger>
              <SelectContent>
                {availableVoices.map((voice) => (
                  <SelectItem key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Audio Player */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={togglePlay}
              size="lg"
              className="h-14 w-14 rounded-full"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-1" />
              )}
            </Button>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <Volume2 className="h-4 w-4" />
                <span>{formatTime(duration)}</span>
              </div>
              
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Transcript Toggle */}
        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={() => setShowTranscript(!showTranscript)}
            className="w-full"
          >
            {showTranscript ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" />
                Hide Transcript
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                Show Transcript
              </>
            )}
          </Button>

          {showTranscript && (
            <div className="p-6 bg-muted/50 rounded-lg max-h-96 overflow-y-auto">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {transcript}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Voltar
            </Button>
          )}
          <Button 
            onClick={onComplete}
            className="ml-auto"
          >
            Continuar para Quiz
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};