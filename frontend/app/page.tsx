import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  QrCode,
  Users,
  BarChart3,
  Shield,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Navigation } from "@/components/Navigation";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Modern Attendance Management Made{" "}
              <span className="text-primary">Simple</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground text-pretty max-w-2xl mx-auto">
              Streamline attendance tracking with QR codes, real-time analytics,
              and seamless integration. Perfect for schools, offices, and
              events.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="h-12 px-8">
                  Start Free Trial
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 bg-transparent"
              >
                Watch Demo
              </Button>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        <div className="mt-16 flow-root sm:mt-24">
          <div className="relative mx-auto max-w-5xl">
            <img
              src="/dashboard.png"
              alt="AttendanceTracker Dashboard"
              className="rounded-xl shadow-2xl ring-1 ring-border"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
              Everything you need for attendance management
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              Powerful features designed to make attendance tracking effortless
              and accurate.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-6xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <QrCode className="h-10 w-10 text-primary" />
                  <CardTitle>QR Code Generation</CardTitle>
                  <CardDescription>
                    Generate unique QR codes for each session. Students scan to
                    mark attendance instantly.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-10 w-10 text-primary" />
                  <CardTitle>Real-time Tracking</CardTitle>
                  <CardDescription>
                    Monitor attendance as it happens. See who's present, absent,
                    or late in real-time.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <BarChart3 className="h-10 w-10 text-primary" />
                  <CardTitle>Analytics & Reports</CardTitle>
                  <CardDescription>
                    Comprehensive analytics and automated reports to track
                    attendance patterns.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="h-10 w-10 text-primary" />
                  <CardTitle>Secure & Private</CardTitle>
                  <CardDescription>
                    Enterprise-grade security ensures your attendance data is
                    always protected.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Clock className="h-10 w-10 text-primary" />
                  <CardTitle>Time-based Sessions</CardTitle>
                  <CardDescription>
                    Set time limits for attendance sessions. Automatic session
                    management.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CheckCircle className="h-10 w-10 text-primary" />
                  <CardTitle>Easy Integration</CardTitle>
                  <CardDescription>
                    Seamlessly integrate with existing systems and export data
                    in multiple formats.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
              Ready to modernize your attendance tracking?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              Join thousands of educators and organizations who trust
              AttendanceTracker.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="h-12 px-8">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 bg-transparent"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container py-12">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              <span className="font-semibold">AttendanceTracker</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-foreground">
                Terms of Service
              </Link>
              <Link href="#" className="hover:text-foreground">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
