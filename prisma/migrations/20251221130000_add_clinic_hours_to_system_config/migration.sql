-- Add new columns to SystemConfig table for clinic hours and other settings
ALTER TABLE "SystemConfig" 
ADD COLUMN "displayDaysOfWeek" INTEGER[] DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6],
ADD COLUMN "clinicHours" JSONB DEFAULT '[]'::jsonb,
ADD COLUMN "numberOfExaminationRooms" INTEGER DEFAULT 1,
ADD COLUMN "doctorDefaultDurationMinutes" INTEGER DEFAULT 30;
