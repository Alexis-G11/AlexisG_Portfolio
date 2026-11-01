export const LIMITS = {
  name: 80,
  email: 254,
  // Kept well inside WhatsApp template body limits once name, email and the
  // template's fixed text are added.
  message: 600,
  // Whole request body, in bytes.
  body: 8 * 1024,
} as const;

export interface CleanInput {
  name: string;
  email: string;
  message: string;
}

export type FieldErrors = Partial<Record<keyof CleanInput, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Control characters (except \n and \t), bidi overrides and zero-width chars.
// eslint-disable-next-line no-control-regex
const UNSAFE_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

function clean(value: string): string {
  return value.normalize('NFC').replace(UNSAFE_CHARS, '').replace(/\r\n?/g, '\n').trim();
}

/** Single-line fields: collapse every whitespace run, including newlines. */
function singleLine(value: string): string {
  return clean(value).replace(/\s+/g, ' ');
}

export function validateInput(raw: Record<string, unknown>): {
  value?: CleanInput;
  errors?: FieldErrors;
} {
  const errors: FieldErrors = {};

  const fields = ['name', 'email', 'message'] as const;
  for (const f of fields) {
    if (typeof raw[f] !== 'string') errors[f] = `${f} must be text.`;
  }
  if (Object.keys(errors).length) return { errors };

  const name = singleLine(raw.name as string);
  const email = singleLine(raw.email as string);
  const message = clean(raw.message as string);

  if (!name) errors.name = 'Name is required.';
  else if (name.length > LIMITS.name) errors.name = `Name must be at most ${LIMITS.name} characters.`;

  if (!email) errors.email = 'Email is required.';
  else if (email.length > LIMITS.email || !EMAIL_RE.test(email)) {
    errors.email = 'A valid email address is required.';
  }

  if (!message) errors.message = 'Message is required.';
  else if (message.length > LIMITS.message) {
    errors.message = `Message must be at most ${LIMITS.message} characters.`;
  }

  if (Object.keys(errors).length) return { errors };
  return { value: { name, email, message } };
}

/**
 * WhatsApp template parameters may not contain newlines, tabs or runs of
 * four or more spaces (Meta rejects them), so flatten the message.
 */
export function toTemplateParam(value: string): string {
  return value.replace(/\s*\n+\s*/g, ' / ').replace(/\t/g, ' ').replace(/ {4,}/g, '   ');
}
