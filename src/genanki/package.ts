import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Database } from './db';
import JSZip from 'jszip';

import { APKG_COL } from './apkg_col';
import { APKG_SCHEMA } from './apkg_schema';
import { Deck } from './deck';

function* count(start: number = 0, step: number = 1): Generator<number> {
  let n = start;
  while (true) {
    yield n;
    n += step;
  }
}

export class Package {
  decks: Deck[];
  media_files: string[];

  constructor(deck_or_decks: Deck | Deck[], media_files: string[] | null = null) {
    if (deck_or_decks instanceof Deck) {
      this.decks = [deck_or_decks];
    } else {
      this.decks = deck_or_decks;
    }

    this.media_files = Array.from(new Set(media_files || []));
  }

  async write_to_file(file: string, timestamp: number | null = null) {
    const dbfilename = path.join(os.tmpdir(), `genanki_ts_${Date.now()}.anki2`);

    // In Python, mkstemp creates the file. better-sqlite3 creates it if not exists.
    // However, we want to ensure we have a clean file.
    if (fs.existsSync(dbfilename)) {
      fs.unlinkSync(dbfilename);
    }

    const db = new Database(dbfilename);

    if (timestamp === null) {
      timestamp = Date.now() / 1000;
    }

    const id_gen = count(Math.floor(timestamp * 1000));
    this.write_to_db(db, timestamp, id_gen);

    db.close();

    const zip = new JSZip();
    zip.file('collection.anki2', fs.readFileSync(dbfilename));

    const media_file_idx_to_path: {[key: string]: string} = {};
    this.media_files.forEach((path_str, idx) => {
      media_file_idx_to_path[idx.toString()] = path_str;
    });

    const media_json: {[key: string]: string} = {};
    Object.entries(media_file_idx_to_path).forEach(([idx, path_str]) => {
      media_json[idx] = path.basename(path_str);
    });

    zip.file('media', JSON.stringify(media_json));

    for (const [idx, path_str] of Object.entries(media_file_idx_to_path)) {
      zip.file(idx, fs.readFileSync(path_str));
    }

    const content = await zip.generateAsync({ type: 'nodebuffer' });
    fs.writeFileSync(file, content);

    // Cleanup temp db file
    try {
      if (fs.existsSync(dbfilename)) {
        fs.unlinkSync(dbfilename);
      }
    } catch (e) {
      console.warn(`Failed to delete temporary file ${dbfilename}:`, e);
    }
  }

  write_to_db(db: any, timestamp: number, id_gen: Generator<number>) {
    db.exec(APKG_SCHEMA);
    db.exec(APKG_COL);

    for (const deck of this.decks) {
      deck.write_to_db(db, timestamp, id_gen);
    }
  }
}
