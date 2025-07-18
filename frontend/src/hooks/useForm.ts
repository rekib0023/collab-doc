import { useState, useCallback, ChangeEvent } from 'react';

// Ensure validation errors don't have undefined values
type ValidationErrors = Record<string, string>;
type ValidationRules<T> = Partial<Record<keyof T, (value: any) => string | undefined>>;

/**
 * Custom hook for form handling with validation
 *
 * @param initialValues - Initial form values
 * @param validationRules - Optional validation rules for form fields
 * @param onSubmit - Function to call on valid form submission
 */
export const useForm = <T extends Record<string, any>>(
  initialValues: T,
  validationRules?: ValidationRules<T>,
  onSubmit?: (values: T) => void | Promise<void>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);

  // Handle change for any input type
  const handleChange = useCallback((
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    setValues(prev => ({
      ...prev,
      [name]: type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : value
    }));

    // Set field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validate field on change if rules exist
    if (validationRules && validationRules[name as keyof T]) {
      const error = validationRules[name as keyof T]?.(value);
      if (error) {
        setErrors(prev => ({
          ...prev,
          [name]: error
        }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name as string];
          return newErrors;
        });
      }
    }
  }, [validationRules]);

  // Set a specific value programmatically
  const setValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate field if rules exist
    if (validationRules && validationRules[name]) {
      const error = validationRules[name]?.(value);
      if (error) {
        setErrors(prev => ({
          ...prev,
          [name]: error
        }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name as string];
          return newErrors;
        });
      }
    }
  }, [validationRules]);

  // Validate all fields
  const validateAll = useCallback((): boolean => {
    if (!validationRules) return true;

    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(values).forEach((key) => {
      // Safe type casting since we're iterating over the keys of values
      const typedKey = key as keyof T;
      const rule = validationRules[typedKey];
      if (rule) {
        const error = rule(values[typedKey]);
        if (error) {
          newErrors[key] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationRules]);

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key as keyof T] = true;
      return acc;
    }, {} as Record<keyof T, boolean>);

    setTouched(allTouched);

    const isValid = validateAll();

    if (isValid && onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [values, validateAll, onSubmit]);

  // Reset form to initial values or new values
  const resetForm = useCallback((newValues?: T) => {
    setValues(newValues || initialValues);
    setErrors({});
    setTouched({} as Record<keyof T, boolean>);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    setValue,
    handleSubmit,
    resetForm,
    validateAll,
  };
};

export default useForm;
