-- Create bookings table if it doesn't exist
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  patient_phone text NOT NULL,
  doctor_id uuid NOT NULL,
  clinic_name text NOT NULL,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  doctor_name text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create booking_notifications table to track sent messages
CREATE TABLE IF NOT EXISTS booking_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  notification_type text NOT NULL DEFAULT 'whatsapp',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  message_id text,
  error_message text,
  created_at timestamp DEFAULT now(),
  sent_at timestamp,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_patient_id ON bookings(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_booking_id ON booking_notifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON booking_notifications(status);

-- Create function to call Edge Function when booking is confirmed
CREATE OR REPLACE FUNCTION public.notify_booking_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed' THEN
    -- Call the Edge Function via HTTP
    PERFORM
      net.http_post(
        url := 'https://' || current_setting('app.supabase_url') || '/functions/v1/send-whatsapp-booking-confirmation',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
        ),
        body := jsonb_build_object(
          'booking_id', NEW.id::text,
          'patient_phone', NEW.patient_phone,
          'clinic_name', NEW.clinic_name,
          'appointment_date', NEW.appointment_date::text,
          'appointment_time', NEW.appointment_time::text,
          'doctor_name', NEW.doctor_name
        )
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on bookings table
DROP TRIGGER IF EXISTS booking_confirmation_trigger ON bookings;
CREATE TRIGGER booking_confirmation_trigger
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_booking_confirmation();

-- Enable the pgsql_net extension for HTTP calls (required for Edge Function calls)
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT ON public.bookings TO anon, authenticated;
GRANT SELECT, INSERT ON public.booking_notifications TO anon, authenticated;
