import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SetWorkdaysDto } from './workday.dto';

@Injectable()
export class WorkdayService {
  constructor(private readonly prisma: PrismaService) {}

  async set(dto: SetWorkdaysDto) {
    // 既存を全削除し、渡された配列で再作成
    await this.prisma.workday.deleteMany();
    const creates = dto.daysOfWeek.map((d) => ({ dayOfWeek: d }));
    return this.prisma.workday.createMany({ data: creates });
  }

  async getAll(): Promise<number[]> {
    const days = await this.prisma.workday.findMany();
    return days.map((d) => d.dayOfWeek);
  }
}
