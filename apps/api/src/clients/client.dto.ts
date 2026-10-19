import { Type } from 'class-transformer';
import { IsBooleanString, IsEmail, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

export class ContactInfoDto {
  @IsOptional() @IsString() @MaxLength(80) contactName?: string;
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MaxLength(1000) note?: string;
}

export class CreateClientDto {
  @IsString() @MaxLength(120)
  name: string;

  @IsOptional() @IsString()
  logo?: string;

  @IsOptional() @ValidateNested() @Type(() => ContactInfoDto)
  contactInfo?: ContactInfoDto;
}

export class UpdateClientDto {
  @IsOptional() @IsString() @MaxLength(120)
  name?: string;

  @IsOptional() @IsString()
  logo?: string;

  @IsOptional() @ValidateNested() @Type(() => ContactInfoDto)
  contactInfo?: ContactInfoDto;
}

export class ListClientsQuery {
  /** "true" để xem cả khách đã lưu trữ */
  @IsOptional() @IsBooleanString()
  includeArchived?: string;
}
