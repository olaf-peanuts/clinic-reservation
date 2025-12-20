import {
  Controller,
  Get,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import { TimezoneService } from './timezone.service';
import { SetTimezoneDto } from './set-timezone.dto';

@Controller('timezones')
export class TimezoneController {
  constructor(private readonly service: TimezoneService) {}

  @Post()
  set(@Body() dto: SetTimezoneDto) {
    return this.service.set(dto);
  }

  // GET /timezones?userId=xxxx
  @Get()
  get(@Query('userId') userId: string) {
    return this.service.get(userId);
  }
}
