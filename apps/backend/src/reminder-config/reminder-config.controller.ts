import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ReminderConfigService } from './reminder-config.service';
import { CreateReminderDto } from './create-reminder.dto';

@Controller('reminders')
export class ReminderConfigController {
  constructor(private readonly service: ReminderConfigService) {}

  @Post()
  create(@Body() dto: CreateReminderDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
