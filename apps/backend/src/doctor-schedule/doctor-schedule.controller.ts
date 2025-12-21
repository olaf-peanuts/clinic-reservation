import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { DoctorScheduleService } from './doctor-schedule.service';
import { CreateDoctorScheduleDto } from './dto/create-doctor-schedule.dto';

@Controller('doctor-schedules')
export class DoctorScheduleController {
  constructor(private doctorScheduleService: DoctorScheduleService) {}

  @Post()
  async create(@Body() dto: CreateDoctorScheduleDto) {
    return this.doctorScheduleService.create(dto);
  }

  @Get()
  async findAll(@Query('doctorId') doctorId?: string) {
    return this.doctorScheduleService.findAll(
      doctorId ? parseInt(doctorId) : undefined,
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.doctorScheduleService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateDoctorScheduleDto>,
  ) {
    return this.doctorScheduleService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.doctorScheduleService.delete(id);
  }
}
