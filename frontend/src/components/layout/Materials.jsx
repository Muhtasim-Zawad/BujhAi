import { useState, useRef } from "react";
import {
	BookOpen,
	Upload,
	Plus,
	Trash2,
	Edit3,
	FileText,
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

let idCounter = 0;
function uid() {
	return `id-${++idCounter}`;
}

export default function Materials() {
	const [hasUploaded, setHasUploaded] = useState(false);
	const [material, setMaterial] = useState(null);
	const [rubrics, setRubrics] = useState([
		{
			id: uid(),
			title: "Criteria 1",
			points: [
				{ id: uid(), text: "Excellence", checked: false },
				{ id: uid(), text: "Good", checked: false },
			],
		},
	]);
	const [editingRubricId, setEditingRubricId] = useState(null);
	const [editingTitle, setEditingTitle] = useState("");

	const totalPoints = rubrics.reduce(
		(sum, r) => sum + r.points.length,
		0
	);
	const checkedPoints = rubrics.reduce(
		(sum, r) => sum + r.points.filter((p) => p.checked).length,
		0
	);
	const globalProgress =
		totalPoints > 0
			? Math.round((checkedPoints / totalPoints) * 100)
			: 0;
	const fileInputRef = useRef(null);

	function addRubric() {
		setRubrics((prev) => [
			...prev,
			{
				id: uid(),
				title: `Criteria ${prev.length + 1}`,
				points: [
					{ id: uid(), text: "New standard", checked: false },
				],
			},
		]);
	}

	function deleteRubric(id) {
		setRubrics((prev) => prev.filter((r) => r.id !== id));
	}

	function renameRubric(id) {
		setRubrics((prev) =>
			prev.map((r) =>
				r.id === id ? { ...r, title: editingTitle } : r
			)
		);
		setEditingRubricId(null);
		setEditingTitle("");
	}

	function startEditing(rubric) {
		setEditingRubricId(rubric.id);
		setEditingTitle(rubric.title);
	}

	function addPoint(rubricId) {
		setRubrics((prev) =>
			prev.map((r) =>
				r.id === rubricId
					? {
							...r,
							points: [
								...r.points,
								{ id: uid(), text: "New standard", checked: false },
							],
						}
					: r
			)
		);
	}

	function deletePoint(rubricId, pointId) {
		setRubrics((prev) =>
			prev.map((r) =>
				r.id === rubricId
					? {
							...r,
							points: r.points.filter((p) => p.id !== pointId),
						}
					: r
			)
		);
	}

	function togglePoint(rubricId, pointId) {
		setRubrics((prev) =>
			prev.map((r) =>
				r.id === rubricId
					? {
							...r,
							points: r.points.map((p) =>
								p.id === pointId
									? { ...p, checked: !p.checked }
									: p
							),
						}
					: r
			)
		);
	}

	function updatePointText(rubricId, pointId, text) {
		setRubrics((prev) =>
			prev.map((r) =>
				r.id === rubricId
					? {
							...r,
							points: r.points.map((p) =>
								p.id === pointId ? { ...p, text } : p
							),
						}
					: r
			)
		);
	}

	function getRubricProgress(rubric) {
		if (rubric.points.length === 0) return 0;
		return Math.round(
			(rubric.points.filter((p) => p.checked).length /
				rubric.points.length) *
				100
		);
	}

	function handleUpload() {
		fileInputRef.current?.click();
	}

	function handleFileChange(e) {
		const file = e.target.files[0];
		if (file) {
			setMaterial({
				name: file.name,
				size: file.size,
				type: file.type,
			});
			setHasUploaded(true);
		}
	}

	if (!hasUploaded) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<BookOpen />
					</EmptyMedia>
					<EmptyTitle>Welcome to Materials</EmptyTitle>
					<EmptyDescription>
						Browse and manage your learning materials here. Select a
						topic from the sidebar to get started.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent className="flex-row justify-center gap-2">
					<input
						ref={fileInputRef}
						type="file"
						className="hidden"
						onChange={handleFileChange}
					/>
					<Button onClick={handleUpload}>
						<Upload className="size-4" />
						Upload Materials
					</Button>
					<Button variant="outline">Import Project</Button>
				</EmptyContent>
			</Empty>
		);
	}

	return (
		<div className="flex flex-col gap-4 p-4 h-full overflow-hidden">
			{/* Section 1: Uploaded material */}
			<div className="flex items-center gap-3 bg-card border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
				<div className="flex items-center justify-center size-10 rounded-lg bg-muted border-2 border-black shrink-0">
					<FileText className="size-5" />
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-sm font-medium truncate">
						{material.name}
					</p>
					<p className="text-xs text-muted-foreground">
						{(material.size / 1024).toFixed(1)} KB
					</p>
				</div>
				<input
					ref={fileInputRef}
					type="file"
					className="hidden"
					onChange={handleFileChange}
				/>
				<Button
					variant="outline"
					size="sm"
					onClick={handleUpload}
				>
					Replace
				</Button>
			</div>

			<Separator />

			{/* Section 2: Global progress + Rubrics */}
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
							const checkedCount = rubric.points.filter(
								(p) => p.checked
							).length;
							return (
								<Accordion key={rubric.id}>
									<AccordionItem>
										<AccordionTrigger className="group">
											<div className="flex flex-1 items-center gap-4">
												{editingRubricId === rubric.id ? (
													<input
														value={editingTitle}
														onChange={(e) =>
															setEditingTitle(
																e.target.value
															)
														}
														onBlur={() =>
															renameRubric(
																rubric.id
															)
														}
														onKeyDown={(e) =>
															e.key === "Enter" &&
															renameRubric(
																rubric.id
															)
														}
														className="flex-1 bg-transparent text-sm font-head outline-none border-b border-black"
														autoFocus
														onClick={(e) =>
															e.stopPropagation()
														}
													/>
												) : (
													<span className="text-sm font-head">
														{rubric.title}
													</span>
												)}
												<div
													className="flex items-center gap-1 ml-auto"
													onClick={(e) =>
														e.stopPropagation()
													}
												>
													<button
														onClick={() =>
															startEditing(rubric)
														}
														className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
													>
														<Edit3 className="size-3.5" />
													</button>
													<button
														onClick={() =>
															deleteRubric(
																rubric.id
															)
														}
														className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-destructive cursor-pointer"
													>
														<Trash2 className="size-3.5" />
													</button>
												</div>
											</div>
										</AccordionTrigger>
										<AccordionContent>
											<div className="flex flex-col gap-3">
												{/* Progress bar */}
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
														{checkedCount}/
														{rubric.points.length}{" "}
														completed
													</span>
													<span>{progress}%</span>
												</div>

												{/* Points */}
												<div className="flex flex-col gap-1.5">
													{rubric.points.map(
														(point) => (
															<div
																key={point.id}
																className="flex items-center gap-2 group/point"
															>
																<Checkbox
																	checked={
																		point.checked
																	}
																	onCheckedChange={() =>
																		togglePoint(
																			rubric.id,
																			point.id
																		)
																	}
																	className="size-4 shrink-0"
																/>
																<input
																	value={
																		point.text
																	}
																	onChange={(
																		e
																	) =>
																		updatePointText(
																			rubric.id,
																			point.id,
																			e.target
																				.value
																		)
																	}
																	className="flex-1 bg-transparent text-sm outline-none border-b border-transparent focus:border-black transition-colors"
																/>
																<button
																	onClick={() =>
																		deletePoint(
																			rubric.id,
																			point.id
																		)
																	}
																	className="opacity-0 group-hover/point:opacity-100 transition-opacity text-destructive p-0.5 cursor-pointer"
																>
																	<Trash2 className="size-3" />
																</button>
															</div>
														)
													)}
												</div>

												{/* Add point */}
												<button
													onClick={() =>
														addPoint(rubric.id)
													}
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

				{/* Add Rubric button */}
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
