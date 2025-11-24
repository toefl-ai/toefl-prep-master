import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, Volume2, ChevronDown, ChevronUp, Languages, SkipForward, SkipBack } from "lucide-react";
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
  const [selectedVoice2, setSelectedVoice2] = useState<string>("");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const intervalRef = useRef<number | null>(null);
  const currentUtteranceIndex = useRef<number>(0);

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
      
      // Set default voices (prefer different voices for conversations)
      if (englishVoices.length > 0) {
        if (!selectedVoice) {
          const usVoice = englishVoices.find(v => v.lang === 'en-US');
          setSelectedVoice(usVoice?.name || englishVoices[0].name);
        }
        if (!selectedVoice2 && taskType === 'conversation' && englishVoices.length > 1) {
          // Pick a different voice for the second speaker
          const secondVoice = englishVoices.find(v => v.name !== selectedVoice) || englishVoices[1];
          setSelectedVoice2(secondVoice?.name || englishVoices[Math.min(1, englishVoices.length - 1)].name);
        }
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
    currentUtteranceIndex.current = 0;

    // Clean transcript: remove any <br> or <br/> tags that might exist
    const cleanedTranscript = transcript.replace(/<br\s*\/?>/gi, '\n');

    // For conversations, split by speaker and alternate voices
    if (taskType === 'conversation') {
      const lines = cleanedTranscript.split('\n').filter(line => line.trim());
      speakConversationLines(lines);
    } else {
      // For lectures, use single voice
      speakSingleUtterance(cleanedTranscript);
    }

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

  const speakSingleUtterance = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    if (selectedVoice) {
      const voice = availableVoices.find(v => v.name === selectedVoice);
      if (voice) utterance.voice = voice;
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
  };

  const speakConversationLines = (lines: string[]) => {
    if (currentUtteranceIndex.current >= lines.length) {
      setIsPlaying(false);
      setCurrentTime(duration);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      onComplete();
      return;
    }

    const line = lines[currentUtteranceIndex.current];
    // Remove speaker name (e.g., "Student:", "Professor:", etc.) from the line
    const textToSpeak = line.replace(/^[^:]+:\s*/, '').trim();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Detect speaker and assign voice
    // Typically first speaker (Student) uses voice 1, second speaker (Professor/Advisor) uses voice 2
    const isFirstSpeaker = line.toLowerCase().startsWith('student') || 
                          (currentUtteranceIndex.current % 2 === 0);
    
    const voiceName = isFirstSpeaker ? selectedVoice : selectedVoice2;
    if (voiceName) {
      const voice = availableVoices.find(v => v.name === voiceName);
      if (voice) utterance.voice = voice;
    }

    utterance.onend = () => {
      currentUtteranceIndex.current++;
      speakConversationLines(lines);
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

  const skipTime = (seconds: number) => {
    const newTime = Math.max(0, Math.min(currentTime + seconds, duration));
    setCurrentTime(newTime);
    
    if (isPlaying) {
      // Cancel current speech and restart from approximate position
      speechSynthesis.cancel();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // For conversations, calculate which line should be playing
      if (taskType === 'conversation') {
        const cleanedTranscript = transcript.replace(/<br\s*\/?>/gi, '\n');
        const lines = cleanedTranscript.split('\n').filter(line => line.trim());
        const timePerLine = duration / lines.length;
        currentUtteranceIndex.current = Math.floor(newTime / timePerLine);
        speakConversationLines(lines);
      } else {
        // For lectures, just restart from beginning (limitation of Web Speech API)
        currentUtteranceIndex.current = 0;
        startSpeech();
      }
      
      // Restart progress interval
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
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Languages className="h-4 w-4 text-muted-foreground" />
                <span>{taskType === 'conversation' ? 'Voice 1 (Student):' : 'Select Voice / Accent:'}</span>
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

            {taskType === 'conversation' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Languages className="h-4 w-4 text-muted-foreground" />
                  <span>Voice 2 (Professor/Advisor):</span>
                </div>
                <Select value={selectedVoice2} onValueChange={setSelectedVoice2}>
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
          </div>
        )}

        {/* Audio Player */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              onClick={togglePlay}
              size="lg"
              className="h-14 w-14 rounded-full flex-shrink-0"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-1" />
              )}
            </Button>
            
            <div className="flex gap-2 flex-shrink-0">
              <Button
                onClick={() => skipTime(-5)}
                size="sm"
                variant="outline"
                className="h-10 w-10 p-0"
                title="Voltar 5 segundos"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => skipTime(5)}
                size="sm"
                variant="outline"
                className="h-10 w-10 p-0"
                title="Adiantar 5 segundos"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
            
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
                {transcript.replace(/<br\s*\/?>/gi, '\n')}
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