import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ScenarioPage from "./pages/ScenarioPage";
import AudiencePage from "./pages/AudiencePage";
import UploadPage from "./pages/UploadPage";
import LivePage from "./pages/LivePage";
import DashboardPage from "./pages/DashboardPage";
import MyPage from "./pages/MyPage";
import PracticeModePage from "./pages/PracticeModePage";
import ScenarioDetailPage from "./pages/ScenarioDetailPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/scenario" element={<ScenarioPage />} />
        <Route path="/audience" element={<AudiencePage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/live" element={<LivePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/practice-mode" element={<PracticeModePage />} />
        <Route path="/scenario-detail" element={<ScenarioDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;