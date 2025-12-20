import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmailTemplateDto } from './email-template.dto';

@Injectable()
export class EmailTemplateService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmailTemplateDto) {
    return this.prisma.emailTemplate.create({ data: dto });
  }

  async findAll() {
    return this.prisma.emailTemplate.findMany();
  }

  async findOne(id: string) {
    return this.prisma.emailTemplate.findUnique({ where: { id } });
  }

  async update(id: string, dto: Partial<CreateEmailTemplateDto>) {
    return this.prisma.emailTemplate.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.emailTemplate.delete({ where: { id } });
  }
}
