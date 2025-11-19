import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, RotateCcw, Home } from "lucide-react";

interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  type: string;
}

interface ResultsProps {
  questions: Question[];
  userAnswers: number[];
  score: number;
  onRestart: () => void;
  onHome: () => void;
}

export const Results = ({ questions, userAnswers, score, onRestart, onHome }: ResultsProps) => {
  const percentage = Math.round((score / questions.length) * 100);
  
  const getScoreColor = () => {
    if (percentage >= 80) return "text-success";
    if (percentage >= 60) return "text-warning";
    return "text-destructive";
  };

  const getScoreBadge = () => {
    if (percentage >= 80) return { text: "Excellent!", variant: "default" as const };
    if (percentage >= 60) return { text: "Good Job!", variant: "secondary" as const };
    return { text: "Keep Practicing", variant: "destructive" as const };
  };

  const badge = getScoreBadge();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Score Card */}
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Your Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className={`text-6xl font-bold ${getScoreColor()}`}>
              {percentage}%
            </div>
            <p className="text-muted-foreground mt-2">
              {score} out of {questions.length} correct
            </p>
          </div>
          
          <Badge variant={badge.variant} className="text-lg py-2 px-4">
            {badge.text}
          </Badge>

          <div className="flex gap-4 justify-center">
            <Button onClick={onRestart} size="lg">
              <RotateCcw className="mr-2 h-5 w-5" />
              Try Another
            </Button>
            <Button onClick={onHome} variant="outline" size="lg">
              <Home className="mr-2 h-5 w-5" />
              Home
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Feedback */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Detailed Feedback</h3>
        
        {questions.map((question, idx) => {
          const userAnswer = userAnswers[idx];
          const isCorrect = userAnswer === question.correctAnswer;
          
          return (
            <Card key={idx} className={isCorrect ? "border-success/50" : "border-destructive/50"}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{question.type}</Badge>
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <CardTitle className="text-base font-medium">
                      Question {idx + 1}: {question.text}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Your answer:</span>
                    <span className={isCorrect ? "text-success" : "text-destructive"}>
                      {userAnswer >= 0 ? question.options[userAnswer] : "Not answered"}
                    </span>
                  </div>
                  
                  {!isCorrect && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Correct answer:</span>
                      <span className="text-success">
                        {question.options[question.correctAnswer]}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-1">Explanation:</p>
                  <p className="text-sm text-muted-foreground">{question.explanation}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};