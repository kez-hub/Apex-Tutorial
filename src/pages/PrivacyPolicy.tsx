import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold font-heading mb-8">Privacy Policy</h1>
        
        <div className="space-y-6 text-muted-foreground prose prose-slate">
          <p className="text-lg">Last updated: April 2026</p>
          
          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">1. Information We Collect</h2>
          <p>
            At Apex Tutorial, we collect information you provide directly to us when you create or modify your account,
            request customer support, or otherwise communicate with us. This information may include your name,
            email address, department, WhatsApp number, and other profile details.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">2. How We Use Your Information</h2>
          <p>
            We use the information we collect to operate, evaluate, and improve our services.
            This includes utilizing your data to personalize courses, generate your distinct Tutorial ID,
            and monitor your learning streak.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">3. Information Sharing</h2>
          <p>
            We do not share your personal information with third parties except as described in this privacy policy,
            such as to facilitate email distributions (e.g. EmailJS logic) or Firebase authentication loops.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">4. Security</h2>
          <p>
            We employ robust security measures designed to protect your data, including specialized Firestore Rule protocols 
            ensuring your user document is strictly accessible only by you.
          </p>
          
          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">5. Contact Us</h2>
          <p>
            If you have any questions or concerns regarding these policies, please reach out via our support channel.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
