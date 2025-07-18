import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useLoginMutation, useRegisterMutation } from "@/store/api";
import { setCredentials } from "@/store/slices/authSlice";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import useToast from "./useToast";

// Login form schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Registration form schema
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirm_password: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;
type AuthFormType = 'login' | 'register';

/**
 * Custom hook for handling authentication forms (login and registration)
 */
export const useAuthForm = (formType: AuthFormType) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { success, error } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  // API hooks
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [register, { isLoading: isRegisterLoading }] = useRegisterMutation();

  const isLoading = formType === 'login' ? isLoginLoading : isRegisterLoading;

  // Create form based on type and get appropriate defaults
  const schema = formType === 'login' ? loginSchema : registerSchema;
  const defaultValues = formType === 'login'
    ? { email: "", password: "" }
    : { name: "", email: "", password: "", confirm_password: "" };

  // Define form type union for better type safety
  type FormValues = LoginFormValues | RegisterFormValues;

  // Use React Hook Form with Zod resolver
  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any // Type assertion needed to handle union type
  });

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    try {
      let result;

      if (formType === 'login') {
        // Login flow
        result = await login(values as LoginFormValues).unwrap();
        success("Login successful", "Welcome back!");
      } else {
        // Registration flow
        const { confirm_password, ...registerData } = values as RegisterFormValues;
        result = await register(registerData).unwrap();
        success("Registration successful", "Your account has been created");
      }

      // Set authentication credentials and navigate to home
      dispatch(
        setCredentials({
          user: result.user,
          token: result.access_token,
        })
      );
      navigate("/");
    } catch (err: any) {
      // Error handling for both forms
      handleApiError(err);
    }
  };

  // Error handling logic for API errors
  const handleApiError = (err: any) => {
    // Handle different error formats
    if (Array.isArray(err.data?.detail)) {
      // Handle validation errors from FastAPI
      const validationErrors = err.data.detail
        .map((e: any) => e.msg)
        .join(", ");
      error("Authentication Failed", validationErrors || "Validation error");
    } else if (
      typeof err.data?.detail === "object" &&
      err.data?.detail !== null
    ) {
      // Handle object errors
      error("Authentication Failed", JSON.stringify(err.data.detail));
    } else {
      // Handle string errors
      error(
        "Authentication Failed",
        err.data?.detail ||
        err.error ||
        `${formType === 'login' ? 'Login' : 'Registration'} failed. Please check your information.`
      );
    }
  };

  // Password toggle function
  const togglePasswordVisibility = () => setShowPassword((prev: boolean) => !prev);

  return {
    methods,
    showPassword,
    togglePasswordVisibility,
    isLoading,
    onSubmit: methods.handleSubmit(onSubmit)
  };
};

export default useAuthForm;
