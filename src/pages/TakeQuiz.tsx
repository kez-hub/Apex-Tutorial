import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseTitle: string;
  questions: number;
  duration: number;
  difficulty: "easy" | "medium" | "hard";
  instructorId: string;
  instructorName: string;
  questionItems?: QuizQuestion[];
}

export default function TakeQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!id) return;

    const quizRef = doc(db, "quizzes", id);
    const unsubscribe = onSnapshot(
      quizRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          toast({
            title: "Quiz not found",
            description: "This quiz does not exist.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const data = snapshot.data() as Omit<Quiz, "id">;
        setQuiz({ id: snapshot.id, ...data });
        setTimeLeft(data.duration * 60); // Convert to seconds
        setLoading(false);
      },
      (error) => {
        console.error("Error loading quiz:", error);
        toast({
          title: "Unable to load quiz",
          description: "Please try again later.",
          variant: "destructive",
        });
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [id, toast]);

  // Timer countdown
  useEffect(() => {
    if (!quiz || isSubmitted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz, isSubmitted]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (isSubmitted || timeLeft > 0 || !quiz || !quiz.questionItems?.length) return;
    handleSubmitQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isSubmitted, quiz]);

  const questions = quiz?.questionItems || [];
  const currentQuestion = questions[currentQuestionIndex];

  const handleSelectAnswer = (optionId: string) => {
    setUserAnswers({
      ...userAnswers,
      [currentQuestion.id]: optionId,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quiz || !user || !questions || questions.length === 0) {
      console.error("Quiz or user not available", { quiz: !!quiz, user: !!user, questions: questions.length });
      return;
    }

    console.log("Submitting quiz for user:", user.uid);

    // Calculate score
    let correctCount = 0;
    questions.forEach((question) => {
      const selectedOptionId = userAnswers[question.id];
      const selectedOption = question.options.find(
        (opt) => opt.id === selectedOptionId,
      );
      if (selectedOption?.isCorrect) {
        correctCount++;
      }
    });

    const finalScore = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    setScore(finalScore);
    setIsSubmitted(true);

    // Save quiz result to Firestore
    try {
      const quizResultRef = doc(db, "users", user.uid, "quizResults", quiz.id);
      await setDoc(
        quizResultRef,
        {
          score: finalScore,
          maxScore: 100,
          completedAt: new Date().toISOString(),
          totalQuestions: questions.length,
          correctAnswers: correctCount,
          status: "completed",
        },
        { merge: true },
      );

      // Update quiz document to record completion
      const quizRef = doc(db, "quizzes", quiz.id);
      await setDoc(
        quizRef,
        {
          completions: {
            [user.uid]: {
              score: finalScore,
              completedAt: new Date().toISOString(),
            },
          },
        },
        { merge: true },
      );

      toast({
        title: "Quiz submitted",
        description: `You scored ${finalScore}% on this quiz.`,
      });
    } catch (error) {
      console.error("Error saving quiz result:", error);
      toast({
        title: "Error",
        description: "Failed to save your quiz result. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading || !quiz) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar isAuthenticated />
        <main className="container mx-auto px-4 py-8">
          <div className="h-[400px] w-full animate-pulse rounded-xl bg-muted" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!currentQuestion && !isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar isAuthenticated />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />
            <h1 className="font-heading text-3xl font-bold mb-2">
              No questions available
            </h1>
            <p className="text-muted-foreground mb-6">
              This quiz does not have questions yet.
            </p>
            <Button onClick={() => navigate(-1)}>Go back</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar isAuthenticated />
        <main className="container mx-auto px-4 py-8">
          <Button
            variant="outline"
            onClick={() => navigate("/quiz")}
            className="mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Quiz Center
          </Button>

          <Card className="mx-auto max-w-2xl border-border/60">
            <CardHeader>
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-center text-3xl">
                Quiz Completed!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="rounded-2xl border border-border/50 bg-muted/30 p-8 text-center">
                <p className="text-sm text-muted-foreground mb-2">Your Score</p>
                <p className="font-heading text-5xl font-bold mb-4">{score}%</p>
                <p className="text-muted-foreground">
                  You answered {Object.keys(userAnswers).length} of{" "}
                  {questions.length} questions correctly
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="font-semibold text-xl">Quiz Summary</h2>
                {questions.map((question, index) => {
                  const userAnswerId = userAnswers[question.id];
                  const userAnswer = question.options.find(
                    (opt) => opt.id === userAnswerId,
                  );
                  const correctAnswer = question.options.find(
                    (opt) => opt.isCorrect,
                  );
                  const isCorrect = userAnswer?.isCorrect;

                  return (
                    <div
                      key={question.id}
                      className={`rounded-2xl border p-4 ${
                        isCorrect
                          ? "border-green-200 bg-green-50"
                          : "border-red-200 bg-red-50"
                      }`}
                    >
                      <p className="mb-2 font-medium">Question {index + 1}</p>
                      <p className="text-sm mb-3">{question.question}</p>
                      {!isCorrect && (
                        <div className="text-sm">
                          <p className="text-red-600 font-medium mb-1">
                            Your answer: {userAnswer?.text || "Not answered"}
                          </p>
                          <p className="text-green-600 font-medium">
                            Correct answer: {correctAnswer?.text}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <Button
                onClick={() => navigate("/quiz")}
                className="w-full"
                size="lg"
              >
                Back to Quiz Center
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold">{quiz.title}</h1>
            <p className="text-muted-foreground">{quiz.courseTitle}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-2xl font-bold">
              <Clock className="h-5 w-5" />
              {formatTime(timeLeft)}
            </div>
            <p className="text-xs text-muted-foreground">Time remaining</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(
                ((currentQuestionIndex + 1) / questions.length) * 100,
              )}
              %
            </span>
          </div>
          <Progress
            value={((currentQuestionIndex + 1) / questions.length) * 100}
            className="h-2"
          />
        </div>

        {/* Question Card */}
        <Card className="mb-8 border-border/60">
          <CardHeader>
            <CardTitle className="text-2xl">
              {currentQuestion.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentQuestion.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelectAnswer(option.id)}
                className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
                  userAnswers[currentQuestion.id] === option.id
                    ? "border-primary bg-primary/10"
                    : "border-border/50 bg-background hover:border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-5 w-5 rounded-full border-2 ${
                      userAnswers[currentQuestion.id] === option.id
                        ? "border-primary bg-primary"
                        : "border-border/50"
                    }`}
                  />
                  <span>{option.text}</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          {currentQuestionIndex === questions.length - 1 ? (
            <Button onClick={handleSubmitQuiz} className="flex-1">
              Submit Quiz
            </Button>
          ) : (
            <Button onClick={handleNext} className="flex-1">
              Next
            </Button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
