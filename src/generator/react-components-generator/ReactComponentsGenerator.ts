import type { ParsedSchema, PrismaModel } from '@tg-scripts/types';
import type { IGenerator } from '@tg-scripts/types';
import { listPage } from './list/page-config';
import { editPage } from './edit/page-config';
import { createPage } from './create/page-config';
import { showPage } from './show/page-config';
import { studioPage } from './studio/page-config';
import { indexPage } from './index/page-config';

type PageType = 'list' | 'edit' | 'create' | 'show' | 'studio' | 'index';

type GenerateReactComponentsInput = {
  pages: PageType[];
  model: PrismaModel;
  parsedSchema: ParsedSchema<PrismaModel>;
};

type GenerateReactComponentsOutput = {
  [K in PageType]?: { content: string; fileName: string };
};

export class ReactComponentsGenerator
  implements IGenerator<GenerateReactComponentsInput, GenerateReactComponentsOutput>
{
  public generate(input: GenerateReactComponentsInput): GenerateReactComponentsOutput {
    const result: GenerateReactComponentsOutput = {};
    for (const page of input.pages) {
      switch (page) {
        case 'list':
          result[page] = {
            content: listPage(input.model, input.parsedSchema),
            fileName: `${input.model.name}List.tsx`,
          };
          break;
        case 'edit':
          result[page] = {
            content: editPage(input.model, input.parsedSchema),
            fileName: `${input.model.name}Edit.tsx`,
          };
          break;
        case 'create':
          result[page] = {
            content: createPage(input.model, input.parsedSchema),
            fileName: `${input.model.name}Create.tsx`,
          };
          break;
        case 'show':
          result[page] = {
            content: showPage(input.model, input.parsedSchema),
            fileName: `${input.model.name}Show.tsx`,
          };
          break;
        case 'studio':
          result[page] = {
            content: studioPage(input.model, input.parsedSchema),
            fileName: `${input.model.name}Studio.tsx`,
          };
          break;
        case 'index':
          result[page] = {
            content: indexPage(input.model, input.parsedSchema),
            fileName: 'index.ts',
          };
          break;
      }
    }
    return result;
  }
}
