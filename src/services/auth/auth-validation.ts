import { displayNameSchema, emailSchema, passwordSchema } from '@contracts/api-schemas';
import type { z } from 'zod';

function getValidationMessage(result: z.ZodSafeParseResult<unknown>) {
  return result.success ? undefined : result.error.issues[0]?.message;
}

export function validateEmail(email: string) {
  return getValidationMessage(emailSchema.safeParse(email));
}

export function validatePassword(password: string) {
  return getValidationMessage(passwordSchema.safeParse(password));
}

export function validateDisplayName(displayName: string) {
  return getValidationMessage(displayNameSchema.safeParse(displayName));
}
