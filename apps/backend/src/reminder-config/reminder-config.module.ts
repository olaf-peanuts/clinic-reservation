import { Module } from '@nestjs/common';
import { ReminderConfigService } from './reminder-config.service';
import { ReminderConfigController } from './reminder-config.controller';

@Module({
  providers: [ReminderConfigService],
  controllers: [ReminderConfigController],
})
export class ReminderConfigModule {}
