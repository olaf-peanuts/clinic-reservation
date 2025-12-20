export interface ReservationDto {
  id: string;
  doctorId: string;
  employeeId: string;
  nurseId?: string | null;
  startUtc: string;   // ISO8601 UTC
  endUtc: string;     // ISO8601 UTC
}
