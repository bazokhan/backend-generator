# Custom Validation Recipe

Add complex validation rules beyond basic Prisma constraints.

## Goal

Implement advanced validation for a user registration system:

- Strong password requirements
- Email domain whitelist
- Username format validation
- Phone number formats
- Custom business rules

## Basic Validation from Prisma

Start with Prisma schema validation:

```prisma
// @tg_form()
model User {
  id        String   @id @default(uuid())
  username  String   @unique  // @min(3) @max(20)
  /// @tg_format(email)
  email     String   @unique
  password  String   // @min(8)
  firstName String   // @min(2) @max(50)
  lastName  String   // @min(2) @max(50)
  /// @tg_format(tel)
  phone     String?
  age       Int      // @min(18)
  website   String?  // @pattern(/^https?:\/\//)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Generate:

```bash
tgraph dtos
```

This creates:

```typescript
export class CreateUserTgDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @IsNotEmpty()
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsNotEmpty()
  lastName: string;

  @Matches(/^[0-9+()\s-]+$/)
  @IsOptional()
  phone?: string;

  @IsInt()
  @Min(18)
  @IsNotEmpty()
  age: number;

  @IsString()
  @Matches(/^https?:\/\//)
  @IsOptional()
  website?: string;
}
```

## Advanced Validation Patterns

### Pattern 1: Custom DTO with Complex Rules

Create a custom registration DTO with stronger validation:

```typescript
// user-registration.dto.ts
import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
  IsInt,
  Min,
  Max,
  IsOptional,
  Validate,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UserRegistrationDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username can only contain letters, numbers, underscores, and hyphens',
  })
  @Transform(({ value }) => value?.trim().toLowerCase())
  username: string;

  @IsEmail()
  @Matches(/^[a-zA-Z0-9._%+-]+@(company\.com|partner\.org)$/, {
    message: 'Email must be from company.com or partner.org domain',
  })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number, and special character',
  })
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message: 'First name can only contain letters, spaces, hyphens, and apostrophes',
  })
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message: 'Last name can only contain letters, spaces, hyphens, and apostrophes',
  })
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone must be a valid international format',
  })
  phone?: string;

  @IsInt()
  @Min(18, { message: 'Must be at least 18 years old' })
  @Max(120, { message: 'Age must be realistic' })
  age: number;

  @IsString()
  @IsOptional()
  @Matches(/^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, {
    message: 'Website must be a valid HTTPS URL',
  })
  website?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio?: string;
}
```

### Pattern 2: Custom Validators

Create reusable custom validators:

```typescript
// validators/is-strong-password.validator.ts
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments): boolean {
    if (!password) return false;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    const isLongEnough = password.length >= 8;

    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character (@$!%*?&)';
  }
}

// Usage
export class UserRegistrationDto {
  @Validate(IsStrongPasswordConstraint)
  password: string;
}
```

### Pattern 3: Async Validators

Validate against database:

```typescript
// validators/is-unique-email.validator.ts
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@ValidatorConstraint({ name: 'isUniqueEmail', async: true })
@Injectable()
export class IsUniqueEmailConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(email: string, args: ValidationArguments): Promise<boolean> {
    if (!email) return false;

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    return !user;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Email $value is already taken';
  }
}

// Usage
export class UserRegistrationDto {
  @IsEmail()
  @Validate(IsUniqueEmailConstraint)
  email: string;
}

// Register in module
@Module({
  providers: [IsUniqueEmailConstraint],
})
export class UserModule {}
```

### Pattern 4: Cross-Field Validation

Validate related fields:

```typescript
// validators/is-password-match.validator.ts
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'isPasswordMatch', async: false })
export class IsPasswordMatchConstraint implements ValidatorConstraintInterface {
  validate(confirmPassword: string, args: ValidationArguments): boolean {
    const object = args.object as any;
    return confirmPassword === object.password;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Passwords do not match';
  }
}

// Usage
export class UserRegistrationDto {
  @IsString()
  @MinLength(8)
  password: string;

  @Validate(IsPasswordMatchConstraint)
  confirmPassword: string;
}
```

### Pattern 5: Conditional Validation

Validate based on other field values:

```typescript
export class UpdateUserDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  // Only validate if password is being changed
  @IsString()
  @IsOptional()
  @MinLength(8)
  newPassword?: string;

  // Required only if newPassword is provided
  @ValidateIf((o) => o.newPassword !== undefined)
  @IsString()
  @IsNotEmpty({ message: 'Current password is required when changing password' })
  currentPassword?: string;

  // Must match newPassword if provided
  @ValidateIf((o) => o.newPassword !== undefined)
  @Validate(IsPasswordMatchConstraint)
  confirmNewPassword?: string;
}
```

## Service-Level Validation

Implement business rule validation in services:

```typescript
// user.service.ts
import { UserTgService } from './user.tg.service';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class UserService extends UserTgService {
  async register(dto: UserRegistrationDto): Promise<User> {
    // Business rule: Check if username is blacklisted
    await this.validateUsername(dto.username);

    // Business rule: Check email domain
    await this.validateEmailDomain(dto.email);

    // Business rule: Check if user is old enough
    this.validateAge(dto.age);

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    return this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
      },
    });
  }

  private async validateUsername(username: string): Promise<void> {
    const blacklist = ['admin', 'root', 'system', 'test'];
    if (blacklist.includes(username.toLowerCase())) {
      throw new BadRequestException('Username is not allowed');
    }

    // Check if taken
    const existing = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      throw new ConflictException('Username is already taken');
    }
  }

  private async validateEmailDomain(email: string): Promise<void> {
    const allowedDomains = ['company.com', 'partner.org'];
    const domain = email.split('@')[1];

    if (!allowedDomains.includes(domain)) {
      throw new BadRequestException(`Email must be from one of: ${allowedDomains.join(', ')}`);
    }

    // Check if taken
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ConflictException('Email is already registered');
    }
  }

  private validateAge(age: number): void {
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - age;

    if (birthYear < 1900) {
      throw new BadRequestException('Invalid age');
    }

    if (age < 18) {
      throw new BadRequestException('You must be at least 18 years old');
    }

    if (age > 120) {
      throw new BadRequestException('Invalid age');
    }
  }

  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.findOne(userId);

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Ensure new password is different
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Hash and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }
}
```

## Frontend Validation

Add client-side validation in React Admin:

```tsx
// UserCreate.tsx
import { useNotify } from 'react-admin';

const validateUsername = (value: string) => {
  if (!value) return 'Required';
  if (value.length < 3) return 'Must be at least 3 characters';
  if (value.length > 20) return 'Must be at most 20 characters';
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    return 'Can only contain letters, numbers, underscores, and hyphens';
  }
  return undefined;
};

const validateEmail = (value: string) => {
  if (!value) return 'Required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Invalid email format';
  }
  if (!/(company\.com|partner\.org)$/.test(value)) {
    return 'Must be from company.com or partner.org';
  }
  return undefined;
};

const validatePassword = (value: string) => {
  if (!value) return 'Required';
  if (value.length < 8) return 'Must be at least 8 characters';
  if (!/(?=.*[a-z])/.test(value)) return 'Must contain lowercase letter';
  if (!/(?=.*[A-Z])/.test(value)) return 'Must contain uppercase letter';
  if (!/(?=.*\d)/.test(value)) return 'Must contain number';
  if (!/(?=.*[@$!%*?&])/.test(value)) return 'Must contain special character';
  return undefined;
};

const validateAge = (value: number) => {
  if (!value) return 'Required';
  if (value < 18) return 'Must be at least 18';
  if (value > 120) return 'Must be realistic';
  return undefined;
};

export const UserCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="username" validate={validateUsername} required />
      <TextInput source="email" type="email" validate={validateEmail} required />
      <TextInput source="password" type="password" validate={validatePassword} required />
      <TextInput source="firstName" required />
      <TextInput source="lastName" required />
      <TextInput source="phone" />
      <NumberInput source="age" validate={validateAge} required />
      <TextInput source="website" />
    </SimpleForm>
  </Create>
);
```

## Testing Validation

Write tests for your validation:

```typescript
// user.service.spec.ts
describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserService, PrismaService],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('register', () => {
    it('should reject blacklisted usernames', async () => {
      const dto = {
        username: 'admin',
        email: 'test@company.com',
        password: 'Test123!@',
        firstName: 'John',
        lastName: 'Doe',
        age: 25,
      };

      await expect(service.register(dto)).rejects.toThrow('Username is not allowed');
    });

    it('should reject invalid email domains', async () => {
      const dto = {
        username: 'testuser',
        email: 'test@invalid.com',
        password: 'Test123!@',
        firstName: 'John',
        lastName: 'Doe',
        age: 25,
      };

      await expect(service.register(dto)).rejects.toThrow('Email must be from one of');
    });

    it('should reject underage users', async () => {
      const dto = {
        username: 'testuser',
        email: 'test@company.com',
        password: 'Test123!@',
        firstName: 'John',
        lastName: 'Doe',
        age: 17,
      };

      await expect(service.register(dto)).rejects.toThrow('You must be at least 18 years old');
    });

    it('should successfully register valid user', async () => {
      const dto = {
        username: 'testuser',
        email: 'test@company.com',
        password: 'Test123!@',
        firstName: 'John',
        lastName: 'Doe',
        age: 25,
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.user, 'create').mockResolvedValue(dto as any);

      const result = await service.register(dto);
      expect(result).toBeDefined();
    });
  });
});
```

## Best Practices

### 1. Layer Your Validation

- **DTO Level** – Format and basic constraints
- **Service Level** – Business rules and database checks
- **Frontend** – User experience and immediate feedback

### 2. Provide Clear Error Messages

```typescript
@Matches(/^[a-zA-Z0-9_-]+$/, {
  message: 'Username can only contain letters, numbers, underscores, and hyphens',
})
username: string;
```

### 3. Use Transformers for Normalization

```typescript
@Transform(({ value }) => value?.trim().toLowerCase())
email: string;
```

### 4. Create Reusable Validators

Don't repeat validation logic—create custom validators.

### 5. Test Edge Cases

Test validation with:

- Empty values
- Boundary values
- Invalid formats
- Null/undefined
- Special characters

## Next Steps

- **[Extending Generated Code](./extending-generated-code.md)** – Advanced patterns
- **[Basic CRUD](./basic-crud.md)** – Start simpler
- **[Field Directives](../guides/field-directives.md)** – Built-in validation
