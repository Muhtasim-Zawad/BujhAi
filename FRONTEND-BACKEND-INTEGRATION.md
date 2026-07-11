# Frontend-Backend Integration Plan

## Bug Fix First

**File:** `frontend/src/utils/api.js` (line ~53)
STT sends to `/projects/${projectId}/stt` but the backend route is `/stt/transcribe`. Change the URL to `/projects/${projectId}/stt/transcribe`.

---

## Phase 1 — Project CRUD (Dashboard + App.jsx)

### API helpers to add (`api.js`)
```js
fetchProjects()          // GET  /projects
createProject(data)      // POST /projects
deleteProject(id)        // DELETE /projects/{id}
updateProject(id, data)  // PUT  /projects/{id}
```

### Files to modify

| File | Changes |
|------|---------|
| `App.jsx` | Remove `import { initialProjects }`. Fetch `GET /projects` on mount instead. `onCreateProject` calls `POST /projects` then sets response as `activeProject`. `onDeleteProject` calls `DELETE /projects/{id}` then removes from state. |
| `Dashboard.jsx` | Receive projects as prop (from App's API call) instead of using `initialProjects`. Remove `initialProjects` export and `uid()` counter. Image fallback when `image_url` is null. |
| `Navbar.jsx` | Replace hardcoded project list with props/context from App. Replace hardcoded user with props or remove. |
| `ProjectCard.jsx` | Remove default props (`title`, `description`, `image`, `badge`, `buttonText`). |

---

## Phase 2 — Materials + Rubrics (Materials.jsx)

### API helpers to add (`api.js`)
```js
fetchMaterials(projectId)                       // GET  /projects/{id}/materials
uploadMaterial(projectId, file)                 // POST /projects/{id}/materials/upload (multipart)
deleteMaterial(projectId, materialId)           // DELETE /projects/{id}/materials/{id}
fetchRubrics(projectId)                         // GET  /projects/{id}/rubrics
createRubric(projectId, title)                  // POST /projects/{id}/rubrics
updateRubric(projectId, rubricId, title)        // PUT  /projects/{id}/rubrics/{id}
deleteRubric(projectId, rubricId)               // DELETE /projects/{id}/rubrics/{id}
createRubricPoint(projectId, rubricId, text)    // POST /projects/{id}/rubrics/{id}/points
updateRubricPoint(projectId, rubricId, pointId, data)  // PUT /projects/{id}/rubrics/{id}/points/{pid}
deleteRubricPoint(projectId, rubricId, pointId)        // DELETE /projects/{id}/rubrics/{id}/points/{pid}
```

### Files to modify

| File | Changes |
|------|---------|
| `Materials.jsx` | On mount: `GET /projects/{id}/materials` + `GET /projects/{id}/rubrics`. File upload calls `POST /projects/{id}/materials/upload`, handles `UploadResponse` (shows generated modules/rubrics/resources). Rubric CRUD replaces local state. Material list shows real uploaded files with delete. |

---

## Phase 3 — Modules Sidebar (ChatRightSidebar.jsx)

### API helpers to add (`api.js`)
```js
fetchModules(projectId)                          // GET  /projects/{id}/modules
createModule(projectId, title)                   // POST /projects/{id}/modules
updateModule(projectId, moduleId, title)         // PUT  /projects/{id}/modules/{id}
deleteModule(projectId, moduleId)                // DELETE /projects/{id}/modules/{id}
createModulePoint(projectId, moduleId, text)     // POST /projects/{id}/modules/{mid}/points
updateModulePoint(projectId, moduleId, pointId, data) // PUT /projects/{id}/modules/{mid}/points/{pid}
deleteModulePoint(projectId, moduleId, pointId)       // DELETE /projects/{id}/modules/{mid}/points/{pid}
```

### Files to modify

| File | Changes |
|------|---------|
| `ChatRightSidebar.jsx` | On mount: `GET /projects/{id}/modules` with points. All CRUD (add/rename/delete module, add/delete/toggle point) call APIs instead of local state only. Remove `uid()` counter. |

---

## Phase 4 — Stats (Stats.jsx)

### API helpers to add (`api.js`)
```js
fetchProjectStats(projectId)  // GET /projects/{id}/stats
```

### Files to modify

| File | Changes |
|------|---------|
| `Stats.jsx` | Results tab: show `module_points_completed` / `module_points_total` and `rubric_criteria_checked` / `rubric_criteria_total` from stats API. Comparison tab: replace or derive from modules + stats. Resources tab: call existing `fetchResources(projectId)`. Accept `projectId` prop. |

---

## Phase 5 — Canvas Persistence (ChatInterface.jsx)

### API helpers to add (`api.js`)
```js
saveCanvasScene(projectId, sceneData)  // PUT  /projects/{id}/canvas
loadCanvasScene(projectId)             // GET  /projects/{id}/canvas
```

### Files to modify

| File | Changes |
|------|---------|
| `ChatInterface.jsx` | On submit with canvas data open, also call `saveCanvasScene` to persist. On mount, optionally `loadCanvasScene` to restore the last drawing. |

---

## Phase 6 — Cleanup

| File | Action |
|------|--------|
| `frontend/src/protegeAIDemo.jsx` | Delete (761 lines of commented-out dead code) |
| `frontend/src/components/sections/Dashboard.jsx` | Remove `initialProjects` export and `uid()` function |
| `frontend/src/components/layout/ProjectCard.jsx` | Remove default props |

---

## Backend Endpoints Reference (all exist)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/projects` | List projects |
| POST | `/projects` | Create project |
| GET | `/projects/{id}` | Get project |
| PUT | `/projects/{id}` | Update project |
| DELETE | `/projects/{id}` | Delete project |
| GET | `/projects/{id}/modules` | List modules with points |
| POST | `/projects/{id}/modules` | Create module |
| PUT | `/projects/{id}/modules/{mid}` | Update module |
| DELETE | `/projects/{id}/modules/{mid}` | Delete module |
| POST | `/projects/{id}/modules/{mid}/points` | Create module point |
| PUT | `/projects/{id}/modules/{mid}/points/{pid}` | Update module point |
| DELETE | `/projects/{id}/modules/{mid}/points/{pid}` | Delete module point |
| GET | `/projects/{id}/rubrics` | List rubrics with criteria |
| POST | `/projects/{id}/rubrics` | Create rubric |
| PUT | `/projects/{id}/rubrics/{rid}` | Update rubric |
| DELETE | `/projects/{id}/rubrics/{rid}` | Delete rubric |
| POST | `/projects/{id}/rubrics/{rid}/points` | Create rubric point |
| PUT | `/projects/{id}/rubrics/{rid}/points/{pid}` | Update rubric point |
| DELETE | `/projects/{id}/rubrics/{rid}/points/{pid}` | Delete rubric point |
| GET | `/projects/{id}/materials` | List materials |
| POST | `/projects/{id}/materials/upload` | Upload material + auto-generate |
| DELETE | `/projects/{id}/materials/{matId}` | Delete material |
| GET | `/projects/{id}/resources` | List learning resources |
| GET | `/projects/{id}/stats` | Project aggregate stats |
| POST | `/projects/{id}/chat/stream` | SSE streaming chat |
| POST | `/projects/{id}/stt/transcribe` | Speech-to-text |
| GET | `/projects/{id}/canvas` | Load canvas scene |
| PUT | `/projects/{id}/canvas` | Save canvas scene |
| POST | `/projects/{id}/canvas/analyze` | Analyze canvas drawing |

---

## Frontend File Dependency Order

```
1. api.js           ← add all helper functions
2. App.jsx          ← projects CRUD from API
3. Dashboard.jsx    ← use real project data
4. Navbar.jsx       ← use real project data
5. ProjectCard.jsx  ← remove defaults
6. Materials.jsx    ← materials + rubrics CRUD
7. ChatRightSidebar.jsx  ← modules CRUD
8. Stats.jsx        ← stats + resources
9. ChatInterface.jsx     ← canvas persistence
10. protegeAIDemo.jsx    ← delete
```
