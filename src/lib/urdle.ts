import {professors, puzzles, rotation} from './urdle/data';
export {professors, puzzles} from './urdle/data';
export const VERSION = 'reviews-v1';
export const MAX_GUESSES = 6;
export const EPOCH = '2026-10-03';
export function normalize(value: string) { return value.toLowerCase().replace(/[^a-z0-9]/g, ''); }
export function richmondDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'}).formatToParts(date);
  return ['year', 'month', 'day'].map(type => parts.find(p => p.type === type)!.value).join('-');
}
export function dayIndex(day: string) { return Math.round((Date.parse(day + 'T12:00:00Z') - Date.parse(EPOCH + 'T12:00:00Z')) / 86400000); }
export function dailyPuzzle(day: string) { return puzzles.find(p => p.professorId === rotation[((dayIndex(day) % rotation.length) + rotation.length) % rotation.length])!; }
export function getProfessor(id: string) { return professors.find(p => p.id === id)!; }
export function feedback(guess: string, answer: string) {
  const a = getProfessor(guess), b = getProfessor(answer);
  if (a.id === b.id) return {label:'Correct professor', emoji:'✅', kind:'correct'};
  if (a.department === b.department && a.department !== 'Unmapped') return {label:'Same department', emoji:'🟩', kind:'department'};
  if (a.group !== 'Unmapped' && a.group === b.group) return {label:'Same academic group', emoji:'🟨', kind:'group'};
  if (a.group === 'Unmapped' || b.group === 'Unmapped') return {label:'Different department · group unavailable', emoji:'⬜', kind:'unknown'};
  return {label:'Different department and group', emoji:'⬜', kind:'different'};
}
export function validGuesses(value: unknown, answerId: string): string[] {
  if (!Array.isArray(value)) return [];
  const result: string[] = [];
  for (const id of value) {
    if (typeof id !== 'string' || !professors.some(c => c.id === id) || result.includes(id)) break;
    result.push(id);
    if (id === answerId || result.length === MAX_GUESSES) break;
  }
  return result;
}
export type Game = {guesses: string[]; completed: boolean; won: boolean};
export type History = Record<string, Game>;
export function gameState(day: string, guesses: unknown): Game {
  const answer = dailyPuzzle(day).professorId, checked = validGuesses(guesses, answer), won = checked.includes(answer);
  return {guesses: checked, completed: won || checked.length === MAX_GUESSES, won};
}
export function readHistory(raw: string | null): History {
  try {
    const parsed: unknown = JSON.parse(raw || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([date, value]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && value && typeof value === 'object').map(([date, value]) => [date, gameState(date, (value as Game).guesses)]));
  } catch { return {}; }
}
function previousDay(day: string) { const date = new Date(day + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() - 1); return date.toISOString().slice(0, 10); }
export function statistics(history: History, today: string) {
  const entries = Object.entries(history).filter(([date, game]) => date <= today && game.completed).sort(([a], [b]) => a.localeCompare(b));
  const distribution = [0, 0, 0, 0, 0, 0];
  let maximumStreak = 0, run = 0, last = '';
  for (const [date, game] of entries) {
    if (game.won) { distribution[game.guesses.length - 1]++; run = last === previousDay(date) ? run + 1 : 1; maximumStreak = Math.max(maximumStreak, run); }
    else run = 0;
    last = date;
  }
  let currentStreak = 0;
  let day = history[today]?.completed ? today : previousDay(today);
  while (history[day]?.won) { currentStreak++; day = previousDay(day); }
  return {currentStreak, maximumStreak, gamesPlayed: entries.length, distribution};
}
export function submitGuess(day: string, game: Game, text: string): {game: Game; error?: string} {
  if (game.completed) return {game, error: 'Today’s game is complete.'};
  const matches = professors.filter(p => [p.name, ...p.aliases].some(n => normalize(n) === normalize(text)));
  const match = matches.length === 1 ? matches[0] : null;
  if (!match) return {game, error: 'Choose a professor from the list. No guess used.'};
  if (game.guesses.includes(match.id)) return {game, error: 'Already guessed. No guess used.'};
  return {game: gameState(day, [...game.guesses, match.id])};
}
export function shareText(day: string, game: Game, streak: number) {
  const answer = dailyPuzzle(day).professorId;
  return `URdle #${dayIndex(day) + 1} — ${game.won ? game.guesses.length : 'X'}/6\n${day}\n\n${game.guesses.map(id => feedback(id, answer).emoji).join(' ')}\n${game.won ? `Recognized the reviews.\nStreak: ${streak}` : 'Anonymous. Apparently very anonymous.'}`;
}
