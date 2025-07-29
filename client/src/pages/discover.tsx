import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, MapPin, Clock, Gamepad2, PartyPopper, Search, Filter, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import MobileNav from "@/components/layout/mobile-nav";
import { type Event } from "@shared/schema";

type EventWithCounts = Event & {
  rsvpCount: number;
  goingCount: number;
};

type FilterCategory = "all" | "gaming" | "parties" | "this-week" | "small-groups";
type SortOption = "date" | "newest" | "popular";

export default function Discover() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [showFilters, setShowFilters] = useState(false);

  const { data: events = [], isLoading } = useQuery<EventWithCounts[]>({
    queryKey: ["/api/events/discover"],
  });

  const formatEventDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short", 
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isThisWeek = (dateString: string) => {
    const eventDate = new Date(dateString);
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return eventDate >= now && eventDate <= oneWeekFromNow;
  };

  const isSmallGroup = (event: EventWithCounts) => {
    return event.maxGuests && event.maxGuests <= 10;
  };

  const filteredAndSortedEvents = useMemo(() => {
    if (!events) return [];

    // Filter by search term
    let filtered = events.filter((event) =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter by category
    switch (selectedCategory) {
      case "gaming":
        filtered = filtered.filter(event => event.eventType === "online");
        break;
      case "parties":
        filtered = filtered.filter(event => event.eventType === "offline");
        break;
      case "this-week":
        filtered = filtered.filter(event => isThisWeek(event.datetime.toString()));
        break;
      case "small-groups":
        filtered = filtered.filter(event => isSmallGroup(event));
        break;
      default:
        // "all" - no additional filtering
        break;
    }

    // Sort events
    switch (sortBy) {
      case "date":
        filtered.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
        break;
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      case "popular":
        // For now, sort by max guests as a proxy for popularity
        filtered.sort((a, b) => (b.maxGuests || 0) - (a.maxGuests || 0));
        break;
    }

    return filtered;
  }, [events, searchTerm, selectedCategory, sortBy]);

  const categories = [
    { id: "all" as FilterCategory, label: "All Events", icon: null },
    { id: "gaming" as FilterCategory, label: "Gaming", icon: Gamepad2 },
    { id: "parties" as FilterCategory, label: "Parties", icon: PartyPopper },
    { id: "this-week" as FilterCategory, label: "This Week", icon: Calendar },
    { id: "small-groups" as FilterCategory, label: "Small Groups", icon: Users },
  ];

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
      <MobileNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 gradient-text">
            Discover Events
          </h1>
          <p className="text-muted-foreground text-lg">
            Find awesome events happening around you
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="space-y-4 mb-8">
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-dark-card border-dark-border"
            />
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="border-dark-border"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-4 justify-center items-center p-4 bg-dark-card/30 rounded-lg border border-dark-border">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Sort by:</span>
                <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                  <SelectTrigger className="w-32 h-8 bg-dark-card border-dark-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="popular">Popular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            
            return (
              <Badge
                key={category.id}
                variant={isSelected ? "secondary" : "outline"}
                className={`cursor-pointer transition-colors ${
                  isSelected 
                    ? "bg-primary text-white hover:bg-primary/90" 
                    : "hover:bg-primary hover:text-white hover:border-primary"
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {Icon && <Icon className="h-3 w-3 mr-1" />}
                {category.label}
              </Badge>
            );
          })}
        </div>

        {/* Events Grid */}
        {filteredAndSortedEvents && filteredAndSortedEvents.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card className="glass-effect hover:neon-glow cursor-pointer transition-all duration-300 h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <Badge
                        variant={event.eventType === "online" ? "default" : "secondary"}
                        className={event.eventType === "online" ? "bg-primary" : "bg-pink-500"}
                      >
                        {event.eventType === "online" ? "Gaming" : "Party"}
                      </Badge>
                      <div className="text-xs text-muted-foreground bg-dark-card/50 px-2 py-1 rounded">
                        Public
                      </div>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {event.description}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{formatEventDate(event.datetime.toString())}</span>
                      </div>
                      
                      {event.location && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="h-4 w-4 mr-2" />
                          <span>{event.goingCount || 0}/{event.maxGuests || '∞'} going</span>
                        </div>
                        <Button size="sm" className="gaming-button-sm">
                          Join Event
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-dark-card/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm ? "No events found" : "No public events yet"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm 
                ? "Try adjusting your search terms" 
                : "Be the first to create a public event for others to discover!"}
            </p>
            <Link href="/">
              <Button className="gaming-button">
                Create First Event
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}