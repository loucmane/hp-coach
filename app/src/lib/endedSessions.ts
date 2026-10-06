// Session ids ended in THIS tab, module-scoped so the memory survives a
// SessionPlayer remount. Task #166 Symptom B: the end:true PATCH is fired
// non-awaited and its active-sessions cache eviction only lands on the
// response, so re-drilling the SAME section before it lands can re-adopt the
// just-finished session. A per-instance ref closed the same-instance "öva
// igen" case, but re-drilling by navigating (Home "Starta", a fresh /drill
// visit) REMOUNTS SessionPlayer with an empty ref — the finished id has to
// outlive the component. A module-level set does that within the tab; it is
// intentionally not persisted (a reload refetches a clean /active, which the
// server already filters). AuthQueryProvider clears it when identity changes.
export const endedSessionIdsThisTab = new Set<number>()

export function markSessionEnded(id: number) {
  endedSessionIdsThisTab.add(id)
  // Cap the set so a marathon tab doesn't grow it without bound. Ended ids
  // only matter for the brief window before /active drops the row, so
  // forgetting the oldest once we're well past that window is safe.
  if (endedSessionIdsThisTab.size > 64) {
    const oldest = endedSessionIdsThisTab.values().next().value
    if (oldest !== undefined) endedSessionIdsThisTab.delete(oldest)
  }
}
