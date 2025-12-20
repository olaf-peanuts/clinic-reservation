import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SetTimezoneDto } from './set-timezone.dto';

@Injectable()
export class TimezoneService {
  constructor(private readonly prisma: PrismaService) {}

  async set(dto: SetTimezoneDto) {
    return this.prisma.userTimezone.upsert({
      where: { userId: dto.userId },
      update: { timezone: dto.timezone },
      create: { userId: dto.userId, timezone: dto.timezone },
    });
  }

  async get(userId: string) {
    const rec = await this.prisma.userTimezone.findUnique({ where: { userId } });
    return { timezone: rec?.timezone ?? 'UTC' };
  }
}
