import assert from 'node:assert/strict';
import test from 'node:test';

import {
  displayNameSchema,
  emailSchema,
  passwordSchema,
} from '../../supabase/functions/_shared/api-schemas.ts';

test('normaliza un correo válido', () => {
  assert.equal(emailSchema.parse('  TURISTA@EJEMPLO.COM '), 'turista@ejemplo.com');
});

test('rechaza correos, contraseñas y nombres inválidos', () => {
  assert.equal(emailSchema.safeParse('correo-invalido').success, false);
  assert.equal(passwordSchema.safeParse('solo-letras').success, false);
  assert.equal(passwordSchema.safeParse('12345678').success, false);
  assert.equal(displayNameSchema.safeParse('A').success, false);
});

test('acepta una contraseña y un nombre válidos', () => {
  assert.equal(passwordSchema.safeParse('Manta2026').success, true);
  assert.equal(displayNameSchema.safeParse('Turista de Manta').success, true);
});
