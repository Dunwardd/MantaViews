export function validateEmail(email: string) {
  if (!email.trim()) return 'Ingresa tu correo electrónico.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Ingresa un correo válido.';
  return undefined;
}

export function validatePassword(password: string) {
  if (!password) return 'Ingresa tu contraseña.';
  if (password.length < 8) return 'Usa al menos 8 caracteres.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Incluye al menos una letra y un número.';
  }
  return undefined;
}

export function validateDisplayName(displayName: string) {
  const length = displayName.trim().length;
  if (length < 2) return 'Ingresa un nombre de al menos 2 caracteres.';
  if (length > 80) return 'El nombre no puede superar 80 caracteres.';
  return undefined;
}
