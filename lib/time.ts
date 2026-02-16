export const formatTimestamp = (value: string) =>
  new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export const relativeTime = (value: string) => {
  const delta = Date.now() - new Date(value).getTime();
  if (delta < 60_000) return "moments ago";
  if (delta < 3_600_000) return `${Math.round(delta / 60_000)} minute${Math.round(delta / 60_000) === 1 ? "" : "s"} ago`;
  if (delta < 86_400_000) return `${Math.round(delta / 3_600_000)} hour${Math.round(delta / 3_600_000) === 1 ? "" : "s"} ago`;
  return `${Math.round(delta / 86_400_000)} day${Math.round(delta / 86_400_000) === 1 ? "" : "s"} ago`;
};
