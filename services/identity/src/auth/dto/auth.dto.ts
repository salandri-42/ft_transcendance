import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
	IsStrongPassword
} from 'class-validator';


export class RegisterDto
{
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword(
		{
			minLength: 8,
			minLowercase: 1,
			minUppercase: 1,
			minNumbers: 1,
			minSymbols: 1,
		}
	)
  password!: string;
}

export class LoginDto
{

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString() 
  @IsNotEmpty()
  @IsStrongPassword(
		{
			minLength: 8,
			minLowercase: 1,
			minUppercase: 1,
			minNumbers: 1,
			minSymbols: 1,
		}
	)
  password!: string;
}

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refresh_token!: string;
}

export class TwoFaVerifyDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;
}

export class UpdateProfileDto {
  @IsString()
  @MinLength(3)
  @IsNotEmpty()
  username?: string;

  @IsString()
  displayName?: string;

  @IsString()
  avatarUrl?: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  newPassword!: string;
}
