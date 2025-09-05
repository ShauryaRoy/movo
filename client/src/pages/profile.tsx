import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Settings, 
  Camera, 
  Edit3, 
  Save,
  X,
  Mail,
  Clock,
  TrendingUp,
  Heart,
  Plus,
  Search
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import MobileNav from "@/components/layout/mobile-nav";
import EventCard from "@/components/event-card";
import { ThemeBackground } from "@/components/theme-background";
import { getThemeById } from "@shared/themes";

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserStats {
  eventsHosted: number;
  eventsAttended: number;
  totalRsvps: number;
  upcomingEvents: number;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("hosted");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    location: ""
  });

  const theme = getThemeById('quantum-dark');

  // Fetch user profile data
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const response = await fetch("/api/profile", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch user statistics
  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ["/api/profile/stats"],
    queryFn: async () => {
      const response = await fetch("/api/profile/stats", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch user's events
  const { data: userEvents, isLoading: eventsLoading } = useQuery<any[]>({
    queryKey: ["/api/profile/events"],
    queryFn: async () => {
      const response = await fetch("/api/profile/events", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
    enabled: !!user,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const response = await apiRequest("PUT", "/api/profile", data);
      if (!response.ok) throw new Error("Failed to update profile");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setIsEditing(false);
      toast({
        title: "Profile updated!",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Initialize edit form when profile loads
  useEffect(() => {
    if (profile) {
      setEditForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        bio: profile.bio || "",
        location: profile.location || ""
      });
    }
  }, [profile]);

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(editForm);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (profile) {
      setEditForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        bio: profile.bio || "",
        location: profile.location || ""
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white">Please log in to view your profile.</p>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <ThemeBackground theme={theme} className="min-h-screen">
        <div className="relative z-10">
          <Header />
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </ThemeBackground>
    );
  }

  return (
    <ThemeBackground theme={theme} className="min-h-screen">
      {/* Full page overlay for content readability */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Page content */}
      <div className="relative z-10">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 md:pb-12 space-y-8">
          {/* Profile Header */}
          <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-white/5 backdrop-blur-md p-6 md:p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Avatar and Basic Info */}
              <div className="flex flex-col items-center lg:items-start space-y-4">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-white/20">
                    <AvatarImage src={profile?.profileImageUrl} />
                    <AvatarFallback className="bg-white/20 text-white text-3xl">
                      {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute bottom-0 right-0 rounded-full h-10 w-10 p-0 border-white/30 bg-white/10 hover:bg-white/20"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="text-center lg:text-left">
                  <h1 className="text-3xl font-bold text-white">
                    {profile?.firstName} {profile?.lastName}
                  </h1>
                  <p className="text-white/70 flex items-center gap-2 justify-center lg:justify-start">
                    <Mail className="h-4 w-4" />
                    {profile?.email}
                  </p>
                  <p className="text-white/50 text-sm flex items-center gap-2 justify-center lg:justify-start mt-1">
                    <Clock className="h-4 w-4" />
                    Joined {new Date(profile?.createdAt || '').toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric"
                    })}
                  </p>
                </div>
              </div>

              {/* Profile Details and Actions */}
              <div className="flex-1 space-y-6">
                {!isEditing ? (
                  <>
                    {/* Bio and Details */}
                    <div className="space-y-4">
                      {profile?.bio && (
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">About</h3>
                          <p className="text-white/80">{profile.bio}</p>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-4">
                        {profile?.location && (
                          <div className="flex items-center gap-2 text-white/70">
                            <MapPin className="h-4 w-4" />
                            <span>{profile.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setIsEditing(true)}
                        variant="outline"
                        className="border-white/30 text-white bg-white/10 hover:bg-white/20"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button
                        variant="outline"
                        className="border-white/30 text-white bg-white/10 hover:bg-white/20"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </div>
                  </>
                ) : (
                  // Edit Form
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName" className="text-white">First Name</Label>
                        <Input
                          id="firstName"
                          value={editForm.firstName}
                          onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-white">Last Name</Label>
                        <Input
                          id="lastName"
                          value={editForm.lastName}
                          onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="bio" className="text-white">Bio</Label>
                      <Textarea
                        id="bio"
                        value={editForm.bio}
                        onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                        placeholder="Tell us about yourself..."
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location" className="text-white">Location</Label>
                        <Input
                          id="location"
                          value={editForm.location}
                          onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                          placeholder="City, Country"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={updateProfileMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        variant="outline"
                        className="border-white/30 text-white bg-white/10 hover:bg-white/20"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {!statsLoading && stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white/10 border-white/20 backdrop-blur-md">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-8 w-8 text-blue-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.eventsHosted}</p>
                      <p className="text-white/60 text-sm">Events Hosted</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 border-white/20 backdrop-blur-md">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Users className="h-8 w-8 text-green-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.eventsAttended}</p>
                      <p className="text-white/60 text-sm">Events Attended</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 border-white/20 backdrop-blur-md">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-8 w-8 text-pink-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.totalRsvps}</p>
                      <p className="text-white/60 text-sm">Total RSVPs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 border-white/20 backdrop-blur-md">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-8 w-8 text-yellow-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.upcomingEvents}</p>
                      <p className="text-white/60 text-sm">Upcoming</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Content Tabs */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 bg-white/10 border border-white/20">
                <TabsTrigger value="hosted" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
                  Hosted Events
                </TabsTrigger>
                <TabsTrigger value="attending" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
                  Attending
                </TabsTrigger>
              </TabsList>

              <TabsContent value="hosted" className="mt-6">
                {eventsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : userEvents && userEvents.filter(event => event.hostId === user.id).length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {userEvents.filter(event => event.hostId === user.id).map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-white/60">
                    <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="mb-4">You haven't hosted any events yet.</p>
                    <Link href="/create-event">
                      <Button variant="outline" className="border-white/30 text-white bg-white/10 hover:bg-white/20">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Event
                      </Button>
                    </Link>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="attending" className="mt-6">
                {eventsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : userEvents && userEvents.filter(event => event.hostId !== user.id).length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {userEvents.filter(event => event.hostId !== user.id).map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-white/60">
                    <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="mb-4">You're not attending any events yet.</p>
                    <Link href="/discover">
                      <Button variant="outline" className="border-white/30 text-white bg-white/10 hover:bg-white/20">
                        <Search className="h-4 w-4 mr-2" />
                        Discover Events
                      </Button>
                    </Link>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <MobileNav />
      </div>
    </ThemeBackground>
  );
}
