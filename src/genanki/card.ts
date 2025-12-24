export class Card {
  ord: number;
  suspend: boolean;

  constructor(ord: number, suspend: boolean = false) {
    this.ord = ord;
    this.suspend = suspend;
  }

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
