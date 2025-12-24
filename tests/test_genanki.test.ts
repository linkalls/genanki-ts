import { Model, Note, Deck, Package } from '../src/index';
import { guid_for } from '../src/genanki/util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import JSZip from 'jszip';
import Database from 'better-sqlite3';

const TEST_MODEL = new Model(
  234567, 'foomodel',
  [
    {
      'name': 'AField',
    },
    {
      'name': 'BField',
    },
  ],
  [
    {
      'name': 'card1',
      'qfmt': '{{AField}}',
      'afmt': '{{FrontSide}}' +
              '<hr id="answer">' +
              '{{BField}}',
    }
  ]
);

const TEST_CN_MODEL = new Model(
  345678, 'Chinese',
  [{'name': 'Traditional'}, {'name': 'Simplified'}, {'name': 'English'}],
  [
    {
      'name': 'Traditional',
      'qfmt': '{{Traditional}}',
      'afmt': '{{FrontSide}}' +
              '<hr id="answer">' +
              '{{English}}',
    },
    {
      'name': 'Simplified',
      'qfmt': '{{Simplified}}',
      'afmt': '{{FrontSide}}' +
              '<hr id="answer">' +
              '{{English}}',
    },
  ]
);

const TEST_MODEL_WITH_HINT = new Model(
  456789, 'with hint',
  [{'name': 'Question'}, {'name': 'Hint'}, {'name': 'Answer'}],
  [
    {
      'name': 'card1',
      'qfmt': '{{Question}}' +
              '{{#Hint}}<br>Hint: {{Hint}}{{/Hint}}',
      'afmt': '{{Answer}}',
    },
  ]
);

// Same as default latex_pre but we include amsfonts package
const CUSTOM_LATEX_PRE = '\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n'
                    + '\\usepackage{amssymb,amsmath,amsfonts}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n'
                    + '\\begin{document}\n';
// Same as default latex_post but we add a comment. (What is a real-world use-case for customizing latex_post?)
const CUSTOM_LATEX_POST = '% here is a great comment\n\\end{document}';

const TEST_MODEL_WITH_LATEX = new Model(
  567890, 'with latex',
  [
    {
      'name': 'AField',
    },
    {
      'name': 'BField',
    },
  ],
  [
    {
      'name': 'card1',
      'qfmt': '{{AField}}',
      'afmt': '{{FrontSide}}' +
              '<hr id="answer">' +
              '{{BField}}',
    }
  ],
  '',
  Model.FRONT_BACK,
  CUSTOM_LATEX_PRE,
  CUSTOM_LATEX_POST
);

const CUSTOM_SORT_FIELD_INDEX = 1;  // Anki default value is 0
const TEST_MODEL_WITH_SORT_FIELD_INDEX = new Model(
  987123, 'with sort field index',
  [
    {
      'name': 'AField',
    },
    {
      'name': 'BField',
    },
  ],
  [
    {
      'name': 'card1',
      'qfmt': '{{AField}}',
      'afmt': '{{FrontSide}}' +
              '<hr id="answer">' +
              '{{BField}}',
    }
  ],
  '',
  Model.FRONT_BACK,
  undefined,
  undefined,
  CUSTOM_SORT_FIELD_INDEX
);

const VALID_MP3 = Buffer.from([
  0xff, 0xe3, 0x18, 0xc4, 0x00, 0x00, 0x00, 0x03, 0x48, 0x00, 0x00, 0x00, 0x00, 0x4c, 0x41, 0x4d, 0x45, 0x33, 0x2e, 0x39, 0x38, 0x2e, 0x32, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
]);

const VALID_JPG = Buffer.from([
  0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x03, 0x02, 0x02, 0x02, 0x02, 0x02, 0x03, 0x02, 0x02, 0x02, 0x03, 0x03,
  0x03, 0x03, 0x04, 0x06, 0x04, 0x04, 0x04, 0x04, 0x04, 0x08, 0x06, 0x06, 0x05, 0x06, 0x09, 0x08, 0x0a, 0x0a, 0x09, 0x08, 0x09,
  0x09, 0x0a, 0x0c, 0x0f, 0x0c, 0x0a, 0x0b, 0x0e, 0x0b, 0x09, 0x09, 0x0d, 0x11, 0x0d, 0x0e, 0x0f, 0x10, 0x10, 0x11, 0x10, 0x0a, 0x0c,
  0x12, 0x13, 0x12, 0x10, 0x13, 0x0f, 0x10, 0x10, 0x10, 0xff, 0xc9, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01,
  0x01, 0x01, 0x11, 0x00, 0xff, 0xcc, 0x00, 0x06, 0x00, 0x10, 0x10, 0x05, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01,
  0x00, 0x00, 0x3f, 0x00, 0xd2, 0xcf, 0x20, 0xff, 0xd9
]);

describe('genanki', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'genanki-test-'));
  });

  afterEach(() => {
    try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (e) {
        // ignore
    }
  });

  async function check_package(pkg: Package, check_fn: (db: any) => void) {
      const outPath = path.join(tmpDir, 'output.apkg');
      await pkg.write_to_file(outPath);

      // Extract zip and check db
      const zipContent = fs.readFileSync(outPath);
      const zip = await JSZip.loadAsync(zipContent);
      const dbContent = await zip.file('collection.anki2')?.async('nodebuffer');

      if (!dbContent) throw new Error('collection.anki2 not found in apkg');

      const dbPath = path.join(tmpDir, 'collection.anki2');
      fs.writeFileSync(dbPath, dbContent);

      const db = new Database(dbPath);
      try {
        check_fn(db);
      } finally {
        db.close();
      }
  }

  test('generated deck can be imported (checked via db inspection)', async () => {
    const deck = new Deck(123456, 'foodeck');
    const note = new Note(TEST_MODEL, ['a', 'b']);
    deck.add_note(note);

    await check_package(new Package(deck), (db) => {
        const decks = JSON.parse(db.prepare('SELECT decks FROM col').get().decks);
        const deck_ids = Object.keys(decks);
        // Default deck (1) + generated deck (123456)
        expect(deck_ids.includes('123456')).toBe(true);
        expect(decks['123456']['name']).toBe('foodeck');

        const notes = db.prepare('SELECT * FROM notes').all();
        expect(notes.length).toBe(1);
        expect(notes[0].flds).toBe('a\x1fb');
    });
  });

  test('generated deck has valid cards', async () => {
    const deck = new Deck(123456, 'foodeck');
    deck.add_note(new Note(TEST_CN_MODEL, ['a', 'b', 'c']));  // 2 cards
    deck.add_note(new Note(TEST_CN_MODEL, ['d', 'e', 'f']));  // 2 cards
    deck.add_note(new Note(TEST_CN_MODEL, ['g', 'h', 'i']));  // 2 cards

    await check_package(new Package(deck), (db) => {
        const cards = db.prepare('SELECT * FROM cards').all();
        expect(cards.length).toBe(6);
    });
  });

  test('multi deck package', async () => {
    const deck1 = new Deck(123456, 'foodeck');
    const deck2 = new Deck(654321, 'bardeck');

    const note = new Note(TEST_MODEL, ['a', 'b']);

    deck1.add_note(note);
    deck2.add_note(note);

    await check_package(new Package([deck1, deck2]), (db) => {
        const decks = JSON.parse(db.prepare('SELECT decks FROM col').get().decks);
        const deck_ids = Object.keys(decks);
        expect(deck_ids.includes('123456')).toBe(true);
        expect(decks['123456']['name']).toBe('foodeck');
        expect(deck_ids.includes('654321')).toBe(true);
        expect(decks['654321']['name']).toBe('bardeck');
    });
  });

  test('Model req', () => {
    expect(TEST_MODEL.req).toEqual([[0, 'all', [0]]]);
  });

  test('Model req cn', () => {
    expect(TEST_CN_MODEL.req).toEqual([[0, 'all', [0]], [1, 'all', [1]]]);
  });

  test('Model req with hint', () => {
    expect(TEST_MODEL_WITH_HINT.req).toEqual([[0, 'any', [0, 1]]]);
  });

  test('notes generate cards based on req cn', () => {
      const n1 = new Note(TEST_CN_MODEL, ['中國', '中国', 'China']);
      const n2 = new Note(TEST_CN_MODEL, ['你好', '', 'hello']);

      expect(n1.cards.length).toBe(2);
      expect(n1.cards[0].ord).toBe(0);
      expect(n1.cards[1].ord).toBe(1);

      expect(n2.cards.length).toBe(1);
      expect(n2.cards[0].ord).toBe(0);
  });

  test('notes generate cards based on req with hint', () => {
      const n1 = new Note(TEST_MODEL_WITH_HINT, ['capital of California', '', 'Sacramento']);
      const n2 = new Note(TEST_MODEL_WITH_HINT, ['capital of Iowa', 'French for "The Moines"', 'Des Moines']);

      expect(n1.cards.length).toBe(1);
      expect(n1.cards[0].ord).toBe(0);
      expect(n2.cards.length).toBe(1);
      expect(n2.cards[0].ord).toBe(0);
  });

  test('Note with guid setter', () => {
      const n = new Note(TEST_MODEL, ['a', 'b']);
      n.guid = '3';
      expect(n.guid).toBe('3');
  });

  test('media files', async () => {
      const deck = new Deck(123456, 'foodeck');
      const note = new Note(TEST_MODEL, [
        'question [sound:present.mp3] [sound:missing.mp3]',
        'answer <img src="present.jpg"> <img src="missing.jpg">'
      ]);
      deck.add_note(note);

      const presentMp3Path = path.join(tmpDir, 'present.mp3');
      const presentJpgPath = path.join(tmpDir, 'present.jpg');
      fs.writeFileSync(presentMp3Path, VALID_MP3);
      fs.writeFileSync(presentJpgPath, VALID_JPG);

      const pkg = new Package(deck, [presentMp3Path, presentJpgPath]);
      const outPath = path.join(tmpDir, 'output.apkg');

      await pkg.write_to_file(outPath);

      const zipContent = fs.readFileSync(outPath);
      const zip = await JSZip.loadAsync(zipContent);

      const mediaJsonStr = await zip.file('media')?.async('string');
      const mediaJson = JSON.parse(mediaJsonStr || '{}');

      // Check if files are in zip and media mapping is correct
      // media mapping keys are string indices
      const values = Object.values(mediaJson);
      expect(values).toContain('present.mp3');
      expect(values).toContain('present.jpg');

      const mp3Index = Object.keys(mediaJson).find(key => mediaJson[key] === 'present.mp3');
      const jpgIndex = Object.keys(mediaJson).find(key => mediaJson[key] === 'present.jpg');

      expect(zip.file(mp3Index!)).toBeTruthy();
      expect(zip.file(jpgIndex!)).toBeTruthy();
  });
});
