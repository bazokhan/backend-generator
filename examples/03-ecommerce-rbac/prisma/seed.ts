import { PrismaClient } from '../generated/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      id: 'seed-admin-id',
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('Created admin:', admin.email);

  // Create categories
  const electronics = await prisma.category.upsert({
    where: { name: 'Electronics' },
    update: {},
    create: { id: 'cat-electronics', name: 'Electronics' },
  });

  const clothing = await prisma.category.upsert({
    where: { name: 'Clothing' },
    update: {},
    create: { id: 'cat-clothing', name: 'Clothing' },
  });

  console.log('Created categories:', electronics.name, clothing.name);

  // Create products
  await prisma.product.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'prod-1',
        name: 'Laptop Pro 15"',
        description: 'High-performance laptop for professionals',
        price: 1299.99,
        stock: 50,
        categoryId: electronics.id,
      },
      {
        id: 'prod-2',
        name: 'Wireless Headphones',
        description: 'Noise-cancelling over-ear headphones',
        price: 249.99,
        stock: 100,
        categoryId: electronics.id,
      },
      {
        id: 'prod-3',
        name: 'Classic T-Shirt',
        description: '100% cotton unisex t-shirt',
        price: 29.99,
        stock: 200,
        categoryId: clothing.id,
      },
    ],
  });

  console.log('Created products');
  console.log('\nSeed complete!');
  console.log('Login at http://localhost:5173 with:');
  console.log('  Email: admin@example.com');
  console.log('  Password: admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
