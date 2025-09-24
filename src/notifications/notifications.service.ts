import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NOTIFICATIONS_QUEUE } from './constants';
import { TaskCompletedJob } from './interfaces/notification.interface';

@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsService extends WorkerHost {
  private readonly logger = new Logger(NotificationsService.name);

  // eslint-disable-next-line @typescript-eslint/require-await
  async process(job: Job<TaskCompletedJob, any, string>) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
    this.logger.log(`Email notification sent for task: ${job.data.message}`);
  }
}
