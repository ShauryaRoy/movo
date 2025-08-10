import { useState } from "react";
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
});

type CreateEventFormData = z.infer<typeof createEventSchema>;

export default function CreateEventPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState<'details' | 'design'>('details');
  const [selectedTheme, setSelectedTheme] = useState('quantum-dark');
  const [posterData, setPosterData] = useState<any>(null);
  const [isPosterCustomizerOpen, setIsPosterCustomizerOpen] = useState(false);
  
  const theme = getThemeById(selectedTheme);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger
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
    console.log("Form submitted:", data);
    createEventMutation.mutate({ ...data, posterData: posterData || undefined });
  };

  const handleNextStep = async () => {
    const isValid = await trigger(['title', 'eventType', 'datetime', 'maxGuests']);
    if (isValid) {
      setCurrentStep('design');
    }
  };

  const handleSavePoster = (newPosterData: any) => {
    console.log("Saving poster data:", newPosterData);
    setPosterData(newPosterData);
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
        
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
          {/* Content background for readability */}
          <div className="w-full max-w-6xl bg-white/10 dark:bg-gray-900/10 backdrop-blur-md rounded-lg shadow-lg border border-white/10">
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Link href="/">
                    <Button variant="ghost" size="sm" className="text-white/80 hover:text-white">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  </Link>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Create New Event</h1>
                    <p className="text-white/70">Design your perfect event experience</p>
                  </div>
                </div>
                
                {/* Step Indicator */}
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    currentStep === 'details' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-white/20 text-white/70'
                  }`}>
                    1. Details
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    currentStep === 'design' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-white/20 text-white/70'
                  }`}>
                    2. Design
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="p-6">
                {currentStep === 'details' && (
                  <div className="max-w-2xl space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title" className="text-white">Event Title</Label>
                        <Input
                          id="title"
                          {...register("title")}
                          placeholder="Epic Friday Game Night 🎮"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20"
                        />
                        {errors.title && (
                          <p className="text-sm text-red-300 mt-1">{errors.title.message}</p>
                        )}
                      </div>

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

                      <div>
                        <Label htmlFor="description" className="text-white">Description</Label>
                        <Textarea
                          id="description"
                          {...register("description")}
                          placeholder="What's this event about?"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20"
                          rows={3}
                        />
                      </div>

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

                    <div className="flex justify-end pt-6">
                      <Button
                        type="button"
                        onClick={handleNextStep}
                        className="gaming-button"
                      >
                        Next: Design & Theme
                        <Palette className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {currentStep === 'design' && (
                  <div className="space-y-8">
                    <div className="grid lg:grid-cols-2 gap-8">
                      {/* Theme Selection */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h2 className="text-xl font-semibold text-white">Choose Theme</h2>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setCurrentStep('details')}
                            className="text-white/70 hover:text-white"
                          >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Details
                          </Button>
                        </div>
                        
                        <Card className="bg-white/10 border-white/20">
                          <CardContent className="p-4">
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

                      {/* Poster Selection */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h2 className="text-xl font-semibold text-white">Event Poster</h2>
                          <Button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIsPosterCustomizerOpen(true);
                            }}
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Custom Poster
                          </Button>
                        </div>
                        
                        <Card className="bg-white/10 border-white/20">
                          <CardContent className="p-4">
                            <PosterGallery 
                              event={{
                                id: 0,
                                title: watch("title") || "",
                                datetime: watch("datetime") || "",
                                location: watch("location") || "",
                                description: watch("description") || "",
                                themeId: selectedTheme,
                                posterData: posterData
                              }}
                              onCustomize={() => setIsPosterCustomizerOpen(true)}
                              isPreview={true}
                            />
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between pt-6">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setCurrentStep('details')}
                        className="text-white/70 hover:text-white"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Details
                      </Button>
                      
                      <Button
                        type="submit"
                        disabled={createEventMutation.isPending}
                        className="gaming-button"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {createEventMutation.isPending ? "Creating..." : "Create Event"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </main>

        {/* Poster Customizer */}
        <PosterCustomizer 
          open={isPosterCustomizerOpen}
          onOpenChange={setIsPosterCustomizerOpen}
          eventData={{
            id: 0,
            title: watch("title") || "",
            datetime: watch("datetime") || "",
            location: watch("location") || "",
            description: watch("description") || "",
            themeId: selectedTheme,
            posterData: posterData
          }}
          onSave={handleSavePoster}
        />
      </div>
    </ThemeBackground>
  );
}
