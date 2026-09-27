import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { WordBreakdownModal } from './components/common/WordBreakdownModal';
import { useAppStore } from './stores/useAppStore';
import { useSettingsStore } from './stores/useSettingsStore';

// Main Pages
import { DashboardPage } from './pages/DashboardPage';
import { TranslatePage } from './pages/TranslatePage';
import { OcrPage } from './pages/OcrPage';
import { VoicePage } from './pages/VoicePage';
import { SubtitlesPage } from './pages/SubtitlesPage';
import { DictionaryPage } from './pages/DictionaryPage';
import { VocabularyPage } from './pages/VocabularyPage';
import { FlashcardsPage } from './pages/FlashcardsPage';
import { PracticePage } from './pages/PracticePage';
import { AiTutorPage } from './pages/AiTutorPage';
import { HistoryPage } from './pages/HistoryPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { SettingsPage } from './pages/SettingsPage';

// Window Overlays
import { SnipOverlay } from './windows/SnipOverlay';
import { FloatingOverlay } from './windows/FloatingOverlay';
import { SubtitleOverlay } from './windows/SubtitleOverlay';

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toastMessage, toastType, showToast } = useAppStore();
  const { fetchSettings, initTheme } = useSettingsStore();

  useEffect(() => {
    fetchSettings();
    const unsubTheme = initTheme();

    // Listen for navigation events from shortcuts or tray
    const unsubNavigate = window.electronAPI?.onNavigate((route) => {
      navigate(route);
    });

    // Listen for clipboard change events
    const unsubClipboard = window.electronAPI?.onClipboardText((text) => {
      showToast(`Đã phát hiện văn bản mới sao chép: "${text.substring(0, 30)}..."`, 'info');
    });

    return () => {
      unsubTheme?.();
      unsubNavigate?.();
      unsubClipboard?.();
    };
  }, []);

  // Check if current route is an independent overlay window
  const isOverlay = ['/snip', '/overlay', '/subtitle'].includes(location.pathname);

  if (isOverlay) {
    return (
      <Routes>
        <Route path="/snip" element={<SnipOverlay />} />
        <Route path="/overlay" element={<FloatingOverlay />} />
        <Route path="/subtitle" element={<SubtitleOverlay />} />
      </Routes>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground select-none">
      {/* Titlebar Header */}
      <Header />

      {/* Main App Layout */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background text-foreground">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/translate" element={<TranslatePage />} />
            <Route path="/ocr" element={<OcrPage />} />
            <Route path="/voice" element={<VoicePage />} />
            <Route path="/subtitles" element={<SubtitlesPage />} />
            <Route path="/dictionary" element={<DictionaryPage />} />
            <Route path="/vocabulary" element={<VocabularyPage />} />
            <Route path="/flashcards" element={<FlashcardsPage />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/ai-tutor" element={<AiTutorPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>

      {/* Global Word Modal */}
      <WordBreakdownModal />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-google-lg text-xs font-medium border flex items-center gap-2.5 backdrop-blur-md ${
              toastType === 'success'
                ? 'bg-success/15 border-success/30 text-success'
                : toastType === 'error'
                ? 'bg-destructive/15 border-destructive/30 text-destructive'
                : toastType === 'warning'
                ? 'bg-warning/15 border-warning/30 text-warning'
                : 'bg-surface/95 border-border text-foreground shadow-google-md'
            }`}
          >
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <HashRouter>
      <AppLayout />
    </HashRouter>
  );
};
