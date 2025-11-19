import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Book, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TaskGeneratorProps {
  onTaskGenerated: (taskId: string) => void;
}

export const TaskGenerator = ({ onTaskGenerated }: TaskGeneratorProps) => {
  const [generating, setGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState<'lecture' | 'conversation' | null>(null);

  const generateTask = async (taskType: 'lecture' | 'conversation') => {
    setGenerating(true);
    setSelectedType(taskType);
    
    try {
      // Step 1: Generate content using Lovable AI
      toast.info(`Generating ${taskType}...`);
      
      const { data: contentData, error: contentError } = await supabase.functions.invoke('generate-content', {
        body: { taskType }
      });

      if (contentError) throw contentError;
      
      console.log('Content generated:', contentData);

      // Step 2: Generate audio using ElevenLabs
      toast.info('Converting to speech...');
      
      const { data: audioData, error: audioError } = await supabase.functions.invoke('generate-audio', {
        body: { 
          text: contentData.transcript,
          taskType
        }
      });

      if (audioError) throw audioError;

      // Step 3: Save to database
      toast.info('Saving task...');
      
      const { data: task, error: dbError } = await supabase
        .from('tasks')
        .insert({
          task_type: taskType,
          title: contentData.title,
          transcript: contentData.transcript,
          audio_url: `data:audio/mpeg;base64,${audioData.audioData}`,
          questions: contentData.questions
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast.success('Task created successfully!');
      onTaskGenerated(task.id);

    } catch (error) {
      console.error('Error generating task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate task');
    } finally {
      setGenerating(false);
      setSelectedType(null);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
      <Card className="hover:shadow-large transition-all duration-300 border-2 hover:border-primary">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Book className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Academic Lecture</CardTitle>
              <CardDescription>4-5 minute lecture with 6 questions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => generateTask('lecture')}
            disabled={generating}
            className="w-full"
            size="lg"
          >
            {generating && selectedType === 'lecture' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Lecture'
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="hover:shadow-large transition-all duration-300 border-2 hover:border-accent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-accent/10">
              <MessageCircle className="h-6 w-6 text-accent" />
            </div>
            <div>
              <CardTitle>Campus Conversation</CardTitle>
              <CardDescription>2-3 minute dialogue with 5 questions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => generateTask('conversation')}
            disabled={generating}
            variant="secondary"
            className="w-full"
            size="lg"
          >
            {generating && selectedType === 'conversation' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Conversation'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};