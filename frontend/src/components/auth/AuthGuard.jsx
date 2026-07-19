import { Navigate } from "react-router-dom";

export default function AuthGuard({ children }) {
	const user = localStorage.getItem("bujhai_user");
	if (user) {
		return <Navigate to="/dashboard" replace />;
	}
	return children;
}
