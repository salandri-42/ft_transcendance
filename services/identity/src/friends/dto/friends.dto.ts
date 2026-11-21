import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class AcceptInviteDto {
	@IsString()
	@IsNotEmpty()
	@Length(6, 6)
	@Matches(/^[A-Z0-9]+$/)
	token!: string;
}
