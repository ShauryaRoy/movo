import React from 'react';
import { ThemeBackground } from '@/components/theme-background';
import { getThemeById } from '@shared/themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SeasonalTest() {
  const seasonalThemes = [
    'autumn-leaves', 
    'winter-snow', 
    'spring-bloom', 
    'summer-pool',
    'christmas-joy',
    'diwali-lights',
    'halloween-spook',
    'new-year-fireworks'
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Seasonal & Holiday Themes Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {seasonalThemes.map((themeId) => {
            const theme = getThemeById(themeId);
            if (!theme) return null;
            
            return (
              <Card key={themeId} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{theme.name}</CardTitle>
                  <p className="text-xs text-gray-600">{theme.category}</p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative h-32">
                    <ThemeBackground theme={theme} className="h-full w-full">
                      <div className="absolute inset-0 bg-black/10" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-white">
                          <h3 className="text-sm font-semibold mb-1">{theme.name}</h3>
                        </div>
                      </div>
                    </ThemeBackground>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
