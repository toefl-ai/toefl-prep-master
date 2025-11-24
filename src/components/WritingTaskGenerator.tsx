import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BookOpen, PenTool } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WritingTaskGeneratorProps {
  onTaskGenerated: (task: any) => void;
}

export const WritingTaskGenerator = ({ onTaskGenerated }: WritingTaskGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateTask = async (writingType: 'integrated' | 'independent') => {
    setIsGenerating(true);
    try {
      console.log(`Generating ${writingType} writing task...`);
      
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { taskType: 'writing', writingType }
      });

      if (error) throw error;

      console.log('Generated writing task:', data);
      
      const taskData = {
        ...data,
        writingType,
        task_type: 'writing'
      };
      
      onTaskGenerated(taskData);
      toast.success(`Task ${writingType === 'integrated' ? '1' : '2'} gerada com sucesso!`);
    } catch (error) {
      console.error('Error generating writing task:', error);
      toast.error('Erro ao gerar task de writing');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            <CardTitle>Task 1: Integrated Writing</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Leia um texto acadêmico e ouça uma lecture que desafia os pontos apresentados. 
            Escreva um resumo de 150-225 palavras explicando como a lecture responde ao texto.
          </p>
          <div className="text-sm space-y-1">
            <p><strong>Tempo:</strong> 20 minutos</p>
            <p><strong>Palavras:</strong> 150-225</p>
            <p><strong>Tipo:</strong> Análise objetiva (sem opinião pessoal)</p>
          </div>
          <Button 
            onClick={() => generateTask('integrated')}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              'Gerar Task 1'
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-3">
            <PenTool className="h-6 w-6 text-primary" />
            <CardTitle>Task 2: Independent Writing</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Escreva uma redação de 300+ palavras respondendo a uma pergunta de opinião. 
            Apresente sua tese, desenvolva argumentos com exemplos e conclua claramente.
          </p>
          <div className="text-sm space-y-1">
            <p><strong>Tempo:</strong> 30 minutos</p>
            <p><strong>Palavras:</strong> 300+</p>
            <p><strong>Tipo:</strong> Argumentação com opinião pessoal</p>
          </div>
          <Button 
            onClick={() => generateTask('independent')}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              'Gerar Task 2'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
