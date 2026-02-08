import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  Matches,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @Transform(({ value }) => {
    if (value === undefined || value === null) return value;
    const trimmed = String(value).trim();
    return trimmed.length === 0 ? null : trimmed;
  })
  @Matches(/^09\d{9}$/, {
    message: 'Phone number must be a valid Philippine mobile number (e.g., 09211231162)',
  })
  @IsOptional()
  phone?: string | null;

  @Transform(({ value }) => {
    if (value === undefined || value === null) return value;
    const trimmed = String(value).trim();
    return trimmed.length === 0 ? null : trimmed;
  })
  @IsString()
  @IsOptional()
  address?: string | null;

  @Transform(({ value }) => {
    if (value === undefined || value === null) return value;
    const trimmed = String(value).trim();
    return trimmed.length === 0 ? null : trimmed;
  })
  @IsString()
  @IsOptional()
  gender?: string | null;
}
