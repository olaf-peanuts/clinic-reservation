import { Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmployeeController } from './employee.controller';
import {
  EMPLOYEE_SERVICE,
  MockEmployeeService,
  RealEmployeeService,
} from './employee.service';
import { PrismaService } from '../prisma/prisma.service';

const employeeProvider: Provider = {
  provide: EMPLOYEE_SERVICE,
  useFactory: (config: ConfigService) => {
    const mockMode = config.get<string>('MOCK_MODE') === 'true';
    return mockMode ? new MockEmployeeService() : new RealEmployeeService();
  },
  inject: [ConfigService],
};

@Module({
  controllers: [EmployeeController],
  providers: [employeeProvider, PrismaService],
  exports: [employeeProvider],
})
export class EmployeeModule {}
