import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "@fontsource/archivo-black/400.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import { SessionProvider } from "./hooks/useSession";
import LandingPage from "./components/sections/LandingPage";
import AuthPage from "./components/sections/AuthPage";
import Dashboard from "./components/sections/Dashboard";
import StudySpace from "./components/sections/StudySpace";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AuthGuard from "./components/auth/AuthGuard";

function App() {
	return (
		<SessionProvider>
			<BrowserRouter>
				<Routes>
					<Route
						path="/"
						element={
							<AuthGuard>
								<LandingPage />
							</AuthGuard>
						}
					/>
					<Route
						path="/auth"
						element={
							<AuthGuard>
								<AuthPage />
							</AuthGuard>
						}
					/>
					<Route
						path="/dashboard"
						element={
							<ProtectedRoute>
								<Dashboard />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/project/:id"
						element={
							<ProtectedRoute>
								<StudySpace />
							</ProtectedRoute>
						}
					/>
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</BrowserRouter>
		</SessionProvider>
	);
}

export default App;
