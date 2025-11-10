export const paginatedSearchUtilTemplate = `import { PrismaClient } from '{{prismaGeneratedPath}}';
import { PaginatedSearchQueryDto } from '{{queryDtoPath}}';
import { PaginatedSearchResultDto } from '{{resultDtoPath}}';

export interface PaginatedSearchParams<T> {
  prisma: PrismaClient;
  model: string;
  query: PaginatedSearchQueryDto;
  fieldsToSearch: Array<{ name: string; type: string }>;
  defaultSortBy?: string;
  defaultLimit?: number;
}

export async function paginatedSearch<T>({
  prisma,
  model,
  query,
  fieldsToSearch,
  defaultSortBy = 'createdAt',
  defaultLimit = 10,
}: PaginatedSearchParams<T>): Promise<PaginatedSearchResultDto<T>> {
  const { search, sort, sortOrder, sortBy = defaultSortBy, page, limit } = query;
  const actualSortOrder = sort || sortOrder || 'desc';
  const parsedLimit = parseInt((limit ?? defaultLimit).toString(), 10);
  const parsedPage = parseInt((page ?? 1).toString(), 10);
  const skip = (parsedPage - 1) * parsedLimit;

  // Build the where clause for search
  const where: any = {};
  if (search && fieldsToSearch.length > 0) {
    where.OR = fieldsToSearch.map((field) => {
      if (field.type === 'String') {
        return { [field.name]: { contains: search, mode: 'insensitive' } };
      } else if (field.type === 'Int' || field.type === 'Float' || field.type === 'Decimal') {
        const numericValue = parseFloat(search);
        if (!isNaN(numericValue)) {
          return { [field.name]: numericValue };
        }
        return null;
      } else if (field.type === 'Boolean') {
        const boolValue = search.toLowerCase() === 'true';
        return { [field.name]: boolValue };
      }
      return null;
    }).filter(Boolean);
  }

  // Build the orderBy clause
  const orderBy = sortBy ? { [sortBy]: actualSortOrder } : { [defaultSortBy]: actualSortOrder };

  // Get the model from Prisma
  const prismaModel = (prisma as any)[model];

  if (!prismaModel) {
    throw new Error(\`Model "\${model}" not found in Prisma client\`);
  }

  // Execute queries
  const [data, total] = await Promise.all([
    prismaModel.findMany({
      where,
      orderBy,
      skip,
      take: parsedLimit,
    }),
    prismaModel.count({ where }),
  ]);

  return new PaginatedSearchResultDto<T>(data, total, parsedPage, parsedLimit);
}
`;
