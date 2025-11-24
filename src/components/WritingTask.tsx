import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface WritingTaskProps {
  task: any;
  onSubmit: (response: string) => void;
  onBack: () => void;
}

export const WritingTask = ({ task, onSubmit, onBack }: WritingTaskProps) => {
  const [userResponse, setUserResponse] = useState("");
  const [timeLeft, setTimeLeft] = useState(task.writingType === 'integrated' ? 1200 : 1800); // 20 or 30 minutes in seconds
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.warning("Tempo esgotado!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const words = userResponse.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
  }, [userResponse]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    const minWords = task.writingType === 'integrated' ? 150 : 300;
    if (wordCount < minWords) {
      toast.error(`Você precisa escrever pelo menos ${minWords} palavras. Palavras atuais: ${wordCount}`);
      return;
    }
    onSubmit(userResponse);
  };

  const isIntegrated = task.writingType === 'integrated';
  const minWords = isIntegrated ? 150 : 300;
  const maxWords = isIntegrated ? 225 : null;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header with Timer */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={isIntegrated ? 'default' : 'secondary'}>
                  {isIntegrated ? 'Task 1: Integrated Writing' : 'Task 2: Independent Writing'}
                </Badge>
              </div>
              <CardTitle>{task.title}</CardTitle>
            </div>
            <div className="flex items-center gap-2 text-2xl font-bold">
              <Clock className="h-6 w-6" />
              <span className={timeLeft < 300 ? "text-destructive" : ""}>{formatTime(timeLeft)}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className={`grid ${isIntegrated ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-6`}>
        {/* Content Section */}
        {isIntegrated ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📘 Reading Passage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none h-[300px] overflow-y-auto">
                  {task.readingPassage?.split('\n').map((para: string, idx: number) => (
                    para.trim() && <p key={idx} className="mb-3">{para}</p>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🎧 Lecture Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none h-[300px] overflow-y-auto">
                  {task.lectureSummary?.split('\n').map((para: string, idx: number) => (
                    para.trim() && <p key={idx} className="mb-3">{para}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">❓ Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-lg">{task.prompt}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Writing Section */}
        <Card className={isIntegrated ? '' : 'lg:col-span-1'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">✍️ Your Response</CardTitle>
              <div className="text-sm">
                <span className={wordCount < minWords ? "text-destructive" : "text-muted-foreground"}>
                  {wordCount} palavras
                </span>
                <span className="text-muted-foreground">
                  {' '}(mínimo: {minWords}{maxWords && `, máximo: ${maxWords}`})
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              placeholder={isIntegrated 
                ? "Summarize the points made in the lecture and explain how they respond to points made in the reading..." 
                : "Write your essay here. Include an introduction with your thesis, body paragraphs with examples, and a conclusion..."}
              className="min-h-[500px] font-mono text-sm"
            />

            <div className="flex justify-between gap-4">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={wordCount < minWords}
              >
                Enviar e Ver Correção
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Question */}
      {isIntegrated && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm font-medium">
              <strong>Question:</strong> {task.question}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
