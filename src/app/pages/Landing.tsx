import { Link } from "react-router";
import { Button } from "../components/Button";
import { ArrowRight, Users, Calendar, MessageSquare, Star } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">S</span>
            </div>
            <span className="font-bold text-xl text-foreground">SkillBridge</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Connect. Learn. Grow.
            <span className="block text-primary mt-2">
              Together.
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            SkillBridge connects people who want to learn with those who love to teach.
            Share your expertise, discover new skills, and grow together.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button variant="primary" size="lg" className="group">
                Start Learning
                <ArrowRight className="ml-2 size-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">
                I'm a Teacher
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">
          How SkillBridge Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Users className="size-8" />}
            title="Find Your Match"
            description="Discover skilled teachers and eager learners based on interests, availability, and goals."
          />
          <FeatureCard
            icon={<Calendar className="size-8" />}
            title="Schedule Sessions"
            description="Book flexible learning sessions that fit your schedule. One-on-one or group learning."
          />
          <FeatureCard
            icon={<MessageSquare className="size-8" />}
            title="Stay Connected"
            description="Chat with your learning partners, share resources, and track your progress together."
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <StatCard number="10,000+" label="Active Members" />
          <StatCard number="50,000+" label="Skills Shared" />
          <StatCard number="4.9" label="Average Rating" icon={<Star className="size-5 fill-yellow-400 text-yellow-400" />} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-primary-foreground mb-6">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Join thousands of learners and teachers building skills together.
          </p>
          <Link to="/signup">
            <Button variant="secondary" size="lg">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary text-secondary-foreground py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2026 SkillBridge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-card rounded-xl p-8 border border-border hover:shadow-lg transition-shadow duration-200">
      <div className="size-16 rounded-lg bg-muted text-primary flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-card-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function StatCard({ number, label, icon }: { number: string; label: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl p-8 border border-border">
      <div className="flex items-center justify-center gap-2 mb-2">
        <p className="text-4xl font-bold text-card-foreground">{number}</p>
        {icon}
      </div>
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
}
