import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!
const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN")!
const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER")!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface BookingConfirmationPayload {
  booking_id: string
  patient_phone: string
  clinic_name: string
  appointment_date: string
  appointment_time: string
  doctor_name: string
}

serve(async (req) => {
  try {
    // Verify request is from Supabase
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response("Unauthorized", { status: 401 })
    }

    const payload: BookingConfirmationPayload = await req.json()

    // Format patient phone number to E.164 format (required by WhatsApp)
    const phoneNumber = formatPhoneNumber(payload.patient_phone)

    // Create WhatsApp message
    const message = `Hello! Your appointment has been confirmed.\n\n📅 Date: ${payload.appointment_date}\n⏰ Time: ${payload.appointment_time}\n👨‍⚕️ Doctor: ${payload.doctor_name}\n🏥 Clinic: ${payload.clinic_name}\n\nSee you soon!`

    // Send via Twilio
    const response = await sendWhatsAppMessage(
      phoneNumber,
      message,
      twilioAccountSid,
      twilioAuthToken,
      twilioPhoneNumber
    )

    if (!response.ok) {
      throw new Error(`Failed to send WhatsApp message: ${response.statusText}`)
    }

    const result = await response.json()

    // Log the sent message in database
    await supabase
      .from("booking_notifications")
      .insert({
        booking_id: payload.booking_id,
        notification_type: "whatsapp",
        status: "sent",
        message_id: result.sid,
        created_at: new Date().toISOString(),
      })

    return new Response(
      JSON.stringify({
        success: true,
        message_id: result.sid,
      }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    )
  } catch (error) {
    console.error("Error sending WhatsApp message:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    )
  }
})

async function sendWhatsAppMessage(
  to: string,
  body: string,
  accountSid: string,
  authToken: string,
  fromNumber: string
): Promise<Response> {
  const auth = btoa(`${accountSid}:${authToken}`)

  const formData = new FormData()
  formData.append("From", `whatsapp:${fromNumber}`)
  formData.append("To", `whatsapp:${to}`)
  formData.append("Body", body)

  return fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
    },
    body: formData,
  })
}

function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, "")
  
  // Assume +1 for US numbers if not provided, adjust as needed for your region
  if (cleaned.length === 10) {
    return `+1${cleaned}`
  } else if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+${cleaned}`
  } else if (!cleaned.startsWith("+")) {
    return `+${cleaned}`
  }
  
  return cleaned
}
