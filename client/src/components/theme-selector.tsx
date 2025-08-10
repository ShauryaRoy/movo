import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Palette, 
  Sparkles, 
  Leaf, 
  PartyPopper, 
  Zap,
  Check
} from 'lucide-react';
import { EventTheme, eventThemes, themeCategories, ThemeCategory } from '@shared/themes';
import { ThemeBackground } from './theme-background';

interface ThemeSelectorProps {
  selectedTheme: string;
  onThemeSelect: (themeId: string) => void;
  className?: string;
}

const categoryIcons = {
  minimal: Palette,
  confetti: Sparkles,
  seasonal: Leaf,
  holiday: PartyPopper,
  'special-effects': Zap,
};

const ThemePreview: React.FC<{ theme: EventTheme; isSelected: boolean; onSelect: () => void }> = ({ 
  theme, 
  isSelected, 
  onSelect 
}) => {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
        isSelected 
          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
          : 'hover:shadow-lg'
      }`}
      onClick={onSelect}
    >
      <div className="relative h-24 overflow-hidden rounded-t-lg">
        <ThemeBackground theme={theme} className="h-full w-full">
          <div className="absolute inset-0 flex items-center justify-center">
            {isSelected && (
              <div className="bg-primary rounded-full p-2">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
          </div>
        </ThemeBackground>
      </div>
      <CardContent className="p-3">
        <div className="space-y-1">
          <h4 className="font-medium text-sm">{theme.name}</h4>
          <p className="text-xs text-muted-foreground">{theme.preview}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ 
  selectedTheme, 
  onThemeSelect, 
  className = '' 
}) => {
  const [activeCategory, setActiveCategory] = useState<ThemeCategory>('minimal');
  
  const getThemesByCategory = (category: ThemeCategory) => {
    return eventThemes.filter(theme => theme.category === category);
  };

  // Filter out emoji and pattern categories
  const filteredCategories = themeCategories.filter(
    category => category.id !== 'emoji' && category.id !== 'pattern'
  );

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Choose Event Theme</h3>
        <p className="text-sm text-muted-foreground">
          Select a theme that matches your event's vibe and style
        </p>
      </div>

      <Tabs 
        value={activeCategory} 
        onValueChange={(value) => setActiveCategory(value as ThemeCategory)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
          {filteredCategories.map((category) => {
            const Icon = categoryIcons[category.id as keyof typeof categoryIcons];
            return (
              <TabsTrigger 
                key={category.id} 
                value={category.id}
                className="flex flex-col gap-1 p-2 text-xs"
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline truncate">{category.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {filteredCategories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="mt-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {getThemesByCategory(category.id as ThemeCategory).length} themes
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              </div>

              <ScrollArea className="h-64">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                  {getThemesByCategory(category.id as ThemeCategory).map((theme) => (
                    <ThemePreview
                      key={theme.id}
                      theme={theme}
                      isSelected={selectedTheme === theme.id}
                      onSelect={() => onThemeSelect(theme.id)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Random Theme Button */}
      <div className="flex justify-center pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const categoryThemes = getThemesByCategory(activeCategory);
            const randomTheme = categoryThemes[Math.floor(Math.random() * categoryThemes.length)];
            onThemeSelect(randomTheme.id);
          }}
          className="flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Surprise Me!
        </Button>
      </div>
    </div>
  );
};

export default ThemeSelector;
