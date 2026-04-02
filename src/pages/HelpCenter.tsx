import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Search, Monitor, CreditCard, BookOpen, Clock, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function HelpCenter() {
  const categories = [
    {
      icon: Monitor,
      title: "Account Settings",
      desc: "Manage your profile, password, and security preferences."
    },
    {
      icon: BookOpen,
      title: "Course Access",
      desc: "Troubleshoot enrollment, modules, and learning streaks."
    },
    {
      icon: CreditCard,
      title: "Billing & Subscriptions",
      desc: "Update payment methods, view invoices, and cancelation."
    },
    {
      icon: Clock,
      title: "Schedule & Alarms",
      desc: "Help with your interactive dashboard timing events."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <div className="gradient-hero py-24 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold font-heading mb-6 tracking-tight">How can we help you today?</h1>
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input 
            className="w-full h-14 pl-12 text-lg rounded-full border-primary/20 shadow-lg focus-visible:ring-primary"
            placeholder="Search for articles, guides, and FAQs..."
          />
        </div>
      </div>

      <main className="container mx-auto px-4 py-16 max-w-5xl">
        <h2 className="text-2xl font-bold mb-8 text-center">Popular Topics</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, idx) => (
            <Card key={idx} className="hover:shadow-md transition-shadow cursor-pointer border-border/50 bg-card">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <cat.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">{cat.title}</h3>
                <p className="text-sm text-muted-foreground">{cat.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-20 bg-muted/30 rounded-3xl p-8 md:p-12 text-center border border-border">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Still can't find what you're looking for?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Our support team is standing by to help you with any issue. Reach out directly and we'll get back to you within 24 hours.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/contact" className="inline-flex items-center justify-center rounded-lg text-sm font-medium h-11 px-8 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Contact Support
            </Link>
            <Link to="/faq" className="inline-flex items-center justify-center rounded-lg text-sm font-medium h-11 px-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
              Browse FAQs
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
