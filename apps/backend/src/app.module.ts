import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from './prisma/prisma.service';
import { HealthModule } from './health/health.module';
import { DoctorModule } from './doctor/doctor.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    HealthModule,
    DoctorModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
