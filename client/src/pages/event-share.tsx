import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Users, 
  MapPin, 
  Clock, 
  Share2, 
  Heart,
  Globe,
  Lock,
  Copy,
  Check,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { type Event } from "@shared/schema";
import { getThemeById } from "@shared/themes";
import { ThemeBackground } from "@/components/theme-background";

type EventWithDetails = Event & {
  rsvpCount: number;
  goingCount: number;
  maybeCount: number;
  notGoingCount: number;
  userRsvpStatus?: string;
  hostName?: string;
  themeId?: string;
};

export default function EventShare() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [rsvpStatus, setRsvpStatus] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery<EventWithDetails>({
    queryKey: [`/api/events/${id}/share`],
    enabled: !!id,
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      const response = await fetch(`/api/events/${id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to RSVP");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}/share`] });
      toast({
        title: "Success!",
        description: "RSVP updated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update RSVP",
        variant: "destructive",
      });
    },
  });

  const handleRSVP = (status: string) => {
    if (!user) {
      // Redirect to home with a message to sign in
      setLocation(`/?auth=required&redirect=/events/${id}/share`);
      return;
    }
    setRsvpStatus(status);
    rsvpMutation.mutate({ status });
  };

  const copyShareLink = async () => {
    const shareUrl = `${window.location.origin}/events/${id}/share`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Share link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      dayMonth: date.toLocaleDateString("en-US", { 
        weekday: "short", 
        month: "short", 
        day: "numeric" 
      }),
      time: date.toLocaleTimeString("en-US", { 
        hour: "numeric", 
        minute: "2-digit",
        hour12: true 
      }),
      full: date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      })
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Event not found</h2>
          <p className="text-muted-foreground">This event doesn't exist or is no longer available.</p>
          <Button 
            className="mt-4 gaming-button"
            onClick={() => setLocation('/')}
          >
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const dateInfo = formatEventDate(event.datetime.toString());
  const currentUserRsvp = event.userRsvpStatus;
  const theme = getThemeById(event.themeId || 'quantum-dark');

  return (
    <ThemeBackground 
      theme={theme}
      className="min-h-screen"
    >
      {/* Full page overlay for content readability */}
      <div className="absolute inset-0 " />
      
      {/* Page content */}
      <div className="relative z-10">
        {/* Event Poster/Header */}
        <div className="relative">
          <div className="h-64 md:h-80">
            {/* Minimal overlay for text readability */}
            <div className="absolute inset-0" />
            
            {/* Event Type Badge */}
            <div className="absolute top-6 left-6">
              <Badge
                variant="secondary"
                className="bg-black/60 border-white/30 text-white backdrop-blur-sm"
              >
                {event.eventType === "online" ? "🎮 Gaming Event" : "🎉 Party"}
              </Badge>
            </div>

            {/* Privacy Badge */}
            <div className="absolute top-6 right-6">
              <Badge 
                variant="outline" 
                className="bg-black/60 border-white/30 text-white backdrop-blur-sm"
              >
                {event.isPublic ? (
                  <>
                    <Globe className="h-3 w-3 mr-1" />
                    Public
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3 mr-1" />
                    Private
                  </>
                )}
              </Badge>
            </div>
          </div>

          {/* Share Button */}
          <div className="absolute bottom-6 right-6">
            <Button
              variant="outline"
              size="sm"
              onClick={copyShareLink}
              className="bg-black/60 border-white/30 text-white hover:bg-black/80 backdrop-blur-sm"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </>
              )}
            </Button>
          </div>

          {/* Event Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0  p-6">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {event.title}
            </h1>
            <p className="text-white/80 text-lg">
              Hosted by {event.hostName || "Event Host"}
            </p>
          </div>
        </div>

        {/* Event Details */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Content background for readability with better transparency */}
          <div className="bg-white/20 dark:bg-gray-900/20 backdrop-blur-md rounded-lg shadow-lg border border-white/10 p-6">
            <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* RSVP Section */}
            <Card className="glass-effect" style={{ borderColor: `${theme.accent}40` }}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" style={{ color: theme.accent }} />
                  Are you going?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3">
                  <Button
                    variant={currentUserRsvp === "going" ? "default" : "outline"}
                    className={`w-full ${
                      currentUserRsvp === "going" 
                        ? "bg-green-600 hover:bg-green-700" 
                        : "border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                    }`}
                    onClick={() => handleRSVP("going")}
                    disabled={rsvpMutation.isPending}
                  >
                    ✅ Going
                  </Button>
                  <Button
                    variant={currentUserRsvp === "maybe" ? "default" : "outline"}
                    className={`w-full ${
                      currentUserRsvp === "maybe" 
                        ? "bg-yellow-600 hover:bg-yellow-700" 
                        : "border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white"
                    }`}
                    onClick={() => handleRSVP("maybe")}
                    disabled={rsvpMutation.isPending}
                  >
                    🤔 Maybe
                  </Button>
                  <Button
                    variant={currentUserRsvp === "not_going" ? "default" : "outline"}
                    className={`w-full ${
                      currentUserRsvp === "not_going" 
                        ? "bg-red-600 hover:bg-red-700" 
                        : "border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                    }`}
                    onClick={() => handleRSVP("not_going")}
                    disabled={rsvpMutation.isPending}
                  >
                    ❌ Can't go
                  </Button>
                </div>

                {!user && (
                  <p className="text-sm text-muted-foreground mt-3 text-center">
                    Sign in to RSVP and get updates about this event
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Event Description */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>About this event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {event.description || "No description provided for this event."}
                </p>
              </CardContent>
            </Card>

            {/* Attendees */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Responses ({(event.goingCount || 0) + (event.maybeCount || 0) + (event.notGoingCount || 0)})</span>
                  <ChevronRight className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-400">
                      {event.goingCount || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Going</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {event.maybeCount || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Maybe</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-400">
                      {event.notGoingCount || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Can't Go</div>
                  </div>
                </div>
                {event.maxGuests && (
                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    Capacity: {event.maxGuests} max
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Details Card */}
            <Card className="glass-effect sticky top-8">
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date & Time */}
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 mt-0.5" style={{ color: theme.accent }} />
                  <div>
                    <div className="font-medium">{dateInfo.dayMonth}</div>
                    <div className="text-sm text-muted-foreground">{dateInfo.time}</div>
                  </div>
                </div>

                <Separator />

                {/* Location */}
                {event.location && (
                  <>
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 mt-0.5" style={{ color: theme.accent }} />
                      <div>
                        <div className="font-medium">Location</div>
                        <div className="text-sm text-muted-foreground">{event.location}</div>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Capacity */}
                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 mt-0.5" style={{ color: theme.accent }} />
                  <div>
                    <div className="font-medium">Capacity</div>
                    <div className="text-sm text-muted-foreground">
                      {event.maxGuests ? `Up to ${event.maxGuests} people` : "Unlimited"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="glass-effect">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setLocation(`/events/${id}`)}
                  >
                    View Full Event Page
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={copyShareLink}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Share Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        </div> {/* End content background */}
      </div> {/* End max-w-4xl container */}
      
      </div> {/* End relative z-10 */}
    </ThemeBackground>
  );
}
