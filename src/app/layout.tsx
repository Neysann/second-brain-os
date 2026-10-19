import type { Metadata } from 'next';
import './globals.css';
import 'katex/dist/katex.min.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { DailyLifeProvider } from '@/context/DailyLifeContext';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Syntropy — Système de Productivité & Connaissances',
  description: 'Syntropy : Système d\'organisation personnelle et de second cerveau inspiré de Notion, Obsidian et Templation avec méthode PARA, Kanban et Markdown.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark" data-color-mode="dark" data-accent="purple" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var s = localStorage.getItem('syntropy_app_settings');
                if (s) {
                  var p = JSON.parse(s);
                  if (p.accentColor) {
                    var acc = p.accentColor === 'rose' ? 'red' : p.accentColor;
                    document.documentElement.setAttribute('data-accent', acc);
                  }
                  if (p.theme === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                    document.documentElement.setAttribute('data-color-mode', 'light');
                    document.documentElement.setAttribute('data-theme', 'light');
                  } else if (p.darkBgStyle === 'oled') {
                    document.documentElement.setAttribute('data-dark-bg', 'oled');
                    document.documentElement.classList.add('oled');
                  }
                  if (p.uiStyle === 'nothing') {
                    document.documentElement.setAttribute('data-ui-style', 'nothing');
                    document.documentElement.classList.add('nothing-os-mode');
                  }
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased" data-accent="purple">
        <AuthProvider>
          <SettingsProvider>
            <ThemeProvider>
              <DataProvider>
                <DailyLifeProvider>
                  <AppShell>{children}</AppShell>
                </DailyLifeProvider>
              </DataProvider>
            </ThemeProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
