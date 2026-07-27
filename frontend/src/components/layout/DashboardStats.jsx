import { useState } from "react";
import { BarChart3 } from "lucide-react";
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from "@/components/ui/accordion";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchStats } from "@/utils/api";

export default function DashboardStats({ projects }) {
	const [statsMap, setStatsMap] = useState({});
	const [loadingStats, setLoadingStats] = useState({});

	async function loadStats(projectId) {
		if (statsMap[projectId] || loadingStats[projectId]) return;
		setLoadingStats((p) => ({ ...p, [projectId]: true }));
		try {
			const data = await fetchStats(projectId);
			setStatsMap((p) => ({ ...p, [projectId]: data }));
		} catch {
			setStatsMap((p) => ({ ...p, [projectId]: null }));
		}
		setLoadingStats((p) => ({ ...p, [projectId]: false }));
	}

	if (projects.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
				<BarChart3 className="size-12 text-muted-foreground" />
				<p className="text-lg font-medium text-muted-foreground">No stats available</p>
				<p className="text-sm text-muted-foreground">
					Start working on a project to track your progress.
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{projects.map((project) => (
				<Accordion
					key={project.id}
					onValueChange={(val) => {
						if (val) loadStats(project.id);
					}}
				>
					<AccordionItem>
						<AccordionTrigger>{project.title}</AccordionTrigger>
						<AccordionContent>
							{loadingStats[project.id] ? (
								<div className="flex items-center justify-center py-4">
									<Skeleton className="h-4 w-32 rounded bg-muted" />
								</div>
							) : statsMap[project.id] ? (
								<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
									<Card>
										<CardHeader>
											<CardTitle>Materials</CardTitle>
											<CardContent className="pt-0 px-0">
												<p className="text-2xl font-bold">{statsMap[project.id].total_materials}</p>
												<p className="text-xs text-muted-foreground">{statsMap[project.id].total_chunks} chunks indexed</p>
											</CardContent>
										</CardHeader>
									</Card>
									<Card>
										<CardHeader>
											<CardTitle>Enrolled</CardTitle>
											<CardContent className="pt-0 px-0">
												<p className="text-2xl font-bold">{statsMap[project.id].total_enrolled}</p>
											</CardContent>
										</CardHeader>
									</Card>
									<Card>
										<CardHeader>
											<CardTitle>Modules</CardTitle>
											<CardContent className="pt-0 px-0">
												<p className="text-2xl font-bold">{statsMap[project.id].total_modules}</p>
												<p className="text-xs text-muted-foreground">
													{statsMap[project.id].module_points_completed}/{statsMap[project.id].module_points_total} points
												</p>
											</CardContent>
										</CardHeader>
									</Card>
								</div>
							) : (
								<p className="py-2 text-center text-sm text-muted-foreground">No stats yet.</p>
							)}
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			))}
		</div>
	);
}
