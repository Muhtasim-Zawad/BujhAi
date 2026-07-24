import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ChatLeftSidebar from "@/components/layout/ChatLeftSidebar";
import ChatInterface from "@/components/layout/ChatInterface";
import ChatRightSidebar from "@/components/layout/ChatRightSidebar";
import Materials from "@/components/layout/Materials";
import Stats from "@/components/layout/Stats";
import { fetchProject } from "@/utils/api";
import { supabase } from "@/lib/supabase";

export default function StudySpace() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [activeSection, setActiveSection] = useState("materials");
	const [role, setRole] = useState(null);
	const projectId = id;

	useEffect(() => {
		if (!projectId) return;
		(async () => {
			try {
				const { data: { user } } = await supabase.auth.getUser();
				const project = await fetchProject(projectId);
				setRole(project.user_id === user?.id ? "owner" : "student");
			} catch {
				navigate("/dashboard");
			}
		})();
	}, [projectId, navigate]);

	return (
		<div className="flex h-screen gap-4 p-4">
			<ChatLeftSidebar
				activeSection={activeSection}
				onSectionChange={setActiveSection}
				onBack={() => navigate("/dashboard")}
			/>

			{activeSection === "materials" && (
				<div className="flex-1 overflow-hidden rounded-xl border-2 border-black bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
					<Materials projectId={projectId} role={role} />
				</div>
			)}

			{activeSection === "study" && (
				<>
					<div className="flex-1 overflow-hidden rounded-xl border-2 border-black bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
						<ChatInterface projectId={projectId} role={role} />
					</div>
					<ChatRightSidebar projectId={projectId} role={role} />
				</>
			)}

			{activeSection === "stats" && (
				<div className="flex-1 overflow-hidden rounded-xl border-2 border-black bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
					<Stats projectId={projectId} role={role} />
				</div>
			)}
		</div>
	);
}
