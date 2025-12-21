import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CalendarSettingsDto {
  displayDaysOfWeek?: number[];
}

export interface ExaminationRoomsDto {
  numberOfRooms?: number;
}

@Injectable()
export class ConfigService {
  // メモリ上での設定管理（本来はデータベース)
  private calendarSettings = { displayDaysOfWeek: [0, 1, 2, 3, 4, 5, 6] };
  private examinationRooms = { numberOfRooms: 1 };
  private doctorDefaultDuration = { defaultDurationMinutes: 30 };

  constructor(private readonly prisma: PrismaService) {}

  getCalendarSettings() {
    return this.calendarSettings;
  }

  updateCalendarSettings(dto: CalendarSettingsDto) {
    if (dto.displayDaysOfWeek !== undefined) {
      this.calendarSettings.displayDaysOfWeek = dto.displayDaysOfWeek;
    }
    return this.calendarSettings;
  }

  getExaminationRooms() {
    return this.examinationRooms;
  }

  updateExaminationRooms(dto: ExaminationRoomsDto) {
    if (dto.numberOfRooms !== undefined) {
      this.examinationRooms.numberOfRooms = dto.numberOfRooms;
    }
    return this.examinationRooms;
  }

  getDoctorDefaultDuration() {
    return this.doctorDefaultDuration;
  }

  updateDoctorDefaultDuration(dto: { defaultDurationMinutes?: number }) {
    if (dto.defaultDurationMinutes !== undefined) {
      this.doctorDefaultDuration.defaultDurationMinutes = dto.defaultDurationMinutes;
    }
    return this.doctorDefaultDuration;
  }
}
