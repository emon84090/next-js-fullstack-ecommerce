"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Assuming you have a Textarea component
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, Mail, Phone, MapPin, Send } from "lucide-react";
import { toast } from "react-toastify";

const Logo = () => (
  <div className="flex items-center justify-center space-x-2 pb-2">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-7 w-7 text-primary"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 18.9c-3.15-1.29-5.46-4.57-6-8.24V6.44l6-2.67 6 2.67v5.22c-.54 3.67-2.85 6.95-6 8.24zM12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
    </svg>
    <span className="text-xl font-bold text-gray-900 dark:text-white tracking-wide">
      A P P L I C A T I O N
    </span>
  </div>
);

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (
      !formData.name ||
      !formData.email ||
      !formData.subject ||
      !formData.message
    ) {
      setError("Please fill in all fields.");
      setIsLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Invalid email format.");
      setIsLoading(false);
      return;
    }

    // --- Mock API Call Start (Replace with your actual fetch) ---
    try {
      // Simulate network delay and successful submission
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Assume successful API response here
      setSuccess(
        "Your message has been sent successfully! We will get back to you soon."
      );
      setFormData({ name: "", email: "", subject: "", message: "" }); // Clear form
    } catch (err) {
      setError(
        "An unexpected error occurred while sending your message. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
    // --- Mock API Call End ---
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Form Card */}
        <Card className="shadow-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 rounded-xl">
          <CardHeader className="p-8 pb-4">
            <Logo />
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
              Send us a Message
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              We are here to help! Fill out the form, and we will respond
              promptly.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Your Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-primary focus:border-primary"
                  required
                />
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-primary focus:border-primary"
                  required
                />
              </div>

              {/* Subject Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="subject"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Subject
                </Label>
                <Input
                  id="subject"
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Inquiry about billing, support, etc."
                  className="dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-primary focus:border-primary"
                  required
                />
              </div>

              {/* Message Textarea (Assumes Textarea is a component you have) */}
              <div className="space-y-2">
                <Label
                  htmlFor="message"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Your Message
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Type your detailed message here..."
                  className="dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-primary focus:border-primary"
                  required
                />
              </div>

              {/* Error/Success Messages */}
              {error && (
                <p className="text-red-500 text-sm text-center font-medium">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-green-500 text-sm text-center font-medium">
                  {success}
                </p>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground font-semibold py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-md flex justify-center items-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Contact Info Card */}
        <Card className="shadow-2xl border border-gray-100 dark:border-gray-800 bg-primary/10 dark:bg-primary/20 rounded-xl lg:mt-16 h-fit">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-2xl font-bold text-primary dark:text-white">
              Contact Information
            </CardTitle>
            <CardDescription className="text-gray-700 dark:text-gray-300">
              Reach out to us directly through these channels.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-6">
            {/* Address */}
            <div className="flex items-start space-x-4">
              <MapPin className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Our Office
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  123 Main Street, Suite 400
                  <br />
                  Business City, State 10001
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center space-x-4">
              <Phone className="h-6 w-6 text-primary flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Call Us
                </h3>
                <a
                  href="tel:+15551234567"
                  className="text-primary hover:underline"
                >
                  +1 (555) 123-4567
                </a>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center space-x-4">
              <Mail className="h-6 w-6 text-primary flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Email Us
                </h3>
                <a
                  href="mailto:support@appname.com"
                  className="text-primary hover:underline"
                >
                  support@appname.com
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
