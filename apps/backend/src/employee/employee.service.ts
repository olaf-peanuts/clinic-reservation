import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmployeeInfoProvider, EmployeeDto } from './employee.types';
import { MockDataLoader } from '@myorg/shared/utils/mock-data.loader';

export const EMPLOYEE_SERVICE = 'EMPLOYEE_SERVICE';
export class RealEmployeeService implements EmployeeInfoProvider {
  async getByNumber(employeeNumber: string): Promise<EmployeeDto> {
    // TODO: Microsoft Graph の /users?$filter=employeeId eq '{employeeNumber}' 呼び出し
    throw new Error('Real Azure AD integration not implemented yet');
  }
}

// Mock 実装（MOCK_MODE が true のときに使用）
@Injectable()
export class MockEmployeeService implements EmployeeInfoProvider {
  async getByNumber(employeeNumber: string): Promise<EmployeeDto> {
    const emp = MockDataLoader.findByNumber(employeeNumber);
    if (!emp) throw new NotFoundException('社員が見つかりません（Mock）');
    return emp;
  }
}
