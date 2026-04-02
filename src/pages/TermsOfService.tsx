import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold font-heading mb-8">Terms of Service</h1>
        
        <div className="space-y-6 text-muted-foreground prose prose-slate">
          <p className="text-lg">Last updated: April 2026</p>
          
          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using Apex Tutorial, you accept and agree to be bound by the terms and provisions of this agreement. 
            If you do not agree to abide by these terms, please do not use this service.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">2. User Accounts</h2>
          <p>
            To use certain features of the service, you must register for an account. You are responsible for 
            safeguarding the password and for all activities that occur under your account. You agree to notify us
            immediately if you suspect any unauthorized use.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">3. Educational Content</h2>
          <p>
            All courses, text, graphics, and materials provided on Apex Tutorial are strictly for educational purposes.
            We make no guarantees regarding the outcome or academic validation of consuming the provided content.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">4. OTP Communication</h2>
          <p>
            By registering, you agree to receive essential service-related emails, including but not limited to One-Time-Password
            verifications through our automated distribution setup. 
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">5. Termination</h2>
          <p>
            We may terminate or suspend your access immediately, without prior notice or liability, for any reason whatsoever,
            including without limitation if you breach the Terms.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
