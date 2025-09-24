import { ApiPropertyOptional } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class TaskQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter tasks by status',
    enum: Status,
  })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiPropertyOptional({
    description: 'Search for tasks by title or description',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
