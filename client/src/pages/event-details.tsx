import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Eye, 
  Share, 
  Camera, 
  Cloud, 
  Check, 
  X, 
  HelpCircle, 
  UserPlus,
  Heart,
  Send,
  Plus,
  ArrowLeft
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import MobileNav from "@/components/layout/mobile-nav";
import GuestList from "@/components/guest-list";
import ExpenseTracker from "@/components/expense-tracker";
import Polls from "@/components/polls";
import PosterGallery from "@/components/poster-gallery";
import PosterCustomizer from "@/components/poster-customizer";
import { ThemeBackground } from "@/components/theme-background";
import { getThemeById } from "@shared/themes";
import type { Event } from "@shared/schema";

export default function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("updates");
  const [newComment, setNewComment] = useState("");
  const [isPosterCustomizerOpen, setIsPosterCustomizerOpen] = useState(false);

  const { data: event, isLoading, error } = useQuery<any>({
    queryKey: [`/api/events/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/events/${id}`, { credentials: "include" });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Event not found");
        }
        if (response.status >= 500) {
          throw new Error("Database connection error - please try again later");
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!id,
    retry: (failureCount, error) => {
      // Don't retry on 404s
      if (error?.message === "Event not found") return false;
      // Retry database errors up to 3 times
      return failureCount < 3;
    },
    retryDelay: 1000,
  });

  // Add debugging
  console.log('Event Details Debug:', {
    id,
    event,
    isLoading,
    error: error?.message,
    queryKey: `/api/events/${id}`
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      try {
        const response = await apiRequest("POST", `/api/events/${id}/rsvp`, { status });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update RSVP");
        }
        return response.json();
      } catch (error) {
        console.error("RSVP error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}`] });
      toast({
        title: "RSVP updated!",
        description: "Your response has been recorded.",
      });
    },
    onError: (error: any) => {
      console.error("RSVP mutation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update RSVP. Please try again.",
        variant: "destructive",
      });
    },
  });

  const postMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/events/${id}/posts`, { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}`] });
      setNewComment("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post comment.",
        variant: "destructive",
      });
    },
  });

  const handleRsvp = (status: string) => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to RSVP.",
        variant: "destructive",
      });
      return;
    }
    rsvpMutation.mutate({ status });
  };

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to post comments.",
        variant: "destructive",
      });
      return;
    }
    postMutation.mutate(newComment);
  };

  const handleSavePoster = async (posterData: any) => {
    try {
      await apiRequest("PUT", `/api/events/${id}`, {
        posterData
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}`] });
      toast({
        title: "Poster saved!",
        description: "Your custom poster has been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save poster.",
        variant: "destructive",
      });
    }
  };

  const formatEventDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getUserRsvpStatus = () => {
    if (!user || !event?.rsvps) return null;
    return event.rsvps.find((rsvp: any) => rsvp.userId === user.id)?.status;
  };

  const getRsvpCounts = () => {
    if (!event?.rsvps) return { going: 0, maybe: 0, not_going: 0 };
    return event.rsvps.reduce((acc: any, rsvp: any) => {
      acc[rsvp.status] = (acc[rsvp.status] || 0) + 1;
      return acc;
    }, { going: 0, maybe: 0, not_going: 0 });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen ">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">
            {error.message === "Event not found" ? "Event not found" : "Unable to load event"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {error.message === "Event not found" 
              ? "The event you're looking for doesn't exist or has been deleted."
              : error.message.includes("Database connection") 
                ? "We're having trouble connecting to our database. Please try again in a few moments."
                : "Something went wrong while loading the event. Please try again."
            }
          </p>
          <div className="space-x-4">
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
            <Link to="/events">
              <Button>Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen ">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Event not found</h1>
          <p className="text-muted-foreground mb-8">
            The event you're looking for doesn't exist or has been deleted.
          </p>
          <Link href="/">
            <Button className="gaming-button">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const userRsvpStatus = getUserRsvpStatus();
  const rsvpCounts = getRsvpCounts();
  const theme = getThemeById(event.themeId || 'quantum-dark');

  return (
    <ThemeBackground 
      theme={theme}
      className="min-h-screen"
    >
      {/* Full page overlay for content readability */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Page content */}
      <div className="relative z-10">
        <Header />
        
        {/* Event Header */}
        <div className="relative">
          <div className="h-48 md:h-56">
            {/* Header background overlay for text readability */}
            <div className="absolute inset-0 bg-black/10" />
            
            {/* Event Title and Basic Info */}
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="text-white">
                  <h1 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg">{event.title}</h1>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(event.datetime).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {rsvpCounts.going} going
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link href="/">
              <Button variant="ghost" className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Events
              </Button>
            </Link>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event Poster Section - Larger Display */}
              {event.posterData && (
                <div className="flex justify-center">
                  <div className="w-full max-w-lg">
                    <PosterGallery 
                      event={event} 
                      isPreview={true}
                    />
                  </div>
                </div>
              )}

              {/* RSVP Actions - Full Width */}
              {user && (
                <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Are you going?</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button
                      onClick={() => handleRsvp("going")}
                      disabled={rsvpMutation.isPending}
                      className={`${
                        userRsvpStatus === "going"
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-white/10 border border-white/20 text-white hover:bg-green-600/20 hover:border-green-500"
                      } transition-all duration-200`}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Going
                    </Button>
                    <Button
                      onClick={() => handleRsvp("maybe")}
                      disabled={rsvpMutation.isPending}
                      className={`${
                        userRsvpStatus === "maybe"
                          ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                          : "bg-white/10 border border-white/20 text-white hover:bg-yellow-600/20 hover:border-yellow-500"
                      } transition-all duration-200`}
                    >
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Maybe
                    </Button>
                    <Button
                      onClick={() => handleRsvp("not_going")}
                      disabled={rsvpMutation.isPending}
                      className={`${
                        userRsvpStatus === "not_going"
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-white/10 border border-white/20 text-white hover:bg-red-600/20 hover:border-red-500"
                      } transition-all duration-200`}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Can't Go
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:border-white/40 transition-all duration-200"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Bring Guest
                    </Button>
                  </div>
                </div>
              )}

              {/* Event Tabs - Improved Styling */}
              <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-5 bg-white/10 border border-white/20">
                    <TabsTrigger value="updates" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">Updates</TabsTrigger>
                    <TabsTrigger value="poster" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">Poster</TabsTrigger>
                    <TabsTrigger value="polls" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">Polls</TabsTrigger>
                    <TabsTrigger value="expenses" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">Expenses</TabsTrigger>
                    <TabsTrigger value="photos" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">Photos</TabsTrigger>
                  </TabsList>

                  <TabsContent value="updates" className="mt-6 space-y-4">
                    {event.posts && event.posts.length > 0 ? (
                      event.posts.map((post: any) => (
                        <div key={post.id} className="flex items-start space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={post.author?.profileImageUrl} />
                            <AvatarFallback className="bg-white/20 text-white">
                              {post.author?.firstName?.[0]}{post.author?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <p className="font-semibold text-sm text-white">
                                  {post.author?.firstName} {post.author?.lastName}
                                  {post.authorId === event.hostId && (
                                    <Badge variant="outline" className="ml-2 text-xs border-white/30 text-white">Host</Badge>
                                  )}
                                </p>
                              </div>
                              <p className="text-sm text-white">{post.content}</p>
                              <div className="flex items-center space-x-4 mt-3 text-xs text-white/60">
                                <span>{new Date(post.createdAt).toLocaleString()}</span>
                                <button className="hover:text-white transition-colors">
                                  <Heart className="h-3 w-3 mr-1 inline" />
                                  Like
                                </button>
                                <button className="hover:text-white transition-colors">Reply</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-white/60">
                        <p>No updates yet. Be the first to post!</p>
                      </div>
                    )}

                    {/* Comment Input */}
                    {user && (
                      <div className="flex items-center space-x-3 mt-6">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.profileImageUrl || undefined} />
                          <AvatarFallback className="bg-white/20 text-white">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 relative">
                          <Input
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="bg-white/10 border border-white/20 pr-12 text-white placeholder:text-white/50"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handlePostComment();
                              }
                            }}
                          />
                          <button
                            onClick={handlePostComment}
                            disabled={!newComment.trim() || postMutation.isPending}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white hover:text-white/80 transition-colors disabled:opacity-50"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="poster" className="mt-6">
                    <PosterGallery 
                      event={event} 
                      onCustomize={() => setIsPosterCustomizerOpen(true)}
                    />
                  </TabsContent>

                  <TabsContent value="polls" className="mt-6">
                    <Polls eventId={parseInt(id!)} />
                  </TabsContent>

                  <TabsContent value="expenses" className="mt-6">
                    <ExpenseTracker eventId={parseInt(id!)} />
                  </TabsContent>

                  <TabsContent value="photos" className="mt-6">
                    <div className="text-center py-8 text-white/60">
                      <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Photo collection feature coming soon!</p>
                      <p className="text-sm">Share memories from your event</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
                <GuestList 
                  eventId={parseInt(id!)} 
                  rsvps={event.rsvps} 
                  rsvpCounts={rsvpCounts} 
                />
              </div>
            </div>
          </div>
        </main>

        <MobileNav />
        
        {/* Poster Customizer */}
        <PosterCustomizer 
          open={isPosterCustomizerOpen}
          onOpenChange={setIsPosterCustomizerOpen}
          eventData={event}
          onSave={handleSavePoster}
        />
      </div> {/* End relative z-10 */}
    </ThemeBackground>
  );
}
