
const NUMBER_WORDS = { first: 1, second: 2 };
const BOOK_ALIASES = { 'first john': '1 john' };
const BIBLE_BOOKS = ['matthew', '1 john', '2 john'];

function normalizeNumbers(text) {
  const words = text.toLowerCase().replace(/[.,!?]/g, '').split(/\s+/);
  let result = [];
  for (const word of words) {
    if (NUMBER_WORDS[word] !== undefined) {
      result.push(NUMBER_WORDS[word].toString());
    } else {
      result.push(word);
    }
  }
  return result.join(' ');
}

function normalizeBooks(text) {
  let normalized = text;
  for (const [alias, standard] of Object.entries(BOOK_ALIASES)) {
    const regex = new RegExp('\b' + alias + '\b', 'gi');
    normalized = normalized.replace(regex, standard);
  }
  return normalized;
}

console.log('Original:', 'First John Chapter 1 verse 1');
let numNorm = normalizeNumbers('First John Chapter 1 verse 1');
console.log('After normalizeNumbers:', numNorm);
let bookNorm = normalizeBooks(numNorm);
console.log('After normalizeBooks:', bookNorm);

const booksPattern = BIBLE_BOOKS.join('|');
const regex = new RegExp('\\\\b(' + booksPattern + ')\\\\b\\\\s*(?:chapter)?\\\\s*(\\\\d+)', 'gi');

console.log('Regex:', regex);
console.log('Match?', regex.exec(bookNorm));

