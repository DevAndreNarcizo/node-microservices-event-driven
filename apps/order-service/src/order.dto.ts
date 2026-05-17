import { IsEmail, IsInt, Min } from 'class-validator';

export class CreateOrderDto {
  @IsEmail()
  customerEmail!: string;

  @IsInt()
  @Min(1)
  totalCents!: number;
}
