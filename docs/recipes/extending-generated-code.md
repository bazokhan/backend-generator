---
title: Extending Generated Code
---

# Extending Generated Code Recipe

Advanced patterns for extending auto-generated code while maintaining regeneration safety.

## Philosophy

TGraph Backend Generator follows a **separation of concerns** where:

- `.tg.*` files = Auto-generated, safe to overwrite
- Custom files = Your business logic, preserved forever

This recipe shows real-world patterns for extension.

## Pattern 1: Service Extension with Business Logic

### Scenario: E-commerce Order System

**Generated Service:**

```typescript
// order.tg.service.ts (auto-generated)
@Injectable()
export class OrderTgService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderTgDto): Promise<Order> {
    return this.prisma.order.create({ data: dto });
  }

  async findAll(query: PaginationSearchDto): Promise<PaginatedResponse<Order>> {
    // ... pagination logic
  }

  async update(id: string, dto: UpdateOrderTgDto): Promise<Order> {
    return this.prisma.order.update({ where: { id }, data: dto });
  }
}
```

**Extended Service:**

```typescript
// order.service.ts (your custom service)
import { OrderTgService } from './order.tg.service';
import { EmailService } from '@/infrastructure/email/email.service';
import { PaymentService } from '@/infrastructure/payment/payment.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class OrderService extends OrderTgService {
  constructor(
    prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly paymentService: PaymentService,
    private readonly inventoryService: InventoryService,
  ) {
    super(prisma);
  }

  // Override create to add order processing workflow
  async create(dto: CreateOrderTgDto): Promise<Order> {
    // Start transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Check inventory
      await this.inventoryService.checkAvailability(dto.items);

      // 2. Create order
      const order = await super.create(dto);

      // 3. Reserve inventory
      await this.inventoryService.reserve(order.id, dto.items);

      // 4. Send confirmation email
      await this.emailService.sendOrderConfirmation(order);

      return order;
    });
  }

  // Custom method: Process payment
  async processPayment(orderId: string, paymentMethod: PaymentMethod): Promise<Order> {
    const order = await this.findOne(orderId);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order cannot be paid');
    }

    // Process payment
    const payment = await this.paymentService.charge({
      amount: order.total,
      method: paymentMethod,
      orderId: order.id,
    });

    // Update order
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PAID,
        paidAt: new Date(),
        paymentId: payment.id,
      },
    });
  }

  // Custom method: Cancel order
  async cancel(orderId: string, reason: string): Promise<Order> {
    const order = await this.findOne(orderId);

    if (order.status === OrderStatus.SHIPPED) {
      throw new BadRequestException('Cannot cancel shipped order');
    }

    // Release inventory
    await this.inventoryService.release(orderId);

    // Refund if paid
    if (order.status === OrderStatus.PAID) {
      await this.paymentService.refund(order.paymentId);
    }

    // Update order
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });

    // Send notification
    await this.emailService.sendOrderCancellation(updatedOrder);

    return updatedOrder;
  }

  // Custom method: Get user orders with stats
  async getUserOrders(userId: string): Promise<{
    orders: Order[];
    stats: OrderStats;
  }> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    const stats = {
      total: orders.length,
      pending: orders.filter((o) => o.status === OrderStatus.PENDING).length,
      paid: orders.filter((o) => o.status === OrderStatus.PAID).length,
      shipped: orders.filter((o) => o.status === OrderStatus.SHIPPED).length,
      totalSpent: orders.reduce((sum, o) => sum + o.total, 0),
    };

    return { orders, stats };
  }
}
```

## Pattern 2: Controller Extension with Custom Endpoints

**Generated Controller:**

```typescript
// order.tg.controller.ts (auto-generated)
@Controller('tg-api/orders')
@UseGuards(JwtAuthGuard, AdminGuard)
export class OrderTgController {
  constructor(private readonly orderService: OrderTgService) {}

  @Get()
  async findAll(@Query() query: PaginationSearchDto) {
    return this.orderService.findAll(query);
  }

  @Post()
  async create(@Body() dto: CreateOrderTgDto) {
    return this.orderService.create(dto);
  }

  // ... other CRUD endpoints
}
```

**Custom Controller:**

```typescript
// order.controller.ts (your custom controller)
import { OrderService } from './order.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // User-facing endpoints (not admin-only)

  @Get('my-orders')
  async getMyOrders(@CurrentUser() user: User) {
    return this.orderService.getUserOrders(user.id);
  }

  @Post()
  async create(@CurrentUser() user: User, @Body() dto: CreateOrderDto) {
    return this.orderService.create({
      ...dto,
      userId: user.id,
    });
  }

  @Put(':id/pay')
  async pay(@Param('id') orderId: string, @Body() dto: PaymentDto, @CurrentUser() user: User) {
    const order = await this.orderService.findOne(orderId);

    // Verify ownership
    if (order.userId !== user.id) {
      throw new ForbiddenException('Not your order');
    }

    return this.orderService.processPayment(orderId, dto.paymentMethod);
  }

  @Put(':id/cancel')
  async cancel(@Param('id') orderId: string, @Body() dto: CancelOrderDto, @CurrentUser() user: User) {
    const order = await this.orderService.findOne(orderId);

    // Verify ownership
    if (order.userId !== user.id) {
      throw new ForbiddenException('Not your order');
    }

    return this.orderService.cancel(orderId, dto.reason);
  }

  @Get(':id/track')
  async track(@Param('id') orderId: string, @CurrentUser() user: User) {
    const order = await this.orderService.findOne(orderId);

    // Verify ownership
    if (order.userId !== user.id) {
      throw new ForbiddenException('Not your order');
    }

    return this.orderService.getTrackingInfo(orderId);
  }
}
```

Now you have:

- `/tg-api/orders` – Admin CRUD endpoints
- `/orders` – User-facing custom endpoints

## Pattern 3: DTO Composition

**Generated DTOs:**

```typescript
// create-order.tg.dto.ts (auto-generated)
export class CreateOrderTgDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @IsNotEmpty()
  total: number;

  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;
}
```

**Custom DTOs:**

```typescript
// create-order.dto.ts (user-facing)
export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  @Max(100)
  quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @ArrayMinSize(1)
  items: OrderItemDto[];

  @IsString()
  @IsNotEmpty()
  shippingAddress: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

// payment.dto.ts
export class PaymentDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsString()
  @IsOptional()
  cardToken?: string;
}

// cancel-order.dto.ts
export class CancelOrderDto {
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason: string;
}
```

## Pattern 4: Event-Driven Architecture

Add events to your service:

```typescript
// order.service.ts
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class OrderService extends OrderTgService {
  constructor(
    prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super(prisma);
  }

  async create(dto: CreateOrderTgDto): Promise<Order> {
    const order = await super.create(dto);

    // Emit event
    this.eventEmitter.emit('order.created', {
      orderId: order.id,
      userId: order.userId,
      total: order.total,
    });

    return order;
  }

  async processPayment(orderId: string, paymentMethod: PaymentMethod): Promise<Order> {
    const order = await this.paymentProcessing(orderId, paymentMethod);

    // Emit event
    this.eventEmitter.emit('order.paid', {
      orderId: order.id,
      userId: order.userId,
      total: order.total,
      paymentMethod,
    });

    return order;
  }
}

// Listeners
@Injectable()
export class OrderEventsListener {
  constructor(
    private readonly emailService: EmailService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @OnEvent('order.created')
  async handleOrderCreated(payload: OrderCreatedEvent) {
    await this.emailService.sendOrderConfirmation(payload.orderId);
    await this.analyticsService.trackOrder(payload);
  }

  @OnEvent('order.paid')
  async handleOrderPaid(payload: OrderPaidEvent) {
    await this.emailService.sendPaymentReceipt(payload.orderId);
    await this.analyticsService.trackRevenue(payload);
  }
}
```

## Pattern 5: Interceptors and Middleware

Add cross-cutting concerns:

```typescript
// logging.interceptor.ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, body } = req;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log({
          method,
          url,
          duration: Date.now() - now,
          body: JSON.stringify(body),
        });
      }),
    );
  }
}

// Use in controller
@Controller('orders')
@UseInterceptors(LoggingInterceptor)
export class OrderController {
  // All endpoints will be logged
}
```

## Pattern 6: Dashboard Customization

**Generated Component:**

```tsx
// OrderList.tsx (auto-generated)
export const OrderList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="orderNumber" />
      <NumberField source="total" />
      <TextField source="status" />
      <DateField source="createdAt" />
      <EditButton />
    </Datagrid>
  </List>
);
```

**Custom Component:**

```tsx
// OrderListCustom.tsx (your custom component)
import { Chip } from '@mui/material';

const OrderStatusField = ({ source }: { source: string }) => {
  const record = useRecordContext();
  const status = record?.[source];

  const colors = {
    PENDING: 'warning',
    PAID: 'info',
    SHIPPED: 'success',
    DELIVERED: 'success',
    CANCELLED: 'error',
  };

  return <Chip label={status} color={colors[status] || 'default'} size="small" />;
};

const OrderFilters = [
  <TextInput source="q" label="Search" alwaysOn />,
  <SelectInput
    source="status"
    choices={[
      { id: 'PENDING', name: 'Pending' },
      { id: 'PAID', name: 'Paid' },
      { id: 'SHIPPED', name: 'Shipped' },
      { id: 'DELIVERED', name: 'Delivered' },
      { id: 'CANCELLED', name: 'Cancelled' },
    ]}
  />,
  <DateInput source="createdFrom" label="From" />,
  <DateInput source="createdTo" label="To" />,
  <NumberInput source="minTotal" label="Min Total" />,
];

const BulkActions = () => (
  <>
    <BulkExportButton />
    <BulkUpdateButton data={% raw %}{{ status: 'SHIPPED' }}{% endraw %} label="Mark as Shipped" mutationMode="pessimistic" />
  </>
);

export const OrderListCustom = () => (
  <List filters={OrderFilters} sort={% raw %}{{ field: 'createdAt', order: 'DESC' }}{% endraw %}>
    <Datagrid rowClick="show" bulkActionButtons={<BulkActions />}>
      <TextField source="orderNumber" />
      <ReferenceField source="userId" reference="users">
        <TextField source="name" />
      </ReferenceField>
      <NumberField source="total" options={% raw %}{{ style: 'currency', currency: 'USD' }}{% endraw %} />
      <OrderStatusField source="status" />
      <DateField source="createdAt" showTime />
      <DateField source="paidAt" showTime />
      <ShowButton />
      <EditButton />
    </Datagrid>
  </List>
);
```

Update `App.tsx`:

```tsx
<Resource
  name="orders"
  list={OrderListCustom} // Use custom component
  edit={OrderEdit}
  create={OrderCreate}
  show={OrderShow}
/>
```

## Pattern 7: Middleware Chain

Add request/response processing:

```typescript
// order.module.ts
export class OrderModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware, RateLimitMiddleware, RequestIdMiddleware)
      .forRoutes(OrderController, OrderTgController);
  }
}
```

## Pattern 8: Guards and Policies

Add authorization logic:

```typescript
// order-ownership.guard.ts
@Injectable()
export class OrderOwnershipGuard implements CanActivate {
  constructor(private readonly orderService: OrderService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const orderId = request.params.id;

    if (!orderId) return true; // Not a single-resource route

    const order = await this.orderService.findOne(orderId);

    // Admin can access all
    if (user.role === 'ADMIN') return true;

    // User can only access their own
    return order.userId === user.id;
  }
}

// Use in controller
@Controller('orders')
@UseGuards(JwtAuthGuard, OrderOwnershipGuard)
export class OrderController {
  // All endpoints check ownership
}
```

## Pattern 9: Response Transformation

Add response DTOs:

```typescript
// order-response.dto.ts
export class OrderResponseDto {
  id: string;
  orderNumber: string;
  total: number;
  status: OrderStatus;
  items: OrderItemResponseDto[];
  user: UserSummaryDto;
  createdAt: Date;
  paidAt?: Date;
  shippedAt?: Date;

  static fromEntity(order: Order & { items: OrderItem[], user: User }): OrderResponseDto {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.status,
      items: order.items.map(OrderItemResponseDto.fromEntity),
      user: UserSummaryDto.fromEntity(order.user),
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      shippedAt: order.shippedAt,
    };
  }
}

// Use in controller
@Get(':id')
async findOne(@Param('id') id: string): Promise<OrderResponseDto> {
  const order = await this.orderService.findOne(id);
  return OrderResponseDto.fromEntity(order);
}
```

## Pattern 10: Testing Custom Extensions

```typescript
// order.service.spec.ts
describe('OrderService', () => {
  let service: OrderService;
  let emailService: EmailService;
  let paymentService: PaymentService;
  let inventoryService: InventoryService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EmailService,
          useValue: {
            sendOrderConfirmation: jest.fn(),
            sendOrderCancellation: jest.fn(),
          },
        },
        {
          provide: PaymentService,
          useValue: {
            charge: jest.fn(),
            refund: jest.fn(),
          },
        },
        {
          provide: InventoryService,
          useValue: {
            checkAvailability: jest.fn(),
            reserve: jest.fn(),
            release: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    emailService = module.get<EmailService>(EmailService);
    paymentService = module.get<PaymentService>(PaymentService);
    inventoryService = module.get<InventoryService>(InventoryService);
  });

  describe('create', () => {
    it('should create order with full workflow', async () => {
      const dto = { userId: 'user1', items: [...], total: 100 };

      jest.spyOn(inventoryService, 'checkAvailability').mockResolvedValue(true);
      jest.spyOn(inventoryService, 'reserve').mockResolvedValue(undefined);
      jest.spyOn(emailService, 'sendOrderConfirmation').mockResolvedValue(undefined);

      const order = await service.create(dto);

      expect(inventoryService.checkAvailability).toHaveBeenCalledWith(dto.items);
      expect(inventoryService.reserve).toHaveBeenCalled();
      expect(emailService.sendOrderConfirmation).toHaveBeenCalled();
      expect(order).toBeDefined();
    });
  });

  describe('cancel', () => {
    it('should cancel order and refund', async () => {
      const order = {
        id: '1',
        status: OrderStatus.PAID,
        paymentId: 'pay123'
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(order as any);
      jest.spyOn(paymentService, 'refund').mockResolvedValue(undefined);

      await service.cancel('1', 'Changed mind');

      expect(paymentService.refund).toHaveBeenCalledWith('pay123');
      expect(inventoryService.release).toHaveBeenCalledWith('1');
    });
  });
});
```

## Best Practices

### 1. Never Edit `.tg.*` Files

Always extend, never modify generated files.

### 2. Use Clear Naming

- `OrderService` (custom) extends `OrderTgService` (generated)
- `OrderController` (custom) alongside `OrderTgController` (generated)

### 3. Separate Concerns

- Generated = CRUD
- Custom = Business logic

### 4. Document Custom Logic

Add clear comments explaining why custom logic exists.

### 5. Test Custom Extensions

Focus tests on your custom logic, not generated CRUD.

## Next Steps

- **[Custom Validation](./custom-validation.md)** – Validation patterns
- **[File Uploads](./file-uploads.md)** – Upload handling
- **[Customization Guide](../guides/customization.md)** – More patterns
