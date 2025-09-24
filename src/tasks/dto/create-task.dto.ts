import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({
    description: 'The title of the task',
    example: 'Finish project report',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    required: false,
    description: 'A detailed description of the task',
    example: 'The report needs to be submitted by EOD.',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
