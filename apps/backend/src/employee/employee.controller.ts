import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';
import { EMPLOYEE_SERVICE } from './employee.constants';
import { Inject } from '@nestjs/common';
import { EmployeeInfoProvider, EmployeeDto } from './employee.types';

@Controller('employees')
export class EmployeeController {
  constructor(
    @Inject(EMPLOYEE_SERVICE) private readonly employeeSvc: EmployeeInfoProvider,
  ) {}

  /** GET /employees → すべての社員情報取得（Mock データ） */
  @Get()
  async getAll(): Promise<EmployeeDto[]> {
    // Mock: 空配列を返す（実装は環境に応じてMockデータを返すように調整可能）
    return [];
  }

  /** GET /employees/:number → 社員情報取得（Mock データ） */
  @Get(':number')
  async get(@Param('number') number: string): Promise<{ data: EmployeeDto }> {
    const data = await this.employeeSvc.getByNumber(number);
    return { data };
  }
}
