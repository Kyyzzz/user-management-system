import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    // Create admin user
    const admin = await usersService.create({
      email: 'admin@example.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    });
    console.log('Admin user created:', admin.email);

    // Create regular user
    const user = await usersService.create({
      email: 'user@example.com',
      password: 'user123',
      firstName: 'Regular',
      lastName: 'User',
      role: UserRole.USER,
    });
    console.log('Regular user created:', user.email);

    console.log('\nSeed completed successfully!');
    console.log('\nTest credentials:');
    console.log('Admin - Email: admin@example.com, Password: admin123');
    console.log('User  - Email: user@example.com, Password: user123');
  } catch (error) {
    console.error('Seed failed:', error.message);
  } finally {
    await app.close();
  }
}

seed();
