import { useState, useRef, useEffect } from "react";
import {
	BookOpen,
	Upload,
	Trash2,
	FileText,
	Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
} from "@/utils/api";

export default function Materials({ projectId }) {
	const [materials, setMaterials] = useState([]);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef(null);

	useEffect(() => {
		if (!projectId) return;
		fetchMaterials(projectId).then(setMaterials).catch(() => {}).finally(() => setLoading(false));
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
			window.dispatchEvent(new CustomEvent("materials-changed"));
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
			window.dispatchEvent(new CustomEvent("materials-changed"));
		} catch (err) {
			console.error("Delete failed:", err);
		}
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
					Manage your uploaded learning materials.
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
								<DialogTrigger render={<button className="flex items-center justify-center size-7 rounded-lg border-2 border-black bg-background text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors cursor-pointer shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none" />}>
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
										<DialogClose render={<Button variant="outline" size="sm" />}>Cancel</DialogClose>
										<DialogClose render={<Button variant="destructive" size="sm" onClick={() => removeMaterial(m.id)} />}>Remove</DialogClose>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</div>
					))}
				</div>
			</div>


		</div>
	);
}