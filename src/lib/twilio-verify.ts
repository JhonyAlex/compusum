type TwilioVerifyResponse = {
  sid?: string;
  status?: string;
  valid?: boolean;
  message?: string;
  code?: number;
  more_info?: string;
};

function getTwilioVerifyConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  return {
    accountSid,
    authToken,
    serviceSid,
    isConfigured: Boolean(accountSid && authToken && serviceSid),
  };
}

export function isTwilioVerifyConfigured(): boolean {
  return getTwilioVerifyConfig().isConfigured;
}

async function twilioVerifyRequest(
  path: 'Verifications' | 'VerificationCheck',
  payload: Record<string, string>
): Promise<TwilioVerifyResponse> {
  const { accountSid, authToken, serviceSid, isConfigured } = getTwilioVerifyConfig();

  if (!isConfigured || !accountSid || !authToken || !serviceSid) {
    throw new Error('Twilio Verify no está configurado. Define TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_VERIFY_SERVICE_SID.');
  }

  const url = `https://verify.twilio.com/v2/Services/${serviceSid}/${path}`;
  const body = new URLSearchParams(payload);
  const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    cache: 'no-store',
  });

  const data = (await response.json().catch(() => ({}))) as TwilioVerifyResponse;

  if (!response.ok) {
    const detail = data.message || 'Error desconocido de Twilio Verify';
    throw new Error(`Twilio Verify error: ${detail}`);
  }

  return data;
}

export async function sendOtpWithTwilio(to: string): Promise<void> {
  await twilioVerifyRequest('Verifications', {
    To: to,
    Channel: 'sms',
  });
}

export async function checkOtpWithTwilio(to: string, code: string): Promise<boolean> {
  const data = await twilioVerifyRequest('VerificationCheck', {
    To: to,
    Code: code,
  });

  return data.status === 'approved' || data.valid === true;
}
