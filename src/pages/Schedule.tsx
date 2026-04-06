import { Calendar } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function Schedule() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-full bg-muted p-6">
            <Calendar className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="font-heading text-3xl font-bold mb-4">Events</h1>
          <p className="text-muted-foreground text-lg">
            No events are available
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
