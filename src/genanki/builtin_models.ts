import { Model } from './model';

export const BASIC_MODEL = new Model(
  1559383000,
  'Basic (genanki)',
  [
    {
      'name': 'Front',
      'font': 'Arial',
    },
    {
      'name': 'Back',
      'font': 'Arial',
    },
  ],
  [
    {
      'name': 'Card 1',
      'qfmt': '{{Front}}',
      'afmt': '{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}',
    },
  ],
  '.card {\n font-family: arial;\n font-size: 20px;\n text-align: center;\n color: black;\n background-color: white;\n}\n'
);

export const BASIC_AND_REVERSED_CARD_MODEL = new Model(
  1485830179,
  'Basic (and reversed card) (genanki)',
  [
    {
      'name': 'Front',
      'font': 'Arial',
    },
    {
      'name': 'Back',
      'font': 'Arial',
    },
  ],
  [
    {
      'name': 'Card 1',
      'qfmt': '{{Front}}',
      'afmt': '{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}',
    },
    {
      'name': 'Card 2',
      'qfmt': '{{Back}}',
      'afmt': '{{FrontSide}}\n\n<hr id=answer>\n\n{{Front}}',
    },
  ],
  '.card {\n font-family: arial;\n font-size: 20px;\n text-align: center;\n color: black;\n background-color: white;\n}\n'
);

export const BASIC_OPTIONAL_REVERSED_CARD_MODEL = new Model(
  1382232460,
  'Basic (optional reversed card) (genanki)',
  [
    {
      'name': 'Front',
      'font': 'Arial',
    },
    {
      'name': 'Back',
      'font': 'Arial',
    },
    {
      'name': 'Add Reverse',
      'font': 'Arial',
    },
  ],
  [
    {
      'name': 'Card 1',
      'qfmt': '{{Front}}',
      'afmt': '{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}',
    },
    {
      'name': 'Card 2',
      'qfmt': '{{#Add Reverse}}{{Back}}{{/Add Reverse}}',
      'afmt': '{{FrontSide}}\n\n<hr id=answer>\n\n{{Front}}',
    },
  ],
  '.card {\n font-family: arial;\n font-size: 20px;\n text-align: center;\n color: black;\n background-color: white;\n}\n'
);

export const BASIC_TYPE_IN_THE_ANSWER_MODEL = new Model(
  1305534440,
  'Basic (type in the answer) (genanki)',
  [
    {
      'name': 'Front',
      'font': 'Arial',
    },
    {
      'name': 'Back',
      'font': 'Arial',
    },
  ],
  [
    {
      'name': 'Card 1',
      'qfmt': '{{Front}}\n\n{{type:Back}}',
      'afmt': '{{Front}}\n\n<hr id=answer>\n\n{{type:Back}}',
    },
  ],
  '.card {\n font-family: arial;\n font-size: 20px;\n text-align: center;\n color: black;\n background-color: white;\n}\n'
);

export const CLOZE_MODEL = new Model(
  1550428389,
  'Cloze (genanki)',
  [
    {
      'name': 'Text',
      'font': 'Arial',
    },
    {
      'name': 'Back Extra',
      'font': 'Arial',
    },
  ],
  [
    {
      'name': 'Cloze',
      'qfmt': '{{cloze:Text}}',
      'afmt': '{{cloze:Text}}<br>\n{{Back Extra}}',
    },
  ],
  '.card {\n font-family: arial;\n font-size: 20px;\n text-align: center;\n color: black;\n background-color: white;\n}\n\n' +
  '.cloze {\n font-weight: bold;\n color: blue;\n}\n.nightMode .cloze {\n color: lightblue;\n}',
  Model.CLOZE
);

export function _fix_deprecated_builtin_models_and_warn(model: Model, fields: string[]): string[] {
  if (model === CLOZE_MODEL && fields.length === 1) {
    const fixed_fields = [...fields, ''];
    console.warn(
      'Using CLOZE_MODEL with a single field is deprecated.' +
      ` Please pass two fields, e.g. ${JSON.stringify(fixed_fields)} .` +
      ' See https://github.com/kerrickstaley/genanki#cloze_model-deprecationwarning .'
    );
    return fixed_fields;
  }
  return fields;
}
