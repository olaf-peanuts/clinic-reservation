import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from './prisma/prisma.service';

// 各機能モジュール
import { EmployeeModule } from './employee/employee.module';
import { DoctorModule } from './doctor/doctor.module';
import { NurseModule } from './nurse/nurse.module';
import { ReservationModule } from './reservation/reservation.module';
import { WorkdayModule } from './workday/workday.module';
import { EmailTemplateModule } from './email-template/email-template.module';
import { ReminderConfigModule } from './reminder-config/reminder-config.module';
import { TimezoneModule } from './timezone/timezone.module';

// Cron ジョブ
import { ReminderJob } from './jobs/reminder.job';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    EmployeeModule,
    DoctorModule,
    NurseModule,
    ReservationModule,
    WorkdayModule,
    EmailTemplateModule,
    ReminderConfigModule,
    TimezoneModule,
  ],
  providers: [PrismaService, ReminderJob],
})
export class AppModule {}
