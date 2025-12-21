import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

@Injectable()
export class ConfigService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateConfig() {
    let config = await this.prisma.systemConfig.findFirst();
    if (!config) {
      config = await this.prisma.systemConfig.create({
        data: {
          displayDaysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          clinicHours: [
            { dayOfWeek: 0, startTime: '09:00', endTime: '18:00' },
            { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
            { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
            { dayOfWeek: 3, startTime: '09:00', endTime: '18:00' },
            { dayOfWeek: 4, startTime: '09:00', endTime: '18:00' },
            { dayOfWeek: 5, startTime: '09:00', endTime: '18:00' },
            { dayOfWeek: 6, startTime: '09:00', endTime: '18:00' },
          ],
          numberOfExaminationRooms: 1,
          doctorDefaultDurationMinutes: 30,
          minScreenWidth: 1024,
          minScreenHeight: 768,
        },
      });
    }
    return config;
  }

  async getCalendarSettings() {
    const config = await this.getOrCreateConfig();
    return {
      displayDaysOfWeek: config.displayDaysOfWeek,
      clinicHours: config.clinicHours as ClinicHour[],
    };
  }

  async updateCalendarSettings(dto: CalendarSettingsDto) {
    const config = await this.getOrCreateConfig();
    const updatedConfig = await this.prisma.systemConfig.update({
      where: { id: config.id },
      data: {
        ...(dto.displayDaysOfWeek !== undefined && { displayDaysOfWeek: dto.displayDaysOfWeek }),
        ...(dto.clinicHours !== undefined && { clinicHours: dto.clinicHours }),
      },
    });
    return {
      displayDaysOfWeek: updatedConfig.displayDaysOfWeek,
      clinicHours: updatedConfig.clinicHours as ClinicHour[],
    };
  }

  async getExaminationRooms() {
    const config = await this.getOrCreateConfig();
    return { numberOfRooms: config.numberOfExaminationRooms };
  }

  async updateExaminationRooms(dto: ExaminationRoomsDto) {
    const config = await this.getOrCreateConfig();
    const updatedConfig = await this.prisma.systemConfig.update({
      where: { id: config.id },
      data: {
        ...(dto.numberOfRooms !== undefined && { numberOfExaminationRooms: dto.numberOfRooms }),
      },
    });
    return { numberOfRooms: updatedConfig.numberOfExaminationRooms };
  }

  async getDoctorDefaultDuration() {
    const config = await this.getOrCreateConfig();
    return { defaultDurationMinutes: config.doctorDefaultDurationMinutes };
  }

  async updateDoctorDefaultDuration(dto: { defaultDurationMinutes?: number }) {
    const config = await this.getOrCreateConfig();
    const updatedConfig = await this.prisma.systemConfig.update({
      where: { id: config.id },
      data: {
        ...(dto.defaultDurationMinutes !== undefined && { doctorDefaultDurationMinutes: dto.defaultDurationMinutes }),
      },
    });
    return { defaultDurationMinutes: updatedConfig.doctorDefaultDurationMinutes };
  }

  async getScreenSize() {
    const config = await this.getOrCreateConfig();
    return {
      minScreenWidth: config.minScreenWidth,
      minScreenHeight: config.minScreenHeight,
    };
  }

  async updateScreenSize(dto: ScreenSizeDto) {
    const config = await this.getOrCreateConfig();
    const updatedConfig = await this.prisma.systemConfig.update({
      where: { id: config.id },
      data: {
        ...(dto.minScreenWidth !== undefined && { minScreenWidth: dto.minScreenWidth }),
        ...(dto.minScreenHeight !== undefined && { minScreenHeight: dto.minScreenHeight }),
      },
    });
    return {
      minScreenWidth: updatedConfig.minScreenWidth,
      minScreenHeight: updatedConfig.minScreenHeight,
    };
  }
}
