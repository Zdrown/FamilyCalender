import nodemailer from 'nodemailer';

export const CARRIERS = {
  verizon: { label: 'Verizon', gateway: 'vtext.com' },
  att: { label: 'AT&T', gateway: 'txt.att.net' },
  tmobile: { label: 'T-Mobile', gateway: 'tmomail.net' },
  sprint: { label: 'Sprint', gateway: 'messaging.sprintpcs.com' },
  uscellular: { label: 'US Cellular', gateway: 'email.uscc.net' },
  boost: { label: 'Boost Mobile', gateway: 'sms.myboostmobile.com' },
  cricket: { label: 'Cricket', gateway: 'sms.cricketwireless.net' },
  metro: { label: 'Metro PCS', gateway: 'mymetropcs.com' },
} as const;

export type CarrierKey = keyof typeof CARRIERS;

interface NotificationConfig {
  gmail_address: string;
  gmail_app_password: string;
}

export async function sendText(
  config: NotificationConfig,
  phone: string,
  carrier: string,
  message: string
) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: config.gmail_address, pass: config.gmail_app_password },
  });

  const gateway = CARRIERS[carrier as CarrierKey]?.gateway;
  if (!gateway) throw new Error(`Unknown carrier: ${carrier}`);

  const cleanPhone = phone.replace(/\D/g, '');

  await transporter.sendMail({
    from: config.gmail_address,
    to: `${cleanPhone}@${gateway}`,
    subject: '',
    text: message,
  });
}
