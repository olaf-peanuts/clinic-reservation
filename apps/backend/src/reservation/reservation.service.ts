import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from '@myorg/shared/dto/create-reservation.dto';
import { UpdateReservationDto } from '@myorg/shared/dto/update-reservation.dto';
import {
  EMPLOYEE_SERVICE,
} from '../employee/employee.constants';
import { Inject } from '@nestjs/common';
import { EmployeeInfoProvider, EmployeeDto } from '../employee/employee.types';

@Injectable()
export class ReservationService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(EMPLOYEE_SERVICE) private readonly employeeSvc: EmployeeInfoProvider,
  ) {}

  /** 社員番号 → Employee.id に変換し、予約を作成 */
  async create(dto: CreateReservationDto) {
    // 社員情報取得（Mock または Azure AD）
    const emp = await this.employeeSvc.getByNumber(dto.employeeNumber);
    if (!emp) throw new NotFoundException('社員が見つかりません');

    // 医師のスケジュールと重複しないかチェック
    const overlapping = await this.prisma.reservation.findFirst({
      where: {
        doctorId: dto.doctorId,
        OR: [
          {
            startUtc: { lte: new Date(dto.endUtc) },
            endUtc:   { gte: new Date(dto.startUtc) },
          },
        ],
      },
    });
    if (overlapping) {
      throw new BadRequestException('同じ時間帯に既に予約があります');
    }

    // 医師が指定したスケジュール内かどうかも簡易チェック
    const schedule = await this.prisma.doctorSchedule.findFirst({
      where: {
        doctorId: dto.doctorId,
        startUtc: { lte: new Date(dto.startUtc) },
        endUtc:   { gte: new Date(dto.endUtc) },
      },
    });
    if (!schedule) {
      throw new BadRequestException('医師の診療スケジュール外です');
    }

    return this.prisma.reservation.create({
      data: {
        doctorId: dto.doctorId,
        employeeId: emp.id,
        nurseId: dto.nurseId ?? null,
        startUtc: new Date(dto.startUtc),
        endUtc: new Date(dto.endUtc),
      },
    });
  }

  async findAll() {
    return this.prisma.reservation.findMany({
      include: { doctor: true, employee: true, nurse: true },
    });
  }

  async findOne(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { doctor: true, employee: true, nurse: true },
    });
    if (!reservation) throw new NotFoundException('予約が見つかりません');
    return reservation;
  }

  async update(id: string, dto: UpdateReservationDto) {
    // 更新時もスケジュール・重複チェックは同様に行う（省略のため簡易実装）
    const data: any = {};
    if (dto.startUtc) data.startUtc = new Date(dto.startUtc);
    if (dto.endUtc)   data.endUtc   = new Date(dto.endUtc);
    return this.prisma.reservation.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.reservation.delete({ where: { id } });
  }
}
