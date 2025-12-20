import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import {
  MAIL_SERVICE,
  IMailService,
} from '../email-template/email-template.service';
import { Inject } from '@nestjs/common';
import { renderTemplate } from '@myorg/shared/utils/email-template.renderer';

@Injectable()
export class ReminderJob {
  private readonly logger = new Logger(ReminderJob.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(MAIL_SERVICE) private readonly mailSvc: IMailService,
  ) {}

  // 毎時0分に実行
  @Cron('0 * * * *')
  async handle() {
    this.logger.log('🔔 ReminderJob 起動');

    const configs = await this.prisma.reminderConfig.findMany();
    if (!configs.length) return;

    const nowUtc = new Date();

    for (const cfg of configs) {
      // 「X日前・sendHour」 の基準日時を算出
      const targetDate = new Date(
        Date.UTC(
          nowUtc.getUTCFullYear(),
          nowUtc.getUTCMonth(),
          nowUtc.getUTCDate() + cfg.daysBefore,
          cfg.sendHour,
          0,
          0,
        ),
      );

      // 同一日（UTC）に対象となる予約を取得
      const startOfDay = new Date(targetDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const reservations = await this.prisma.reservation.findMany({
        where: {
          startUtc: { gte: startOfDay, lte: endOfDay },
          // まだ送信されていないものだけ対象
          reminders: { none: { configId: cfg.id } },
        },
        include: { employee: true, doctor: true, nurse: true },
      });

      const template = await this.prisma.emailTemplate.findFirst({
        where: { name: 'Reminder' },
      });
      if (!template) {
        this.logger.warn('リマインダー用テンプレートが未登録です');
        continue;
      }

      for (const res of reservations) {
        const mailBody = renderTemplate(template.body, {
          employeeName: res.employee.name,
          doctorName:   res.doctor.employee?.name ?? '',
          nurseName:    res.nurse?.employee?.name ?? '',
          reservationDateTime: new Date(res.startUtc).toISOString(),
        });

        // メール送信（Mock か本番実装が走る）
        await this.mailSvc.send({
          to: res.employee.email,
          subject: template.subject,
          body: mailBody,
        });

        // 送信履歴を記録して二重送信防止
        await this.prisma.reminderSent.create({
          data: { reservationId: res.id, configId: cfg.id },
        });
      }
    }

    this.logger.log('🔔 ReminderJob 完了');
  }
}
