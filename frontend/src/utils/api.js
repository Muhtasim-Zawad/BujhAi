const BASE = import.meta.env.VITE_API_URL || "http://localhost:8999";

/**
 * Stream a chat message via SSE.
 * @param {string} projectId
 * @param {string} message
 * @param {object} callbacks - { onEvaluatorStart, onEvalText, onRubricUpdate, onStudentStart, onStudentToken, onFinish, onError }
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

  const res = await fetch(`${BASE}/projects/${projectId}/stt`, {
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
