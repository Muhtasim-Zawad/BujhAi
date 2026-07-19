const BASE = import.meta.env.VITE_API_URL || "http://localhost:8999";

async function getAccessToken() {
  const { supabase } = await import("@/lib/supabase");
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

async function authHeaders() {
  const token = await getAccessToken();
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Stream a chat message via SSE.
 * @param {string} projectId
 * @param {string} message
 * @param {object} callbacks - { onEvaluatorStart, onText, onModuleUpdate, onStudentStart, onFinish, onError }
 * @param {string|null} canvasData - optional serialized Excalidraw scene JSON
 */
export async function streamChat(projectId, message, callbacks, canvasData = null) {
  const body = { message };
  if (canvasData) {
    body.canvas_data = canvasData;
  }

  const headers = await authHeaders();
  delete headers["Content-Type"];

  const res = await fetch(`${BASE}/projects/${projectId}/chat/stream`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
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
          case "module_update":
            callbacks.onModuleUpdate?.(data.updates);
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
  const headers = await authHeaders();
  const formData = new FormData();
  formData.append("file", audioBlob, "recording.webm");

  const res = await fetch(`${BASE}/projects/${projectId}/stt/transcribe`, {
    method: "POST",
    headers: Object.fromEntries(
      Object.entries(headers).filter(([k]) => k !== "Content-Type")
    ),
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`STT failed: HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.text || "";
}

async function apiFetch(url, options = {}) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

// ---- Resources ----

export async function fetchResources(projectId) {
  try {
    const res = await apiFetch(`/projects/${projectId}/resources`);
    return await res.json();
  } catch {
    return [];
  }
}

// ---- Projects ----

export async function fetchProjects() {
  const res = await apiFetch("/projects");
  return res.json();
}

export async function createProject(data) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}/projects`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create project: HTTP ${res.status}`);
  return res.json();
}

export async function deleteProject(id) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}/projects/${id}`, { method: "DELETE", headers });
  if (!res.ok) throw new Error(`Failed to delete project: HTTP ${res.status}`);
}

export async function updateProject(id, data) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}/projects/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update project: HTTP ${res.status}`);
  return res.json();
}

// ---- Materials ----

export async function fetchMaterials(projectId) {
  try {
    const res = await apiFetch(`/projects/${projectId}/materials`);
    return await res.json();
  } catch {
    return [];
  }
}

export async function uploadMaterial(projectId, file) {
  const headers = await authHeaders();
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE}/projects/${projectId}/materials/upload`, {
    method: "POST",
    headers: Object.fromEntries(
      Object.entries(headers).filter(([k]) => k !== "Content-Type")
    ),
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed: HTTP ${res.status}`);
  return res.json();
}

export async function deleteMaterial(projectId, materialId) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}/projects/${projectId}/materials/${materialId}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error(`Delete failed: HTTP ${res.status}`);
}

// ---- Modules ----

export async function fetchModules(projectId) {
  try {
    const res = await apiFetch(`/projects/${projectId}/modules`);
    return await res.json();
  } catch {
    return [];
  }
}

export async function createModule(projectId, title) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}/projects/${projectId}/modules`, {
    method: "POST",
    headers,
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`Create module failed: HTTP ${res.status}`);
  return res.json();
}

export async function updateModule(projectId, moduleId, title) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}/projects/${projectId}/modules/${moduleId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`Update module failed: HTTP ${res.status}`);
  return res.json();
}

export async function deleteModule(projectId, moduleId) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}/projects/${projectId}/modules/${moduleId}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error(`Delete module failed: HTTP ${res.status}`);
}

export async function createModulePoint(projectId, moduleId, text) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}/projects/${projectId}/modules/${moduleId}/points`, {
    method: "POST",
    headers,
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Create point failed: HTTP ${res.status}`);
  return res.json();
}

export async function updateModulePoint(projectId, moduleId, pointId, data) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}/projects/${projectId}/modules/${moduleId}/points/${pointId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Update point failed: HTTP ${res.status}`);
  return res.json();
}

export async function deleteModulePoint(projectId, moduleId, pointId) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}/projects/${projectId}/modules/${moduleId}/points/${pointId}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error(`Delete point failed: HTTP ${res.status}`);
}

// ---- Canvas ----

export async function fetchCanvas(projectId) {
  try {
    const res = await apiFetch(`/projects/${projectId}/canvas`);
    return await res.json();
  } catch {
    return null;
  }
}

export async function saveCanvas(projectId, sceneData) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}/projects/${projectId}/canvas`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ scene_data: sceneData }),
  });
  if (!res.ok) throw new Error(`Save canvas failed: HTTP ${res.status}`);
  return res.json();
}

// ---- Stats ----

export async function fetchStats(projectId) {
  const res = await apiFetch(`/projects/${projectId}/stats`);
  return res.json();
}
