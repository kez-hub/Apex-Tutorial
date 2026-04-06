import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Brain,
  Trophy,
  Clock,
  Target,
  Play,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useQuizzes } from "@/hooks/useQuizzes";

interface Quiz {
  id: string;
  title: string;
  description: string;
  courseId?: string;
  courseTitle?: string;
  noteId?: string;
  noteTitle?: string;
  questions: number;
  duration: number; // in minutes
  difficulty: "easy" | "medium" | "hard";
  completed: boolean;
  score?: number;
  maxScore?: number;
  completedAt?: Date;
  instructorId: string;
  completions?: Record<string, { score: number; completedAt: string }>;
}

export default function Quiz() {
  const { user, userData } = useAuth();
  const { quizzes, loading } = useQuizzes();

  const instructorQuizzes = quizzes.filter(
    (quiz) => quiz.instructorId === user?.uid,
  );

  // Check user-specific completion status
  const completedQuizzes = quizzes.filter((q) => {
    const completions =
      (q.completions as Record<
        string,
        { score: number; completedAt: string }
      >) || {};
    return completions[user?.uid || ""] !== undefined;
  });
  const pendingQuizzes = quizzes.filter((q) => {
    const completions =
      (q.completions as Record<
        string,
        { score: number; completedAt: string }
      >) || {};
    return completions[user?.uid || ""] === undefined;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500/10 text-green-600 border-green-200";
      case "medium":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "hard":
        return "bg-red-500/10 text-red-600 border-red-200";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-200";
    }
  };

  const getScorePercentage = (score: number, maxScore: number) => {
    return Math.round((score / maxScore) * 100);
  };

  if (userData?.role === "instructor") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar isAuthenticated />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold mb-2">
              Your Posted Quizzes
            </h1>
            <p className="text-muted-foreground">
              Review the quizzes you have created and keep track of what
              students can take.
            </p>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[220px] w-full animate-pulse rounded-xl bg-muted"
                />
              ))}
            </div>
          ) : instructorQuizzes.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {instructorQuizzes.map((quiz) => (
                <Card
                  key={quiz.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {quiz.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {quiz.courseTitle || quiz.noteTitle}
                        </p>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        {quiz.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {quiz.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        {quiz.questions} questions
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {quiz.duration} min
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      size="sm"
                      asChild
                    >
                      <Link to={`/quiz/${quiz.id}`}>View Quiz</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-2xl bg-muted/30">
              <Brain className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="font-heading text-xl font-semibold mb-2">
                No quizzes posted yet
              </h3>
              <p className="text-muted-foreground max-w-md">
                Create quizzes from your dashboard to make them available for
                students.
              </p>
            </div>
          )}
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
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold mb-2">Quiz Center</h1>
          <p className="text-muted-foreground">
            Test your knowledge and track your progress across all courses.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Quizzes</p>
                <p className="font-heading text-2xl font-bold">
                  {quizzes.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="font-heading text-2xl font-bold">
                  {completedQuizzes.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="font-heading text-2xl font-bold">
                  {pendingQuizzes.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <Trophy className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Score</p>
                <p className="font-heading text-2xl font-bold">
                  {completedQuizzes.length > 0
                    ? Math.round(
                        completedQuizzes.reduce((acc, q) => {
                          const completions =
                            (q.completions as Record<
                              string,
                              { score: number }
                            >) || {};
                          const userCompletion = completions[user?.uid || ""];
                          return acc + (userCompletion?.score || 0);
                        }, 0) / completedQuizzes.length,
                      )
                    : 0}
                  %
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Quizzes */}
        {pendingQuizzes.length > 0 && (
          <section className="mb-12">
            <h2 className="font-heading text-xl font-semibold mb-6">
              Available Quizzes
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[200px] w-full animate-pulse rounded-xl bg-muted"
                    />
                  ))
                : pendingQuizzes.map((quiz) => (
                    <Card
                      key={quiz.id}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2">
                              {quiz.title}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mb-3">
                              {quiz.courseTitle || quiz.noteTitle}
                            </p>
                          </div>
                          <Badge
                            className={getDifficultyColor(quiz.difficulty)}
                          >
                            {quiz.difficulty}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {quiz.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            {quiz.questions} questions
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {quiz.duration} min
                          </div>
                        </div>
                        <Button className="w-full" size="sm" asChild>
                          <Link to={`/quiz/${quiz.id}/take`}>
                            <Play className="h-4 w-4 mr-2" />
                            Start Quiz
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
            </div>
          </section>
        )}

        {/* Completed Quizzes */}
        {completedQuizzes.length > 0 && (
          <section>
            <h2 className="font-heading text-xl font-semibold mb-6">
              Completed Quizzes
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {completedQuizzes.map((quiz) => (
                <Card key={quiz.id} className="border-green-200 bg-green-50/50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {quiz.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mb-3">
                          {quiz.courseTitle || quiz.noteTitle}
                        </p>
                      </div>
                      <Badge className="bg-green-500/10 text-green-600 border-green-200">
                        Completed
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Score</span>
                        <span className="font-semibold">
                          {quiz.score}/{quiz.maxScore} (
                          {getScorePercentage(quiz.score!, quiz.maxScore!)}%)
                        </span>
                      </div>
                      <Progress
                        value={getScorePercentage(quiz.score!, quiz.maxScore!)}
                        className="h-2"
                      />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        {quiz.questions} questions
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {quiz.duration} min
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" size="sm">
                      Review Answers
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {quizzes.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Brain className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="font-heading text-xl font-semibold mb-2">
              No Quizzes Available
            </h3>
            <p className="text-muted-foreground max-w-md">
              Complete courses to unlock quizzes and test your knowledge.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
