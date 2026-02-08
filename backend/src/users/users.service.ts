import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  private normalizeOptionalStringForCreate(value?: string | null): string | null {
    if (value == null) return null;
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }

  private normalizeOptionalStringForUpdate(
    value?: string | null,
  ): string | null | undefined {
    if (value === undefined) return undefined; // not provided -> don't change
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }

  async setRefreshToken(userId: number, refreshToken: string): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersRepository.update(userId, { hashedRefreshToken });
  }

  async clearRefreshToken(userId: number): Promise<void> {
    await this.usersRepository.update(userId, { hashedRefreshToken: null });
  }

  async findOneWithRefreshToken(id: number): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.hashedRefreshToken')
      .where('user.id = :id', { id })
      .getOne();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check for existing user including soft-deleted ones
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
      withDeleted: true,
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      phone: this.normalizeOptionalStringForCreate(createUserDto.phone),
      address: this.normalizeOptionalStringForCreate(createUserDto.address),
      gender: this.normalizeOptionalStringForCreate(createUserDto.gender),
    });

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'phone',
        'address',
        'gender',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    currentUser: User,
  ): Promise<User> {
    const user = await this.findOne(id);

    // Prevent non-admin users from changing their own role
    if (
      updateUserDto.role &&
      currentUser.role !== UserRole.ADMIN &&
      currentUser.id === id
    ) {
      throw new ForbiddenException('You cannot change your own role');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    updateUserDto.phone = this.normalizeOptionalStringForUpdate(updateUserDto.phone);
    updateUserDto.address = this.normalizeOptionalStringForUpdate(updateUserDto.address);
    updateUserDto.gender = this.normalizeOptionalStringForUpdate(updateUserDto.gender);

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: number, currentUser: User): Promise<void> {
    const user = await this.findOne(id);

    // Prevent users from deleting their own account
    if (currentUser.id === id) {
      throw new ForbiddenException(
        'You cannot delete your own account. Please ask another administrator to delete your account if needed.',
      );
    }

    await this.usersRepository.softDelete(id);
  }
}
