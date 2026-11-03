/** Pure presentation helpers: covered by frontend unit tests. */
export function getUvLabel(uv: number): string {
  if (uv >= 8) return "очень высокий";
  if (uv >= 6) return "высокий";
  if (uv >= 3) return "умеренный";
  return "низкий";
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}
