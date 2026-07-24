import { useState, useRef, useEffect } from "react";
import {
	BookOpen,
	Upload,
	Trash2,
	FileText,
	Loader2,
	Plus,
	Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import {
	Empty,
	EmptyHeader,
	EmptyTitle,
	EmptyDescription,
	EmptyContent,
	EmptyMedia,
} from "@/components/ui/empty";
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "@/components/ui/dialog";
import {
	fetchMaterials,
	uploadMaterial,
	deleteMaterial,
	fetchModules,
	createModule,
	updateModule,
	deleteModule,
	createModulePoint,
	updateModulePoint,
	deleteModulePoint,
} from "@/utils/api";

export default function Materials({ projectId }) {
	const [materials, setMaterials] = useState([]);
	const [modules, setModules] = useState([]);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [editingModuleId, setEditingModuleId] = useState(null);
	const [editingTitle, setEditingTitle] = useState("");
	const fileInputRef = useRef(null);

	useEffect(() => {
		if (!projectId) return;
		Promise.all([
			fetchMaterials(projectId)
				.then(setMaterials)
				.catch(() => {}),
			fetchModules(projectId)
				.then(setModules)
				.catch(() => {}),
		]).finally(() => setLoading(false));
	}, [projectId]);

	useEffect(() => {
		if (!projectId) return;
		const handler = () => {
			console.log("[Materials] module-update event received, refetching modules");
			fetchModules(projectId).then(setModules).catch(() => {});
		};
		window.addEventListener("module-update", handler);
		return () => window.removeEventListener("module-update", handler);
	}, [projectId]);

	async function handleUpload() {
		fileInputRef.current?.click();
	}

	async function handleFileChange(e) {
		const file = e.target.files?.[0];
		if (!file || !projectId) return;
		setUploading(true);
		try {
			const result = await uploadMaterial(projectId, file);
			setMaterials((prev) => [...prev, result.material]);
			setModules((prev) => [...prev, ...(result.generated_modules || [])]);
			window.dispatchEvent(new CustomEvent("materials-changed"));
			if (result.generated_modules?.length) {
				window.dispatchEvent(
					new CustomEvent("modules-generated", {
						detail: result.generated_modules,
					}),
				);
			}
		} catch (err) {
			console.error("Upload failed:", err);
		}
		setUploading(false);
		e.target.value = "";
	}

	async function removeMaterial(id) {
		try {
			await deleteMaterial(projectId, id);
			setMaterials((prev) => prev.filter((m) => m.id !== id));
			window.dispatchEvent(new CustomEvent("materials-changed"));
		} catch (err) {
			console.error("Delete failed:", err);
		}
	}

	const totalModulePoints = modules.reduce(
		(sum, m) => sum + (m.points?.length || 0),
		0,
	);
	const checkedModulePoints = modules.reduce(
		(sum, m) => sum + (m.points || []).filter((p) => p.checked).length,
		0,
	);
	const moduleGlobalProgress =
		totalModulePoints > 0
			? Math.round((checkedModulePoints / totalModulePoints) * 100)
			: 0;

	async function addModule() {
		try {
			const created = await createModule(
				projectId,
				`Module ${modules.length + 1}`,
			);
			setModules((prev) => [...prev, created]);
		} catch (err) {
			console.error("Create module failed:", err);
		}
	}

	async function deleteModuleLocal(id) {
		try {
			await deleteModule(projectId, id);
			setModules((prev) => prev.filter((m) => m.id !== id));
		} catch (err) {
			console.error("Delete module failed:", err);
		}
	}

	async function renameModule() {
		if (!editingModuleId) return;
		try {
			const updated = await updateModule(
				projectId,
				editingModuleId,
				editingTitle,
			);
			setModules((prev) =>
				prev.map((m) => (m.id === editingModuleId ? updated : m)),
			);
			setEditingModuleId(null);
			setEditingTitle("");
		} catch (err) {
			console.error("Rename module failed:", err);
		}
	}

	function startEditing(mod) {
		setEditingModuleId(mod.id);
		setEditingTitle(mod.title);
	}

	async function addPoint(moduleId) {
		try {
			const created = await createModulePoint(projectId, moduleId, "New point");
			setModules((prev) =>
				prev.map((m) =>
					m.id === moduleId
						? { ...m, points: [...(m.points || []), created] }
						: m,
				),
			);
		} catch (err) {
			console.error("Add point failed:", err);
		}
	}

	async function deletePointLocal(moduleId, pointId) {
		try {
			await deleteModulePoint(projectId, moduleId, pointId);
			setModules((prev) =>
				prev.map((m) =>
					m.id === moduleId
						? { ...m, points: (m.points || []).filter((p) => p.id !== pointId) }
						: m,
				),
			);
		} catch (err) {
			console.error("Delete point failed:", err);
		}
	}

	async function togglePoint(moduleId, pointId) {
		const mod = modules.find((m) => m.id === moduleId);
		const point = mod?.points?.find((p) => p.id === pointId);
		if (!point) return;
		try {
			const updated = await updateModulePoint(projectId, moduleId, pointId, {
				checked: !point.checked,
			});
			setModules((prev) =>
				prev.map((m) =>
					m.id === moduleId
						? {
								...m,
								points: (m.points || []).map((p) =>
									p.id === pointId ? updated : p,
								),
							}
						: m,
				),
			);
		} catch (err) {
			console.error("Toggle point failed:", err);
		}
	}

	async function updatePointText(moduleId, pointId, text) {
		try {
			const updated = await updateModulePoint(projectId, moduleId, pointId, {
				text,
			});
			setModules((prev) =>
				prev.map((m) =>
					m.id === moduleId
						? {
								...m,
								points: (m.points || []).map((p) =>
									p.id === pointId ? updated : p,
								),
							}
						: m,
				),
			);
		} catch (err) {
			console.error("Update point failed:", err);
		}
	}

	function getModuleProgress(mod) {
		const pts = mod.points || [];
		if (pts.length === 0) return 0;
		return Math.round((pts.filter((p) => p.checked).length / pts.length) * 100);
	}

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (materials.length === 0 && !uploading) {
		return (
			<Empty className="h-full">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<BookOpen />
					</EmptyMedia>
					<EmptyTitle>Welcome to Materials</EmptyTitle>
					<EmptyDescription>
						Upload your learning materials to get AI-generated modules and
						resources.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent className="flex-row justify-center gap-2">
					<input
						ref={fileInputRef}
						type="file"
						accept=".pdf,.txt,.doc,.docx"
						className="hidden"
						onChange={handleFileChange}
					/>
					<Button onClick={handleUpload} disabled={uploading}>
						{uploading ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<Upload className="size-4" />
						)}
						Upload Materials
					</Button>
				</EmptyContent>
			</Empty>
		);
	}

	return (
		<div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
			<div className="flex flex-col gap-1">
				<h1 className="font-head text-2xl tracking-tight">Materials</h1>
				<p className="text-sm text-muted-foreground">
					Upload learning materials and track module progress.
				</p>
			</div>

			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<span className="text-sm font-medium text-muted-foreground">
						{materials.length} file{materials.length !== 1 ? "s" : ""} uploaded
					</span>
					<input
						ref={fileInputRef}
						type="file"
						accept=".pdf,.txt,.doc,.docx"
						className="hidden"
						onChange={handleFileChange}
					/>
					<Button
						variant="outline"
						size="sm"
						onClick={handleUpload}
						disabled={uploading}
						className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
					>
						{uploading ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<Upload className="size-4" />
						)}
						Upload More
					</Button>
				</div>
				<div className="flex flex-row flex-wrap gap-3">
					{materials.map((m) => (
						<div
							key={m.id}
							className="flex items-center gap-3 bg-card border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] min-w-0"
						>
							<div className="flex items-center justify-center size-8 rounded-lg bg-muted border-2 border-black shrink-0">
								<FileText className="size-4" />
							</div>
							<div className="flex-1 min-w-0 max-w-40">
								<p className="text-sm font-medium truncate">{m.file_name}</p>
								<p className="text-xs text-muted-foreground">
									{m.chunk_count != null
										? `${m.chunk_count} chunks`
										: `${(m.file_size / 1024).toFixed(1)} KB`}
								</p>
							</div>
							<Dialog>
								<DialogTrigger
									render={
										<button className="flex items-center justify-center size-7 rounded-lg border-2 border-black bg-background text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors cursor-pointer shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none" />
									}
								>
									<Trash2 className="size-3.5" />
								</DialogTrigger>
								<DialogContent className="bg-card">
									<DialogHeader>
										<DialogTitle>Remove material</DialogTitle>
										<DialogDescription>
											Are you sure you want to remove{" "}
											<span className="font-medium text-foreground">
												{m.file_name}
											</span>
											? This action cannot be undone.
										</DialogDescription>
									</DialogHeader>
									<DialogFooter>
										<DialogClose
											render={<Button variant="outline" size="sm" />}
										>
											Cancel
										</DialogClose>
										<DialogClose
											render={
												<Button
													variant="destructive"
													size="sm"
													onClick={() => removeMaterial(m.id)}
												/>
											}
										>
											Remove
										</DialogClose>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</div>
					))}
				</div>
			</div>

			<Separator />

			<div className="flex-1 overflow-y-auto min-h-0">
				<Progress value={moduleGlobalProgress} className="mb-4">
					<ProgressLabel>Module Progress</ProgressLabel>
					<ProgressValue>{moduleGlobalProgress}%</ProgressValue>
				</Progress>

				<h2 className="font-head text-base mb-3">Modules</h2>

				{modules.length > 0 ? (
					<div className="flex flex-col gap-2">
						{modules.map((mod) => {
							const progress = getModuleProgress(mod);
							const pts = mod.points || [];
							const checkedCount = pts.filter((p) => p.checked).length;
							return (
								<Accordion key={mod.id}>
									<AccordionItem>
										<AccordionTrigger className="group">
											<div className="flex flex-1 items-center gap-4">
												{editingModuleId === mod.id ? (
													<input
														value={editingTitle}
														onChange={(e) => setEditingTitle(e.target.value)}
														onBlur={renameModule}
														onKeyDown={(e) =>
															e.key === "Enter" && renameModule()
														}
														className="flex-1 bg-transparent text-sm font-head outline-none border-b border-black"
														autoFocus
														onClick={(e) => e.stopPropagation()}
													/>
												) : (
													<span className="text-sm font-head">{mod.title}</span>
												)}
												<div
													className="flex items-center gap-1 ml-auto"
													onClick={(e) => e.stopPropagation()}
												>
													<button
														onClick={() => startEditing(mod)}
														className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
													>
														<Edit3 className="size-3.5" />
													</button>
													<button
														onClick={() => deleteModuleLocal(mod.id)}
														className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-destructive cursor-pointer"
													>
														<Trash2 className="size-3.5" />
													</button>
												</div>
											</div>
										</AccordionTrigger>
										<AccordionContent>
											<div className="flex flex-col gap-3">
												<div className="relative h-2 w-full overflow-hidden rounded border border-black bg-background">
													<div
														className="h-full bg-primary transition-all duration-300"
														style={{ width: `${progress}%` }}
													/>
												</div>
												<div className="flex justify-between text-xs text-muted-foreground">
													<span>
														{checkedCount}/{pts.length} completed
													</span>
													<span>{progress}%</span>
												</div>

												<div className="flex flex-col gap-1.5">
													{pts.map((point) => (
														<div
															key={point.id}
															className="flex items-center gap-2 group/point"
														>
															<Checkbox
																checked={point.checked}
																onCheckedChange={() =>
																	togglePoint(mod.id, point.id)
																}
																className="size-4 shrink-0"
															/>
															<input
																value={point.text}
																onChange={(e) =>
																	updatePointText(
																		mod.id,
																		point.id,
																		e.target.value,
																	)
																}
																className="flex-1 bg-transparent text-sm outline-none border-b border-transparent focus:border-black transition-colors"
															/>
															<button
																onClick={() =>
																	deletePointLocal(mod.id, point.id)
																}
																className="opacity-0 group-hover/point:opacity-100 transition-opacity text-destructive p-0.5 cursor-pointer"
															>
																<Trash2 className="size-3" />
															</button>
														</div>
													))}
												</div>

												<button
													onClick={() => addPoint(mod.id)}
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
						No modules yet. Upload materials to generate them.
					</p>
				)}

				<Button
					onClick={addModule}
					variant="outline"
					size="sm"
					className="w-full mt-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
				>
					<Plus className="size-4" />
					Add Module
				</Button>
			</div>
		</div>
	);
}
