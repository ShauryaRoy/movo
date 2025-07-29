import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Eye, Share, Camera, Cloud } from "lucide-react";

interface EventCardProps {
  event: any;
}

export default function EventCard({ event }: EventCardProps) {
  const formatEventDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Mock weather data - in a real app, this would come from a weather API
  const weatherInfo = "🌤️ 72°F • Clear skies";

  return (
    <Card className="glass-effect">
      <CardContent className="p-6 space-y-6">
        {/* Event Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <Badge
                variant={event.eventType === "online" ? "default" : "secondary"}
                className={`${
                  event.eventType === "online"
                    ? "bg-gradient-to-r from-primary to-blue-600"
                    : "bg-gradient-to-r from-pink-500 to-purple-600"
                }`}
              >
                {event.eventType === "online" ? "GAMING SESSION" : "PARTY"}
              </Badge>
              <span className="text-primary text-sm flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                42 views
              </span>
            </div>
            <h2 className="text-3xl font-bold mb-2">{event.title}</h2>
            <p className="text-muted-foreground">{event.description}</p>
          </div>
          <Button variant="ghost" size="icon">
            <Share className="h-5 w-5 text-primary" />
          </Button>
        </div>

        {/* Event Image Placeholder */}
        <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-blue-600/20 h-64 flex items-center justify-center">
          <div className="text-6xl">
            {event.eventType === "online" ? "🎮" : "🎉"}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70"
          >
            <Camera className="h-5 w-5 text-white" />
          </Button>
        </div>

        {/* Event Details Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Calendar className="text-primary w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Date & Time</p>
                <p className="font-semibold">{formatEventDate(event.datetime)}</p>
              </div>
            </div>
            
            {event.location && (
              <div className="flex items-center space-x-3">
                <MapPin className="text-pink-400 w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-semibold">{event.location}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Users className="text-purple-400 w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Guests</p>
                <p className="font-semibold">
                  {event.maxGuests ? `Max ${event.maxGuests}` : "No limit"}
                </p>
              </div>
            </div>
            
            {event.eventType === "offline" && (
              <div className="flex items-center space-x-3">
                <Cloud className="text-cyan-400 w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Weather</p>
                  <p className="font-semibold">{weatherInfo}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
