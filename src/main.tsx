import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import LoginPage from './pages/LoginPage.tsx'
import DashboardPage from './pages/DashboardPage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'
import SisCheckPage from './pages/SisCheckPage.tsx'
import SisClearPage from './pages/SisClearPage.tsx'
import SisCraftPage from './pages/SisCraftPage.tsx'
import PreQuestionnairePage from './pages/PreQuestionnairePage.tsx'
import DemographicQuestionairePage from './pages/DemographicQuestionairePage.tsx'
import PostQuestionnairePage from './pages/PostQuestionnairePage.tsx'
import OnboardingPage from './pages/OnboardingPage.tsx'
import ContactPage from './pages/ContactPage.tsx'
import LibraryPage from './pages/LibraryPage.tsx'
import SosKitsPage from './pages/SosKitsPage.tsx'
import SecondaryGroupPage from './pages/SecondaryGroupPage.tsx'
import SuccessPage from './pages/SuccessPage.tsx'
import InteractiveQuestionPage from './pages/InteractiveQuestionPage.tsx'
import PolicyPage from './pages/PolicyPage.tsx'
import RenewCraftPage from './pages/RenewCraftPage.tsx'
import NotificationCenterPage from './pages/NotificationCenterPage.tsx'
import DiaryPage from './pages/DiaryPage.tsx'
import SisStageGuard from './components/SisStageGuard.tsx'
import { savePendingRoute } from './lib/pendingRoute'

import { AppLayout } from './components/Navigation.tsx'
import { WebViewBlocker } from './components/WebViewBlocker.tsx'
import { EngagementTracker } from './components/EngagementTracker.tsx'
//import { InstallGate } from './components/InstallGate.tsx'
import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useRegisterSW } from 'virtual:pwa-register/react'
import LibraryforSecPage from './pages/LibraryforSecPage.tsx'
import './index.css'

// Signal the inline HTML error boundary in index.html that boot succeeded.
// Set only after first successful render, so a render crash on old phones
// still triggers the fallback instead of hanging on a white screen.
const BootSignal = () => {
  useEffect(() => {
    try {
      ;(window as unknown as Record<string, unknown>).__WESIS_BOOTED__ = true
    } catch { /* ignore */ }
  }, [])
  return null
}

window.onerror = (message, source, lineno, colno, error) => {
  console.error('[GlobalError]', message, source, lineno, colno, error)
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('[UnhandledRejection]', event.reason)
})

const PWAUpdater = () => {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegistered(r) {
      r && setInterval(() => {
        r.update();
      }, 60 * 60 * 1000);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);
  
  return null;
}

const ConsentGuard = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  let hasConsented = false;
  try {
    const consent = JSON.parse(localStorage.getItem('wesis_consent_details') || 'null');
    hasConsented = localStorage.getItem('wesis_consent') === 'true'
      && consent?.policy1 === true && consent?.policy2 === true
      && consent?.policy3 === true && consent?.policy4 === true;
  } catch {
    // localStorage unavailable (private browsing, quota, WebView)
  }

  useEffect(() => {
    if (!hasConsented && location.pathname !== '/policy') {
      savePendingRoute(`${location.pathname}${location.search}${location.hash}`)
      navigate('/policy');
    }
  }, [hasConsented, location.pathname, navigate]);

  return <>{children}</>;
}



const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1234567890-mockclientid.apps.googleusercontent.com'

const app = (
  <ErrorBoundary>
    <BootSignal />
    <WebViewBlocker>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <BrowserRouter>
          {/* <InstallGate> */}
            <ConsentGuard>
              <PWAUpdater />
              <EngagementTracker />
            <Routes>
            <Route path="/policy" element={<PolicyPage />} />
            <Route path="/login" element={<LoginPage />} />

            <Route path="/" element={<AppLayout><DashboardPage /></AppLayout>} />
            <Route path="/dashboard" element={<AppLayout><DashboardPage /></AppLayout>} />
            <Route path="/profile" element={<AppLayout><ProfilePage /></AppLayout>} />
            <Route path="/notifications" element={<AppLayout><NotificationCenterPage /></AppLayout>} />
            <Route path="/diary" element={<AppLayout><DiaryPage /></AppLayout>} />
            <Route path="/sis/check" element={<AppLayout><SisStageGuard requiredStage={1}><SisCheckPage /></SisStageGuard></AppLayout>} />
            <Route path="/sis/clear" element={<AppLayout><SisStageGuard requiredStage={2}><SisClearPage /></SisStageGuard></AppLayout>} />
            <Route path="/sis/craft" element={<AppLayout><SisStageGuard requiredStage={3}><SisCraftPage /></SisStageGuard></AppLayout>} />
            <Route path="/sis-clear" element={<AppLayout><SisStageGuard requiredStage={2}><SisClearPage /></SisStageGuard></AppLayout>} />
            <Route path="/sis-craft" element={<AppLayout><SisStageGuard requiredStage={3}><SisCraftPage /></SisStageGuard></AppLayout>} />
            <Route path="/contact" element={<AppLayout><ContactPage /></AppLayout>} />
            <Route path="/library" element={<AppLayout><LibraryPage /></AppLayout>} />
            <Route path="/sos-kits" element={<AppLayout><SosKitsPage /></AppLayout>} />
            <Route path="/secondary-group" element={<SecondaryGroupPage />} />
            <Route path="/secondary-group/library" element={<LibraryforSecPage />} />
            <Route path="/questionnaire/demo" element={<AppLayout><DemographicQuestionairePage /></AppLayout>} />
            <Route path="/questionnaire/pre" element={<AppLayout><PreQuestionnairePage /></AppLayout>} />
            <Route path="/questionnaire/post" element={<AppLayout><PostQuestionnairePage /></AppLayout>} />
            <Route path="/renew/craft" element={<RenewCraftPage />} />


            <Route path="/onboarding" element={<AppLayout><OnboardingPage /></AppLayout>} />
            <Route path="/success" element={<AppLayout><SuccessPage /></AppLayout>} />
            <Route path="/interactive-question/:messageKey" element={<AppLayout><InteractiveQuestionPage /></AppLayout>} />
          </Routes>
          </ConsentGuard>
      {/* </InstallGate> */}
    </BrowserRouter>
  </GoogleOAuthProvider>
</WebViewBlocker>
</ErrorBoundary>
)

const container = document.getElementById('root')!

if (import.meta.hot) {
  import.meta.hot.data.root ??= createRoot(container)
  import.meta.hot.data.root.render(app)
} else {
  createRoot(container).render(app)
}
