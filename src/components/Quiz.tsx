import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  type: string;
}

interface QuizProps {
  questions: Question[];
  onComplete: (answers: number[], score: number) => void;
  onBack?: () => void;
  transcript?: string;
  taskType?: 'lecture' | 'conversation' | 'reading';
}

export const Quiz = ({ questions, onComplete, onBack, transcript, taskType }: QuizProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(questions.length).fill(-1));
  const [selectedAnswer, setSelectedAnswer] = useState<number>(-1);

  const handleNext = () => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(newAnswers[currentQuestion + 1]);
    } else {
      // Calculate score
      const score = newAnswers.reduce((acc, answer, idx) => {
        return acc + (answer === questions[idx].correctAnswer ? 1 : 0);
      }, 0);
      onComplete(newAnswers, score);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1]);
    }
  };

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isReading = taskType === 'reading';

  // For reading, split transcript into paragraphs
  const paragraphs = isReading && transcript 
    ? transcript.split('\n').filter(p => p.trim()) 
    : [];

  return (
    <div className={`w-full ${isReading ? 'max-w-7xl' : 'max-w-4xl'} mx-auto`}>
      <div className={`${isReading ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}`}>
        {/* Reading Passage - Left Column */}
        {isReading && transcript && (
          <Card className="h-fit sticky top-4">
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Reading Passage</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[600px] overflow-y-auto pr-4">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  {paragraphs.map((paragraph, index) => (
                    <p key={index} className="mb-4 text-sm leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questions - Right Column (or Full Width) */}
        <Card className="w-full">
      <CardHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle>Question {currentQuestion + 1} of {questions.length}</CardTitle>
            <Badge variant="outline">{question.type}</Badge>
          </div>
          
          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <p className="text-lg font-medium leading-relaxed">{question.text}</p>

        <RadioGroup value={selectedAnswer.toString()} onValueChange={(value) => setSelectedAnswer(parseInt(value))}>
          <div className="space-y-3">
            {question.options.map((option, idx) => (
              <div
                key={idx}
                className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedAnswer === idx
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedAnswer(idx)}
              >
                <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                <Label
                  htmlFor={`option-${idx}`}
                  className="flex-1 cursor-pointer text-base"
                >
                  {option}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>

        <div className="flex justify-between pt-4">
          {onBack && currentQuestion === 0 ? (
            <Button
              variant="outline"
              onClick={onBack}
            >
              Voltar ao Áudio
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>
          )}
          
          <Button
            onClick={handleNext}
            disabled={selectedAnswer === -1}
          >
            {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </div>
      </CardContent>
    </Card>
      </div>
    </div>
  );
};