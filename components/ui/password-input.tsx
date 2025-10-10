import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  showPassword?: boolean
  onTogglePassword?: () => void
  error?: string
  requirements?: {
    minLength: boolean
    hasUppercase: boolean
    hasLowercase: boolean
    hasNumber: boolean
    hasSpecialChar: boolean
  }
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showPassword, onTogglePassword, error, requirements, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
        
        {/* Error message */}
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
        
        {/* Password requirements */}
        {requirements && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-500">Password requirements:</p>
            <div className="space-y-1">
              <div className="flex items-center text-xs">
                <div className={cn(
                  "w-2 h-2 rounded-full mr-2",
                  requirements.minLength ? "bg-green-500" : "bg-gray-300"
                )} />
                <span className={requirements.minLength ? "text-green-600" : "text-gray-500"}>
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center text-xs">
                <div className={cn(
                  "w-2 h-2 rounded-full mr-2",
                  requirements.hasUppercase ? "bg-green-500" : "bg-gray-300"
                )} />
                <span className={requirements.hasUppercase ? "text-green-600" : "text-gray-500"}>
                  One uppercase letter
                </span>
              </div>
              <div className="flex items-center text-xs">
                <div className={cn(
                  "w-2 h-2 rounded-full mr-2",
                  requirements.hasLowercase ? "bg-green-500" : "bg-gray-300"
                )} />
                <span className={requirements.hasLowercase ? "text-green-600" : "text-gray-500"}>
                  One lowercase letter
                </span>
              </div>
              <div className="flex items-center text-xs">
                <div className={cn(
                  "w-2 h-2 rounded-full mr-2",
                  requirements.hasNumber ? "bg-green-500" : "bg-gray-300"
                )} />
                <span className={requirements.hasNumber ? "text-green-600" : "text-gray-500"}>
                  One number
                </span>
              </div>
              <div className="flex items-center text-xs">
                <div className={cn(
                  "w-2 h-2 rounded-full mr-2",
                  requirements.hasSpecialChar ? "bg-green-500" : "bg-gray-300"
                )} />
                <span className={requirements.hasSpecialChar ? "text-green-600" : "text-gray-500"}>
                  One special character (!@#$%^&*)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
