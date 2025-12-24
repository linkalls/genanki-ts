import mustache from 'mustache';
import yaml from 'js-yaml';

export class Model {
  static FRONT_BACK = 0;
  static CLOZE = 1;
  static DEFAULT_LATEX_PRE = '\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n'
                       + '\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n'
                       + '\\begin{document}\n';
  static DEFAULT_LATEX_POST = '\\end{document}';

  model_id: number;
  name: string;
  fields: any[];
  templates: any[];
  css: string;
  model_type: number;
  latex_pre: string;
  latex_post: string;
  sort_field_index: number;
  private _req: any[] | null = null;

  constructor(
    model_id: number,
    name: string,
    fields: any[] | string,
    templates: any[] | string,
    css: string = '',
    model_type: number = Model.FRONT_BACK,
    latex_pre: string = Model.DEFAULT_LATEX_PRE,
    latex_post: string = Model.DEFAULT_LATEX_POST,
    sort_field_index: number = 0
  ) {
    this.model_id = model_id;
    this.name = name;
    this.css = css;
    this.model_type = model_type;
    this.latex_pre = latex_pre;
    this.latex_post = latex_post;
    this.sort_field_index = sort_field_index;
    this.fields = [];
    this.templates = [];

    this.set_fields(fields);
    this.set_templates(templates);
  }

  set_fields(fields: any[] | string) {
    if (Array.isArray(fields)) {
      this.fields = fields;
    } else if (typeof fields === 'string') {
      this.fields = yaml.load(fields) as any[];
    }
  }

  set_templates(templates: any[] | string) {
    if (Array.isArray(templates)) {
      this.templates = templates;
    } else if (typeof templates === 'string') {
      this.templates = yaml.load(templates) as any[];
    }
  }

  get req(): any[] {
    if (this._req) return this._req;

    const sentinel = 'SeNtInEl';
    const field_names = this.fields.map((field: any) => field['name']);

    const req: any[] = [];
    this.templates.forEach((template, template_ord) => {
      const required_fields: number[] = [];

      // Check for "all"
      for (let field_ord = 0; field_ord < field_names.length; field_ord++) {
        const field = field_names[field_ord];
        const field_values: {[key: string]: string} = {};
        field_names.forEach(f => field_values[f] = sentinel);
        field_values[field] = '';

        const rendered = mustache.render(template['qfmt'], field_values);

        if (!rendered.includes(sentinel)) {
          required_fields.push(field_ord);
        }
      }

      if (required_fields.length > 0) {
        req.push([template_ord, 'all', required_fields]);
        return;
      }

      // Check for "any"
      const any_required_fields: number[] = [];
      for (let field_ord = 0; field_ord < field_names.length; field_ord++) {
        const field = field_names[field_ord];
        const field_values: {[key: string]: string} = {};
        field_names.forEach(f => field_values[f] = '');
        field_values[field] = sentinel;

        const rendered = mustache.render(template['qfmt'], field_values);

        if (rendered.includes(sentinel)) {
          any_required_fields.push(field_ord);
        }
      }

      if (any_required_fields.length === 0) {
        throw new Error(`Could not compute required fields for this template; please check the formatting of "qfmt": ${JSON.stringify(template)}`);
      }

      req.push([template_ord, 'any', any_required_fields]);
    });

    this._req = req;
    return req;
  }

  to_json(timestamp: number, deck_id: number) {
    this.templates.forEach((tmpl, ord) => {
      tmpl['ord'] = ord;
      tmpl['bafmt'] = tmpl['bafmt'] || '';
      tmpl['bqfmt'] = tmpl['bqfmt'] || '';
      tmpl['bfont'] = tmpl['bfont'] || '';
      tmpl['bsize'] = tmpl['bsize'] || 0;
      tmpl['did'] = tmpl['did'] || null;
    });

    this.fields.forEach((field, ord) => {
      field['ord'] = ord;
      field['font'] = field['font'] || 'Liberation Sans';
      field['media'] = field['media'] || [];
      field['rtl'] = field['rtl'] || false;
      field['size'] = field['size'] || 20;
      field['sticky'] = field['sticky'] || false;
    });

    return {
      "css": this.css,
      "did": deck_id,
      "flds": this.fields,
      "id": this.model_id.toString(),
      "latexPost": this.latex_post,
      "latexPre": this.latex_pre,
      "latexsvg": false,
      "mod": Math.floor(timestamp),
      "name": this.name,
      "req": this.req,
      "sortf": this.sort_field_index,
      "tags": [],
      "tmpls": this.templates,
      "type": this.model_type,
      "usn": -1,
      "vers": []
    };
  }
}
