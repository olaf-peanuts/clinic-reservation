import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorScheduleDto } from './dto/create-doctor-schedule.dto';

@Injectable()
export class DoctorScheduleService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDoctorScheduleDto) {
    return this.prisma.doctorSchedule.create({
      data: {
        doctorId: dto.doctorId,
        date: dto.date,
        timePeriods: dto.timePeriods,
      },
      include: {
        doctor: true,
      },
    });
  }

  async findAll(doctorId?: number) {
    const where = doctorId ? { doctorId } : {};
    return this.prisma.doctorSchedule.findMany({
      where,
      include: {
        doctor: true,
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findById(id: string) {
    return this.prisma.doctorSchedule.findUnique({
      where: { id },
      include: {
        doctor: true,
      },
    });
  }

  async update(id: string, dto: Partial<CreateDoctorScheduleDto>) {
    return this.prisma.doctorSchedule.update({
      where: { id },
      data: {
        ...dto,
      },
      include: {
        doctor: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.doctorSchedule.delete({
      where: { id },
    });
  }
}
