import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { NurseService } from './nurse.service';
import { CreateNurseDto } from './create-nurse.dto';

@Controller('nurses')
export class NurseController {
  constructor(private readonly service: NurseService) {}

  @Post()
  create(@Body() dto: CreateNurseDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
