import { Navigate } from "react-router-dom";
import { useSession } from "@/hooks/useSession";

export default function ProtectedRoute({ children }) {
	const { user, loading } = useSession();

	if (loading) return null;

	if (!user) {
		return <Navigate to="/auth" replace />;
	}

	return children;
}
