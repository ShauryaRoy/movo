import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, MapPin, Plus, Gamepad2, PartyPopper, Sparkles } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEventSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import MobileNav from "@/components/layout/mobile-nav";
import PosterCustomizer from "@/components/poster-customizer";

const createEventSchema = insertEventSchema.omit({ hostId: true }).extend({
  datetime: z.string().min(1, "Date and time are required"),
});

type CreateEventForm = z.infer<typeof createEventSchema>;

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPosterCustomizerOpen, setIsPosterCustomizerOpen] = useState(false);
  const [currentEventData, setCurrentEventData] = useState<any>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["/api/events"],
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData: CreateEventForm & { posterData?: any }) => {
      const response = await apiRequest("POST", "/api/events", eventData);
      return response.json();
    },
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event created!",
        description: "Your event has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      setCurrentEventData(newEvent);
      // Auto-open poster customizer for new events
      setIsPosterCustomizerOpen(true);
      reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateEventForm>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      description: "",
      eventType: "offline",
      location: "",
      datetime: "",
      maxGuests: 20,
      isPublic: true,
    },
  });

  const eventType = watch("eventType");

  const onSubmit = (data: CreateEventForm) => {
    console.log("Form submission started with data:", data);
    console.log("Form errors:", errors);
    
    // Ensure all required fields are present
    if (!data.eventType) {
      data.eventType = "offline";
    }
    
    // Validate required fields
    if (!data.title?.trim()) {
      toast({
        title: "Error",
        description: "Event title is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.datetime) {
      toast({
        title: "Error", 
        description: "Date and time are required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Convert datetime string to ISO format for the backend
      const eventData = {
        ...data,
        datetime: new Date(data.datetime).toISOString(),
        maxGuests: data.maxGuests || 20,
        isPublic: data.isPublic ?? true,
      };
      console.log("Submitting event data:", eventData);
      createEventMutation.mutate(eventData);
    } catch (error) {
      console.error("Error preparing event data:", error);
      toast({
        title: "Error",
        description: "Please check your form data and try again",
        variant: "destructive",
      });
    }
  };

  const handleSavePoster = async (posterData: any) => {
    if (!currentEventData) return;
    
    try {
      await apiRequest("PUT", `/api/events/${currentEventData.id}`, {
        posterData
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
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

  const openPosterCustomizer = (event: any) => {
    setCurrentEventData(event);
    setIsPosterCustomizerOpen(true);
  };

  const formatEventDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
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

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      
      <main className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        {/* Welcome Section */}
        <div className="mb-1">
          <h1 className="text-3xl font-bold ">
            Welcome back, {(user as any)?.firstName || "Friend"}! 👋
          </h1>
          <p className="text-muted-foreground">
            Ready to plan your next epic event?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Card className="glass-effect hover:neon-glow cursor-pointer transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold">Create Event</h3>
                  <p className="text-sm text-muted-foreground">Start planning something awesome</p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="glass-effect max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit((data) => {
                console.log("handleSubmit called with:", data);
                onSubmit(data);
              }, (errors) => {
                console.log("Form validation errors:", errors);
              })} className="space-y-4">
                <div>
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    {...register("title")}
                    placeholder="Epic Friday Game Night 🎮"
                    className="bg-dark-card border-dark-border"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-400 mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select 
                    defaultValue="offline"
                    onValueChange={(value) => setValue("eventType", value as "offline" | "online")}
                  >
                    <SelectTrigger className="bg-dark-card border-dark-border">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offline">In-Person Party</SelectItem>
                      <SelectItem value="online">Gaming Session</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.eventType && (
                    <p className="text-sm text-red-400 mt-1">{errors.eventType.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="datetime">Date & Time</Label>
                  <Input
                    id="datetime"
                    type="datetime-local"
                    {...register("datetime")}
                    className="bg-dark-card border-dark-border"
                  />
                  {errors.datetime && (
                    <p className="text-sm text-red-400 mt-1">{errors.datetime.message}</p>
                  )}
                </div>

                {eventType === "offline" && (
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      {...register("location")}
                      placeholder="Mike's Gaming Den"
                      className="bg-dark-card border-dark-border"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="What's this event about?"
                    className="bg-dark-card border-dark-border"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="maxGuests">Max Guests</Label>
                  <Input
                    id="maxGuests"
                    type="number"
                    {...register("maxGuests", { valueAsNumber: true })}
                    min="1"
                    className="bg-dark-card border-dark-border"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full gaming-button"
                  disabled={createEventMutation.isPending}
                  onClick={(e) => {
                    console.log("Create Event button clicked");
                    // Don't prevent default - let form submission handle it
                  }}
                >
                  {createEventMutation.isPending ? "Creating..." : "Create Event"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Card className="glass-effect hover:border-primary/50 cursor-pointer transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Gamepad2 className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold">Gaming Template</h3>
              <p className="text-sm text-muted-foreground">Quick setup for game nights</p>
            </CardContent>
          </Card>

          <Card className="glass-effect hover:border-primary/50 cursor-pointer transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <PartyPopper className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold">Party Template</h3>
              <p className="text-sm text-muted-foreground">Perfect for birthdays & celebrations</p>
            </CardContent>
          </Card>
        </div>

        {/* Events List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Your Events</h2>
            <Button variant="outline" className="border-primary/30">
              View All
            </Button>
          </div>

          {Array.isArray(events) && events.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event: any) => (
                <Card key={event.id} className="glass-effect hover:neon-glow transition-all duration-300 h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Badge
                        variant={event.eventType === "online" ? "default" : "secondary"}
                        className={event.eventType === "online" ? "bg-primary" : "bg-pink-500"}
                      >
                        {event.eventType === "online" ? "Gaming" : "Party"}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {event.hostId === (user as any)?.id ? "Host" : "Guest"}
                      </div>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{formatEventDate(event.datetime)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center text-muted-foreground">
                        <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>
                          {event.maxGuests ? `Max ${event.maxGuests} guests` : "No limit"}
                        </span>
                      </div>
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    
                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs flex-1"
                        onClick={() => openPosterCustomizer(event)}
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Poster
                      </Button>
                      <Link href={`/events/${event.id}`} className="flex-1">
                        <Button size="sm" className="gaming-button-sm w-full">
                          View
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="glass-effect">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-primary/20 to-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No events yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first event to get started with the ultimate planning experience!
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="gaming-button">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Event
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <MobileNav />
      
      {/* Poster Customizer */}
      <PosterCustomizer 
        open={isPosterCustomizerOpen}
        onOpenChange={setIsPosterCustomizerOpen}
        eventData={currentEventData}
        onSave={handleSavePoster}
      />
    </div>
  );
}
