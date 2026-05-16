export const DEFAULT_CHARACTER_ID = 'default';

const CHARACTER_CATALOG = [
  {
    id: DEFAULT_CHARACTER_ID,
    name: 'Default Reader',
    file: 'char_common_gray.png',
  },
];

export function characterById(id) {
  return CHARACTER_CATALOG.find((character) => character.id === id) || CHARACTER_CATALOG[0];
}
