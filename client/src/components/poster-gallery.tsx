import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Share, 
  Download, 
  Eye, 
  Calendar, 
  MapPin, 
  Users,
  Gamepad2,
  PartyPopper,
  Image as ImageIcon
} from "lucide-react";

interface PosterGalleryProps {
  event: any;
  onCustomize?: () => void;
}

export default function PosterGallery({ event, onCustomize }: PosterGalleryProps) {
  const [selectedPoster, setSelectedPoster] = useState<any>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const formatEventDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getEventIcon = () => {
    if (event?.eventType === "online") {
      return <Gamepad2 className="w-16 h-16" />;
    }
    return <PartyPopper className="w-16 h-16" />;
  };

  const renderPoster = (posterData: any) => {
    const template = posterData?.template || {
      gradient: "from-blue-600 to-purple-600",
      textColor: "text-white",
      accentColor: "text-blue-200"
    };

    return (
      <div className={`w-full h-full bg-gradient-to-br ${template.gradient} relative p-6 flex flex-col justify-between text-white`}>
        {/* Top Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge className="bg-white/20 backdrop-blur-sm border-0 text-white">
              {event?.eventType === "online" ? "Gaming Session" : "Party Event"}
            </Badge>
            <div className={template.accentColor}>
              {getEventIcon()}
            </div>
          </div>

          <div className="space-y-2">
            <h1 className={`text-2xl font-bold ${template.textColor} leading-tight`}>
              {posterData?.customTitle || event?.title}
            </h1>
            {posterData?.customSubtitle && (
              <p className={`text-lg ${template.accentColor}`}>
                {posterData.customSubtitle}
              </p>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        {posterData?.showDetails !== false && (
          <div className="space-y-3 bg-black/30 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Calendar className={`w-4 h-4 ${template.accentColor}`} />
              <p className={`text-sm ${template.textColor} font-medium`}>
                {event?.datetime ? formatEventDate(event.datetime) : "Date & Time"}
              </p>
            </div>
            
            {event?.location && (
              <div className="flex items-center gap-3">
                <MapPin className={`w-4 h-4 ${template.accentColor}`} />
                <p className={`text-sm ${template.textColor}`}>
                  {event.location}
                </p>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <Users className={`w-4 h-4 ${template.accentColor}`} />
              <p className={`text-sm ${template.textColor}`}>
                {event?.maxGuests ? `Up to ${event.maxGuests} guests` : "Open to all"}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const viewPoster = (posterData: any) => {
    setSelectedPoster(posterData);
    setIsViewerOpen(true);
  };

  const downloadPoster = (posterData: any) => {
    // In a real app, this would generate and download the poster
    console.log("Downloading poster:", posterData);
  };

  const sharePoster = (posterData: any) => {
    // In a real app, this would share the poster
    console.log("Sharing poster:", posterData);
  };

  if (!event?.posterData) {
    return (
      <Card className="glass-effect">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-primary/20 to-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Custom Poster Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create a stunning custom poster for your event to share with friends!
          </p>
          {onCustomize && (
            <Button onClick={onCustomize} className="gaming-button">
              Create Poster
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Event Poster</h3>
          {onCustomize && (
            <Button variant="outline" onClick={onCustomize}>
              Edit Poster
            </Button>
          )}
        </div>

        <Card className="glass-effect overflow-hidden">
          <div className="aspect-[4/5] relative">
            {renderPoster(event.posterData)}
            
            {/* Overlay Controls */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
              <div className="flex gap-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => viewPoster(event.posterData)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => downloadPoster(event.posterData)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => sharePoster(event.posterData)}
                >
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Poster Viewer Dialog */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="glass-effect max-w-2xl">
          <DialogHeader>
            <DialogTitle>Event Poster</DialogTitle>
          </DialogHeader>
          
          {selectedPoster && (
            <div className="aspect-[4/5] rounded-xl overflow-hidden">
              {renderPoster(selectedPoster)}
            </div>
          )}
          
          <div className="flex gap-3">
            <Button
              onClick={() => downloadPoster(selectedPoster)}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={() => sharePoster(selectedPoster)}
              className="flex-1"
            >
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}