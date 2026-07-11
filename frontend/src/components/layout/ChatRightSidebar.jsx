import { useState } from "react";
import { ChevronRight, Plus, Trash2, Edit3 } from "lucide-react";
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Progress,
	ProgressLabel,
	ProgressValue,
} from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

let idCounter = 0;
function uid() {
	return `id-${++idCounter}`;
}

export default function ChatRightSidebar() {
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [modules, setModules] = useState([
		{
			id: uid(),
			title: "Module 1",
			points: [
				{ id: uid(), text: "Introduction", checked: false },
				{ id: uid(), text: "Core concepts", checked: false },
			],
		},
	]);
	const [editingModuleId, setEditingModuleId] = useState(null);
	const [editingTitle, setEditingTitle] = useState("");

	const totalPoints = modules.reduce((sum, m) => sum + m.points.length, 0);
	const checkedPoints = modules.reduce(
		(sum, m) => sum + m.points.filter((p) => p.checked).length,
		0,
	);
	const globalProgress =
		totalPoints > 0 ? Math.round((checkedPoints / totalPoints) * 100) : 0;

	function addModule() {
		setModules((prev) => [
			...prev,
			{
				id: uid(),
				title: `Module ${prev.length + 1}`,
				points: [{ id: uid(), text: "New point", checked: false }],
			},
		]);
	}

	function deleteModule(id) {
		setModules((prev) => prev.filter((m) => m.id !== id));
	}

	function renameModule(id) {
		setModules((prev) =>
			prev.map((m) => (m.id === id ? { ...m, title: editingTitle } : m)),
		);
		setEditingModuleId(null);
		setEditingTitle("");
	}

	function startEditing(module) {
		setEditingModuleId(module.id);
		setEditingTitle(module.title);
	}

	function addPoint(moduleId) {
		setModules((prev) =>
			prev.map((m) =>
				m.id === moduleId
					? {
							...m,
							points: [
								...m.points,
								{ id: uid(), text: "New point", checked: false },
							],
						}
					: m,
			),
		);
	}

	function deletePoint(moduleId, pointId) {
		setModules((prev) =>
			prev.map((m) =>
				m.id === moduleId
					? {
							...m,
							points: m.points.filter((p) => p.id !== pointId),
						}
					: m,
			),
		);
	}

	function togglePoint(moduleId, pointId) {
		setModules((prev) =>
			prev.map((m) =>
				m.id === moduleId
					? {
							...m,
							points: m.points.map((p) =>
								p.id === pointId ? { ...p, checked: !p.checked } : p,
							),
						}
					: m,
			),
		);
	}

	function updatePointText(moduleId, pointId, text) {
		setModules((prev) =>
			prev.map((m) =>
				m.id === moduleId
					? {
							...m,
							points: m.points.map((p) =>
								p.id === pointId ? { ...p, text } : p,
							),
						}
					: m,
			),
		);
	}

	function getModuleProgress(module) {
		if (module.points.length === 0) return 0;
		return Math.round(
			(module.points.filter((p) => p.checked).length / module.points.length) *
				100,
		);
	}

	return (
		<div
			className={cn(
				"relative flex flex-col bg-card border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 overflow-hidden h-full",
				isCollapsed ? "w-16" : "w-72",
			)}
		>
			{/* Section 1: Title + collapse toggle */}
			<div className="flex items-center px-4 py-4">
				<button
					onClick={() => setIsCollapsed(!isCollapsed)}
					className={cn(
						"flex items-center justify-center size-6 rounded-full bg-primary border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 active:translate-y-1 active:shadow-none transition-all duration-300 cursor-pointer shrink-0",
						isCollapsed ? "mx-auto" : "",
					)}
				>
					<ChevronRight
						className={cn(
							"size-4 transition-transform duration-300",
							isCollapsed && "rotate-180",
						)}
					/>
				</button>
				<div
					className={cn(
						"transition-all duration-300 overflow-hidden whitespace-nowrap",
						isCollapsed
							? "opacity-0 scale-95 max-w-0 ml-0"
							: "opacity-100 scale-100 max-w-full ml-2",
					)}
				>
					<span className="font-extrabold text-lg tracking-tight">
						Course Progress
					</span>
				</div>
			</div>

			<Separator className="mx-3 w-[calc(100%-24px)]" />

			{/* Section 2: Content */}
			{!isCollapsed && (
				<div className="flex flex-col gap-4 p-3 overflow-y-auto flex-1">
					{/* Global progress */}
					<Progress value={globalProgress}>
						<ProgressLabel>Overall Progress</ProgressLabel>
						<ProgressValue>{globalProgress}%</ProgressValue>
					</Progress>

					{/* Modules */}
					{modules.length > 0 ? (
						<div className="flex flex-col gap-2">
							{modules.map((module) => {
								const progress = getModuleProgress(module);
								const checkedCount = module.points.filter(
									(p) => p.checked,
								).length;
								return (
									<Accordion key={module.id}>
										<AccordionItem>
											<AccordionTrigger className="group">
												{editingModuleId === module.id ? (
													<input
														value={editingTitle}
														onChange={(e) => setEditingTitle(e.target.value)}
														onBlur={() => renameModule(module.id)}
														onKeyDown={(e) =>
															e.key === "Enter" && renameModule(module.id)
														}
														className="flex-1 bg-transparent text-sm font-head outline-none border-b border-black"
														autoFocus
														onClick={(e) => e.stopPropagation()}
													/>
												) : (
													<span className="text-sm font-head">
														{module.title}
													</span>
												)}
												<div
													className="flex items-center gap-1"
													onClick={(e) => e.stopPropagation()}
												>
													<button
														onClick={() => startEditing(module)}
														className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
													>
														<Edit3 className="size-3.5" />
													</button>
													<button
														onClick={() => deleteModule(module.id)}
														className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-destructive cursor-pointer"
													>
														<Trash2 className="size-3.5" />
													</button>
												</div>
											</AccordionTrigger>
											<AccordionContent>
												<div className="flex flex-col gap-3">
													{/* Module progress bar */}
													<div className="relative h-2 w-full overflow-hidden rounded border border-black bg-background">
														<div
															className="h-full bg-primary transition-all duration-300"
															style={{
																width: `${progress}%`,
															}}
														/>
													</div>
													<div className="flex justify-between text-xs text-muted-foreground">
														<span>
															{checkedCount}/{module.points.length} completed
														</span>
														<span>{progress}%</span>
													</div>

													{/* Points */}
													<div className="flex flex-col gap-1.5">
														{module.points.map((point) => (
															<div
																key={point.id}
																className="flex items-center gap-2 group/point"
															>
																<Checkbox
																	checked={point.checked}
																	onCheckedChange={() =>
																		togglePoint(module.id, point.id)
																	}
																	className="size-4 shrink-0"
																/>
																<input
																	value={point.text}
																	onChange={(e) =>
																		updatePointText(
																			module.id,
																			point.id,
																			e.target.value,
																		)
																	}
																	className="flex-1 bg-transparent text-sm outline-none border-b border-transparent focus:border-black transition-colors"
																/>
																<button
																	onClick={() =>
																		deletePoint(module.id, point.id)
																	}
																	className="opacity-0 group-hover/point:opacity-100 transition-opacity text-destructive p-0.5 cursor-pointer"
																>
																	<Trash2 className="size-3" />
																</button>
															</div>
														))}
													</div>

													{/* Add point */}
													<button
														onClick={() => addPoint(module.id)}
														className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
													>
														<Plus className="size-3" />
														Add point
													</button>
												</div>
											</AccordionContent>
										</AccordionItem>
									</Accordion>
								);
							})}
						</div>
					) : (
						<p className="text-sm text-muted-foreground text-center py-4">
							No modules yet
						</p>
					)}

					{/* Add Module button */}
					<Button
						onClick={addModule}
						variant="outline"
						size="sm"
						className="w-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
					>
						<Plus className="size-4" />
						Add Module
					</Button>
				</div>
			)}
		</div>
	);
}
