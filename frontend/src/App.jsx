import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ScenarioPage from "./pages/ScenarioPage";
import AudiencePage from "./pages/AudiencePage";
import UploadPage from "./pages/UploadPage";
import LivePage from "./pages/LivePage";
import DashboardPage from "./pages/DashboardPage";
import MyPage from "./pages/MyPage";
import RecordsPage from "./pages/RecordsPage";
import PracticeModePage from "./pages/PracticeModePage";
import ScenarioDetailPage from "./pages/ScenarioDetailPage";
import PresentationSetupPage from "./pages/PresentationSetupPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/scenario" element={<ScenarioPage />} />
        <Route path="/scenario-detail" element={<ProtectedRoute><ScenarioDetailPage /></ProtectedRoute>} />
        <Route path="/presentation-setup" element={<ProtectedRoute><PresentationSetupPage /></ProtectedRoute>} />
        <Route path="/audience" element={<ProtectedRoute><AudiencePage /></ProtectedRoute>} />
        <Route path="/practice-mode" element={<ProtectedRoute><PracticeModePage /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
        <Route path="/live" element={<ProtectedRoute><LivePage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
        <Route path="/records" element={<ProtectedRoute><RecordsPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
