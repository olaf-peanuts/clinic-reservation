import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmailTemplateDto } from './email-template.dto';

@Injectable()
export class EmailTemplateService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmailTemplateDto) {
    console.log('[EmailTemplateService.create] Received:', dto);
    try {
      const result = await this.prisma.emailTemplate.create({ 
        data: {
          name: dto.name,
          subject: dto.subject,
          body: dto.bodyHtml,
        }
      });
      console.log('[EmailTemplateService.create] Created successfully:', result);
      return result;
    } catch (error) {
      console.error('[EmailTemplateService.create] Error:', error);
      throw error;
    }
  }

  async findAll() {
    const templates = await this.prisma.emailTemplate.findMany();
    return templates.map(t => ({
      id: t.id,
      name: t.name,
      subject: t.subject,
      bodyHtml: t.body,
    }));
  }

  async findOne(id: number) {
    const template = await this.prisma.emailTemplate.findUnique({ where: { id } });
    if (!template) return null;
    return {
      id: template.id,
      name: template.name,
      subject: template.subject,
      bodyHtml: template.body,
    };
  }

  async update(id: number, dto: Partial<CreateEmailTemplateDto>) {
    const data: any = {};
    if (dto.name) data.name = dto.name;
    if (dto.subject) data.subject = dto.subject;
    if (dto.bodyHtml) data.body = dto.bodyHtml;

    const template = await this.prisma.emailTemplate.update({ where: { id }, data });
    return {
      id: template.id,
      name: template.name,
      subject: template.subject,
      bodyHtml: template.body,
    };
  }

  async remove(id: number) {
    return this.prisma.emailTemplate.delete({ where: { id } });
  }
}
