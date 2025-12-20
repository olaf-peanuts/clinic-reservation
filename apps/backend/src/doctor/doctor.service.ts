import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorDto } from './doctor.dto';

@Injectable()
export class DoctorService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDoctorDto) {
    // 従業員情報は別途作成済みと仮定（employeeId が外部キーになる）
    // ここでは簡易的に employee を同時作成しない実装
    return this.prisma.doctor.create({ data: dto as any });
  }

  async findAll() {
    return this.prisma.doctor.findMany({
      include: { employee: true, schedules: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.doctor.findUnique({
      where: { id },
      include: { employee: true, schedules: true },
    });
  }

  async update(id: string, dto: Partial<CreateDoctorDto>) {
    return this.prisma.doctor.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    return this.prisma.doctor.delete({ where: { id } });
  }
}
