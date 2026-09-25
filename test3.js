
const BIBLE_BOOKS = ['matthew', '1 john', '2 john'];
const booksPattern = BIBLE_BOOKS.join('|');
const regex = new RegExp('\\b(' + booksPattern + ')\\b\\s*(?:chapter)?\\s*(\\d+)', 'gi');
console.log('Regex:', regex);
console.log('Match?', regex.exec('1 john chapter 1 verse 1'));

