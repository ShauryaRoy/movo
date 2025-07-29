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
import EventCard from "@/components/event-card";
import GuestList from "@/components/guest-list";
import ExpenseTracker from "@/components/expense-tracker";
import Polls from "@/components/polls";
import PosterGallery from "@/components/poster-gallery";
import PosterCustomizer from "@/components/poster-customizer";

export default function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("updates");
  const [newComment, setNewComment] = useState("");
  const [isPosterCustomizerOpen, setIsPosterCustomizerOpen] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: [`/api/events/${id}`],
    enabled: !!id,
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
      <div className="min-h-screen bg-dark-bg">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-dark-bg">
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

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-primary hover:text-primary/80">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <EventCard event={event} />

            {/* RSVP Actions */}
            {user && (
              <Card className="glass-effect">
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => handleRsvp("going")}
                      disabled={rsvpMutation.isPending}
                      className={`${
                        userRsvpStatus === "going"
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-dark-card border border-dark-border hover:border-green-500"
                      } transition-colors`}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Going
                    </Button>
                    <Button
                      onClick={() => handleRsvp("maybe")}
                      disabled={rsvpMutation.isPending}
                      className={`${
                        userRsvpStatus === "maybe"
                          ? "bg-yellow-600 hover:bg-yellow-700"
                          : "bg-dark-card border border-dark-border hover:border-yellow-500"
                      } transition-colors`}
                    >
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Maybe
                    </Button>
                    <Button
                      onClick={() => handleRsvp("not_going")}
                      disabled={rsvpMutation.isPending}
                      className={`${
                        userRsvpStatus === "not_going"
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-dark-card border border-dark-border hover:border-red-500"
                      } transition-colors`}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Can't Go
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-dark-card border border-dark-border hover:border-primary"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Bring Guest
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Event Tabs */}
            <Card className="glass-effect">
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-5 bg-dark-card">
                    <TabsTrigger value="updates">Updates</TabsTrigger>
                    <TabsTrigger value="poster">Poster</TabsTrigger>
                    <TabsTrigger value="polls">Polls</TabsTrigger>
                    <TabsTrigger value="expenses">Expenses</TabsTrigger>
                    <TabsTrigger value="photos">Photos</TabsTrigger>
                  </TabsList>

                  <TabsContent value="updates" className="mt-6 space-y-4">
                    {event.posts && event.posts.length > 0 ? (
                      event.posts.map((post: any) => (
                        <div key={post.id} className="flex items-start space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={post.author?.profileImageUrl} />
                            <AvatarFallback>
                              {post.author?.firstName?.[0]}{post.author?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-dark-card rounded-lg p-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <p className="font-semibold text-sm">
                                  {post.author?.firstName} {post.author?.lastName}
                                  {post.authorId === event.hostId && (
                                    <Badge variant="outline" className="ml-2 text-xs">Host</Badge>
                                  )}
                                </p>
                              </div>
                              <p className="text-sm">{post.content}</p>
                              <div className="flex items-center space-x-4 mt-3 text-xs text-muted-foreground">
                                <span>{new Date(post.createdAt).toLocaleString()}</span>
                                <button className="hover:text-primary transition-colors">
                                  <Heart className="h-3 w-3 mr-1 inline" />
                                  Like
                                </button>
                                <button className="hover:text-primary transition-colors">Reply</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No updates yet. Be the first to post!</p>
                      </div>
                    )}

                    {/* Comment Input */}
                    {user && (
                      <div className="flex items-center space-x-3 mt-6">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.profileImageUrl} />
                          <AvatarFallback>
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 relative">
                          <Input
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="bg-dark-card border border-dark-border pr-12"
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
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
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
                    <div className="text-center py-8 text-muted-foreground">
                      <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Photo collection feature coming soon!</p>
                      <p className="text-sm">Share memories from your event</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <GuestList 
              eventId={parseInt(id!)} 
              rsvps={event.rsvps} 
              rsvpCounts={rsvpCounts} 
            />
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
    </div>
  );
}
