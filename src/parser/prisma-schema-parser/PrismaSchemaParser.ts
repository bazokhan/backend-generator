import type { PrismaModel, ParsedSchema, PrismaField } from '@tg-scripts/types';
import { State, STATE_RULES } from './config';
import type { IPrismaFieldParser, IPrismaRelationsParser, IPrismaSchemaParser } from '@tg-scripts/types';

export class PrismaSchemaParser implements IPrismaSchemaParser<PrismaModel> {
  private currentEnum: string | null = null;
  private currentModel: {
    name: string;
    fields: PrismaField[];
    tgLabelField?: string | undefined;
  } | null = null;
  private enums = new Map<string, string[]>();
  private fieldParser: IPrismaFieldParser<PrismaField>;
  private fieldRelationsParser: IPrismaRelationsParser<PrismaModel>;
  private lines: string[] = [];
  private models: PrismaModel[] = [];
  // Current parsing state
  private state = State.None;
  // Context tracking
  private hasTgForm = false;
  private pendingTgLabel?: string | undefined;
  private pendingFieldDocComment?: string | undefined;

  constructor(fieldParser: IPrismaFieldParser<PrismaField>, fieldRelationsParser: IPrismaRelationsParser<PrismaModel>) {
    this.fieldParser = fieldParser;
    this.fieldRelationsParser = fieldRelationsParser;
  }

  public load(schema: string): void {
    this.lines = schema.split('\n');
  }

  public parse(): ParsedSchema<PrismaModel> {
    this.reset();

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i]?.trim() ?? '';
      if (!line) continue;

      this.processLine(line);
    }

    // After initial parse, enrich fields with relation/scalar/baseType and set displayField
    this.fieldRelationsParser.parse({ models: this.models, enums: this.enums });

    return { models: this.models, enums: this.enums };
  }

  public reset(): void {
    this.models = [];
    this.enums = new Map();
    this.state = State.None;
    this.currentEnum = null;
    this.currentModel = null;
    this.hasTgForm = false;
    this.pendingTgLabel = undefined;
    this.pendingFieldDocComment = undefined;
  }

  private processLine(line: string): void {
    // Check triple-slash comments BEFORE double-slash (order matters!)
    if (line.startsWith('///')) {
      // Check for @tg_form() and @tg_label() in triple-slash comments
      this.handleComment(line);
      
      if (this.state === State.InModel) {
        const content = line.replace(/^\/\/\//, '').trim();
        this.pendingFieldDocComment = this.pendingFieldDocComment
          ? `${this.pendingFieldDocComment} ${content}`
          : content;
      }
      return;
    }

    if (line.startsWith('//')) {
      this.handleComment(line);
      return;
    }

    if (line.startsWith('/*')) {
      this.state = State.InMultiLineComment;
      if (line.includes('*/')) {
        this.state = State.None;
      }
      return;
    }

    if (this.state === State.InMultiLineComment) {
      if (line.includes('*/')) {
        this.state = State.None;
      }
      return;
    }

    // Handle state-specific parsing
    switch (this.state) {
      case State.None:
        this.handleNoneState(line);
        break;
      case State.InEnum:
        this.handleEnumState(line);
        break;
      case State.InModel:
        this.handleModelState(line);
        break;
    }
  }

  private handleComment(line: string): void {
    if (line.includes('@tg_form()')) {
      this.hasTgForm = true;
    }

    if (!this.currentModel && line.includes('@tg_label(')) {
      const match = line.match(/@tg_label\(([^)]+)\)/);
      if (match) {
        this.pendingTgLabel = match[1]?.trim() ?? '';
      }
    }
  }

  private handleNoneState(line: string): void {
    const rule = STATE_RULES[State.None];
    const firstToken = line.split(/\s+/)[0];

    for (const [keyword, newState] of Object.entries(rule.transitions)) {
      if (firstToken === keyword) {
        this.state = newState as State;
        this.handleTransition(keyword, line);
        return;
      }
    }
  }

  private handleTransition(keyword: string, line: string): void {
    if (keyword === 'enum') {
      const match = line.match(/^enum\s+(\w+)/);
      if (match) {
        this.currentEnum = match[1] ?? '';
        this.enums.set(this.currentEnum ?? '', []);
      }
    } else if (keyword === 'model' && this.hasTgForm) {
      const match = line.match(/^model\s+(\w+)/);
      if (match) {
        const modelName = match[1];
        // Skip models named "model" (reserved keyword)
        if (modelName === 'model') {
          return;
        }
        this.currentModel = {
          name: modelName ?? '',
          fields: [],
          tgLabelField: this.pendingTgLabel,
        };
        this.pendingTgLabel = undefined;
        // Handle single-line model: model Name { field Type }
        const restOfLine = line.substring(match[0].length).trim();
        if (restOfLine.startsWith('{') && restOfLine.includes('}')) {
          // Extract content between braces
          const content = restOfLine.match(/\{([^}]*)\}/)?.[1]?.trim();
          if (content) {
            const field = this.fieldParser.parse(content, this.pendingFieldDocComment);
            if (field && this.currentModel) {
              this.currentModel.fields.push(field);
            }
            this.pendingFieldDocComment = undefined;
            this.finalizeModel();
            this.state = State.None;
            return;
          }
        }
      }
    }
  }

  private handleEnumState(line: string): void {
    const rule = STATE_RULES[State.InEnum];

    if (line === rule.endToken) {
      this.currentEnum = null;
      this.state = rule.endState;
      return;
    }

    if (this.currentEnum && !line.startsWith('//')) {
      const enumValue = line.split(/\s+/)[0];
      if (enumValue) {
        this.enums.get(this.currentEnum)!.push(enumValue);
      }
    }
  }

  private handleModelState(line: string): void {
    const rule = STATE_RULES[State.InModel];

    if (line === rule.endToken) {
      this.finalizeModel();
      this.state = rule.endState;
      return;
    }

    if (!this.currentModel) return;

    if (line.startsWith('@@')) {
      // Skip model-level directives
      return;
    }

    if (line && !line.startsWith('//')) {
      const field = this.fieldParser.parse(line, this.pendingFieldDocComment);
      if (field) {
        this.currentModel.fields.push(field);
      }
      this.pendingFieldDocComment = undefined;
    }
  }

  private finalizeModel(): void {
    if (!this.currentModel) return;

    // Find enums used in this model
    const usedEnums: string[] = [];
    this.currentModel.fields.forEach((field) => {
      if (this.enums.has(field.type)) {
        usedEnums.push(field.type);
      }
    });

    this.models.push({
      name: this.currentModel.name,
      fields: this.currentModel.fields,
      enums: usedEnums,
      moduleType: '', // Will be set later by ApiGenerator based on where module is found
      tgLabelField: this.currentModel.tgLabelField,
    });

    this.currentModel = null;
    this.hasTgForm = false;
  }
}
