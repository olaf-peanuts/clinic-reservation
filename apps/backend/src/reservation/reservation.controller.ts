import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from '@myorg/shared/dto/create-reservation.dto';
import { UpdateReservationDto } from '@myorg/shared/dto/update-reservation.dto';

@Controller('reservations')
export class ReservationController {
  constructor(private readonly service: ReservationService) {}

  @Post()
  create(@Body() dto: CreateReservationDto) {
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

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReservationDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
