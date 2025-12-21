import { Controller, Get, Put, Body } from '@nestjs/common';
import { ConfigService } from './config.service';

export interface ClinicHour {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface CalendarSettingsDto {
  displayDaysOfWeek?: number[];
  clinicHours?: ClinicHour[];
}

export interface ExaminationRoomsDto {
  numberOfRooms?: number;
}

export interface ScreenSizeDto {
  minScreenWidth?: number;
  minScreenHeight?: number;
}

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get('calendar-settings')
  getCalendarSettings() {
    return this.configService.getCalendarSettings();
  }

  @Put('calendar-settings')
  updateCalendarSettings(@Body() dto: CalendarSettingsDto) {
    return this.configService.updateCalendarSettings(dto);
  }

  @Get('examination-rooms')
  getExaminationRooms() {
    return this.configService.getExaminationRooms();
  }

  @Put('examination-rooms')
  updateExaminationRooms(@Body() dto: ExaminationRoomsDto) {
    return this.configService.updateExaminationRooms(dto);
  }

  @Get('doctor-default-duration')
  getDoctorDefaultDuration() {
    return this.configService.getDoctorDefaultDuration();
  }

  @Put('doctor-default-duration')
  updateDoctorDefaultDuration(@Body() dto: { defaultDurationMinutes?: number }) {
    return this.configService.updateDoctorDefaultDuration(dto);
  }

  @Get('screen-size')
  getScreenSize() {
    return this.configService.getScreenSize();
  }

  @Put('screen-size')
  updateScreenSize(@Body() dto: ScreenSizeDto) {
    return this.configService.updateScreenSize(dto);
  }
}
