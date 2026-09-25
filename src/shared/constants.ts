// ============================================================
// Sanctuary — Shared Constants
// ============================================================

// ---- Application ----

export const APP_NAME = 'Sanctuary';
export const APP_VERSION = '0.1.0';
export const APP_DESCRIPTION = 'AI-Powered Church Presentation & Broadcast Platform';
export const APP_AUTHOR = 'Sanctuary Team';

// ---- Bible Books ----

export const BIBLE_BOOKS = [
  // Old Testament
  { id: 1, name: 'Genesis', abbr: 'Gen', testament: 'OT' as const, chapters: 50 },
  { id: 2, name: 'Exodus', abbr: 'Exod', testament: 'OT' as const, chapters: 40 },
  { id: 3, name: 'Leviticus', abbr: 'Lev', testament: 'OT' as const, chapters: 27 },
  { id: 4, name: 'Numbers', abbr: 'Num', testament: 'OT' as const, chapters: 36 },
  { id: 5, name: 'Deuteronomy', abbr: 'Deut', testament: 'OT' as const, chapters: 34 },
  { id: 6, name: 'Joshua', abbr: 'Josh', testament: 'OT' as const, chapters: 24 },
  { id: 7, name: 'Judges', abbr: 'Judg', testament: 'OT' as const, chapters: 21 },
  { id: 8, name: 'Ruth', abbr: 'Ruth', testament: 'OT' as const, chapters: 4 },
  { id: 9, name: '1 Samuel', abbr: '1Sam', testament: 'OT' as const, chapters: 31 },
  { id: 10, name: '2 Samuel', abbr: '2Sam', testament: 'OT' as const, chapters: 24 },
  { id: 11, name: '1 Kings', abbr: '1Kgs', testament: 'OT' as const, chapters: 22 },
  { id: 12, name: '2 Kings', abbr: '2Kgs', testament: 'OT' as const, chapters: 25 },
  { id: 13, name: '1 Chronicles', abbr: '1Chr', testament: 'OT' as const, chapters: 29 },
  { id: 14, name: '2 Chronicles', abbr: '2Chr', testament: 'OT' as const, chapters: 36 },
  { id: 15, name: 'Ezra', abbr: 'Ezra', testament: 'OT' as const, chapters: 10 },
  { id: 16, name: 'Nehemiah', abbr: 'Neh', testament: 'OT' as const, chapters: 13 },
  { id: 17, name: 'Esther', abbr: 'Esth', testament: 'OT' as const, chapters: 10 },
  { id: 18, name: 'Job', abbr: 'Job', testament: 'OT' as const, chapters: 42 },
  { id: 19, name: 'Psalms', abbr: 'Ps', testament: 'OT' as const, chapters: 150 },
  { id: 20, name: 'Proverbs', abbr: 'Prov', testament: 'OT' as const, chapters: 31 },
  { id: 21, name: 'Ecclesiastes', abbr: 'Eccl', testament: 'OT' as const, chapters: 12 },
  { id: 22, name: 'Song of Solomon', abbr: 'Song', testament: 'OT' as const, chapters: 8 },
  { id: 23, name: 'Isaiah', abbr: 'Isa', testament: 'OT' as const, chapters: 66 },
  { id: 24, name: 'Jeremiah', abbr: 'Jer', testament: 'OT' as const, chapters: 52 },
  { id: 25, name: 'Lamentations', abbr: 'Lam', testament: 'OT' as const, chapters: 5 },
  { id: 26, name: 'Ezekiel', abbr: 'Ezek', testament: 'OT' as const, chapters: 48 },
  { id: 27, name: 'Daniel', abbr: 'Dan', testament: 'OT' as const, chapters: 12 },
  { id: 28, name: 'Hosea', abbr: 'Hos', testament: 'OT' as const, chapters: 14 },
  { id: 29, name: 'Joel', abbr: 'Joel', testament: 'OT' as const, chapters: 3 },
  { id: 30, name: 'Amos', abbr: 'Amos', testament: 'OT' as const, chapters: 9 },
  { id: 31, name: 'Obadiah', abbr: 'Obad', testament: 'OT' as const, chapters: 1 },
  { id: 32, name: 'Jonah', abbr: 'Jonah', testament: 'OT' as const, chapters: 4 },
  { id: 33, name: 'Micah', abbr: 'Mic', testament: 'OT' as const, chapters: 7 },
  { id: 34, name: 'Nahum', abbr: 'Nah', testament: 'OT' as const, chapters: 3 },
  { id: 35, name: 'Habakkuk', abbr: 'Hab', testament: 'OT' as const, chapters: 3 },
  { id: 36, name: 'Zephaniah', abbr: 'Zeph', testament: 'OT' as const, chapters: 3 },
  { id: 37, name: 'Haggai', abbr: 'Hag', testament: 'OT' as const, chapters: 2 },
  { id: 38, name: 'Zechariah', abbr: 'Zech', testament: 'OT' as const, chapters: 14 },
  { id: 39, name: 'Malachi', abbr: 'Mal', testament: 'OT' as const, chapters: 4 },
  // New Testament
  { id: 40, name: 'Matthew', abbr: 'Matt', testament: 'NT' as const, chapters: 28 },
  { id: 41, name: 'Mark', abbr: 'Mark', testament: 'NT' as const, chapters: 16 },
  { id: 42, name: 'Luke', abbr: 'Luke', testament: 'NT' as const, chapters: 24 },
  { id: 43, name: 'John', abbr: 'John', testament: 'NT' as const, chapters: 21 },
  { id: 44, name: 'Acts', abbr: 'Acts', testament: 'NT' as const, chapters: 28 },
  { id: 45, name: 'Romans', abbr: 'Rom', testament: 'NT' as const, chapters: 16 },
  { id: 46, name: '1 Corinthians', abbr: '1Cor', testament: 'NT' as const, chapters: 16 },
  { id: 47, name: '2 Corinthians', abbr: '2Cor', testament: 'NT' as const, chapters: 13 },
  { id: 48, name: 'Galatians', abbr: 'Gal', testament: 'NT' as const, chapters: 6 },
  { id: 49, name: 'Ephesians', abbr: 'Eph', testament: 'NT' as const, chapters: 6 },
  { id: 50, name: 'Philippians', abbr: 'Phil', testament: 'NT' as const, chapters: 4 },
  { id: 51, name: 'Colossians', abbr: 'Col', testament: 'NT' as const, chapters: 4 },
  { id: 52, name: '1 Thessalonians', abbr: '1Thess', testament: 'NT' as const, chapters: 5 },
  { id: 53, name: '2 Thessalonians', abbr: '2Thess', testament: 'NT' as const, chapters: 3 },
  { id: 54, name: '1 Timothy', abbr: '1Tim', testament: 'NT' as const, chapters: 6 },
  { id: 55, name: '2 Timothy', abbr: '2Tim', testament: 'NT' as const, chapters: 4 },
  { id: 56, name: 'Titus', abbr: 'Titus', testament: 'NT' as const, chapters: 3 },
  { id: 57, name: 'Philemon', abbr: 'Phlm', testament: 'NT' as const, chapters: 1 },
  { id: 58, name: 'Hebrews', abbr: 'Heb', testament: 'NT' as const, chapters: 13 },
  { id: 59, name: 'James', abbr: 'Jas', testament: 'NT' as const, chapters: 5 },
  { id: 60, name: '1 Peter', abbr: '1Pet', testament: 'NT' as const, chapters: 5 },
  { id: 61, name: '2 Peter', abbr: '2Pet', testament: 'NT' as const, chapters: 3 },
  { id: 62, name: '1 John', abbr: '1John', testament: 'NT' as const, chapters: 5 },
  { id: 63, name: '2 John', abbr: '2John', testament: 'NT' as const, chapters: 1 },
  { id: 64, name: '3 John', abbr: '3John', testament: 'NT' as const, chapters: 1 },
  { id: 65, name: 'Jude', abbr: 'Jude', testament: 'NT' as const, chapters: 1 },
  { id: 66, name: 'Revelation', abbr: 'Rev', testament: 'NT' as const, chapters: 22 },
] as const;

// ---- Book Name Aliases (for AI parser) ----

export const BOOK_ALIASES: Record<string, string> = {
  // Genesis
  'gen': 'Genesis', 'ge': 'Genesis', 'gn': 'Genesis',
  // Exodus
  'exod': 'Exodus', 'exo': 'Exodus', 'ex': 'Exodus',
  // Leviticus
  'lev': 'Leviticus', 'le': 'Leviticus', 'lv': 'Leviticus',
  // Numbers
  'num': 'Numbers', 'nu': 'Numbers', 'nm': 'Numbers', 'nb': 'Numbers',
  // Deuteronomy
  'deut': 'Deuteronomy', 'de': 'Deuteronomy', 'dt': 'Deuteronomy',
  // Joshua
  'josh': 'Joshua', 'jos': 'Joshua',
  // Judges
  'judg': 'Judges', 'jdg': 'Judges', 'jg': 'Judges',
  // Ruth
  'ruth': 'Ruth', 'ru': 'Ruth',
  // 1 Samuel
  '1sam': '1 Samuel', '1sa': '1 Samuel', '1 sam': '1 Samuel',
  'first samuel': '1 Samuel', '1st samuel': '1 Samuel', 'i samuel': '1 Samuel',
  // 2 Samuel
  '2sam': '2 Samuel', '2sa': '2 Samuel', '2 sam': '2 Samuel',
  'second samuel': '2 Samuel', '2nd samuel': '2 Samuel', 'ii samuel': '2 Samuel',
  // 1 Kings
  '1kgs': '1 Kings', '1ki': '1 Kings', '1 kings': '1 Kings',
  'first kings': '1 Kings', '1st kings': '1 Kings', 'i kings': '1 Kings',
  // 2 Kings
  '2kgs': '2 Kings', '2ki': '2 Kings', '2 kings': '2 Kings',
  'second kings': '2 Kings', '2nd kings': '2 Kings', 'ii kings': '2 Kings',
  // 1 Chronicles
  '1chr': '1 Chronicles', '1ch': '1 Chronicles', '1 chronicles': '1 Chronicles',
  'first chronicles': '1 Chronicles', '1st chronicles': '1 Chronicles', 'i chronicles': '1 Chronicles',
  // 2 Chronicles
  '2chr': '2 Chronicles', '2ch': '2 Chronicles', '2 chronicles': '2 Chronicles',
  'second chronicles': '2 Chronicles', '2nd chronicles': '2 Chronicles', 'ii chronicles': '2 Chronicles',
  // Ezra
  'ezra': 'Ezra', 'ezr': 'Ezra',
  // Nehemiah
  'neh': 'Nehemiah', 'ne': 'Nehemiah',
  // Esther
  'esth': 'Esther', 'est': 'Esther', 'es': 'Esther',
  // Job
  'job': 'Job', 'jb': 'Job',
  // Psalms
  'ps': 'Psalms', 'psa': 'Psalms', 'psalm': 'Psalms', 'psalms': 'Psalms',
  // Proverbs
  'prov': 'Proverbs', 'pro': 'Proverbs', 'pr': 'Proverbs',
  // Ecclesiastes
  'eccl': 'Ecclesiastes', 'ecc': 'Ecclesiastes', 'ec': 'Ecclesiastes',
  // Song of Solomon
  'song': 'Song of Solomon', 'sos': 'Song of Solomon', 'sg': 'Song of Solomon',
  'song of songs': 'Song of Solomon', 'canticles': 'Song of Solomon',
  // Isaiah
  'isa': 'Isaiah', 'is': 'Isaiah',
  // Jeremiah
  'jer': 'Jeremiah', 'je': 'Jeremiah',
  // Lamentations
  'lam': 'Lamentations', 'la': 'Lamentations',
  // Ezekiel
  'ezek': 'Ezekiel', 'eze': 'Ezekiel',
  // Daniel
  'dan': 'Daniel', 'da': 'Daniel', 'dn': 'Daniel',
  // Hosea
  'hos': 'Hosea', 'ho': 'Hosea',
  // Joel
  'joel': 'Joel', 'jl': 'Joel',
  // Amos
  'amos': 'Amos', 'am': 'Amos',
  // Obadiah
  'obad': 'Obadiah', 'ob': 'Obadiah',
  // Jonah
  'jonah': 'Jonah', 'jon': 'Jonah',
  // Micah
  'mic': 'Micah', 'mi': 'Micah',
  // Nahum
  'nah': 'Nahum', 'na': 'Nahum',
  // Habakkuk
  'hab': 'Habakkuk',
  // Zephaniah
  'zeph': 'Zephaniah', 'zep': 'Zephaniah',
  // Haggai
  'hag': 'Haggai', 'hg': 'Haggai',
  // Zechariah
  'zech': 'Zechariah', 'zec': 'Zechariah',
  // Malachi
  'mal': 'Malachi',
  // Matthew
  'matt': 'Matthew', 'mat': 'Matthew', 'mt': 'Matthew',
  // Mark
  'mark': 'Mark', 'mrk': 'Mark', 'mk': 'Mark', 'mr': 'Mark',
  // Luke
  'luke': 'Luke', 'luk': 'Luke', 'lk': 'Luke',
  // John
  'john': 'John', 'joh': 'John', 'jn': 'John',
  'gospel of john': 'John', 'gospel according to john': 'John',
  // Acts
  'acts': 'Acts', 'act': 'Acts', 'ac': 'Acts',
  // Romans
  'rom': 'Romans', 'ro': 'Romans', 'rm': 'Romans',
  // 1 Corinthians
  '1cor': '1 Corinthians', '1co': '1 Corinthians', '1 corinthians': '1 Corinthians',
  'first corinthians': '1 Corinthians', '1st corinthians': '1 Corinthians', 'i corinthians': '1 Corinthians',
  // 2 Corinthians
  '2cor': '2 Corinthians', '2co': '2 Corinthians', '2 corinthians': '2 Corinthians',
  'second corinthians': '2 Corinthians', '2nd corinthians': '2 Corinthians', 'ii corinthians': '2 Corinthians',
  // Galatians
  'gal': 'Galatians', 'ga': 'Galatians',
  // Ephesians
  'eph': 'Ephesians',
  // Philippians
  'phil': 'Philippians', 'php': 'Philippians',
  // Colossians
  'col': 'Colossians',
  // 1 Thessalonians
  '1thess': '1 Thessalonians', '1th': '1 Thessalonians', '1 thessalonians': '1 Thessalonians',
  'first thessalonians': '1 Thessalonians', '1st thessalonians': '1 Thessalonians',
  // 2 Thessalonians
  '2thess': '2 Thessalonians', '2th': '2 Thessalonians', '2 thessalonians': '2 Thessalonians',
  'second thessalonians': '2 Thessalonians', '2nd thessalonians': '2 Thessalonians',
  // 1 Timothy
  '1tim': '1 Timothy', '1ti': '1 Timothy', '1 timothy': '1 Timothy',
  'first timothy': '1 Timothy', '1st timothy': '1 Timothy',
  // 2 Timothy
  '2tim': '2 Timothy', '2ti': '2 Timothy', '2 timothy': '2 Timothy',
  'second timothy': '2 Timothy', '2nd timothy': '2 Timothy',
  // Titus
  'titus': 'Titus', 'tit': 'Titus',
  // Philemon
  'phlm': 'Philemon', 'phm': 'Philemon', 'philem': 'Philemon',
  // Hebrews
  'heb': 'Hebrews',
  // James
  'jas': 'James', 'jam': 'James', 'jm': 'James',
  // 1 Peter
  '1pet': '1 Peter', '1pe': '1 Peter', '1 peter': '1 Peter',
  'first peter': '1 Peter', '1st peter': '1 Peter',
  // 2 Peter
  '2pet': '2 Peter', '2pe': '2 Peter', '2 peter': '2 Peter',
  'second peter': '2 Peter', '2nd peter': '2 Peter',
  // 1 John
  '1john': '1 John', '1jn': '1 John', '1 john': '1 John',
  'first john': '1 John', '1st john': '1 John',
  // 2 John
  '2john': '2 John', '2jn': '2 John', '2 john': '2 John',
  'second john': '2 John', '2nd john': '2 John',
  // 3 John
  '3john': '3 John', '3jn': '3 John', '3 john': '3 John',
  'third john': '3 John', '3rd john': '3 John',
  // Jude
  'jude': 'Jude', 'jud': 'Jude',
  // Revelation
  'rev': 'Revelation', 're': 'Revelation', 'revelations': 'Revelation',
  'the revelation': 'Revelation', 'apocalypse': 'Revelation',
};

// ---- Spoken Number Words (for AI parser) ----

export const WORD_TO_NUMBER: Record<string, number> = {
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
  'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
  'twenty-one': 21, 'twenty-two': 22, 'twenty-three': 23, 'twenty-four': 24,
  'twenty-five': 25, 'twenty-six': 26, 'twenty-seven': 27, 'twenty-eight': 28,
  'twenty-nine': 29, 'thirty': 30, 'thirty-one': 31, 'thirty-two': 32,
  'thirty-three': 33, 'thirty-four': 34, 'thirty-five': 35, 'thirty-six': 36,
  'thirty-seven': 37, 'thirty-eight': 38, 'thirty-nine': 39, 'forty': 40,
  'forty-one': 41, 'forty-two': 42, 'forty-three': 43, 'forty-four': 44,
  'forty-five': 45, 'forty-six': 46, 'forty-seven': 47, 'forty-eight': 48,
  'forty-nine': 49, 'fifty': 50, 'fifty-one': 51, 'fifty-two': 52,
  'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
  'hundred': 100, 'one hundred': 100,
  'one hundred and one': 101, 'one hundred and two': 102,
  'one hundred and three': 103, 'one hundred and ten': 110,
  'one hundred and nineteen': 119, 'one hundred and twenty': 120,
  'one hundred and thirty': 130, 'one hundred and forty': 140,
  'one hundred and fifty': 150, 'one hundred and seventy six': 176,
};

// ---- Ordinal Words ----

export const ORDINAL_TO_NUMBER: Record<string, number> = {
  'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5,
  'sixth': 6, 'seventh': 7, 'eighth': 8, 'ninth': 9, 'tenth': 10,
  'eleventh': 11, 'twelfth': 12, 'thirteenth': 13, 'fourteenth': 14,
  'fifteenth': 15, 'sixteenth': 16, 'seventeenth': 17, 'eighteenth': 18,
  'nineteenth': 19, 'twentieth': 20, 'twenty-first': 21, 'twenty-second': 22,
  'twenty-third': 23, 'twenty-fourth': 24, 'twenty-fifth': 25,
  'thirtieth': 30, 'fortieth': 40, 'fiftieth': 50,
};

// ---- Default Keyboard Shortcuts ----

export const DEFAULT_SHORTCUTS: Record<string, string> = {
  'presentation.next': 'Space',
  'presentation.previous': 'Backspace',
  'presentation.blackout': 'B',
  'presentation.clear': 'Escape',
  'presentation.freeze': 'F',
  'presentation.logo': 'L',
  'service.save': 'Ctrl+S',
  'service.saveAs': 'Ctrl+Shift+S',
  'service.new': 'Ctrl+N',
  'service.open': 'Ctrl+O',
  'bible.search': 'Ctrl+B',
  'song.search': 'Ctrl+G',
  'media.search': 'Ctrl+M',
  'app.help': 'F1',
  'app.fullscreen': 'F11',
  'app.settings': 'Ctrl+,',
  'app.quit': 'Ctrl+Q',
};

// ---- Default Theme ----

export const DEFAULT_THEME_ID = 'default-dark';

// ---- Supported Media Types ----

export const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.mkv', '.webm', '.avi'];
export const SUPPORTED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.flac', '.aac'];
export const SUPPORTED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'];
export const SUPPORTED_MEDIA_EXTENSIONS = [
  ...SUPPORTED_VIDEO_EXTENSIONS,
  ...SUPPORTED_AUDIO_EXTENSIONS,
  ...SUPPORTED_IMAGE_EXTENSIONS,
];

// ---- Database ----

export const DB_FILENAME = 'sanctuary.db';
export const DB_BACKUP_PREFIX = 'sanctuary-backup-';
export const AUTOSAVE_INTERVAL_MS = 30_000; // 30 seconds
export const MAX_RECOVERY_FILES = 5;

// ---- AI Defaults ----

export const DEFAULT_CONFIDENCE_AUTO = 0.90;
export const DEFAULT_CONFIDENCE_SUGGEST = 0.70;
export const DEFAULT_VAD_THRESHOLD = 0.5;
export const DEFAULT_SAMPLE_RATE = 16000;
export const DEFAULT_BUFFER_SIZE = 4096;
