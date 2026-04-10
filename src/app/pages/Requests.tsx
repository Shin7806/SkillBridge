import { Link } from "react-router";
import { Button } from "../components/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/Card";
import { Clock, CheckCircle, XCircle, Plus } from "lucide-react";
import { useState } from "react";

const mockRequests = [
  {
    id: 1,
    skill: "React Development",
    requester: "Emily Davis",
    avatar: "ED",
    description: "Looking for help with React Hooks and state management",
    status: "pending",
    date: "2 hours ago",
    level: "Intermediate",
  },
  {
    id: 2,
    skill: "JavaScript Basics",
    requester: "Michael Johnson",
    avatar: "MJ",
    description: "Need help understanding closures and async/await",
    status: "pending",
    date: "5 hours ago",
    level: "Beginner",
  },
  {
    id: 3,
    skill: "Web Design",
    requester: "Sarah Wilson",
    avatar: "SW",
    description: "Want to learn CSS Grid and Flexbox for responsive layouts",
    status: "accepted",
    date: "1 day ago",
    level: "Beginner",
  },
  {
    id: 4,
    skill: "TypeScript",
    requester: "David Kim",
    avatar: "DK",
    description: "Looking to learn TypeScript for existing JavaScript projects",
    status: "declined",
    date: "2 days ago",
    level: "Intermediate",
  },
];

export default function Requests() {
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "declined">("all");

  const filteredRequests =
    filter === "all" ? mockRequests : mockRequests.filter((r) => r.status === filter);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="size-5 text-yellow-600" />;
      case "accepted":
        return <CheckCircle className="size-5 text-green-600" />;
      case "declined":
        return <XCircle className="size-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "accepted":
        return "bg-green-100 text-green-700";
      case "declined":
        return "bg-red-100 text-red-700";
      default:
        return "bg-muted text-foreground";
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Skill Requests</h1>
          <p className="text-muted-foreground">Manage incoming requests to teach your skills</p>
        </div>
        <Link to="/request">
          <Button>
            <Plus className="size-5 mr-2" />
            New Request
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === "all" ? "primary" : "outline"}
          onClick={() => setFilter("all")}
          size="sm"
        >
          All
        </Button>
        <Button
          variant={filter === "pending" ? "primary" : "outline"}
          onClick={() => setFilter("pending")}
          size="sm"
        >
          Pending
        </Button>
        <Button
          variant={filter === "accepted" ? "primary" : "outline"}
          onClick={() => setFilter("accepted")}
          size="sm"
        >
          Accepted
        </Button>
        <Button
          variant={filter === "declined" ? "primary" : "outline"}
          onClick={() => setFilter("declined")}
          size="sm"
        >
          Declined
        </Button>
      </div>

      {/* Requests Grid */}
      <div className="grid gap-6">
        {filteredRequests.map((request) => (
          <Card key={request.id} variant="elevated">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="size-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                    {request.avatar}
                  </div>
                  <div>
                    <CardTitle>{request.requester}</CardTitle>
                    <CardDescription className="mt-1">
                      Wants to learn <strong>{request.skill}</strong>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(request.status)}
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                      request.status
                    )}`}
                  >
                    {request.status}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-foreground mb-4">{request.description}</p>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>
                  <strong>Level:</strong> {request.level}
                </span>
                <span>
                  <strong>Requested:</strong> {request.date}
                </span>
              </div>
            </CardContent>

            {request.status === "pending" && (
              <CardFooter>
                <Button variant="primary">Accept Request</Button>
                <Button variant="outline">Decline</Button>
                <Link to="/chat/1">
                  <Button variant="ghost">Send Message</Button>
                </Link>
              </CardFooter>
            )}

            {request.status === "accepted" && (
              <CardFooter>
                <Link to="/schedule/1">
                  <Button variant="primary">Schedule Session</Button>
                </Link>
                <Link to="/chat/1">
                  <Button variant="outline">Message</Button>
                </Link>
              </CardFooter>
            )}
          </Card>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <Card variant="bordered" className="text-center py-12">
          <p className="text-muted-foreground mb-4">No {filter !== "all" && filter} requests found</p>
          <Link to="/matching">
            <Button variant="outline">Find Learning Opportunities</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
