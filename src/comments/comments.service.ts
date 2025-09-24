import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(taskId: number, createCommentDto: CreateCommentDto, user: User) {
    return this.prisma.comment.create({
      data: {
        ...createCommentDto,
        taskId,
        authorId: user.id,
      },
    });
  }

  async findAllForTask(taskId: number, paginationQuery: PaginationQueryDto) {
    const { page, limit } = paginationQuery;
    const skip = (page - 1) * limit;

    const [comments, total] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        where: { taskId },
        skip,
        take: limit,
      }),
      this.prisma.comment.count({ where: { taskId } }),
    ]);

    return {
      data: comments,
      total,
      page,
      limit,
    };
  }
}
