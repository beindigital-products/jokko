'use client'

interface SocialButtonsProps {
  disabled?: boolean
  action: 'sign-in' | 'sign-up'
}

export function SocialButtons({ disabled, action }: SocialButtonsProps) {
  const text = action === 'sign-in' ? 'Se connecter' : "S'inscrire"

  return (
    <div className="space-y-3">
      <div
        aria-disabled={disabled}
        className="text-center text-sm text-gray-500 italic"
      >
        {text} avec Google temporairement indisponible
      </div>
    </div>
  )
}
