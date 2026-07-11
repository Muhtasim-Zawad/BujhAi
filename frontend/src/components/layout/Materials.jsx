import { useState, useRef, useEffect } from "react";
import {
	BookOpen,
	Upload,
	Plus,
	Trash2,
	Edit3,
	FileText,
	Loader2,
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
	fetchRubrics,
	createRubric,
	updateRubric,
	deleteRubric,
	createRubricPoint,
	updateRubricPoint,
	deleteRubricPoint,
} from "@/utils/api";

export default function Materials({ projectId }) {
	const [materials, setMaterials] = useState([]);
	const [rubrics, setRubrics] = useState([]);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [editingRubricId, setEditingRubricId] = useState(null);
	const [editingTitle, setEditingTitle] = useState("");
	const fileInputRef = useRef(null);

	useEffect(() => {
		if (!projectId) return;
		Promise.all([
			fetchMaterials(projectId).then(setMaterials).catch(() => {}),
			fetchRubrics(projectId).then(setRubrics).catch(() => {}),
		]).finally(() => setLoading(false));
	}, [projectId]);

	const totalPoints = rubrics.reduce((sum, r) => sum + (r.points?.length || 0), 0);
	const checkedPoints = rubrics.reduce(
		(sum, r) =>
			sum + (r.points || []).filter((p) => p.checked).length,
		0,
	);
	const globalProgress = totalPoints > 0 ? Math.round((checkedPoints / totalPoints) * 100) : 0;

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
			const freshRubrics = await fetchRubrics(projectId);
			setRubrics(freshRubrics);
			if (result.generated_modules?.length) {
				window.dispatchEvent(
					new CustomEvent("modules-generated", { detail: result.generated_modules }),
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
		} catch (err) {
			console.error("Delete failed:", err);
		}
	}

	async function addRubric() {
		try {
			const created = await createRubric(projectId, `Criteria ${rubrics.length + 1}`);
			setRubrics((prev) => [...prev, created]);
		} catch (err) {
			console.error("Create rubric failed:", err);
		}
	}

	async function deleteRubricLocal(id) {
		try {
			await deleteRubric(projectId, id);
			setRubrics((prev) => prev.filter((r) => r.id !== id));
		} catch (err) {
			console.error("Delete rubric failed:", err);
		}
	}

	async function renameRubric(id) {
		try {
			const updated = await updateRubric(projectId, id, editingTitle);
			setRubrics((prev) => prev.map((r) => (r.id === id ? updated : r)));
			setEditingRubricId(null);
			setEditingTitle("");
		} catch (err) {
			console.error("Rename rubric failed:", err);
		}
	}

	function startEditing(rubric) {
		setEditingRubricId(rubric.id);
		setEditingTitle(rubric.title);
	}

	async function addPoint(rubricId) {
		try {
			const created = await createRubricPoint(projectId, rubricId, "New standard");
			setRubrics((prev) =>
				prev.map((r) =>
					r.id === rubricId
						? { ...r, points: [...(r.points || []), created] }
						: r,
				),
			);
		} catch (err) {
			console.error("Add point failed:", err);
		}
	}

	async function deletePointLocal(rubricId, pointId) {
		try {
			await deleteRubricPoint(projectId, rubricId, pointId);
			setRubrics((prev) =>
				prev.map((r) =>
					r.id === rubricId
						? { ...r, points: (r.points || []).filter((p) => p.id !== pointId) }
						: r,
				),
			);
		} catch (err) {
			console.error("Delete point failed:", err);
		}
	}

	async function togglePoint(rubricId, pointId) {
		const rubric = rubrics.find((r) => r.id === rubricId);
		const point = rubric?.points?.find((p) => p.id === pointId);
		if (!point) return;
		try {
			const updated = await updateRubricPoint(projectId, rubricId, pointId, {
				checked: !point.checked,
			});
			setRubrics((prev) =>
				prev.map((r) =>
					r.id === rubricId
						? {
								...r,
								points: (r.points || []).map((p) =>
									p.id === pointId ? updated : p,
								),
							}
						: r,
				),
			);
		} catch (err) {
			console.error("Toggle point failed:", err);
		}
	}

	async function updatePointText(rubricId, pointId, text) {
		try {
			const updated = await updateRubricPoint(projectId, rubricId, pointId, { text });
			setRubrics((prev) =>
				prev.map((r) =>
					r.id === rubricId
						? {
								...r,
								points: (r.points || []).map((p) =>
									p.id === pointId ? updated : p,
								),
							}
						: r,
				),
			);
		} catch (err) {
			console.error("Update point failed:", err);
		}
	}

	function getRubricProgress(rubric) {
		const pts = rubric.points || [];
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
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<BookOpen />
					</EmptyMedia>
					<EmptyTitle>Welcome to Materials</EmptyTitle>
					<EmptyDescription>
						Upload your learning materials to get AI-generated modules, rubrics, and
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
		<div className="flex flex-col gap-4 p-4 h-full overflow-hidden">
			<div className="flex flex-col gap-1">
				<h1 className="font-head text-2xl tracking-tight">Materials</h1>
				<p className="text-sm text-muted-foreground">
					Manage your uploaded learning materials and rubrics.
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
								<DialogTrigger asChild>
									<button className="flex items-center justify-center size-7 rounded-lg border-2 border-black bg-background text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors cursor-pointer shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
										<Trash2 className="size-3.5" />
									</button>
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
										<DialogClose asChild>
											<Button variant="outline" size="sm">
												Cancel
											</Button>
										</DialogClose>
										<DialogClose asChild>
											<Button
												variant="destructive"
												size="sm"
												onClick={() => removeMaterial(m.id)}
											>
												Remove
											</Button>
										</DialogClose>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</div>
					))}
				</div>
			</div>

			<Separator />

			<div className="flex-1 overflow-y-auto">
				<Progress value={globalProgress} className="mb-4">
					<ProgressLabel>Overall Progress</ProgressLabel>
					<ProgressValue>{globalProgress}%</ProgressValue>
				</Progress>

				<h2 className="font-head text-base mb-3">Rubrics</h2>

				{rubrics.length > 0 ? (
					<div className="flex flex-col gap-2">
						{rubrics.map((rubric) => {
							const progress = getRubricProgress(rubric);
							const pts = rubric.points || [];
							const checkedCount = pts.filter((p) => p.checked).length;
							return (
								<Accordion key={rubric.id}>
									<AccordionItem>
										<AccordionTrigger className="group">
											<div className="flex flex-1 items-center gap-4">
												{editingRubricId === rubric.id ? (
													<input
														value={editingTitle}
														onChange={(e) => setEditingTitle(e.target.value)}
														onBlur={() => renameRubric(rubric.id)}
														onKeyDown={(e) =>
															e.key === "Enter" && renameRubric(rubric.id)
														}
														className="flex-1 bg-transparent text-sm font-head outline-none border-b border-black"
														autoFocus
														onClick={(e) => e.stopPropagation()}
													/>
												) : (
													<span className="text-sm font-head">{rubric.title}</span>
												)}
												<div
													className="flex items-center gap-1 ml-auto"
													onClick={(e) => e.stopPropagation()}
												>
													<button
														onClick={() => startEditing(rubric)}
														className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
													>
														<Edit3 className="size-3.5" />
													</button>
													<button
														onClick={() => deleteRubricLocal(rubric.id)}
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
														<div key={point.id} className="flex items-center gap-2 group/point">
															<Checkbox
																checked={point.checked}
																onCheckedChange={() => togglePoint(rubric.id, point.id)}
																className="size-4 shrink-0"
															/>
															<input
																value={point.text}
																onChange={(e) =>
																	updatePointText(rubric.id, point.id, e.target.value)
																}
																className="flex-1 bg-transparent text-sm outline-none border-b border-transparent focus:border-black transition-colors"
															/>
															<button
																onClick={() => deletePointLocal(rubric.id, point.id)}
																className="opacity-0 group-hover/point:opacity-100 transition-opacity text-destructive p-0.5 cursor-pointer"
															>
																<Trash2 className="size-3" />
															</button>
                                                        </div>
													))}
												</div>

												<button
													onClick={() => addPoint(rubric.id)}
													className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
												>
													<Plus className="size-3" />
													Add standard
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
						No rubrics yet
					</p>
				)}

				<Button
					onClick={addRubric}
					variant="outline"
					size="sm"
					className="w-full mt-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
				>
					<Plus className="size-4" />
					Add Rubric
				</Button>
			</div>
		</div>
	);
}