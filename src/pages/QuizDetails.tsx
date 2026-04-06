import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle,
  Target,
  Clock,
  AlertCircle,
} from "lucide-react";

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
  videoId?: string;
  videoTitle?: string;
  noteId?: string;
  noteTitle?: string;
  questions: number;
  duration: number;
  difficulty: "easy" | "medium" | "hard";
  completed: boolean;
  score?: number;
  maxScore?: number;
  completedAt?: Date;
  instructorId: string;
  instructorName: string;
  createdAt: string;
  updatedAt: string;
  questionItems?: QuizQuestion[];
}

const defaultOptions = () => [
  { id: `option-${Date.now()}-1`, text: "", isCorrect: false },
  { id: `option-${Date.now()}-2`, text: "", isCorrect: false },
];

export default function QuizDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const { toast } = useToast();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<QuizOption[]>(defaultOptions());
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [userQuizResult, setUserQuizResult] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    const review = searchParams.get("review");
    setIsReviewMode(review === "true");

    const quizRef = doc(db, "quizzes", id);
    const unsubscribe = onSnapshot(
      quizRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setQuiz(null);
          setLoading(false);
          return;
        }
        const data = snapshot.data() as Omit<Quiz, "id">;
        setQuiz({ id: snapshot.id, ...data });
        setLoading(false);
      },
      (error) => {
        console.error("Error loading quiz details:", error);
        setLoading(false);
        toast({
          title: "Unable to load quiz",
          description: "Please try again later.",
          variant: "destructive",
        });
      },
    );

    // Load user answers if in review mode
    if (review === "true" && user) {
      const quizResultRef = doc(db, "users", user.uid, "quizResults", id);
      const resultUnsubscribe = onSnapshot(
        quizResultRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setUserAnswers(data.userAnswers || {});
            setUserQuizResult(data);
          }
        },
        (error) => {
          console.error("Error loading quiz results:", error);
        },
      );

      return () => {
        unsubscribe();
        resultUnsubscribe();
      };
    }

    return () => unsubscribe();
  }, [id, toast, searchParams, user]);

  const isInstructor = userData?.role === "instructor";

  const handleCorrectOptionChange = (optionId: string) => {
    setOptions((currentOptions) =>
      currentOptions.map((option) => ({
        ...option,
        isCorrect: option.id === optionId,
      })),
    );
  };

  const handleOptionTextChange = (optionId: string, text: string) => {
    setOptions((currentOptions) =>
      currentOptions.map((option) =>
        option.id === optionId ? { ...option, text } : option,
      ),
    );
  };

  const addOption = () => {
    setOptions((currentOptions) => [
      ...currentOptions,
      {
        id: `option-${Date.now()}`,
        text: "",
        isCorrect: false,
      },
    ]);
  };

  const removeOption = (optionId: string) => {
    setOptions((currentOptions) =>
      currentOptions.filter((option) => option.id !== optionId),
    );
  };

  const resetQuestionForm = () => {
    setQuestionText("");
    setOptions(defaultOptions());
  };

  const handleAddQuestion = async () => {
    if (!quiz || !id) return;
    const trimmedQuestion = questionText.trim();
    const validOptions = options.filter((option) => option.text.trim() !== "");
    const correctOption = validOptions.find((option) => option.isCorrect);

    if (!trimmedQuestion) {
      toast({
        title: "Question required",
        description: "Enter the question text before saving.",
        variant: "destructive",
      });
      return;
    }

    if (validOptions.length < 2) {
      toast({
        title: "More options needed",
        description: "Add at least two answer options.",
        variant: "destructive",
      });
      return;
    }

    if (!correctOption) {
      toast({
        title: "Select correct answer",
        description: "Mark one option as the correct answer.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const quizRef = doc(db, "quizzes", id);
      const newQuestion: QuizQuestion = {
        id: `question-${Date.now()}`,
        question: trimmedQuestion,
        options: validOptions,
      };
      const updatedQuestionItems = [...(quiz.questionItems || []), newQuestion];
      await updateDoc(quizRef, {
        questionItems: updatedQuestionItems,
        questions: updatedQuestionItems.length,
        updatedAt: new Date().toISOString(),
      });
      setQuiz({
        ...quiz,
        questionItems: updatedQuestionItems,
        questions: updatedQuestionItems.length,
      });
      toast({
        title: "Question added",
        description: "Your question and answer set have been saved.",
      });
      resetQuestionForm();
    } catch (error) {
      console.error("Error saving question:", error);
      toast({
        title: "Save failed",
        description: "Unable to save the question. Try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isInstructor && !isReviewMode) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar isAuthenticated />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <h1 className="font-heading text-3xl font-bold mb-4">
              Access Restricted
            </h1>
            <p className="text-muted-foreground mb-6">
              Only instructors can add quiz questions and answers.
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold mb-2">
              {isReviewMode ? "Quiz Review" : "Quiz Builder"}
            </h1>
            <p className="text-muted-foreground">
              {isReviewMode
                ? "Review your answers and see the correct solutions."
                : "Add questions, answers, and mark the correct option so the backend stores them securely."}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </div>

        {loading || !quiz ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-[220px] w-full animate-pulse rounded-xl bg-muted"
              />
            ))}
          </div>
        ) : isReviewMode ? (
          /* Review Mode */
          <div className="space-y-6">
            {userQuizResult && (
              <Card className="border-green-200 bg-green-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading text-lg font-semibold">
                      Your Score
                    </h3>
                    <Badge className="bg-green-500/10 text-green-600 border-green-200">
                      {userQuizResult.score}% ({userQuizResult.correctAnswers}/
                      {userQuizResult.totalQuestions} correct)
                    </Badge>
                  </div>
                  <Progress value={userQuizResult.score} className="h-3" />
                </CardContent>
              </Card>
            )}

            {quiz.questionItems?.map((question, index) => {
              const userAnswer = userAnswers[question.id];
              const correctOption = question.options.find(
                (opt) => opt.isCorrect,
              );
              const userSelectedOption = question.options.find(
                (opt) => opt.id === userAnswer,
              );
              const selectedOption = question.options.find(
                (opt) => opt.id === userAnswer,
              );
              const isCorrect = selectedOption?.isCorrect || false;

              return (
                <Card key={question.id} className="border-border/60">
                  <CardHeader>
                    <CardTitle className="flex items-start gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-lg">{question.question}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {isCorrect ? (
                            <Badge className="bg-green-500/10 text-green-600 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Correct
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/10 text-red-600 border-red-200">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Incorrect
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {question.options.map((option) => {
                        const isUserAnswer = option.id === userAnswer;
                        const isCorrectAnswer = option.isCorrect;

                        let optionClass =
                          "p-3 rounded-lg border transition-colors ";
                        if (isCorrectAnswer) {
                          optionClass +=
                            "bg-green-50 border-green-200 text-green-800";
                        } else if (isUserAnswer && !isCorrectAnswer) {
                          optionClass +=
                            "bg-red-50 border-red-200 text-red-800";
                        } else {
                          optionClass += "bg-muted/50 border-border";
                        }

                        return (
                          <div key={option.id} className={optionClass}>
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                  isUserAnswer
                                    ? "border-primary bg-primary"
                                    : "border-muted-foreground"
                                }`}
                              >
                                {isUserAnswer && (
                                  <div className="w-2 h-2 bg-white rounded-full" />
                                )}
                              </div>
                              <span className="flex-1">{option.text}</span>
                              {isCorrectAnswer && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Instructor Edit Mode */
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card className="border-border/60 bg-card/80">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl">{quiz.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {quiz.videoTitle || quiz.noteTitle} • {quiz.duration} min
                      • {quiz.questions} questions
                    </p>
                  </div>
                  <Badge className="bg-secondary/10 text-secondary border-secondary/20">
                    {quiz.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h2 className="font-semibold text-lg mb-2">
                    Quiz description
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {quiz.description}
                  </p>
                </div>

                <div className="space-y-4">
                  <h2 className="font-semibold text-lg">Existing Questions</h2>
                  {quiz.questionItems?.length ? (
                    <div className="space-y-4">
                      {quiz.questionItems.map((question, index) => (
                        <div
                          key={question.id}
                          className="rounded-2xl border border-border/50 bg-muted/40 p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-semibold">
                              Question {index + 1}
                            </p>
                            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                              {question.options.filter((o) => o.isCorrect)
                                .length > 0
                                ? "Answer set"
                                : "No correct answer"}
                            </span>
                          </div>
                          <p className="mb-3 text-sm">{question.question}</p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {question.options.map((option) => (
                              <div
                                key={option.id}
                                className={`rounded-xl border p-3 text-sm ${
                                  option.isCorrect
                                    ? "border-green-400 bg-green-50"
                                    : "border-border/50 bg-background"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle
                                    className={`h-4 w-4 ${
                                      option.isCorrect
                                        ? "text-green-600"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                  <span>
                                    {option.isCorrect ? "Correct" : "Option"}
                                  </span>
                                </div>
                                <p>{option.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No questions have been added yet. Add the first question
                      below.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/80">
              <CardHeader>
                <CardTitle className="text-xl">Add a new question</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="quiz-question">Question</Label>
                  <Textarea
                    id="quiz-question"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Type the question here"
                    className="min-h-[120px] bg-muted/30"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Answer options</h2>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addOption}
                    >
                      <Plus className="h-4 w-4" /> Add option
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {options.map((option, index) => (
                      <div
                        key={option.id}
                        className="grid gap-3 rounded-2xl border border-border/50 bg-background p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <input
                              type="radio"
                              name="correct-option"
                              checked={option.isCorrect}
                              onChange={() =>
                                handleCorrectOptionChange(option.id)
                              }
                              className="h-4 w-4 text-primary"
                            />
                            <span>Correct answer</span>
                          </div>
                          {options.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeOption(option.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <Input
                          value={option.text}
                          placeholder={`Option ${index + 1}`}
                          onChange={(e) =>
                            handleOptionTextChange(option.id, e.target.value)
                          }
                          className="bg-muted/30"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <Button
                    type="button"
                    onClick={handleAddQuestion}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? "Saving question..." : "Save question"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
