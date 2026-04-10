import { Link, useParams } from "react-router";
import { Button } from "../components/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Star, Calendar, MessageSquare, Award, Clock } from "lucide-react";

export default function MatchProfile() {
  const { id } = useParams();

  // Mock data - would come from API based on id
  const profile = {
    name: "Sarah Chen",
    avatar: "SC",
    title: "Senior Frontend Developer",
    bio: "I'm a frontend developer with 5+ years of experience in building modern web applications. I love teaching and helping others grow their skills. My teaching style is hands-on and practical, focusing on real-world projects.",
    skills: ["React", "TypeScript", "Web Design", "CSS", "JavaScript", "Testing"],
    rating: 4.9,
    totalSessions: 47,
    responseTime: "2 hours",
    languages: ["English", "Mandarin"],
    availability: ["Mon-Fri evenings", "Sat mornings"],
    reviews: [
      {
        id: 1,
        author: "Michael Johnson",
        rating: 5,
        text: "Sarah is an excellent teacher! She explained React concepts clearly and patiently answered all my questions.",
        date: "2 weeks ago",
      },
      {
        id: 2,
        author: "Emily Davis",
        rating: 5,
        text: "Very knowledgeable and professional. Helped me build my first TypeScript project from scratch.",
        date: "1 month ago",
      },
      {
        id: 3,
        author: "David Kim",
        rating: 4,
        text: "Great session! Sarah provided helpful feedback on my code and shared useful resources.",
        date: "2 months ago",
      },
    ],
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <Card variant="elevated" className="mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="size-32 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-5xl flex-shrink-0">
            {profile.avatar}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-1">{profile.name}</h1>
            <p className="text-lg text-muted-foreground mb-4">{profile.title}</p>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Star className="size-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{profile.rating}</span>
                <span className="text-muted-foreground">({profile.totalSessions} sessions)</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-5" />
                <span>Responds in {profile.responseTime}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to={`/schedule/${id}`}>
                <Button variant="primary" size="lg">
                  <Calendar className="size-5 mr-2" />
                  Schedule Session
                </Button>
              </Link>
              <Link to="/chat">
                <Button variant="outline" size="lg">
                  <MessageSquare className="size-5 mr-2" />
                  Send Message
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* About */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">{profile.bio}</p>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-4 py-2 bg-muted text-primary rounded-lg font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile.reviews.map((review) => (
                  <div key={review.id} className="pb-4 border-b border-border last:border-0 last:pb-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-foreground">{review.author}</p>
                        <p className="text-sm text-muted-foreground">{review.date}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`size-4 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-slate-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-foreground">{review.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Availability */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {profile.availability.map((time) => (
                  <div key={time} className="flex items-center gap-2 text-foreground">
                    <Calendar className="size-4 text-primary" />
                    <span>{time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Languages */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Languages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {profile.languages.map((lang) => (
                  <div key={lang} className="text-foreground">
                    {lang}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Sessions</span>
                  <span className="font-semibold text-foreground">{profile.totalSessions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Rating</span>
                  <span className="font-semibold text-foreground">{profile.rating} / 5.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Response Time</span>
                  <span className="font-semibold text-foreground">{profile.responseTime}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
