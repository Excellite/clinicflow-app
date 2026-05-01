import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { patient_name, phone, doctor_name, appointment_date, appointment_time, reference } = await req.json()

  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")

  const message = `Hi ${patient_name}! Your appointment with ${doctor_name} is confirmed. Date: ${appointment_date} at ${appointment_time}. Ref: ${reference}. - ClinicFlow Lagos`

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(`${accountSid}:${authToken}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: `whatsapp:+14155238886`,
        To: `whatsapp:+234${phone.replace(/^0/, "")}`,
        Body: message,
      }),
    }
  )

  const data = await response.json()
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" }
  })
})