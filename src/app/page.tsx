import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedSection, FloatingBadge, GradientText, ScrollReveal, ParallaxSection, StaggeredFade } from "@/components/home-client";
import { ThemeToggle } from "@/components/theme-toggle";
import { ExamDoodleBackground } from "@/components/exam-doodles";
import { UserAccountNav } from "@/components/user-account-nav";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { 
  Check, 
  Zap, 
  Shield, 
  Globe, 
  Timer,
  Users,
  BarChart3,
  Lock,
  Sparkles,
  ArrowRight,
  Star,
  TrendingUp,
  Eye,
  Award,
  CheckCircle2
} from "lucide-react";

export default async function Home() {
  // Check if user is logged in
  const session = await auth();
  let user = null;
  
  if (session?.user?.email) {
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        name: true,
        email: true,
        image: true,
        planType: true,
        credits: true,
      },
    });
  }
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="px-3 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center border-b bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60 sticky top-0 z-50 shadow-sm">
        <Link className="flex items-center justify-center gap-1.5 sm:gap-2 group" href="#">
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-lg group-hover:shadow-xl transition-shadow">
            M
          </div>
          <span className="font-bold text-base sm:text-xl bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">MCQ Platform</span>
        </Link>
        <nav className="ml-auto flex gap-1 sm:gap-2 md:gap-4 items-center">
          <Link className="text-xs sm:text-sm font-medium hover:text-primary transition-colors hidden lg:inline-flex" href="#features">
            Features
          </Link>
          <Link className="text-xs sm:text-sm font-medium hover:text-primary transition-colors hidden lg:inline-flex" href="#pricing">
            Pricing
          </Link>
          <Link className="text-xs sm:text-sm font-medium hover:text-primary transition-colors hidden xl:inline-flex" href="#how-it-works">
            How It Works
          </Link>
          <ThemeToggle />
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm h-8 sm:h-9">Dashboard</Button>
              </Link>
              <UserAccountNav user={user} />
            </>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm h-8 sm:h-9">Login</Button>
              </Link>
              <Link href="/login">
                <Button size="sm" className="shadow-md hover:shadow-lg transition-shadow text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-4">
                  <span className="hidden sm:inline">Get Started Free</span>
                  <span className="sm:hidden">Sign Up</span>
                </Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-12 sm:py-16 md:py-20 lg:py-28 xl:py-36 overflow-hidden bg-background dark:bg-slate-950">
          {/* Background gradients with animation */}
          <div className="absolute inset-0 bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900"></div>
          <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-100/[0.01]"></div>
          {/* Exam doodles background */}
          <ExamDoodleBackground />
          
          {/* Animated blobs with parallax - light mode only, hidden on mobile */}
          <ParallaxSection speed={0.3}>
            <div className="absolute top-20 left-10 w-48 h-48 sm:w-64 sm:h-64 lg:w-72 lg:h-72 bg-purple-300 dark:bg-transparent rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob hidden sm:block"></div>
          </ParallaxSection>
          <ParallaxSection speed={0.5}>
            <div className="absolute top-40 right-10 w-48 h-48 sm:w-64 sm:h-64 lg:w-72 lg:h-72 bg-yellow-300 dark:bg-transparent rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 hidden sm:block"></div>
          </ParallaxSection>
          <ParallaxSection speed={0.4}>
            <div className="absolute -bottom-8 left-40 w-48 h-48 sm:w-64 sm:h-64 lg:w-72 lg:h-72 bg-pink-300 dark:bg-transparent rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 hidden md:block"></div>
          </ParallaxSection>
          
          <div className="container relative px-4 sm:px-6 md:px-8">
            <AnimatedSection>
              <div className="flex flex-col items-center space-y-6 sm:space-y-8 text-center">
                {/* Badge */}
                <FloatingBadge>
                  <Badge variant="secondary" className="px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium shadow-lg backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-2">
                    <Sparkles className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5 text-yellow-500" />
                    <span className="hidden sm:inline">Trusted by 10,000+ Educators Worldwide</span>
                    <span className="sm:hidden">10,000+ Educators</span>
                  </Badge>
                </FloatingBadge>
                
                {/* Main Headline */}
                <div className="space-y-3 sm:space-y-4 max-w-4xl px-2">
                  <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl animate-fade-in-up leading-tight">
                    Create & Manage Exams
                    <span className="block mt-1 sm:mt-2">
                      <GradientText>Like Never Before</GradientText>
                    </span>
                  </h1>
                  <p className="mx-auto max-w-[90%] sm:max-w-175 text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed px-2">
                    The most powerful online exam platform with built-in <span className="font-semibold text-foreground">anti-cheat protection</span>, 
                    instant grading, and real-time analytics. Start creating secure exams in minutes.
                  </p>
                </div>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4 w-full sm:w-auto px-4 sm:px-0">
                  <Link href="/login" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-10 text-base sm:text-lg font-semibold shadow-2xl hover:shadow-3xl transition-all group glow-on-hover bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      Start for Free
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="#features" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-10 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover-lift border-2">
                      <Eye className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Watch Demo
                    </Button>
                  </Link>
                </div>

                {/* Trust indicators */}
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8 pt-6 sm:pt-8 text-xs sm:text-sm px-4">
                  <div className="flex items-center gap-2 hover:scale-105 transition-transform">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                    </div>
                    <span className="font-medium whitespace-nowrap">No credit card</span>
                  </div>
                  <div className="flex items-center gap-2 hover:scale-105 transition-transform">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                    </div>
                    <span className="font-medium whitespace-nowrap">Free forever</span>
                  </div>
                  <div className="flex items-center gap-2 hover:scale-105 transition-transform">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                    </div>
                    <span className="font-medium whitespace-nowrap">Cancel anytime</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8 pt-10 sm:pt-12 md:pt-16 w-full max-w-5xl px-2">
                  <div className="space-y-1 sm:space-y-2 p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:scale-105 transition-transform border border-transparent dark:border-blue-500/20 dark:hover:border-blue-500/40">
                    <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">10K+</div>
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-slate-300">Active Teachers</div>
                  </div>
                  <div className="space-y-1 sm:space-y-2 p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:scale-105 transition-transform border border-transparent dark:border-purple-500/20 dark:hover:border-purple-500/40">
                    <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-linear-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">500K+</div>
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-slate-300">Exams Created</div>
                  </div>
                  <div className="space-y-1 sm:space-y-2 p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:scale-105 transition-transform border border-transparent dark:border-pink-500/20 dark:hover:border-pink-500/40">
                    <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-linear-to-r from-pink-600 to-orange-600 dark:from-pink-400 dark:to-orange-400 bg-clip-text text-transparent">2M+</div>
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-slate-300">Students Tested</div>
                  </div>
                  <div className="space-y-1 sm:space-y-2 p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:scale-105 transition-transform border border-transparent dark:border-orange-500/20 dark:hover:border-orange-500/40">
                    <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-linear-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">99.9%</div>
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-slate-300">Uptime</div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative w-full py-12 sm:py-16 md:py-20 lg:py-28 bg-background dark:bg-linear-to-b dark:from-slate-900 dark:to-slate-950 overflow-hidden">
          <ExamDoodleBackground />
          <div className="container relative px-4 sm:px-6 md:px-8">
            <ScrollReveal>
              <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 text-center mb-10 sm:mb-12 md:mb-16">
                <Badge variant="outline" className="px-3 py-1 text-xs sm:text-sm">Features</Badge>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight max-w-3xl px-2">
                  Everything You Need to Run <span className="text-primary">Secure Online Exams</span>
                </h2>
                <p className="max-w-[90%] sm:max-w-175 text-sm sm:text-base md:text-lg text-muted-foreground px-2">
                  Powerful features designed to make exam creation, distribution, and grading effortless.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {/* Feature Card 1 */}
              <StaggeredFade delay={0}>
                <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-2xl group relative overflow-hidden hover-lift h-full">
                  <div className="absolute inset-0 bg-linear-to-br from-blue-50 to-transparent dark:from-blue-950/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CardHeader className="relative p-4 sm:p-5 md:p-6">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg sm:rounded-xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg">
                      <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl group-hover:text-blue-600 transition-colors">Lightning Fast Setup</CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                      Create and publish exams in under 5 minutes. Our intuitive editor streamlines the entire process.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </StaggeredFade>

              {/* Feature Card 2 */}
              <StaggeredFade delay={100}>
                <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-2xl group relative overflow-hidden hover-lift h-full">
                  <div className="absolute inset-0 bg-linear-to-br from-red-50 to-transparent dark:from-red-950/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CardHeader className="relative p-4 sm:p-5 md:p-6">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg sm:rounded-xl bg-linear-to-br from-red-500 to-red-600 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg">
                      <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl group-hover:text-red-600 transition-colors">Advanced Anti-Cheat</CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                      Fullscreen enforcement, tab switching detection, and violation tracking keep your exams secure.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </StaggeredFade>

              {/* Feature Card 3 */}
              <StaggeredFade delay={200}>
                <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-2xl group relative overflow-hidden hover-lift h-full">
                  <div className="absolute inset-0 bg-linear-to-br from-green-50 to-transparent dark:from-green-950/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CardHeader className="relative p-4 sm:p-5 md:p-6">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg sm:rounded-xl bg-linear-to-br from-green-500 to-green-600 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg">
                      <Timer className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl group-hover:text-green-600 transition-colors">Auto-Grading & Timer</CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                      Automatic scoring and timed exams with server-controlled deadlines. Results available instantly.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </StaggeredFade>

              {/* Feature Card 4 */}
              <StaggeredFade delay={300}>
                <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-2xl group relative overflow-hidden hover-lift h-full">
                  <div className="absolute inset-0 bg-linear-to-br from-purple-50 to-transparent dark:from-purple-950/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CardHeader className="relative p-4 sm:p-5 md:p-6">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg sm:rounded-xl bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg">
                      <BarChart3 className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl group-hover:text-purple-600 transition-colors">Real-Time Analytics</CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                      Track student performance, violation rates, and completion statistics with detailed dashboards.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </StaggeredFade>

              {/* Feature Card 5 */}
              <StaggeredFade delay={400}>
                <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-2xl group relative overflow-hidden hover-lift h-full">
                  <div className="absolute inset-0 bg-linear-to-br from-orange-50 to-transparent dark:from-orange-950/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CardHeader className="relative p-4 sm:p-5 md:p-6">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg sm:rounded-xl bg-linear-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg">
                      <Users className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl group-hover:text-orange-600 transition-colors">Unlimited Students</CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                      No restrictions on student count. Share exam links and let anyone take your tests.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </StaggeredFade>

              {/* Feature Card 6 */}
              <StaggeredFade delay={500}>
                <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-2xl group relative overflow-hidden hover-lift h-full">
                  <div className="absolute inset-0 bg-linear-to-br from-pink-50 to-transparent dark:from-pink-950/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CardHeader className="relative p-4 sm:p-5 md:p-6">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg sm:rounded-xl bg-linear-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg">
                      <Globe className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl group-hover:text-pink-600 transition-colors">Monetization Ready</CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                      Sell premium exams with our built-in credit system. Start earning from your knowledge today.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </StaggeredFade>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="relative w-full py-12 sm:py-16 md:py-20 lg:py-28 bg-linear-to-b from-background to-muted/30 dark:from-slate-950 dark:to-slate-900 overflow-hidden">
          <ExamDoodleBackground />
          <div className="container relative px-4 sm:px-6 md:px-8">
            <ScrollReveal>
              <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 text-center mb-10 sm:mb-12 md:mb-16">
                <Badge variant="outline" className="px-3 py-1 text-xs sm:text-sm">How It Works</Badge>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight max-w-3xl px-2">
                  Get Started in <span className="text-primary">3 Simple Steps</span>
                </h2>
                <p className="max-w-[90%] sm:max-w-175 text-sm sm:text-base md:text-lg text-muted-foreground px-2">
                  Create your first exam in minutes and start testing students immediately.
                </p>
              </div>
            </ScrollReveal>

            <div className="max-w-5xl mx-auto grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              <ScrollReveal delay={0}>
                <div className="relative flex flex-col items-center text-center group px-4">
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl sm:text-2xl mb-3 sm:mb-4 shadow-lg group-hover:scale-110 group-hover:shadow-2xl transition-all">
                    1
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors">Create Your Exam</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Use our intuitive editor to add questions, set time limits, and configure anti-cheat settings.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={200}>
                <div className="relative flex flex-col items-center text-center group px-4">
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl sm:text-2xl mb-3 sm:mb-4 shadow-lg group-hover:scale-110 group-hover:shadow-2xl transition-all">
                    2
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 group-hover:text-purple-600 transition-colors">Share the Link</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Publish your exam and share the unique link with students via email, SMS, or social media.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={400}>
                <div className="relative flex flex-col items-center text-center group px-4 sm:col-span-2 md:col-span-1">
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-linear-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white font-bold text-xl sm:text-2xl mb-3 sm:mb-4 shadow-lg group-hover:scale-110 group-hover:shadow-2xl transition-all">
                    3
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 group-hover:text-pink-600 transition-colors">View Results</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Get instant results with detailed analytics, violation reports, and student performance insights.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="relative w-full py-12 sm:py-16 md:py-20 lg:py-28 bg-background dark:bg-slate-900 overflow-hidden">
          <ExamDoodleBackground />
          <div className="container relative px-4 sm:px-6 md:px-8">
            <ScrollReveal>
              <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 text-center mb-10 sm:mb-12 md:mb-16">
                <Badge variant="outline" className="px-3 py-1 text-xs sm:text-sm">Pricing</Badge>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight px-2">
                  Simple, Transparent Pricing
                </h2>
                <p className="max-w-[90%] sm:max-w-175 text-sm sm:text-base md:text-lg text-muted-foreground px-2">
                  Start free, scale as you grow. No hidden fees, no surprises.
                </p>
              </div>
            </ScrollReveal>

            <div className="mx-auto grid max-w-lg items-stretch gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 sm:max-w-4xl lg:max-w-5xl">
              {/* Free Plan */}
              <Card className="flex flex-col border-2 hover:border-primary/50 transition-all hover:shadow-2xl hover-lift relative overflow-hidden group dark:bg-slate-800/50 dark:border-slate-700 h-full">
                <div className="absolute inset-0 bg-linear-to-br from-blue-50/50 to-transparent dark:from-blue-500/10 dark:via-transparent dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardHeader className="relative p-4 sm:p-5 md:p-6">
                  <CardTitle className="text-xl sm:text-2xl group-hover:text-blue-600 transition-colors">Pay Per Exam</CardTitle>
                  <CardDescription className="text-sm sm:text-base">Perfect for occasional use and testing the platform</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-4 sm:p-5 md:p-6 pt-0">
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl sm:text-5xl font-extrabold">$1</span>
                      <span className="ml-2 text-lg sm:text-xl text-muted-foreground">/exam</span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">Pay only when you publish</p>
                  </div>
                  <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">Unlimited questions per exam</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">Anti-cheat protection</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">Instant auto-grading</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">Basic analytics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">Email support</span>
                    </li>
                  </ul>
                </CardContent>
                <CardHeader className="p-4 sm:p-5 md:p-6 pt-0">
                  <Link href="/login" className="w-full">
                    <Button variant="outline" size="lg" className="w-full h-11 sm:h-12 text-sm sm:text-base">
                      Get Started Free
                    </Button>
                  </Link>
                </CardHeader>
              </Card>

              {/* Pro Plan */}
              <Card className="flex flex-col border-2 border-primary relative hover:shadow-2xl hover-lift transition-all group overflow-hidden dark:bg-slate-800/70 dark:border-primary/60 dark:shadow-lg dark:shadow-primary/20 h-full">
                <div className="absolute inset-0 bg-linear-to-br from-purple-50/50 to-transparent dark:from-purple-500/10 dark:via-blue-500/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute -top-3 sm:-top-4 left-0 right-0 flex justify-center z-10">
                  <Badge className="px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-xl animate-pulse">
                    <Star className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5 fill-yellow-300" />
                    Most Popular
                  </Badge>
                </div>
                <CardHeader className="pt-6 sm:pt-8 relative p-4 sm:p-5 md:p-6">
                  <CardTitle className="text-xl sm:text-2xl group-hover:text-purple-600 transition-colors">Pro Subscription</CardTitle>
                  <CardDescription className="text-sm sm:text-base">For educators and institutions running regular exams</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-4 sm:p-5 md:p-6 pt-0">
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl sm:text-5xl font-extrabold">$15</span>
                      <span className="ml-2 text-lg sm:text-xl text-muted-foreground">/month</span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">Billed monthly, cancel anytime</p>
                  </div>
                  <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm font-semibold">Everything in Free, plus:</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">Unlimited exams</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">Advanced analytics & reports</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">Priority support (24h response)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">Custom branding</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">Export data to CSV/Excel</span>
                    </li>
                  </ul>
                </CardContent>
                <CardHeader className="p-4 sm:p-5 md:p-6 pt-0">
                  <Link href="/login" className="w-full">
                    <Button size="lg" className="w-full shadow-lg hover:shadow-xl h-11 sm:h-12 text-sm sm:text-base">
                      Start 14-Day Free Trial
                    </Button>
                  </Link>
                </CardHeader>
              </Card>
            </div>

            {/* Pricing FAQ */}
            <div className="max-w-3xl mx-auto mt-10 sm:mt-12 md:mt-16 text-center px-4">
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                <strong>Need more?</strong> Contact us for enterprise pricing with custom features, dedicated support, and SLA guarantees.
              </p>
              <Link href="/login">
                <Button variant="link" className="text-primary text-sm sm:text-base">
                  Contact Sales <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Newsletter / CTA Section */}
        <section className="relative w-full py-12 sm:py-16 md:py-20 lg:py-28 overflow-hidden bg-linear-to-br from-blue-600 via-purple-600 to-pink-600 dark:from-blue-700 dark:via-purple-700 dark:to-pink-700">
          {/* Animated background pattern */}
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-size-[30px_30px] dark:bg-grid-white/[0.08]"></div>
          <ParallaxSection speed={0.2}>
            <div className="absolute top-10 left-10 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 rounded-full blur-3xl hidden sm:block"></div>
          </ParallaxSection>
          <ParallaxSection speed={0.3}>
            <div className="absolute bottom-10 right-10 w-56 h-56 sm:w-80 sm:h-80 bg-white/10 rounded-full blur-3xl hidden sm:block"></div>
          </ParallaxSection>

          <div className="container relative px-4 sm:px-6 md:px-8">
            <ScrollReveal>
              <div className="max-w-3xl mx-auto text-center text-white space-y-4 sm:space-y-6">
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs sm:text-sm px-3 py-1">
                  <Sparkles className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  Join 10,000+ Educators
                </Badge>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold px-2">
                  Ready to Transform Your Exams?
                </h2>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 max-w-2xl mx-auto px-4">
                  Start creating secure, professional online exams today. No credit card required. Get started in under 5 minutes.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-2 sm:pt-4 px-4">
                  <Link href="/login" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-10 text-base sm:text-lg font-semibold bg-white text-purple-600 hover:bg-gray-100 shadow-2xl hover:shadow-3xl transition-all group">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="#pricing" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-10 text-base sm:text-lg font-semibold border-2 border-white text-white hover:bg-white hover:text-purple-600 transition-all">
                      View Pricing
                    </Button>
                  </Link>
                </div>
                
                {/* Trust indicators */}
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8 pt-6 sm:pt-8 text-xs sm:text-sm text-white/80">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="whitespace-nowrap">14-day free trial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="whitespace-nowrap">No credit card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="whitespace-nowrap">Cancel anytime</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative border-t bg-linear-to-b from-background to-muted/50 dark:from-slate-950 dark:to-slate-900 dark:border-slate-800 overflow-hidden">
        <ExamDoodleBackground />
        <div className="container relative px-4 sm:px-6 md:px-8 py-12 sm:py-16">
          <ScrollReveal>
            <div className="grid gap-8 sm:gap-10 md:gap-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 mb-8 sm:mb-10 md:mb-12">
              {/* Brand - Larger column */}
              <div className="space-y-3 sm:space-y-4 lg:col-span-2 sm:col-span-2">
                <Link className="flex items-center gap-1.5 sm:gap-2 group" href="/">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg group-hover:shadow-xl transition-shadow">
                    M
                  </div>
                  <span className="font-bold text-lg sm:text-xl bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">MCQ Platform</span>
                </Link>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm leading-relaxed">
                  The most powerful online exam platform for modern educators. Create secure exams with advanced anti-cheat, instant grading, and real-time analytics.
                </p>
                {/* Social Links */}
                <div className="flex items-center gap-2 sm:gap-3 pt-2">
                  <Link href="#" className="h-10 w-10 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center group">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                    </svg>
                  </Link>
                  <Link href="#" className="h-10 w-10 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center group">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </Link>
                  <Link href="#" className="h-10 w-10 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center group">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                  </Link>
                  <Link href="#" className="h-10 w-10 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center group">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Product */}
              <div className="space-y-3 sm:space-y-4">
                <h4 className="font-semibold text-xs sm:text-sm uppercase tracking-wider text-foreground">Product</h4>
                <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <li><Link href="#features" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block">Features</Link></li>
                  <li><Link href="#pricing" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block">Pricing</Link></li>
                  <li><Link href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block">How It Works</Link></li>
                  <li><Link href="/login" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block">Get Started</Link></li>
                  <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block">Roadmap</Link></li>
                </ul>
              </div>

              {/* Company */}
              <div className="space-y-3 sm:space-y-4">
                <h4 className="font-semibold text-xs sm:text-sm uppercase tracking-wider text-foreground">Company</h4>
                <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block">About Us</Link></li>
                  <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block">Blog</Link></li>
                  <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block">Careers</Link></li>
                  <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block">Contact</Link></li>
                  <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block">Partners</Link></li>
                </ul>
              </div>

              {/* Legal */}
              <div className="space-y-3 sm:space-y-4">
                <h4 className="font-semibold text-xs sm:text-sm uppercase tracking-wider text-foreground">Legal</h4>
                <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block">Privacy Policy</Link></li>
                  <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block">Terms of Service</Link></li>
                  <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block">Cookie Policy</Link></li>
                  <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block">Security</Link></li>
                  <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block">GDPR</Link></li>
                </ul>
              </div>
            </div>
          </ScrollReveal>

          {/* Bottom bar */}
          <div className="border-t pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-center sm:text-left">
            <p className="text-xs sm:text-sm text-muted-foreground">
              © {new Date().getFullYear()} <span className="font-semibold">MCQ Platform Inc.</span> All rights reserved.
            </p>
            <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                Made with <span className="text-red-500">❤️</span> for Educators
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
