import { Module } from '@nestjs/common';
import { WorkdayService } from './workday.service';
import { WorkdayController } from './workday.controller';

@Module({
  providers: [WorkdayService],
  controllers: [WorkdayController],
})
export class WorkdayModule {}
