import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { NOTIFICATIONS_QUEUE } from './constants';
import { NotificationsService } from './notifications.service';
import { NotificationsProducerService } from './producer/producer.service';

@Module({
  imports: [BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE })],
  providers: [NotificationsService, NotificationsProducerService],
  exports: [NotificationsProducerService],
})
export class NotificationsModule {}
