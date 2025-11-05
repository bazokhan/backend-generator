---
layout: default
title: Customization
parent: Guides
nav_order: 4
---

# Customization Guide

Learn how to extend and customize generated code while preserving the ability to regenerate safely.

## Philosophy

TGraph Backend Generator follows a **separation of concerns** approach:

- **Generated files** (`.tg.*`) – Auto-generated, safe to regenerate
- **Custom files** – Your business logic, never touched by the generator

This allows you to extend generated code without losing your customizations.

## Backend Customization

### Extending Services

Create a custom service that extends the generated service:

**Generated Service:**

```typescript
// user.tg.service.ts
@Injectable()
export class UserTgService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserTgDto): Promise<User> {
    return this.prisma.user.create({ data: dto });
  }

  async findAll(query: PaginationSearchDto): Promise<PaginatedResponse<User>> {
    // Paginated query
  }

  // ... other CRUD methods
}
```

**Custom Service:**

```typescript
// user.service.ts
import { UserTgService } from './user.tg.service';

@Injectable()
export class UserService extends UserTgService {
  async createWithWelcomeEmail(dto: CreateUserTgDto): Promise<User> {
    const user = await super.create(dto);
    await this.sendWelcomeEmail(user);
    return user;
  }

  async findActiveUsers(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { isActive: true },
    });
  }

  async banUser(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false, bannedAt: new Date() },
    });
  }

  private async sendWelcomeEmail(user: User): Promise<void> {
    // Email logic
  }
}
```

**Update Module:**

```typescript
// user.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [UserTgController, UserController],
  providers: [
    UserTgService,
    UserService, // Your custom service
  ],
  exports: [UserService],
})
export class UserModule {}
```

### Custom Controllers

Create custom controllers alongside generated ones:

**Generated Controller:**

```typescript
// user.tg.controller.ts
@Controller('tg-api/users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class UserTgController {
  // Standard CRUD endpoints
}
```

**Custom Controller:**

```typescript
// user.controller.ts
import { UserService } from './user.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('active')
  async getActiveUsers() {
    return this.userService.findActiveUsers();
  }

  @Put(':id/ban')
  @UseGuards(AdminGuard)
  async banUser(@Param('id') id: string) {
    return this.userService.banUser(id);
  }

  @Get('me')
  async getCurrentUser(@CurrentUser() user: User) {
    return user;
  }
}
```

This gives you two controllers:

- `UserTgController` – Admin CRUD at `/tg-api/users`
- `UserController` – Custom endpoints at `/users`

### Custom DTOs

Create custom DTOs alongside generated ones:

**Generated DTOs:**

```typescript
// create-user.tg.dto.ts
export class CreateUserTgDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}

// update-user.tg.dto.ts
export class UpdateUserTgDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}
```

**Custom DTOs:**

```typescript
// create-user-with-profile.dto.ts
import { CreateUserTgDto } from './create-user.tg.dto';

export class CreateUserWithProfileDto extends CreateUserTgDto {
  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interests?: string[];
}

// user-registration.dto.ts
export class UserRegistrationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  password: string;

  @IsBoolean()
  acceptedTerms: boolean;
}
```

### Override Generated Behavior

Override specific methods in your custom service:

```typescript
@Injectable()
export class UserService extends UserTgService {
  // Override create to add custom validation
  async create(dto: CreateUserTgDto): Promise<User> {
    // Custom validation
    if (await this.emailExists(dto.email)) {
      throw new ConflictException('Email already in use');
    }

    // Call parent implementation
    const user = await super.create(dto);

    // Post-creation logic
    await this.initializeUserSettings(user.id);

    return user;
  }

  // Override update to add audit logging
  async update(id: string, dto: UpdateUserTgDto): Promise<User> {
    const before = await this.findOne(id);
    const after = await super.update(id, dto);

    await this.auditLog.log({
      action: 'USER_UPDATE',
      userId: id,
      before,
      after,
    });

    return after;
  }

  private async emailExists(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { email } });
    return count > 0;
  }

  private async initializeUserSettings(userId: string): Promise<void> {
    await this.prisma.userSettings.create({
      data: { userId, theme: 'light', language: 'en' },
    });
  }
}
```

## Frontend Customization

### Custom List Columns

Customize the generated list component:

**Generated:**

```tsx
// UserList.tsx
export const UserList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="name" />
      <EmailField source="email" />
      <DateField source="createdAt" />
      <EditButton />
    </Datagrid>
  </List>
);
```

**Option 1: Edit in place** (will be overwritten on regeneration):

```tsx
export const UserList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="name" />
      <EmailField source="email" />
      <TextField source="role" />
      <BooleanField source="isActive" />
      <DateField source="createdAt" showTime />
      <EditButton />
      <ShowButton />
      <DeleteButton />
    </Datagrid>
  </List>
);
```

**Option 2: Create custom component** (preserved on regeneration):

```tsx
// UserListCustom.tsx
export const UserListCustom = () => {
  const filters = [
    <TextInput source="q" label="Search" alwaysOn />,
    <SelectInput source="role" choices={roleChoices} />,
    <BooleanInput source="isActive" />,
  ];

  return (
    <List filters={filters}>
      <Datagrid rowClick="edit">
        <AvatarField source="avatar" />
        <TextField source="name" />
        <EmailField source="email" />
        <ChipField source="role" />
        <BooleanField source="isActive" label="Active" />
        <DateField source="lastLoginAt" showTime />
        <DateField source="createdAt" />
        <EditButton />
        <ShowButton />
      </Datagrid>
    </List>
  );
};
```

Then update `App.tsx` to use your custom component:

```tsx
<Resource
  name="users"
  list={UserListCustom} // Use custom component
  edit={UserEdit}
  create={UserCreate}
  show={UserShow}
/>
```

### Custom Form Layouts

Create custom form components:

```tsx
// UserEditCustom.tsx
import { UserEdit } from './UserEdit';

export const UserEditCustom = () => (
  <Edit>
    <TabbedForm>
      <FormTab label="Basic Info">
        <TextInput source="firstName" required />
        <TextInput source="lastName" required />
        <TextInput source="email" type="email" required />
      </FormTab>

      <FormTab label="Profile">
        <FileInput source="avatar" accept="image/*">
          <ImageField source="src" title="title" />
        </FileInput>
        <TextInput source="bio" multiline rows={5} />
        <SelectInput source="role" choices={roleChoices} />
      </FormTab>

      <FormTab label="Settings">
        <BooleanInput source="isActive" />
        <BooleanInput source="emailNotifications" />
        <SelectInput source="language" choices={languageChoices} />
      </FormTab>
    </TabbedForm>
  </Edit>
);
```

### Custom Fields

Create reusable custom fields:

```tsx
// components/AvatarField.tsx
export const AvatarField = ({ source }: { source: string }) => {
  const record = useRecordContext();
  const avatar = record?.[source];
  const name = record?.name;

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Avatar src={avatar} alt={name}>
        {!avatar && name?.[0]}
      </Avatar>
      <Typography>{name}</Typography>
    </Box>
  );
};

// Use in list
<Datagrid>
  <AvatarField source="avatar" />
  <EmailField source="email" />
</Datagrid>;
```

### Custom Actions

Add custom actions to your resources:

```tsx
// UserList.tsx
const UserActions = () => (
  <TopToolbar>
    <FilterButton />
    <CreateButton />
    <ExportButton />
    <Button
      label="Import Users"
      onClick={() => {
        /* Import logic */
      }}
    >
      <UploadIcon />
    </Button>
  </TopToolbar>
);

export const UserList = () => (
  <List actions={<UserActions />}>
    <Datagrid>{/* columns */}</Datagrid>
  </List>
);
```

## Configuration Customization

### Custom Config

Override default configuration:

```typescript
// tgraph.config.ts
import type { Config } from '@tgraph/backend-generator';

export const config: Config = {
  schemaPath: 'prisma/schema.prisma',
  dashboardPath: 'src/dashboard/src',
  dtosPath: 'src/dtos/generated',
  suffix: 'Admin', // Custom suffix
  isAdmin: true,
  updateDataProvider: true,
};
```

### CLI Overrides

Override config via CLI flags:

```bash
# Use custom suffix
tgraph api --suffix Bz

# Generate for public API
tgraph api --no-admin --suffix Public

# Skip data provider updates
tgraph dashboard --no-update-data-provider

# Custom paths
tgraph all \
  --schema apps/api/prisma/schema.prisma \
  --dashboard apps/admin/src \
  --dtos apps/api/src/dtos
```

## Module Structure Customization

### Custom Module Paths

If your modules are not in `src/features` or `src/infrastructure`, customize the `ModulePathResolver`:

```typescript
// custom-resolver.ts
import { ModulePathResolver } from '@tgraph/backend-generator';

export class CustomModulePathResolver extends ModulePathResolver {
  protected getModulePaths(kebabName: string): string[] {
    return [
      `src/modules/${kebabName}`, // Custom path
      `src/domain/${kebabName}`,
      `src/features/${kebabName}`,
    ];
  }
}
```

Use in your script:

```typescript
import { ApiGenerator } from '@tgraph/backend-generator';
import { CustomModulePathResolver } from './custom-resolver';

const generator = new ApiGenerator(config);
generator.modulePathResolver = new CustomModulePathResolver();
await generator.generate();
```

### Custom File Organization

Organize generated files differently:

```
src/features/user/
├── dtos/
│   ├── create-user.tg.dto.ts
│   └── update-user.tg.dto.ts
├── services/
│   ├── user.tg.service.ts
│   └── user.service.ts
└── controllers/
    ├── user.tg.controller.ts
    └── user.controller.ts
```

This requires forking the generators and adjusting file paths.

## Advanced Patterns

### Decorator Composition

Create reusable decorator combinations:

```typescript
// decorators/api-endpoint.decorator.ts
export function ApiEndpoint(path: string) {
  return applyDecorators(Controller(path), UseGuards(JwtAuthGuard, AdminGuard), ApiTags(path.split('/').pop() || ''));
}

// Usage
@ApiEndpoint('api/users')
export class UserController {
  // No need to repeat guards
}
```

### Service Composition

Compose multiple services:

```typescript
@Injectable()
export class UserManagementService {
  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService,
    private readonly permissionService: PermissionService,
  ) {}

  async createUserWithRole(userDto: CreateUserDto, roleName: string): Promise<User> {
    const user = await this.userService.create(userDto);
    const role = await this.roleService.findByName(roleName);
    await this.permissionService.assignRole(user.id, role.id);
    return user;
  }
}
```

### Middleware Integration

Add middleware to generated endpoints:

```typescript
// user.module.ts
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware, RateLimitMiddleware).forRoutes(UserTgController);
  }
}
```

## Best Practices

### 1. Never Edit Generated Files

```
✗ Don't edit: user.tg.service.ts
✓ Create: user.service.ts (extends UserTgService)
```

### 2. Use Descriptive Names for Custom Files

```typescript
// Good
UserService; // Custom service
UserRegistrationDto; // Custom DTO
UserListCustom; // Custom component

// Avoid
UserServiceCustom; // Unclear
UserDto2; // Non-descriptive
```

### 3. Extend, Don't Replace

```typescript
// Good
export class UserService extends UserTgService {
  async customMethod() {}
}

// Avoid - loses generated functionality
export class UserService {
  async customMethod() {}
}
```

### 4. Document Custom Logic

```typescript
/**
 * Custom user service extending generated CRUD operations.
 * Adds email sending, role management, and audit logging.
 */
@Injectable()
export class UserService extends UserTgService {
  // Custom methods
}
```

### 5. Keep Generated and Custom Separate

```
src/features/user/
├── user.tg.service.ts       # Generated
├── user.tg.controller.ts    # Generated
├── user.service.ts          # Custom
└── user.controller.ts       # Custom
```

## Regeneration Strategy

When you regenerate:

```bash
tgraph all
```

- `.tg.*` files are overwritten
- Custom files remain untouched
- AppModule auto-generated sections are updated
- Manual sections in AppModule remain intact

## Next Steps

- **[Extending Generated Code Recipe](../recipes/extending-generated-code.md)** – Practical examples
- **[SDK Reference](../sdk-reference.md)** – Programmatic API
- **[Architecture Overview](../architecture/overview.md)** – System design
