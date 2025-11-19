import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, Volume2, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TaskPlayerProps {
  title: string;
  transcript: string;
  audioUrl: string;
  taskType: 'lecture' | 'conversation';
  onComplete: () => void;
}

export const TaskPlayer = ({ title, transcript, audioUrl, taskType, onComplete }: TaskPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      onComplete();
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onComplete]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
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
        {/* Audio Player */}
        <div className="space-y-4">
          <audio ref={audioRef} src={audioUrl} preload="metadata" />
          
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
      </CardContent>
    </Card>
  );
};