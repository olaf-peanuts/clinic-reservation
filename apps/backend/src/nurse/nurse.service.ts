import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNurseDto } from './create-nurse.dto';
import { EMPLOYEE_SERVICE } from '../employee/employee.constants';
import { Inject } from '@nestjs/common';
import { EmployeeInfoProvider } from '../employee/employee.types';

@Injectable()
export class NurseService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(EMPLOYEE_SERVICE) private readonly employeeSvc: EmployeeInfoProvider,
  ) {}

  async create(dto: CreateNurseDto) {
    const emp = await this.employeeSvc.getByNumber(dto.employeeNumber);
    return this.prisma.nurse.create({
      data: { employeeId: emp.id, title: dto.title },
    });
  }

  async findAll() {
    return this.prisma.nurse.findMany({ include: { employee: true } });
  }

  async findOne(id: string) {
    const nurse = await this.prisma.nurse.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!nurse) throw new NotFoundException('看護師が見つかりません');
    return nurse;
  }

  async remove(id: string) {
    return this.prisma.nurse.delete({ where: { id } });
  }
}
