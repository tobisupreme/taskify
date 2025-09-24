import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateTaskDto {
  @ApiProperty({
    required: false,
    description: 'The new title of the task',
    example: 'Finalize project report',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    required: false,
    description: 'The new description of the task',
    example: 'The report must include Q3 data.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    required: false,
    enum: Status,
    description: 'The new status of the task',
    example: 'IN_PROGRESS',
  })
  @IsEnum(Status)
  @IsOptional()
  status?: Status;
}
