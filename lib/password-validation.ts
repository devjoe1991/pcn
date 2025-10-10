export interface PasswordRequirements {
  minLength: boolean
  hasUppercase: boolean
  hasLowercase: boolean
  hasNumber: boolean
  hasSpecialChar: boolean
}

export function validatePassword(password: string): PasswordRequirements {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  }
}

export function isPasswordValid(requirements: PasswordRequirements): boolean {
  return Object.values(requirements).every(Boolean)
}

export function getPasswordStrength(requirements: PasswordRequirements): 'weak' | 'medium' | 'strong' {
  const validCount = Object.values(requirements).filter(Boolean).length
  
  if (validCount < 3) return 'weak'
  if (validCount < 5) return 'medium'
  return 'strong'
}

export function getPasswordStrengthColor(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak': return 'text-red-500'
    case 'medium': return 'text-yellow-500'
    case 'strong': return 'text-green-500'
    default: return 'text-gray-500'
  }
}

export function getPasswordStrengthText(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak': return 'Weak password'
    case 'medium': return 'Medium strength'
    case 'strong': return 'Strong password'
    default: return ''
  }
}
