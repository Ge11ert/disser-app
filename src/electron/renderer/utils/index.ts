export function formatTime(timeInHours: number): string {
  const timeInSeconds = timeInHours * 3600;
  const hours = Math.floor(timeInHours);
  const minutes = Math.floor(timeInSeconds % 3600 / 60);
  const seconds = Math.floor(timeInSeconds % 60);

  const minSec = `${minutes} мин ${seconds} сек`;

  return hours > 0 ? `${hours} ч ${minSec}` : minSec;
}
