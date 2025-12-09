import random, string, httpx
from app.core.security import create_access_token
from redis.asyncio.client import Redis

async def send_otp(email: str, redis_client: Redis, settings: dict):
    otp = ''.join(random.choices(string.digits, k=6))
    otp_expire = 2*60
    await redis_client.setex(f"otp:{email}", otp_expire, otp)

    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Email Verification</title>
      <style>
        body {{
          font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #f9fafb;
          color: #111827;
          margin: 0;
          padding: 0;
        }}
        .container {{
          max-width: 500px;
          margin: 40px auto;
          background: #ffffff;
          padding: 32px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }}
        h1 {{
          color: #1d4ed8;
          font-size: 22px;
          margin-bottom: 12px;
        }}
        p {{
          line-height: 1.6;
          margin: 8px 0;
        }}
        .otp {{
          font-size: 28px;
          font-weight: 600;
          letter-spacing: 6px;
          text-align: center;
          margin: 24px 0;
          text-decoration: underline;
          color: #111827;
        }}
        .footer {{
          margin-top: 24px;
          font-size: 13px;
          color: #6b7280;
          text-align: center;
        }}
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Email Verification Code</h1>
        <p>Hello,</p>
        <p>Use the verification code below to sign in to your account. This code will expire in {otp_expire} minutes.</p>
        <div class="otp">{otp}</div>
        <p>If you didn’t request this code, you can safely ignore this email.</p>
      </div>
    </body>
    </html>
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings['RESEND_API_KEY']}"},
            json={
                "from": "noreply <onboarding@lofy.space>",
                "to": [email],
                "subject": "Email Verification",
                "html": html
            }
        )

        if response.status_code >= 400:
            print("Failed to send email:", response.text)
        else:
            print("OTP sent successfully to", email)
    
    print(otp)
    return otp

async def verify_otp(email: str, otp: str, redis_client: Redis, settings: dict):
    sent_otp = await redis_client.get(f"otp:{email}")
    if not sent_otp:
        return {"error: OTP code expired or not found, please resend"}
    
    if otp != sent_otp:
        return {"error: Invalid OTP"}

    await redis_client.delete(f"otp:{email}")
    token = create_access_token({"sub": email}, settings)
    return token
    
