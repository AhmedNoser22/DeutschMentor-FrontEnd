export function parseUtc(value: string): number {
  return Date.parse(value.replace(/(\.\d{3})\d+/, '$1'));
}

export function clockOffsetMs(serverNowUtc: string): number {
  return parseUtc(serverNowUtc) - Date.now();
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}