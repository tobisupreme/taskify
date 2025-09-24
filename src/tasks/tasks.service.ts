import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Status, User } from '@prisma/client';
import { NotificationsProducerService } from '../notifications/producer/producer.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private notificationsProducer: NotificationsProducerService,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: User) {
    return this.prisma.task.create({
      data: {
        ...createTaskDto,
        ownerId: user.id,
      },
    });
  }

  async findAll(user: User, query: TaskQueryDto) {
    const { page, limit, status, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {
      ownerId: user.id,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [tasks, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number, user: User) {
    const task = await this.prisma.task.findUnique({
      where: {
        id,
      },
    });

    if (!task || task.ownerId !== user.id) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, user: User) {
    const task = await this.findOne(id, user);

    const updatedTask = await this.prisma.task.update({
      where: {
        id: task.id,
      },
      data: updateTaskDto,
    });

    if (updatedTask.status === Status.COMPLETED) {
      await this.notificationsProducer.enqueueTaskCompletedNotification(
        updatedTask,
      );
    }

    return updatedTask;
  }

  async remove(id: number, user: User) {
    const task = await this.findOne(id, user);

    await this.prisma.task.delete({
      where: {
        id: task.id,
      },
    });
  }
}
