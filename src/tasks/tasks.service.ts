import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto, user: User) {
    return this.prisma.task.create({
      data: {
        ...createTaskDto,
        ownerId: user.id,
      },
    });
  }

  async findAll(user: User) {
    return this.prisma.task.findMany({
      where: {
        ownerId: user.id,
      },
    });
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

    return this.prisma.task.update({
      where: {
        id: task.id,
      },
      data: updateTaskDto,
    });
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
