import { createTransport } from 'nodemailer';

type EmailPayload = { to: string; subject: string; html: string };

const sendEmail = async (payload: EmailPayload): Promise<void> => {
  const user = process.env.SMTP_USER ?? '';
  const pass = process.env.SMTP_PASS ?? '';

  if (!user || !pass) {
    console.warn('[email] SMTP_USER və ya SMTP_PASS yoxdur — email göndərilmədi.');
    return;
  }

  const transporter = createTransport({
    host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"Aevic Esports" <${user}>`,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  });
};

export const sendOtpEmail = async (to: string, otpCode: string): Promise<void> => {
  await sendEmail({
    to,
    subject: 'Aevic Esports — Təsdiq Kodu',
    html: `<!--[if mso]>
<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
<tr><td background="https://aevic-landing.netlify.app/email-bg.png" style="background:#0a0a0c;padding:24px;border-radius:12px;">
<![endif]-->
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background-color:#0a0a0c;background-image:url('https://aevic-landing.netlify.app/email-bg.png');background-size:cover;background-position:center;background-repeat:no-repeat;color:#fff;border-radius:12px">
  <p style="color:#f3c450;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 12px">Aevic Esports</p>
  <h1 style="font-size:22px;margin:0 0 12px">Təsdiq Kodunuz</h1>
  <p style="color:#999;line-height:1.7">Qeydiyyatı tamamlamaq üçün aşağıdakı kodu daxil edin:</p>
  <div style="margin:24px 0;padding:20px;background:rgba(26,26,28,0.85);border-radius:8px;text-align:center">
    <span style="font-size:36px;font-weight:700;letter-spacing:0.2em;color:#f3c450">${otpCode}</span>
  </div>
  <p style="color:#555;font-size:12px">Kod 10 dəqiqə etibarlıdır.</p>
</div>
<!--[if mso]>
</td></tr>
</table>
<![endif]-->`,
  });
};

export const sendRegistrationEmail = async (to: string, teamName: string): Promise<void> => {
  await sendEmail({
    to,
    subject: `Aevic Esports — ${teamName} qeydiyyatı alındı`,
    html: `<!--[if mso]>
<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
<tr><td background="https://aevic-landing.netlify.app/email-bg.png" style="background:#0a0a0c;padding:24px;border-radius:12px;">
<![endif]-->
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background-color:#0a0a0c;background-image:url('https://aevic-landing.netlify.app/email-bg.png');background-size:cover;background-position:center;background-repeat:no-repeat;color:#fff;border-radius:12px">
  <p style="color:#f3c450;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 12px">Aevic Esports</p>
  <h1 style="font-size:22px;margin:0 0 12px">Qeydiyyatınız alındı!</h1>
  <p style="color:#999;line-height:1.7"><strong style="color:#fff">${teamName}</strong> komandasının qeydiyyatı uğurla tamamlandı. Admin yoxladıqdan sonra email bildirişi alacaqsınız.</p>
  <div style="margin:24px 0;padding:16px;background:rgba(26,26,28,0.85);border-radius:8px">
    <a href="https://aevic-landing.netlify.app/panel" style="color:#f3c450;text-decoration:none;font-size:14px;font-weight:700">Panelə daxil ol →</a>
  </div>
  <p style="color:#555;font-size:12px">Aevic Esports · aevicesports.com</p>
</div>
<!--[if mso]>
</td></tr>
</table>
<![endif]-->`,
  });
};

export const sendStatusChangeEmail = async (to: string, teamName: string, newStatus: string): Promise<void> => {
  const statusMap: Record<string, { label: string; color: string; message: string }> = {
    approved: { label: 'Təsdiqləndi ✓', color: '#4ade80', message: 'Komandanız turnirə qəbul edildi! Panelinizdə room kodunu izləyin.' },
    rejected: { label: 'Rədd edildi', color: '#f87171', message: 'Komandanızın qeydiyyatı qəbul edilmədi. Ətraflı məlumat üçün adminlə əlaqə saxlayın.' },
  };
  const info = statusMap[newStatus];
  if (!info) return;

  await sendEmail({
    to,
    subject: `Aevic Esports — ${teamName}: ${info.label}`,
    html: `<!--[if mso]>
<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
<tr><td background="https://aevic-landing.netlify.app/email-bg.png" style="background:#0a0a0c;padding:24px;border-radius:12px;">
<![endif]-->
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background-color:#0a0a0c;background-image:url('https://aevic-landing.netlify.app/email-bg.png');background-size:cover;background-position:center;background-repeat:no-repeat;color:#fff;border-radius:12px">
  <p style="color:#f3c450;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 12px">Aevic Esports</p>
  <h1 style="font-size:22px;margin:0 0 12px">Status: <span style="color:${info.color}">${info.label}</span></h1>
  <p style="color:#999;line-height:1.7"><strong style="color:#fff">${teamName}</strong> — ${info.message}</p>
  <div style="margin:24px 0;padding:16px;background:rgba(26,26,28,0.85);border-radius:8px">
    <a href="https://aevic-landing.netlify.app/panel" style="color:#f3c450;text-decoration:none;font-size:14px;font-weight:700">Panelə daxil ol →</a>
  </div>
  <p style="color:#555;font-size:12px">Aevic Esports · aevicesports.com</p>
</div>
<!--[if mso]>
</td></tr>
</table>
<![endif]-->`,
  });
};

export const sendResetEmail = async (to: string, resetLink: string): Promise<void> => {
  await sendEmail({
    to,
    subject: 'Aevic Esports — Şifrəni sıfırla',
    html: `<!--[if mso]>
<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
<tr><td background="https://aevic-landing.netlify.app/email-bg.png" style="background:#0a0a0c;padding:24px;border-radius:12px;">
<![endif]-->
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background-color:#0a0a0c;background-image:url('https://aevic-landing.netlify.app/email-bg.png');background-size:cover;background-position:center;background-repeat:no-repeat;color:#fff;border-radius:12px">
  <p style="color:#f3c450;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 12px">Aevic Esports</p>
  <h1 style="font-size:22px;margin:0 0 12px">Şifrəni sıfırla</h1>
  <p style="color:#999;line-height:1.7">Aşağıdakı düyməyə basaraq yeni şifrə təyin edin. Link 1 saat etibarlıdır.</p>
  <div style="margin:24px 0">
    <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#f3c450;color:#0a0a0c;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Şifrəni Sıfırla →</a>
  </div>
  <p style="color:#555;font-size:12px">Bu emaili siz göndərməmisinizsə, məhəl qoymayın.</p>
</div>
<!--[if mso]>
</td></tr>
</table>
<![endif]-->`,
  });
};

export const sendRoomCodeEmail = async (
  to: string,
  teamName: string,
  roomId: string,
  roomPassword: string,
  matchLabel: string,
): Promise<void> => {
  await sendEmail({
    to,
    subject: `Aevic Esports — ${matchLabel} Room Kodu`,
    html: `<!--[if mso]>
<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
<tr><td background="https://aevic-landing.netlify.app/email-bg.png" style="background:#0a0a0c;padding:24px;border-radius:12px;">
<![endif]-->
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background-color:#0a0a0c;background-image:url('https://aevic-landing.netlify.app/email-bg.png');background-size:cover;background-position:center;background-repeat:no-repeat;color:#fff;border-radius:12px">
  <p style="color:#f3c450;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 12px">Aevic Esports · ${matchLabel}</p>
  <h1 style="font-size:22px;margin:0 0 12px">Room kodu hazırdır!</h1>
  <p style="color:#999;line-height:1.7"><strong style="color:#fff">${teamName}</strong>, aşağıdakı məlumatlarla oyuna qoşula bilərsiniz:</p>
  <div style="margin:20px 0;padding:20px;background:rgba(26,26,28,0.85);border-radius:8px;border:1px solid rgba(243,196,80,0.3)">
    <div style="margin-bottom:12px">
      <p style="margin:0;font-size:11px;color:#888;letter-spacing:0.08em;text-transform:uppercase">Room ID</p>
      <p style="margin:4px 0 0;font-size:24px;font-weight:700;color:#f3c450;letter-spacing:0.05em">${roomId}</p>
    </div>
    <div>
      <p style="margin:0;font-size:11px;color:#888;letter-spacing:0.08em;text-transform:uppercase">Şifrə</p>
      <p style="margin:4px 0 0;font-size:24px;font-weight:700;color:#f3c450;letter-spacing:0.05em">${roomPassword}</p>
    </div>
  </div>
  <p style="color:#f87171;font-size:13px">⚠️ Room kodunu başqaları ilə paylaşmayın!</p>
  <p style="color:#555;font-size:12px;margin-top:24px">Aevic Esports · aevicesports.com</p>
</div>
<!--[if mso]>
</td></tr>
</table>
<![endif]-->`,
  });
};
