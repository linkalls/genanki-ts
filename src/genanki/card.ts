/**
 * Represents a Card generated from a Note.
 */
export class Card {
  ord: number;
  suspend: boolean;

  /**
   * Creates a new Card.
   *
   * @param ord - The ordinal of the card (which template it corresponds to).
   * @param suspend - Whether the card is suspended.
   */
  constructor(ord: number, suspend: boolean = false) {
    this.ord = ord;
    this.suspend = suspend;
  }

  /**
   * Writes the card to the database.
   *
   * @param cursor - Database cursor.
   * @param timestamp - Modification timestamp.
   * @param deck_id - ID of the deck.
   * @param note_id - ID of the parent note.
   * @param id_gen - ID generator.
   * @param due - Due date or queue position.
   */
  write_to_db(cursor: any, timestamp: number, deck_id: number, note_id: number, id_gen: Generator<number>, due: number = 0) {
    const queue = this.suspend ? -1 : 0;
    cursor.prepare('INSERT INTO cards VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(
        id_gen.next().value,    // id
        note_id,                // nid
        deck_id,                // did
        this.ord,               // ord
        Math.floor(timestamp),  // mod
        -1,                     // usn
        0,                      // type (=0 for non-Cloze)
        queue,                  // queue
        due,                    // due
        0,                      // ivl
        0,                      // factor
        0,                      // reps
        0,                      // lapses
        0,                      // left
        0,                      // odue
        0,                      // odid
        0,                      // flags
        ""                      // data
    );
  }
}
