import { Controller, Get, Post, Body } from '@nestjs/common';
import { WorkdayService } from './workday.service';
import { SetWorkdaysDto } from './workday.dto';

@Controller('schedules/days')
export class WorkdayController {
  constructor(private readonly service: WorkdayService) {}

  @Post()
  set(@Body() dto: SetWorkdaysDto) {
    return this.service.set(dto);
  }

  @Get()
  getAll() {
    return this.service.getAll();
  }
}
