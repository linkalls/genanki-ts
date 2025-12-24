import { Note } from './note';
import { Model } from './model';
import { Package } from './package';

export class Deck {
  deck_id: number;
  name: string;
  description: string;
  notes: Note[];
  models: { [key: string]: Model };

  constructor(deck_id: number, name: string, description: string = '') {
    this.deck_id = deck_id;
    this.name = name;
    this.description = description;
    this.notes = [];
    this.models = {};
  }

  add_note(note: Note) {
    this.notes.push(note);
  }

  add_model(model: Model) {
    this.models[model.model_id.toString()] = model;
  }

  to_json() {
    return {
      "collapsed": false,
      "conf": 1,
      "desc": this.description,
      "dyn": 0,
      "extendNew": 0,
      "extendRev": 50,
      "id": this.deck_id,
      "lrnToday": [
          163,
          2
      ],
      "mod": 1425278051,
      "name": this.name,
      "newToday": [
          163,
          2
      ],
      "revToday": [
          163,
          0
      ],
      "timeToday": [
          163,
          23598
      ],
      "usn": -1
    };
  }

  write_to_db(cursor: any, timestamp: number, id_gen: Generator<number>) {
    if (typeof this.deck_id !== 'number') {
      throw new TypeError(`Deck .deck_id must be an integer, not ${this.deck_id}.`);
    }
    if (typeof this.name !== 'string') {
      throw new TypeError(`Deck .name must be a string, not ${this.name}.`);
    }

    const decks_row = cursor.prepare('SELECT decks FROM col').get();
    const decks = JSON.parse(decks_row.decks);
    decks[this.deck_id.toString()] = this.to_json();
    cursor.prepare('UPDATE col SET decks = ?').run(JSON.stringify(decks));

    const models_row = cursor.prepare('SELECT models from col').get();
    const models = JSON.parse(models_row.models);

    for (const note of this.notes) {
      this.add_model(note.model);
    }

    for (const model of Object.values(this.models)) {
        models[model.model_id.toString()] = model.to_json(timestamp, this.deck_id);
    }

    cursor.prepare('UPDATE col SET models = ?').run(JSON.stringify(models));

    for (const note of this.notes) {
      note.write_to_db(cursor, timestamp, this.deck_id, id_gen);
    }
  }

  write_to_file(file: string) {
    new Package(this).write_to_file(file);
  }
}
