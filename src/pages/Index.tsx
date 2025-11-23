import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TaskGenerator } from "@/components/TaskGenerator";
import { TaskPlayer } from "@/components/TaskPlayer";
import { ReadingPlayer } from "@/components/ReadingPlayer";
import { Quiz } from "@/components/Quiz";
import { Results } from "@/components/Results";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";

type Screen = 'home' | 'player' | 'quiz' | 'results';

interface Task {
  id: string;
  title: string;
  transcript: string;
  audio_url: string;
  task_type: 'lecture' | 'conversation' | 'reading';
  questions: unknown;
}

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [screen, setScreen] = useState<Screen>('home');
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleTaskGenerated = async (taskId: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) throw error;

      setCurrentTask(data);
      setScreen('player');
    } catch (error) {
      console.error('Error loading task:', error);
      toast.error('Failed to load task');
    }
  };

  const handleAudioComplete = () => {
    setScreen('quiz');
  };

  const handleQuizComplete = async (answers: number[], finalScore: number) => {
    setUserAnswers(answers);
    setScore(finalScore);

    // Save results to database
    if (user) {
      try {
        const questions = currentTask?.questions as any[] || [];
        await supabase.from('user_results').insert({
          task_id: currentTask?.id,
          user_id: user.id,
          user_answers: answers,
          score: finalScore,
          total_questions: questions.length,
        });
      } catch (error) {
        console.error('Error saving results:', error);
      }
    }

    setScreen('results');
  };

  const handleRestart = () => {
    setCurrentTask(null);
    setUserAnswers([]);
    setScore(0);
    setScreen('home');
  };

  const handleHome = () => {
    setCurrentTask(null);
    setUserAnswers([]);
    setScore(0);
    setScreen('home');
  };

  if (!session || !user) {
    return null; // Will redirect to auth page
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header 
        onHomeClick={handleHome}
        showHomeButton={screen !== 'home'}
      />
      
      <div className="container mx-auto px-4 py-8">
        {screen === 'home' && (
          <header className="text-center mb-12 space-y-4">
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              AI-powered practice tasks with automatic grading and detailed feedback
            </p>
          </header>
        )}

        {/* Main Content */}
        <main className="space-y-8">
          {screen === 'home' && (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full">
                  <GraduationCap className="h-5 w-5 text-accent" />
                  <span className="text-sm font-medium">Generate Your Practice Task</span>
                </div>
                <p className="text-muted-foreground">
                  Escolha entre lecture, conversation ou reading passage
                </p>
              </div>
              <TaskGenerator onTaskGenerated={handleTaskGenerated} />
            </div>
          )}

          {screen === 'player' && currentTask && (
            currentTask.task_type === 'reading' ? (
              <ReadingPlayer
                title={currentTask.title}
                transcript={currentTask.transcript}
                onComplete={handleAudioComplete}
                onBack={handleHome}
              />
            ) : (
              <TaskPlayer
                title={currentTask.title}
                transcript={currentTask.transcript}
                audioUrl={currentTask.audio_url}
                taskType={currentTask.task_type as 'lecture' | 'conversation'}
                onComplete={handleAudioComplete}
                onBack={handleHome}
              />
            )
          )}

          {screen === 'quiz' && currentTask && (
            <Quiz
              questions={currentTask.questions as any[]}
              onComplete={handleQuizComplete}
              onBack={() => setScreen('player')}
              transcript={currentTask.transcript}
              taskType={currentTask.task_type}
            />
          )}

          {screen === 'results' && currentTask && (
            <Results
              questions={currentTask.questions as any[]}
              userAnswers={userAnswers}
              score={score}
              onRestart={handleRestart}
              onHome={handleHome}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>Powered by Lovable AI & Web Speech API</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;