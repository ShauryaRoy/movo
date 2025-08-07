import React from 'react';
import { ThemeBackground } from '@/components/theme-background';
import { getThemeById } from '@shared/themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ThemeTest() {
  const testThemes = [
    'quantum-dark', // minimal with gradient
    'ocean-breeze', // minimal with gradient
    'polkadot-classic', // pattern
    'gaming-emoji', // emoji
    'hearts-confetti', // confetti
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Theme Background Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testThemes.map((themeId) => {
            const theme = getThemeById(themeId);
            if (!theme) return null;
            
            return (
              <Card key={themeId} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{theme.name}</CardTitle>
                  <p className="text-xs text-gray-600">{theme.category} • {theme.preview}</p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative h-48">
                    <ThemeBackground theme={theme} className="h-full w-full">
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-white">
                          <h3 className="text-lg font-semibold mb-1">{theme.name}</h3>
                          <p className="text-sm opacity-90">{theme.category}</p>
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
