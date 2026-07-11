const BASE = import.meta.env.VITE_API_URL || "http://localhost:8999";

/**
 * Stream a chat message via SSE.
 * @param {string} projectId
 * @param {string} message
 * @param {object} callbacks - { onEvaluatorStart, onText, onRubricUpdate, onStudentStart, onFinish, onError }
 * @param {string|null} canvasData - optional serialized Excalidraw scene JSON
 */
export async function streamChat(projectId, message, callbacks, canvasData = null) {
  const body = { message };
  if (canvasData) {
    body.canvas_data = canvasData;
  }

  const res = await fetch(`${BASE}/projects/${projectId}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "Unknown error");
    callbacks.onError?.(new Error(`HTTP ${res.status}: ${errText}`));
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const data = JSON.parse(line.slice(6));
        switch (data.type) {
          case "evaluator_start":
            callbacks.onEvaluatorStart?.();
            break;
          case "text":
            callbacks.onText?.(data.text);
            break;
          case "rubric_update":
            callbacks.onRubricUpdate?.(data.updates);
            break;
          case "student_start":
            callbacks.onStudentStart?.();
            break;
          case "finish":
            callbacks.onFinish?.(data.finishReason);
            break;
          case "error":
            callbacks.onError?.(new Error(data.text));
            break;
        }
      } catch {
        // skip malformed JSON
      }
    }
  }
}

/**
 * Send audio blob to STT endpoint.
 * @param {string} projectId
 * @param {Blob} audioBlob
 * @returns {Promise<string>} transcribed text
 */
export async function sendStt(projectId, audioBlob) {
  const formData = new FormData();
  formData.append("file", audioBlob, "recording.webm");

  const res = await fetch(`${BASE}/projects/${projectId}/stt/transcribe`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`STT failed: HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.text || "";
}

/**
 * Fetch resources for a project.
 * @param {string} projectId
 * @returns {Promise<Array>}
 */
export async function fetchResources(projectId) {
  const res = await fetch(`${BASE}/projects/${projectId}/resources`);
  if (!res.ok) return [];
  return res.json();
}

// ---- Projects ----

export async function fetchProjects() {
  const res = await fetch(`${BASE}/projects`);
  if (!res.ok) throw new Error(`Failed to fetch projects: HTTP ${res.status}`);
  return res.json();
}

export async function createProject(data) {
  const res = await fetch(`${BASE}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create project: HTTP ${res.status}`);
  return res.json();
}

export async function deleteProject(id) {
  const res = await fetch(`${BASE}/projects/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete project: HTTP ${res.status}`);
}

export async function updateProject(id, data) {
  const res = await fetch(`${BASE}/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update project: HTTP ${res.status}`);
  return res.json();
}

// ---- Materials ----

export async function fetchMaterials(projectId) {
  const res = await fetch(`${BASE}/projects/${projectId}/materials`);
  if (!res.ok) return [];
  return res.json();
}

export async function uploadMaterial(projectId, file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE}/projects/${projectId}/materials/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed: HTTP ${res.status}`);
  return res.json();
}

export async function deleteMaterial(projectId, materialId) {
  const res = await fetch(`${BASE}/projects/${projectId}/materials/${materialId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Delete failed: HTTP ${res.status}`);
}

// ---- Rubrics ----

export async function fetchRubrics(projectId) {
  const res = await fetch(`${BASE}/projects/${projectId}/rubrics`);
  if (!res.ok) return [];
  return res.json();
}

export async function createRubric(projectId, title) {
  const res = await fetch(`${BASE}/projects/${projectId}/rubrics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`Create rubric failed: HTTP ${res.status}`);
  return res.json();
}

export async function updateRubric(projectId, rubricId, title) {
  const res = await fetch(`${BASE}/projects/${projectId}/rubrics/${rubricId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`Update rubric failed: HTTP ${res.status}`);
  return res.json();
}

export async function deleteRubric(projectId, rubricId) {
  const res = await fetch(`${BASE}/projects/${projectId}/rubrics/${rubricId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Delete rubric failed: HTTP ${res.status}`);
}

export async function createRubricPoint(projectId, rubricId, text) {
  const res = await fetch(`${BASE}/projects/${projectId}/rubrics/${rubricId}/points`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Create point failed: HTTP ${res.status}`);
  return res.json();
}

export async function updateRubricPoint(projectId, rubricId, pointId, data) {
  const res = await fetch(`${BASE}/projects/${projectId}/rubrics/${rubricId}/points/${pointId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Update point failed: HTTP ${res.status}`);
  return res.json();
}

export async function deleteRubricPoint(projectId, rubricId, pointId) {
  const res = await fetch(`${BASE}/projects/${projectId}/rubrics/${rubricId}/points/${pointId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Delete point failed: HTTP ${res.status}`);
}
