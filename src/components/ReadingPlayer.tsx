import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ReadingPlayerProps {
  title: string;
  transcript: string;
  onComplete: () => void;
  onBack: () => void;
}

export const ReadingPlayer = ({ title, transcript, onComplete, onBack }: ReadingPlayerProps) => {
  const [hasRead, setHasRead] = useState(false);

  const handleContinue = () => {
    setHasRead(true);
    onComplete();
  };

  // Split transcript into paragraphs
  const paragraphs = transcript.split('\n').filter(p => p.trim());

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">{title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                TOEFL Reading Practice - Leia atentamente a passagem
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={onBack}>
            Voltar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <ScrollArea className="h-[500px] w-full rounded-md border p-6 bg-muted/30">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="mb-4 text-base leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </ScrollArea>

        <div className="mt-6 flex items-center justify-between p-4 bg-accent/10 rounded-lg">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" />
            <p className="text-sm text-muted-foreground">
              Leia a passagem completa antes de responder às questões
            </p>
          </div>
          <Button onClick={handleContinue} size="lg" className="gap-2">
            Começar Questões
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 text-xs text-muted-foreground text-center">
          Dica: Você poderá voltar ao texto durante as questões
        </div>
      </CardContent>
    </Card>
  );
};