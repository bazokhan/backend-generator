import { PrismaClient } from '../src/generated/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user (password hashed so bcrypt.compare works in auth service)
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@example.com',
      password: adminPassword,
    },
  });

  console.log('✅ Created user:', admin.email);
  console.log('\nSeed complete!');
  console.log('Login at http://localhost:5173 with:');
  console.log('  Email:    admin@example.com');
  console.log('  Password: admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
