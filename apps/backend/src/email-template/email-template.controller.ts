import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { EmailTemplateService } from './email-template.service';
import { CreateEmailTemplateDto } from './email-template.dto';

@Controller('templates')
export class EmailTemplateController {
  constructor(private readonly service: EmailTemplateService) {}

  @Post()
  async create(@Body() dto: CreateEmailTemplateDto) {
    const result = await this.service.create(dto);
    return {
      id: result.id,
      name: result.name,
      subject: result.subject,
      bodyHtml: result.body,
    };
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(parseInt(id));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateEmailTemplateDto>) {
    const result = await this.service.update(parseInt(id), dto);
    return result;
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() dto: Partial<CreateEmailTemplateDto>) {
    const result = await this.service.update(parseInt(id), dto);
    return result;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(parseInt(id));
  }
}
