# genanki-ts

A TypeScript library for generating Anki decks, ported from the Python `genanki` library.

## Installation

```bash
npm install genanki-ts
```

## Usage

```typescript
import { Deck, Model, Note, Package } from 'genanki-ts';
import * as fs from 'fs';

// Create a model
const myModel = new Model(
  1607392319,
  'Simple Model',
  [
    {'name': 'Question'},
    {'name': 'Answer'},
  ],
  [
    {
      'name': 'Card 1',
      'qfmt': '{{Question}}',
      'afmt': '{{FrontSide}}<hr id="answer">{{Answer}}',
    },
  ]
);

// Create a deck
const myDeck = new Deck(2059400110, 'Country Capitals');

// Add a note
myDeck.add_note(new Note(myModel, ['Capital of Argentina', 'Buenos Aires']));

// Generate the package
const pkg = new Package(myDeck);
pkg.write_to_file('output.apkg').then(() => {
  console.log('Deck generated successfully!');
});
```

## Media Files

To add media files:

```typescript
const pkg = new Package(myDeck, ['path/to/image.jpg', 'path/to/sound.mp3']);
```

And reference them in your fields/templates as usual (e.g., `<img src="image.jpg">` or `[sound:sound.mp3]`).

## License

MIT
