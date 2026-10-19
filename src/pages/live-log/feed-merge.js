const byNewest = (a, b) =>
  new Date(b.receivedAt) - new Date(a.receivedAt) || (b.id > a.id ? 1 : b.id < a.id ? -1 : 0);

export function matchesFilters(item, filters) {
  if (filters.command && item.command !== filters.command) return false;
  if (filters.status && item.status !== filters.status) return false;
  return true;
}

export function mergeFeedChanges(data, changes, filters) {
  if (!data?.pages?.length) return data;
  const loaded = data.pages.flatMap((page) => page.items);
  const lastPage = data.pages.at(-1);
  const oldestLoaded = loaded.at(-1);
  const changed = new Map(changes.items.map((item) => [item.id, item]));

  const merged = [];
  for (const item of loaded) {
    const update = changed.get(item.id);
    changed.delete(item.id);
    const next = update ?? item;
    if (matchesFilters(next, filters)) merged.push(next);
  }
  for (const item of changed.values()) {
    if (!matchesFilters(item, filters)) continue;
    const withinLoadedRange =
      !lastPage.hasMore || !oldestLoaded || byNewest(item, oldestLoaded) <= 0;
    if (withinLoadedRange) merged.push(item);
  }
  merged.sort(byNewest);

  return {
    pages: [{ items: merged, cursor: changes.cursor, hasMore: lastPage.hasMore }],
    pageParams: [data.pageParams[0]],
  };
}

export function isInteractionSettled(interaction) {
  if (!interaction) return false;
  if (['received', 'processing'].includes(interaction.status)) return false;
  return interaction.actions.every((action) =>
    ['succeeded', 'dead', 'skipped'].includes(action.status),
  );
}
