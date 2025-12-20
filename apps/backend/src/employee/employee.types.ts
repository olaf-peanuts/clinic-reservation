import { EmployeeDto } from '@myorg/shared/dto/employee.dto';

export interface EmployeeInfoProvider {
  getByNumber(employeeNumber: string): Promise<EmployeeDto>;
}
