export interface EmployeeDto {
  id: string;
  employeeNumber: string;
  name: string;
  email: string;
  companyName?: string;
  department?: string;
  phoneNumber?: string; // "000-0000-0000" 形式
}
