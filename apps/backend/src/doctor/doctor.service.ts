import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorDto } from './doctor.dto';

@Injectable()
export class DoctorService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDoctorDto) {
    return this.prisma.doctor.create({
      data: {
        name: dto.name,
        email: dto.email || '',
        azureObjectId: dto.azureObjectId || '',
        honorific: dto.honorific || '医師',
        minDurationMinutes: dto.minDurationMinutes || 5,
        defaultDurationMinutes: dto.defaultDurationMinutes || 30,
        maxDurationMinutes: dto.maxDurationMinutes || 300,
      },
    });
  }

  async findAll() {
    return this.prisma.doctor.findMany();
  }

  async findOne(id: number) {
    return this.prisma.doctor.findUnique({
      where: { id },
    });
  }

  async update(id: number, dto: Partial<CreateDoctorDto>) {
    return this.prisma.doctor.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        azureObjectId: dto.azureObjectId,
        honorific: dto.honorific,
        minDurationMinutes: dto.minDurationMinutes,
        defaultDurationMinutes: dto.defaultDurationMinutes,
        maxDurationMinutes: dto.maxDurationMinutes,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.doctor.delete({ where: { id } });
  }
}
