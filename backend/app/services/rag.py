import os

import chromadb

from app.config import settings

os.makedirs(settings.chroma_db_dir, exist_ok=True)
client = chromadb.PersistentClient(path=settings.chroma_db_dir)


def _collection_name(project_id: str) -> str:
    return f"project_{project_id}"


def _get_or_create_collection(project_id: str):
    name = _collection_name(project_id)
    try:
        return client.get_collection(name)
    except (ValueError, chromadb.errors.NotFoundError):
        return client.create_collection(name)


def _chunk_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> list[str]:
    paragraphs = text.split("\n\n")
    chunks: list[str] = []
    current = ""

    for para in paragraphs:
        stripped = para.strip()
        if not stripped:
            continue
        candidate = stripped + "\n\n"

        if len(current) + len(candidate) <= chunk_size:
            current += candidate
        else:
            if current.strip():
                chunks.append(current.strip())
            current = candidate

    if current.strip():
        chunks.append(current.strip())

    result: list[str] = []
    for chunk in chunks:
        if len(chunk) <= chunk_size:
            result.append(chunk)
        else:
            start = 0
            while start < len(chunk):
                result.append(chunk[start : start + chunk_size])
                start += chunk_size - chunk_overlap

    return result or [text]


def ingest_text(project_id: str, material_id: str, text: str, file_name: str) -> int:
    collection = _get_or_create_collection(project_id)
    chunks = _chunk_text(text)

    ids = [f"{material_id}_{i}" for i in range(len(chunks))]
    metadatas = [
        {"material_id": material_id, "file_name": file_name, "chunk_index": i}
        for i in range(len(chunks))
    ]

    collection.add(documents=chunks, ids=ids, metadatas=metadatas)
    return len(chunks)


def search(
    project_id: str, query: str, k: int = 5
) -> list[dict]:
    collection = _get_or_create_collection(project_id)
    try:
        results = collection.query(query_texts=[query], n_results=k)
    except ValueError:
        return []

    docs = results.get("documents", [[]])[0] or []
    metas = results.get("metadatas", [[]])[0] or []

    return [{"text": d, "metadata": m} for d, m in zip(docs, metas)]


def delete_material(project_id: str, material_id: str) -> None:
    collection = _get_or_create_collection(project_id)
    stored = collection.get(where={"material_id": material_id})
    if stored and stored["ids"]:
        collection.delete(ids=stored["ids"])


def delete_collection(project_id: str) -> None:
    try:
        client.delete_collection(_collection_name(project_id))
    except (ValueError, chromadb.errors.NotFoundError):
        pass
