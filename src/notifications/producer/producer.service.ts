import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Task } from '@prisma/client';
import { Queue } from 'bullmq';
import { JOBS, NOTIFICATIONS_QUEUE } from '../constants';

@Injectable()
export class NotificationsProducerService {
  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE) private notificationsQueue: Queue,
  ) {}

  async enqueueTaskCompletedNotification(task: Task) {
    await this.notificationsQueue.add(
      JOBS.TASK_COMPLETED,
      {
        message: `Task "${task.title}" was completed.`,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );
  }
}
