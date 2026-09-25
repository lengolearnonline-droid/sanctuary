"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BibleImporter = void 0;
var fast_xml_parser_1 = require("fast-xml-parser");
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var BIBLE_BOOKS = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
    "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah",
    "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah",
    "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah",
    "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
    "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians",
    "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
    "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter",
    "1 John", "2 John", "3 John", "Jude", "Revelation"
];
var BibleImporter = /** @class */ (function () {
    function BibleImporter(db) {
        this.db = db;
    }
    BibleImporter.prototype.importXml = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var xmlData, parser, jObj, rawTranslationName, translationId, insertTranslation, insertVerse, importTransaction, totalVerses;
            return __generator(this, function (_a) {
                xmlData = fs_1.default.readFileSync(filePath, 'utf-8');
                parser = new fast_xml_parser_1.XMLParser({
                    ignoreAttributes: false,
                    attributeNamePrefix: "@_"
                });
                jObj = parser.parse(xmlData);
                if (!jObj || !jObj.bible) {
                    throw new Error("Invalid Bible XML format. Missing <bible> tag.");
                }
                rawTranslationName = jObj.bible['@_translation'] || path_1.default.parse(filePath).name;
                translationId = rawTranslationName.toLowerCase().replace(/[^a-z0-9]/g, '_');
                insertTranslation = this.db.prepare("\n      INSERT OR REPLACE INTO bible_translations (id, name, abbreviation, language)\n      VALUES (?, ?, ?, 'en')\n    ");
                insertVerse = this.db.prepare("\n      INSERT OR IGNORE INTO verses (translation_id, book_name, book_number, chapter, verse, text)\n      VALUES (?, ?, ?, ?, ?, ?)\n    ");
                importTransaction = this.db.transaction(function () {
                    insertTranslation.run(translationId, rawTranslationName, rawTranslationName.substring(0, 5).toUpperCase());
                    var testaments = Array.isArray(jObj.bible.testament) ? jObj.bible.testament : [jObj.bible.testament];
                    var insertedCount = 0;
                    for (var _i = 0, testaments_1 = testaments; _i < testaments_1.length; _i++) {
                        var test = testaments_1[_i];
                        if (!test)
                            continue;
                        var books = Array.isArray(test.book) ? test.book : [test.book];
                        for (var _a = 0, books_1 = books; _a < books_1.length; _a++) {
                            var b = books_1[_a];
                            if (!b)
                                continue;
                            var bookNumberStr = b['@_number'];
                            var bookNumber = parseInt(bookNumberStr, 10);
                            // Old Testament is 1-39, New Testament is 40-66 (or sometimes numbered 1-27).
                            if (test['@_name'] === 'New' && bookNumber < 40) {
                                bookNumber += 39;
                            }
                            var bookName = b['@_name'];
                            if (!bookName && BIBLE_BOOKS[bookNumber - 1]) {
                                bookName = BIBLE_BOOKS[bookNumber - 1];
                            }
                            if (!bookName)
                                continue;
                            var chapters = Array.isArray(b.chapter) ? b.chapter : [b.chapter];
                            for (var _b = 0, chapters_1 = chapters; _b < chapters_1.length; _b++) {
                                var c = chapters_1[_b];
                                if (!c)
                                    continue;
                                var chapterNum = parseInt(c['@_number'], 10);
                                var verses = Array.isArray(c.verse) ? c.verse : [c.verse];
                                for (var _c = 0, verses_1 = verses; _c < verses_1.length; _c++) {
                                    var v = verses_1[_c];
                                    if (!v)
                                        continue;
                                    var verseNum = parseInt(v['@_number'], 10);
                                    var text = v['#text'];
                                    if (typeof text !== 'string') {
                                        text = v['#text'] || String(v) || "";
                                    }
                                    if (text && text !== '[object Object]') {
                                        insertVerse.run(translationId, bookName, bookNumber, chapterNum, verseNum, text);
                                        insertedCount++;
                                    }
                                }
                            }
                        }
                    }
                    return insertedCount;
                });
                totalVerses = importTransaction();
                return [2 /*return*/, "Imported ".concat(totalVerses, " verses into '").concat(rawTranslationName, "'.")];
            });
        });
    };
    return BibleImporter;
}());
exports.BibleImporter = BibleImporter;
