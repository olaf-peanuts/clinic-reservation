import { Module } from '@nestjs/common';
import { EmailTemplateService } from './email-template.service';
import { EmailTemplateController } from './email-template.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [EmailTemplateService, PrismaService],
  controllers: [EmailTemplateController],
})
export class EmailTemplateModule {}
