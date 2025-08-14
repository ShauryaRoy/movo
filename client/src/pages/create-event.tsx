import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Globe, 
  Lock,
  Plus,
  Palette,
  Image,
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import { ThemeSelector } from "@/components/theme-selector";
import { ThemeBackground } from "@/components/theme-background";
import PosterGallery from "@/components/poster-gallery";
import PosterCustomizer from "@/components/poster-customizer";
import { getThemeById } from "@shared/themes";

const createEventSchema = z.object({
  title: z.string().min(1, "Event title is required"),
  eventType: z.enum(["offline", "online"]),
  datetime: z.string().min(1, "Date and time are required"),
  location: z.string().optional(),
  description: z.string().optional(),
  maxGuests: z.number().min(1, "Must allow at least 1 guest"),
  isPrivate: z.boolean(),
  themeId: z.string().min(1, "Please select a theme"),
  posterData: z.any().optional(), // We'll validate this separately
});

type CreateEventFormData = z.infer<typeof createEventSchema>;

export default function CreateEventPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedTheme, setSelectedTheme] = useState('quantum-dark');
  const [posterData, setPosterData] = useState<any>(null);
  const [isPosterCustomizerOpen, setIsPosterCustomizerOpen] = useState(false);
  const [posterError, setPosterError] = useState<string>("");
  
  const theme = getThemeById(selectedTheme);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      eventType: "offline",
      isPrivate: false,
      themeId: selectedTheme,
      maxGuests: 10
    }
  });

  const eventType = watch("eventType");
  
  // Watch form values for live poster preview
  const formValues = watch();

  // Update poster data when title changes
  useEffect(() => {
    if (posterData && formValues.title) {
      setPosterData((prev: any) => ({
        ...prev,
        customTitle: formValues.title
      }));
    }
  }, [formValues.title, posterData]);

  const createEventMutation = useMutation({
    mutationFn: async (data: CreateEventFormData & { posterData?: any }) => {
      console.log("Creating event with data:", data);
      
      const eventData = {
        ...data,
        datetime: new Date(data.datetime).toISOString(),
        posterData: data.posterData
      };

      const response = await apiRequest("POST", "/api/events", eventData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create event");
      }
      return response.json();
    },
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event created!",
        description: "Your event has been successfully created.",
      });
      setLocation(`/events/${newEvent.id}`);
    },
    onError: (error: any) => {
      console.error("Event creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: CreateEventFormData) => {
    // Validate that a poster is selected (either default from PosterGallery or custom)
    if (!posterData) {
      setPosterError("Please select or customize a poster for your event");
      // Scroll to the poster section
      document.getElementById('poster-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    
    // Clear any poster errors
    setPosterError("");
    
    console.log("Form submitted:", data);
    createEventMutation.mutate({ ...data, posterData: posterData });
  };

  const handleSavePoster = (newPosterData: any) => {
    console.log("Saving poster data:", newPosterData);
    setPosterData(newPosterData);
    setPosterError(""); // Clear any poster errors
    setIsPosterCustomizerOpen(false);
    toast({
      title: "Poster saved!",
      description: "Your custom poster has been saved.",
    });
  };

  return (
    <ThemeBackground 
      theme={theme}
      className="min-h-screen"
    >
      {/* Full page overlay for content readability */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Page content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          {/* Split Layout Container */}
          <div className="max-w-7xl mx-auto">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid lg:grid-cols-2 gap-8 min-h-[80vh]">
                
                {/* LEFT SIDE - Event Details Form */}
                <Card className="bg-white/10 dark:bg-gray-900/10 backdrop-blur-md border border-white/10 shadow-lg">
                  <CardHeader className="border-b border-white/10">
                    <div className="flex items-center gap-4">
                      <Link href="/">
                        <Button variant="ghost" size="sm" className="text-white/80 hover:text-white">
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back
                        </Button>
                      </Link>
                      <div>
                        <CardTitle className="text-2xl text-white">Create New Event</CardTitle>
                        <p className="text-white/70 text-sm">Fill out the details for your event</p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                    <div className="space-y-4">
                      {/* Event Title */}
                      <div>
                        <Label htmlFor="title" className="text-white">Event Title</Label>
                        <Input
                          id="title"
                          {...register("title")}
                          placeholder="Epic Friday Game Night 🎮"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20"
                          onChange={(e) => {
                            register("title").onChange(e);
                            // This will trigger re-render of poster preview
                          }}
                        />
                        {errors.title && (
                          <p className="text-sm text-red-300 mt-1">{errors.title.message}</p>
                        )}
                      </div>

                      {/* Event Type */}
                      <div>
                        <Label htmlFor="eventType" className="text-white">Event Type</Label>
                        <Select 
                          defaultValue="offline"
                          onValueChange={(value) => setValue("eventType", value as "offline" | "online")}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="offline">In-Person Party</SelectItem>
                            <SelectItem value="online">Gaming Session</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.eventType && (
                          <p className="text-sm text-red-300 mt-1">{errors.eventType.message}</p>
                        )}
                      </div>

                      {/* Date & Time and Max Guests */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="datetime" className="text-white">Date & Time</Label>
                          <Input
                            id="datetime"
                            type="datetime-local"
                            {...register("datetime")}
                            className="bg-white/10 border-white/20 text-white focus:bg-white/20"
                          />
                          {errors.datetime && (
                            <p className="text-sm text-red-300 mt-1">{errors.datetime.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="maxGuests" className="text-white">Max Guests</Label>
                          <Input
                            id="maxGuests"
                            type="number"
                            {...register("maxGuests", { valueAsNumber: true })}
                            min="1"
                            className="bg-white/10 border-white/20 text-white focus:bg-white/20"
                          />
                          {errors.maxGuests && (
                            <p className="text-sm text-red-300 mt-1">{errors.maxGuests.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Location (for offline events) */}
                      {eventType === "offline" && (
                        <div>
                          <Label htmlFor="location" className="text-white">Location</Label>
                          <Input
                            id="location"
                            {...register("location")}
                            placeholder="Mike's Gaming Den"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20"
                          />
                        </div>
                      )}

                      {/* Description */}
                      <div>
                        <Label htmlFor="description" className="text-white">Description</Label>
                        <Textarea
                          id="description"
                          {...register("description")}
                          placeholder="What's this event about? What should guests expect?"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20"
                          rows={4}
                        />
                      </div>

                      {/* Privacy Setting */}
                      <div className="space-y-3">
                        <Label className="text-white">Event Privacy</Label>
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-2">
                            <span className="relative">
                              <input
                                type="radio"
                                id="public"
                                value="false"
                                checked={!watch("isPrivate")}
                                onChange={() => setValue("isPrivate", false)}
                                className="w-4 h-4 appearance-none rounded-full border border-white/20 bg-white/10 checked:bg-white/30 focus:ring-primary transition-colors"
                              />
                              {(!watch("isPrivate")) && (
                                <span className="absolute left-1 top-1 w-2 h-2 bg-white rounded-full pointer-events-none"></span>
                              )}
                            </span>
                            <label htmlFor="public" className="text-sm text-white flex items-center">
                              <Globe className="w-4 h-4 mr-2" />
                              Public
                            </label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className="relative">
                              <input
                                type="radio"
                                id="private"
                                value="true"
                                checked={watch("isPrivate")}
                                onChange={() => setValue("isPrivate", true)}
                                className="w-4 h-4 appearance-none rounded-full border border-white/20 bg-white/10 checked:bg-white/30 focus:ring-primary transition-colors"
                              />
                              {(watch("isPrivate")) && (
                                <span className="absolute left-1 top-1 w-2 h-2 bg-white rounded-full pointer-events-none"></span>
                              )}
                            </span>
                            <label htmlFor="private" className="text-sm text-white flex items-center">
                              <Lock className="w-4 h-4 mr-2" />
                              Private
                            </label>
                          </div>
                        </div>
                        
                        <p className="text-xs text-white/60">
                          {watch("isPrivate") === true
                            ? "Only people you invite can see and join this event"
                            : "Anyone can discover and join this event"
                          }
                        </p>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-6 border-t border-white/10">
                      <Button
                        type="submit"
                        disabled={createEventMutation.isPending}
                        className="gaming-button w-full"
                        size="lg"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {createEventMutation.isPending ? "Creating Event..." : "Create Event"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* RIGHT SIDE - Poster Preview & Theme Selection */}
                <div className="space-y-6">
                  {/* Poster Preview - No Card Wrapper */}
                  <div id="poster-section" className="space-y-4">
                    {/* Poster Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-white flex items-center">
                        <Image className="mr-2 h-5 w-5" />
                        Event Poster Preview
                        <span className="text-red-400 ml-1">*</span>
                      </h3>
                      <div className="flex gap-2">
                        {!posterData && (
                          <Button
                            type="button"
                            onClick={() => {
                              const defaultPoster = {
                                template: {
                                  gradient: "from-blue-600 to-purple-600",
                                  textColor: "text-white",
                                  accentColor: "text-blue-200"
                                },
                                customTitle: formValues.title || "Your Event Title",
                                customSubtitle: "",
                                showDetails: true
                              };
                              setPosterData(defaultPoster);
                              setPosterError("");
                              toast({
                                title: "Default poster selected!",
                                description: "You can customize it further if needed.",
                              });
                            }}
                            variant="outline"
                            size="sm"
                            className="border-green-400/50 text-green-400 hover:bg-green-400/10"
                          >
                            Use Default
                          </Button>
                        )}
                        <Button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsPosterCustomizerOpen(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          {posterData ? "Edit Poster" : "Create Custom"}
                        </Button>
                      </div>
                    </div>

                    {/* Error Message */}
                    {posterError && (
                      <div className="mt-2">
                        <p className="text-sm text-red-300">{posterError}</p>
                      </div>
                    )}

                    {/* Poster Display - Direct without Card */}
                    <div className={`transition-all ${posterError ? 'ring-2 ring-red-400/50 rounded-lg' : ''}`}>
                      <PosterGallery 
                        event={{
                          id: 0,
                          title: formValues.title || "Your Event Title",
                          datetime: formValues.datetime || new Date().toISOString(),
                          location: formValues.location || (eventType === "offline" ? "Your Location" : ""),
                          description: formValues.description || "",
                          themeId: selectedTheme,
                          posterData: posterData
                        }}
                        onCustomize={() => setIsPosterCustomizerOpen(true)}
                        isPreview={true}
                      />
                    </div>
                      
                    {/* Status Message */}
                    <div className="text-center">
                      <p className="text-sm text-white/60">
                        {posterData ? (
                          <span className="text-green-400">✓ Poster selected</span>
                        ) : (
                          <span>Select a poster template or create a custom one <span className="text-red-400">*</span></span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Theme Selector */}
                  <Card className="bg-white/10 dark:bg-gray-900/10 backdrop-blur-md border border-white/10 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-xl text-white flex items-center">
                        <Palette className="mr-2 h-5 w-5" />
                        Choose Background Theme
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ThemeSelector
                        selectedTheme={selectedTheme}
                        onThemeSelect={(themeId) => {
                          setSelectedTheme(themeId);
                          setValue("themeId", themeId);
                        }}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </form>
          </div>
        </main>

        {/* Poster Customizer Modal */}
        <PosterCustomizer 
          open={isPosterCustomizerOpen}
          onOpenChange={setIsPosterCustomizerOpen}
          eventData={{
            id: 0,
            title: formValues.title || "Your Event Title",
            datetime: formValues.datetime || new Date().toISOString(),
            location: formValues.location || (eventType === "offline" ? "Your Location" : ""),
            description: formValues.description || "",
            themeId: selectedTheme,
            posterData: posterData
          }}
          onSave={handleSavePoster}
        />
      </div>
    </ThemeBackground>
  );
}
