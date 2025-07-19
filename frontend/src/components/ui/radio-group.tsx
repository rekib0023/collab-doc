import * as React from "react"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

// Custom RadioGroup context to manage radio group state
const RadioGroupContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  name?: string
}>({});

// RadioGroup component
interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  name?: string
  disabled?: boolean
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, defaultValue, value, onValueChange, name, disabled, ...props }, ref) => {
    // Use internal state if value is not controlled externally
    const [internalValue, setInternalValue] = React.useState(defaultValue || "");
    
    // Determine if the component is controlled or uncontrolled
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;
    
    const handleValueChange = React.useCallback(
      (newValue: string) => {
        if (!isControlled) {
          setInternalValue(newValue);
        }
        onValueChange?.(newValue);
      },
      [isControlled, onValueChange]
    );

    return (
      <RadioGroupContext.Provider
        value={{ value: currentValue, onValueChange: handleValueChange, name }}
      >
        <div 
          role="radiogroup"
          className={cn("grid gap-2", className)}
          ref={ref}
          {...props}
        />
      </RadioGroupContext.Provider>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

// RadioGroupItem component
interface RadioGroupItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  disabled?: boolean
}

const RadioGroupItem = React.forwardRef<HTMLDivElement, RadioGroupItemProps>(
  ({ className, value, disabled, ...props }, ref) => {
    const { value: groupValue, onValueChange, name } = React.useContext(RadioGroupContext);
    const checked = value === groupValue;
    const id = React.useId();
    
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex items-center space-x-2",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <div
          onClick={() => !disabled && onValueChange?.(value)}
          className={cn(
            "aspect-square h-4 w-4 rounded-full border border-primary ring-offset-background",
            "cursor-pointer flex items-center justify-center",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            checked && "bg-primary",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
          {...props}
        >
          {checked && (
            <div className="flex items-center justify-center">
              <Circle className="h-2.5 w-2.5 fill-white text-white" />
            </div>
          )}
          <input
            type="radio"
            name={name}
            value={value}
            checked={checked}
            onChange={() => onValueChange?.(value)}
            className="sr-only"
            disabled={disabled}
            id={id}
          />
        </div>
      </div>
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
