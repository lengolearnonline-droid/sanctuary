
const NUMBER_WORDS = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, first: 1, second: 2, third: 3 };
function normalizeNumbers(text) {
  const words = text.toLowerCase().replace(/[.,!?]/g, '').split(/\s+/);
  let result = [];
  let currentNumber = 0; let isBuildingNumber = false;
  for (const word of words) {
    if (NUMBER_WORDS[word] !== undefined) {
      const val = NUMBER_WORDS[word];
      if (isBuildingNumber) {
        if (val < 10 && currentNumber > 0 && currentNumber < 20) { result.push(currentNumber.toString()); currentNumber = val; }
        else if (val === 100) { currentNumber = currentNumber === 0 ? 100 : currentNumber * 100; }
        else { currentNumber += val; }
      } else { isBuildingNumber = true; currentNumber = val; }
    } else {
      if (isBuildingNumber) { result.push(currentNumber.toString()); currentNumber = 0; isBuildingNumber = false; }
      result.push(word);
    }
  }
  if (isBuildingNumber) { result.push(currentNumber.toString()); }
  return result.join(' ');
}

const BIBLE_BOOKS = ['matthew', '1 john', '2 peter'];
const booksPattern = BIBLE_BOOKS.join('|');
const regex = new RegExp('\b(' + booksPattern + ')\b\s*(?:chapter)?\s*(\d+)\s*(?:verse|:)?\s*(\d+)?\s*(?:through|to|-)?\s*(\d+)?', 'gi');
// Using the actual string from ScriptureExtractor.ts:
const regexReal = new RegExp(\\\\\b(\)\\\\b\\\\s*(?:chapter)?\\\\s*(\\\\d+)\\\\s*(?:verse|:)?\\\\s*(\\\\d+)?\\\\s*(?:through|to|-)?\\\\s*(\\\\d+)?\, 'gi');

console.log(regexReal.exec('1 john chapter 1 verse 1'));
console.log(regexReal.exec(normalizeNumbers('First John Chapter 1 verse 1')));
console.log(regexReal.exec(normalizeNumbers('Mathew 1 1')));

