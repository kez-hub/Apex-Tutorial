import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HelpCircle } from "lucide-react";

export default function FAQ() {
  const faqs = [
    {
      q: "How do I verify my email?",
      a: "When you sign up, an automated email containing a 6-digit One Time Password (OTP) will be dispatched to your inbox. Enter this code into the prompt securely."
    },
    {
      q: "Are the courses free?",
      a: "Yes! The core repository of our learning modules is entirely free to access. Certain premium modules or advanced 1-on-1 scheduled sessions may be introduced later."
    },
    {
      q: "How does the Learning Streak work?",
      a: "Your Learning Streak is monitored by daily logins and active class participation. If you successfully digest content continuously for days in a row, your dashboard multiplier scales accordingly!"
    },
    {
      q: "Who generates my Tutorial ID?",
      a: "The Apex platform's backend infrastructure assigns you a securely sequenced ID (like APEX-002) instantaneously the moment your account is minted in the database."
    },
    {
      q: "Can I delete my account?",
      a: "Yes. Head over to the Account Settings menu in your dashboard and select 'Deactivate Account'. This will strip your associated metrics out of our database entirely."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-flex w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-6">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold font-heading mb-4">Frequently Asked Questions</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Quickly find answers instantly without having to contact our support team.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <details key={idx} className="group bg-card border border-border/50 rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between p-6 font-semibold hover:bg-muted/50 transition-colors">
                {faq.q}
                <span className="relative ml-4 shrink-0 w-5 h-5 transition duration-300 group-open:-rotate-180">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
              </summary>
              <div className="px-6 pb-6 text-muted-foreground leading-relaxed animate-fade-in border-t border-border/10 pt-4">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
