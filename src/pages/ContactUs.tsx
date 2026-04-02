import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone } from "lucide-react";

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="gradient-primary text-primary-foreground py-16 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <h1 className="text-4xl font-bold font-heading mb-4">Get in Touch</h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Have a question about a course or need technical support? We'd love to hear from you. 
            Fill out the form below and our team will be in touch shortly.
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Contact Information */}
          <div className="space-y-8 md:col-span-1">
            <h3 className="text-2xl font-bold mb-6">Contact Info</h3>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Our Office</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  123 Learning Avenue<br />
                  Tech District, Suite 400<br />
                  Los Angeles, CA 90001
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Email Us</h4>
                <p className="text-sm text-muted-foreground">support@apextutorial.com</p>
                <p className="text-sm text-muted-foreground">hello@apextutorial.com</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Call Us</h4>
                <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                <p className="text-sm text-muted-foreground">Mon-Fri, 9am - 6pm PST</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-2 bg-card border border-border shadow-sm rounded-2xl p-8">
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name</label>
                  <Input placeholder="John" className="bg-background" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name</label>
                  <Input placeholder="Doe" className="bg-background" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input type="email" placeholder="john@example.com" className="bg-background" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message Subject</label>
                <Input placeholder="How can we help?" className="bg-background" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Your Message</label>
                <Textarea 
                  placeholder="Tell us exactly what you need help with..." 
                  className="min-h-[150px] bg-background resize-y"
                />
              </div>

              <Button type="submit" variant="gradient" className="w-full text-base h-12">
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
