import * as fs from 'fs';
import * as path from 'path';
import { EmployeeDto } from '../dto/employee.dto';

export class MockDataLoader {
  private static employees: EmployeeDto[] | null = null;

  /** mock-data/employees.json を読み込み、キャッシュします */
  static loadEmployees(): EmployeeDto[] {
    if (this.employees) return this.employees;
    const filePath = path.resolve(__dirname, '../../../mock-data/employees.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    this.employees = JSON.parse(raw);
    return this.employees || [];
  }

  /** 社員番号で検索 */
  static findByNumber(number: string): EmployeeDto | undefined {
    return this.loadEmployees().find((e) => e.employeeNumber === number);
  }
}
