 import { Link, useSearchParams } from "react-router-dom";
 import { Mail, ExternalLink, ArrowLeft } from "lucide-react";
 import { Button } from "@/components/ui/button";
 
 export default function ConfirmEmail() {
   const [searchParams] = useSearchParams();
   const email = searchParams.get("email") || "";
 
   const getEmailDomain = (email: string) => {
     const domain = email.split("@")[1]?.toLowerCase();
     return domain || "";
   };
 
   const getEmailProviderLink = (email: string) => {
     const domain = getEmailDomain(email);
     
     const providers: Record<string, string> = {
       "gmail.com": "https://mail.google.com",
       "googlemail.com": "https://mail.google.com",
       "outlook.com": "https://outlook.live.com",
       "hotmail.com": "https://outlook.live.com",
       "live.com": "https://outlook.live.com",
       "yahoo.com": "https://mail.yahoo.com",
       "icloud.com": "https://www.icloud.com/mail",
       "me.com": "https://www.icloud.com/mail",
       "protonmail.com": "https://mail.proton.me",
       "proton.me": "https://mail.proton.me",
     };
 
     return providers[domain] || null;
   };
 
   const providerLink = getEmailProviderLink(email);
   const isGmail = getEmailDomain(email).includes("gmail");
 
   return (
     <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
       <div className="max-w-md w-full text-center animate-fade-in">
         <div className="bg-card rounded-2xl shadow-xl p-8 border">
           {/* Email Icon */}
           <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
             <Mail className="w-10 h-10 text-primary" />
           </div>
 
           {/* Heading */}
           <h1 className="font-heading text-2xl font-bold mb-3">
             Check your email
           </h1>
 
           {/* Description */}
           <p className="text-muted-foreground mb-2">
             We've sent a confirmation link to
           </p>
           {email && (
             <p className="font-medium text-foreground mb-6">
               {email}
             </p>
           )}
           <p className="text-sm text-muted-foreground mb-8">
             Click the link in the email to verify your account and get started with LearnHub.
           </p>
 
           {/* Open Email Button */}
           {providerLink && (
             <Button
               asChild
               variant="gradient"
               size="lg"
               className="w-full mb-4"
             >
               <a href={providerLink} target="_blank" rel="noopener noreferrer">
                 {isGmail ? "Open Gmail" : "Open Email"}
                 <ExternalLink className="w-4 h-4 ml-2" />
               </a>
             </Button>
           )}
 
 
           {/* Help Text */}
           <p className="text-xs text-muted-foreground mt-6">
             Didn't receive the email? Check your spam folder or{" "}
             <Link to="/auth?mode=signup" className="text-primary hover:underline">
               try again
             </Link>
           </p>
         </div>
       </div>
     </div>
   );
 }