import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { ArrowLeft, Check, Users, BookOpen, MessageCircle } from "lucide-react";

export default function Signup() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setLoading(true);
    try {
      await login();
    } catch (error) {
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      icon: Users,
      title: "Join Learning Communities",
      description: "Connect with like-minded learners in your field of interest"
    },
    {
      icon: MessageCircle,
      title: "Real-time Discussions",
      description: "Engage in live chats and get instant feedback from peers"
    },
    {
      icon: BookOpen,
      title: "Share & Discover Knowledge",
      description: "Write articles and learn from expert insights"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      {/* Back to Landing */}
      <Button asChild variant="ghost" className="absolute top-4 left-4" data-testid="button-back-to-landing">
        <Link href="/">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
      </Button>

      <div className="max-w-6xl mx-auto pt-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Benefits */}
          <div className="space-y-8">
            <div>
              <Badge variant="secondary" className="mb-4">
                🚀 Join the Community
              </Badge>
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Start Your Learning Journey
              </h1>
              <p className="text-lg text-muted-foreground">
                Join MIND-MERGE and become part of a global community of passionate learners, 
                sharing knowledge and growing together.
              </p>
            </div>

            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <benefit.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-4 pt-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-full border-2 border-background flex items-center justify-center">
                    <span className="text-xs text-primary-foreground font-medium">{i}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">10,000+</span> learners already joined
              </p>
            </div>
          </div>

          {/* Right Side - Signup Form */}
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              {/* Logo Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-foreground font-bold text-2xl">M</span>
                </div>
                <h2 className="text-2xl font-bold text-foreground">Create Your Account</h2>
                <p className="text-muted-foreground">Get started in seconds</p>
              </div>

              <Card className="border border-border shadow-xl">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">Join MIND-MERGE</CardTitle>
                  <CardDescription>
                    Start connecting and learning today
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <Button
                    onClick={handleSignup}
                    disabled={loading}
                    className="w-full"
                    size="lg"
                    data-testid="button-google-signup"
                  >
                    {loading ? "Creating account..." : "Sign up with Google"}
                  </Button>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary mr-2" />
                      Free to join, always
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary mr-2" />
                      No credit card required
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary mr-2" />
                      Instant access to all features
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <Link href="/login" className="text-primary hover:underline font-medium" data-testid="link-login">
                        Sign in here
                      </Link>
                    </p>
                  </div>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    By signing up, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}