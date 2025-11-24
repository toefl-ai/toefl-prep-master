import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Home, RotateCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface WritingResultsProps {
  correction: any;
  userResponse: string;
  task: any;
  onBack: () => void;
  onRetry: () => void;
}

export const WritingResults = ({ correction, userResponse, task, onBack, onRetry }: WritingResultsProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-green-600 dark:text-green-400";
    if (score >= 3) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 4.5) return "Excelente";
    if (score >= 3.5) return "Bom";
    if (score >= 2.5) return "Satisfatório";
    if (score >= 1.5) return "Precisa Melhorar";
    return "Insuficiente";
  };

  const overallScore = correction.scores?.overall || 0;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Overall Score */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Resultado da Correção</CardTitle>
            <div className="text-right">
              <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore.toFixed(1)}/5.0
              </div>
              <Badge variant={overallScore >= 4 ? "default" : overallScore >= 3 ? "secondary" : "destructive"}>
                {getScoreLabel(overallScore)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={overallScore * 20} className="h-3" />
        </CardContent>
      </Card>

      {/* Detailed Scores */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📊 Pontuação Detalhada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(correction.scores || {}).map(([key, value]: [string, any]) => {
              if (key === 'overall') return null;
              const labels: Record<string, string> = {
                content: 'Conteúdo / Tarefa',
                organization: 'Organização',
                grammar: 'Gramática & Vocabulário',
                style: 'Estilo Acadêmico'
              };
              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{labels[key]}</span>
                    <span className={`font-bold ${getScoreColor(value)}`}>{value}/5</span>
                  </div>
                  <Progress value={value * 20} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📈 Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Tipo de Task:</span>
              <Badge>{task.writingType === 'integrated' ? 'Task 1: Integrated' : 'Task 2: Independent'}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span>Palavras escritas:</span>
              <span className="font-medium">{correction.wordCount || userResponse.trim().split(/\s+/).length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Mínimo requerido:</span>
              <span className="font-medium">{task.writingType === 'integrated' ? '150-225' : '300+'} palavras</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strengths and Weaknesses */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Pontos Fortes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {correction.strengths?.map((strength: string, idx: number) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-green-600 flex-shrink-0">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-lg">Pontos a Melhorar</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {correction.weaknesses?.map((weakness: string, idx: number) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-red-600 flex-shrink-0">✗</span>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">💡 Sugestões de Melhoria</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {correction.suggestions?.map((suggestion: string, idx: number) => (
              <li key={idx} className="flex gap-2">
                <span className="text-primary flex-shrink-0">→</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Rewrite Suggestion */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="text-lg">✨ Versão Melhorada (Exemplo)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap leading-relaxed">{correction.rewriteSuggestion}</p>
          </div>
        </CardContent>
      </Card>

      {/* Your Response */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">📝 Sua Resposta Original</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap leading-relaxed">{userResponse}</p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <Button variant="outline" onClick={onBack}>
          <Home className="mr-2 h-4 w-4" />
          Voltar ao Início
        </Button>
        <Button onClick={onRetry}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Tentar Novamente
        </Button>
      </div>
    </div>
  );
};
