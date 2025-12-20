import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReminderDto } from './create-reminder.dto';

@Injectable()
export class ReminderConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReminderDto) {
    return this.prisma.reminderConfig.create({ data: dto });
  }

  async findAll() {
    return this.prisma.reminderConfig.findMany();
  }

  async remove(id: string) {
    return this.prisma.reminderConfig.delete({ where: { id } });
  }
}
