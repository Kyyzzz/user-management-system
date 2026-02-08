import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../src/users/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clear users before each test (including soft-deleted ones)
    await userRepository.query('DELETE FROM users');

    // Create admin and regular user for tests
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await userRepository.save({
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    });

    await userRepository.save({
      email: 'user@example.com',
      password: hashedPassword,
      firstName: 'Regular',
      lastName: 'User',
      role: UserRole.USER,
    });

    // Get tokens
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' });
    adminToken = adminResponse.body.access_token;

    const userResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'password123' });
    userToken = userResponse.body.access_token;
  });

  describe('/users (GET)', () => {
    it('should return all users with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });
  });

  describe('/users (POST)', () => {
    it('should create user as admin', async () => {
      const newUser = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.USER,
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser)
        .expect(201);

      expect(response.body.email).toBe(newUser.email);
      expect(response.body.firstName).toBe(newUser.firstName);
    });

    it('should return 403 when regular user tries to create user', async () => {
      const newUser = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newUser)
        .expect(403);
    });

    it('should return 409 when email already exists', async () => {
      const duplicateUser = {
        email: 'admin@example.com',
        password: 'password123',
        firstName: 'Duplicate',
        lastName: 'User',
      };

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateUser)
        .expect(409);
    });
  });

  describe('/users/:id (GET)', () => {
    it('should return user by id', async () => {
      const users = await userRepository.find();
      const userId = users[0].id;

      const response = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.id).toBe(userId);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .get('/users/999999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('/users/:id (PATCH)', () => {
    it('should update user as admin', async () => {
      const users = await userRepository.find();
      const userId = users[0].id;

      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const response = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.firstName).toBe(updateData.firstName);
      expect(response.body.lastName).toBe(updateData.lastName);
    });

    it('should return 403 when regular user tries to update', async () => {
      const users = await userRepository.find();
      const userId = users[0].id;

      await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ firstName: 'Updated' })
        .expect(403);
    });
  });

  describe('/users/:id (DELETE)', () => {
    it('should soft delete user as admin', async () => {
      const users = await userRepository.find();
      const userId = users[1].id; // Don't delete the admin

      await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // User should not be found in normal queries (soft deleted)
      const deletedUser = await userRepository.findOne({ where: { id: userId } });
      expect(deletedUser).toBeNull();

      // But should exist when including soft-deleted records
      const softDeletedUser = await userRepository.findOne({
        where: { id: userId },
        withDeleted: true,
      });
      expect(softDeletedUser).not.toBeNull();
      expect(softDeletedUser!.deletedAt).toBeDefined();
    });

    it('should return 403 when regular user tries to delete', async () => {
      const users = await userRepository.find();
      const userId = users[0].id;

      await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return 403 when admin tries to delete their own account', async () => {
      const adminUser = await userRepository.findOne({ 
        where: { email: 'admin@example.com' } 
      });

      const response = await request(app.getHttpServer())
        .delete(`/users/${adminUser!.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      expect(response.body.message).toContain('cannot delete your own account');
    });
  });
});
