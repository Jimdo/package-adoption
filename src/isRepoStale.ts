/**
 * "If the pushedAt date is null, return false. Otherwise, return true if the pushedAt date is more
 * than daysUntilStale days ago."
 *
 * @param {string} pushedAt - The date the repository was last pushed to.
 * @param {number} daysUntilStale - The number of days until a repository is considered stale.
 * @returns A boolean value.
 */
export const isStale = (pushedAt: string, daysUntilStale: number): boolean => {
  if (pushedAt === null) {
    return false;
  }

  const pushedAtDate = new Date(pushedAt);
  const todayDate = new Date();

  const diffTime = todayDate.getTime() - pushedAtDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isStale = diffDays > daysUntilStale;
  return isStale;
};
