import bank from './reviews.json';
export const professors = bank.professors;
export const puzzles = bank.puzzles;
export type GameProfessor = typeof professors[number];
// Frozen six-day pilot schedule. Do not reorder after publication.
export const rotation = ['darrell-walden-2129273','erik-craft-134228','tenace-setor-2834621','carlos-hurtado-2566131','racheal-cooper-2709313','emily-boone-525729'];
