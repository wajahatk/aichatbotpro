---
name: WorkspaceProvider export name
description: The WorkspaceProvider context exports `workspace`, not `currentWorkspace` — easy to get wrong when adding new pages.
---

The `workspaceContext.Provider` value shape (in `WorkspaceProvider.tsx`) is:
```ts
{ workspaces, workspace, currentUserMode, switchWorkspace, createWorkspace, updateWorkspace, deleteCurrentWorkspace }
```

There is NO `currentWorkspace` key. Pages that destructure `{ currentWorkspace }` will get `undefined`, causing all `orgId`-gated fetch calls to silently skip.

**Why:** The provider stores the selected workspace as `workspace` (not `currentWorkspace`). The local variable inside the effect is named `currentWorkspace`, but only `workspace` is placed in the context value.

**How to apply:** Any new page under `/app/*` or elsewhere that needs the active workspace should write:
```ts
const { workspace } = useWorkspace();
```
or, for naming clarity:
```ts
const { workspace: currentWorkspace } = useWorkspace();
```
Never just `{ currentWorkspace }` — it will be undefined.
