import { Model } from './model';
import { Card } from './card';
import { guid_for } from './util';
import { _fix_deprecated_builtin_models_and_warn } from './builtin_models';

class TagList extends Array<string> {
  static validate_tag(tag: string) {
    if (tag.includes(' ')) {
      throw new Error(`Tag "${tag}" contains a space; this is not allowed!`);
    }
  }

  constructor(tags: string[] = []) {
    super(...tags);
    // In JS extending Array is tricky, usually fine in ES6+ environments.
    // However, validation on push/splice etc needs to be overridden or handled via proxy.
    // For simplicity, we'll just check in the constructor and valid methods,
    // but full array compatibility with validation on index set is hard.
    // We will just validate on initialization and helper methods.
    tags.forEach(TagList.validate_tag);
  }

  push(...tags: string[]): number {
    tags.forEach(TagList.validate_tag);
    return super.push(...tags);
  }

  // Not implementing full array overrides for now, users should be careful or we can use a Proxy if needed.
}

/**
 * Represents a specific Note (an instance of a Model with data).
 */
export class Note {
  static _INVALID_HTML_TAG_RE = /<(?!(?:\/?[a-zA-Z0-9]+(?: .*|\/?)>|!--|!\[CDATA\[))(?:.|\n)*?>/g;

  model: Model;
  fields: string[];
  private _sort_field?: string;
  private _tags: string[] = [];
  due: number;
  private _guid?: string;
  private _cards: Card[] | null = null;

  /**
   * Creates a new Note.
   *
   * @param model - The Model this note follows.
   * @param fields - The data for the fields defined in the model.
   * @param sort_field - The value used for sorting. If null, uses the field at `model.sort_field_index`.
   * @param tags - A list of tags to apply to the note.
   * @param guid - A unique ID. If null, one is generated from the fields.
   * @param due - Due date (mostly internal use).
   */
  constructor(
    model: Model,
    fields: string[],
    sort_field: string | null = null,
    tags: string[] | null = null,
    guid: string | null = null,
    due: number = 0
  ) {
    this.model = model;
    this.fields = fields;
    if (sort_field !== null) this._sort_field = sort_field;
    this.tags = tags || [];
    this.due = due;
    if (guid !== null) this._guid = guid;
  }

  /**
   * Gets the sort field value.
   */
  get sort_field(): string {
    return this._sort_field || this.fields[this.model.sort_field_index];
  }

  set sort_field(val: string) {
    this._sort_field = val;
  }

  /**
   * Gets the list of tags.
   */
  get tags(): string[] {
    return this._tags;
  }

  set tags(val: string[]) {
    val.forEach(TagList.validate_tag);
    this._tags = val;
  }

  /**
   * Generates and returns the cards for this note based on the model type.
   */
  get cards(): Card[] {
    if (this._cards) return this._cards;

    if (this.model.model_type === Model.FRONT_BACK) {
      this._cards = this._front_back_cards();
    } else if (this.model.model_type === Model.CLOZE) {
      this._cards = this._cloze_cards();
    } else {
      throw new Error('Expected model_type CLOZE or FRONT_BACK');
    }
    return this._cards;
  }

  private _cloze_cards(): Card[] {
    const card_ords = new Set<number>();
    const qfmt = this.model.templates[0]['qfmt'];

    // find cloze replacements
    // Python: re.findall(r"{{[^}]*?cloze:(?:[^}]?:)*(.+?)}}", ...)
    // JS RegExp doesn't support named groups in the same way or lookbehinds in all envs, but basic match is fine.
    // We use a global regex.
    const regex1 = /{{[^}]*?cloze:(?:[^}]?:)*(.+?)}}/g;
    const regex2 = /<%cloze:(.+?)%>/g;

    const cloze_replacements = new Set<string>();
    let match;
    while ((match = regex1.exec(qfmt)) !== null) {
      cloze_replacements.add(match[1]);
    }
    while ((match = regex2.exec(qfmt)) !== null) {
      cloze_replacements.add(match[1]);
    }

    for (const field_name of cloze_replacements) {
      const field_index = this.model.fields.findIndex(f => f['name'] === field_name);
      const field_value = field_index >= 0 ? this.fields[field_index] : "";

      const regex3 = /{{c(\d+)::.+?}}/gs; // dotAll mode
      let m;
      while ((m = regex3.exec(field_value)) !== null) {
        if (parseInt(m[1]) > 0) {
          card_ords.add(parseInt(m[1]) - 1);
        }
      }
    }

    if (card_ords.size === 0) {
      card_ords.add(0);
    }

    return Array.from(card_ords).map(ord => new Card(ord));
  }

  private _front_back_cards(): Card[] {
    const rv: Card[] = [];
    for (const req of this.model.req) {
        const card_ord = req[0];
        const any_or_all = req[1];
        const required_field_ords = req[2];

        const field_values = required_field_ords.map((ord: number) => this.fields[ord]);

        let should_add = false;
        if (any_or_all === 'any') {
            should_add = field_values.some((v: string) => v && v.length > 0);
        } else if (any_or_all === 'all') {
             should_add = field_values.every((v: string) => v && v.length > 0);
        }

        if (should_add) {
            rv.push(new Card(card_ord));
        }
    }
    return rv;
  }

  /**
   * Gets the GUID for the note.
   */
  get guid(): string {
    if (this._guid === undefined) {
      return guid_for(...this.fields);
    }
    return this._guid;
  }

  set guid(val: string) {
    this._guid = val;
  }

  _check_number_model_fields_matches_num_fields() {
    if (this.model.fields.length !== this.fields.length) {
      throw new Error(
          `Number of fields in Model does not match number of fields in Note: ` +
          `${this.model.name} has ${this.model.fields.length} fields, but Note has ${this.fields.length} fields.`
      );
    }
  }

  static _find_invalid_html_tags_in_field(field: string): string[] {
     const matches = field.match(Note._INVALID_HTML_TAG_RE);
     return matches || [];
  }

  _check_invalid_html_tags_in_fields() {
    this.fields.forEach((field, idx) => {
      const invalid_tags = Note._find_invalid_html_tags_in_field(field);
      if (invalid_tags.length > 0) {
        console.warn(`Field contained the following invalid HTML tags. Make sure you are calling html.escape() if` +
                      ` your field data isn't already HTML-encoded: ${invalid_tags.join(' ')}`);
      }
    });
  }

  /**
   * Writes the note to the Anki database.
   *
   * @param cursor - Database cursor.
   * @param timestamp - Modification timestamp.
   * @param deck_id - The ID of the deck containing this note.
   * @param id_gen - Generator for note IDs.
   */
  write_to_db(cursor: any, timestamp: number, deck_id: number, id_gen: Generator<number>) {
    this.fields = _fix_deprecated_builtin_models_and_warn(this.model, this.fields);
    this._check_number_model_fields_matches_num_fields();
    this._check_invalid_html_tags_in_fields();

    const note_id = id_gen.next().value;

    cursor.prepare('INSERT INTO notes VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(
        note_id,                      // id
        this.guid,                    // guid
        this.model.model_id,          // mid
        Math.floor(timestamp),        // mod
        -1,                           // usn
        this._format_tags(),          // tags
        this._format_fields(),        // flds
        this.sort_field,              // sfld
        0,                            // csum
        0,                            // flags
        ''                            // data
    );

    this.cards.forEach(card => {
      card.write_to_db(cursor, timestamp, deck_id, note_id, id_gen, this.due);
    });
  }

  _format_fields(): string {
    return this.fields.join('\x1f');
  }

  _format_tags(): string {
    return ' ' + this.tags.join(' ') + ' ';
  }
}
