"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserRole } from "@/types";

type StepData = {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  username: string;
  role: UserRole;
  workspaceIcon: string;
  workspaceName: string;
  workspaceDescription: string;
};

const workspaceIcons = ["📚", "🎓", "📖", "✍️", "🔬", "💼", "📊", "🎯", "🌟", "💡"];

export default function RegisterPage() {
  const router = useRouter();
  const { register, users } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<StepData>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    username: "",
    role: "Student",
    workspaceIcon: "📚",
    workspaceName: "",
    workspaceDescription: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const totalSteps = 4;

  // Calculate password strength
  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    return Math.min(strength, 100);
  };

  // Update form data
  const updateFormData = (field: keyof StepData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));

    // Update password strength
    if (field === "password") {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  // Step 1: Email validation
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    } else if (users.some((u) => u.email === formData.email)) {
      newErrors.email = "This email is already registered";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 2: Password validation
  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 3: Credentials validation
  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.username) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = "Username can only contain letters, numbers, and underscores";
    } else if (users.some((u) => u.username === formData.username)) {
      newErrors.username = "This username is already taken";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 4: Workspace validation
  const validateStep4 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.workspaceName) {
      newErrors.workspaceName = "Workspace name is required";
    } else if (formData.workspaceName.length < 3) {
      newErrors.workspaceName = "Workspace name must be at least 3 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    let isValid = false;

    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      case 4:
        isValid = validateStep4();
        break;
    }

    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else if (isValid && currentStep === totalSteps) {
      handleSubmit();
    }
  };

  // Handle back step
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  // Handle final submission
  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const newUser = await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        role: formData.role,
        workspace: {
          icon: formData.workspaceIcon,
          name: formData.workspaceName,
          description: formData.workspaceDescription,
        },
      });

      // Redirect to workspace dashboard
      setTimeout(() => {
        router.push(`/${newUser.id}`);
      }, 1000);
    } catch (error) {
      setErrors({ submit: "Registration failed. Please try again." });
      setIsLoading(false);
    }
  };

  const handleSocialSignup = (provider: string) => {
    alert(`${provider} signup coming soon!`);
  };

  // Password strength color
  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return "bg-red-500";
    if (passwordStrength < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return "Weak";
    if (passwordStrength < 70) return "Medium";
    return "Strong";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Registration Card */}
        <div className="p-8">
          {/* Error Message */}
          {errors.submit && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
              {errors.submit}
            </div>
          )}

          {/* Step 1: Email */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Title */}
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Create your PaperNest account
                </h1>
                <p className="text-sm text-gray-500">
                  Step {currentStep} of {totalSteps} - Account
                </p>
              </div>

              {/* Social Sign Up */}
              <div className="grid grid-cols-2 gap-3">

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSocialSignup("Google")}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Login using Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSocialSignup("GitHub")}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  Login using GitHub
                </Button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">
                    Or Continue With Your Credentials
                  </span>
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-900 font-normal">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Password */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Title */}
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Create a new password
                </h1>
                <p className="text-sm text-gray-500">
                  Step {currentStep} of {totalSteps} - Password
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-900 font-normal">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateFormData("password", e.target.value)}
                  placeholder="Password"
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password}</p>
                )}

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="flex items-center gap-2 text-xs">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-600">At least 8 characters</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-900 font-normal">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Credentials */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Title */}
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Your credentials
                </h1>
                <p className="text-sm text-gray-500">
                  Step {currentStep} of {totalSteps} - Credentials
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-900 font-normal">
                    First name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateFormData("firstName", e.target.value)}
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-900 font-normal">
                    Last name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateFormData("lastName", e.target.value)}
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-900 font-normal">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => updateFormData("username", e.target.value)}
                  placeholder="Create your username"
                />
                {errors.username && (
                  <p className="text-sm text-red-600">{errors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-gray-900 font-normal">
                  Select role
                </Label>
                <div className="">
                    <Select
                  value={formData.role}
                  onValueChange={(value) => updateFormData("role", value as UserRole)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Student">
                      Student
                    </SelectItem>
                    <SelectItem value="Lecturer">
                      Lecturer
                    </SelectItem>
                  </SelectContent>
                </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Workspace */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {/* Title */}
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Create or join a workspace
                </h1>
                <p className="text-sm text-gray-500">
                  Step {currentStep} of {totalSteps} - Workspace
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-900 font-normal">
                  Workspace Icon
                </Label>
                <div className="grid grid-cols-5 gap-2">
                  {workspaceIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => updateFormData("workspaceIcon", icon)}
                      className={`p-3 text-2xl border rounded-lg transition-all hover:scale-105 ${
                        formData.workspaceIcon === icon
                          ? "bg-teal-500 border-teal-400"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workspaceName" className="text-gray-900 font-normal">
                  Workspace Name
                </Label>
                <Input
                  id="workspaceName"
                  type="text"
                  value={formData.workspaceName}
                  onChange={(e) => updateFormData("workspaceName", e.target.value)}
                  placeholder="My Workspace"
                />
                {errors.workspaceName && (
                  <p className="text-sm text-red-600">{errors.workspaceName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="workspaceDescription" className="text-gray-900 font-normal">
                  Workspace Description
                </Label>
                <Textarea
                  id="workspaceDescription"
                  value={formData.workspaceDescription}
                  onChange={(e) => updateFormData("workspaceDescription", e.target.value)}
                  placeholder="Short description"
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center gap-3 mt-8">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
                className="flex-1"
              >
                ← Back
              </Button>
            )}
            <Button
              type="button"
              onClick={handleNext}
              disabled={isLoading}
              className={`${currentStep === 1 ? "w-full" : "flex-1"}`}
            >
              {isLoading
                ? "Creating account..."
                : currentStep === totalSteps
                ? "Finish ✓"
                : "Continue →"}
            </Button>
          </div>

          {/* Login Link */}
          {currentStep === 1 && (
            <div className="mt-6 text-center text-sm text-gray-600">
              Have an account?{" "}
              <Link
                href="/login"
                className="text-gray-900 hover:text-gray-700 font-medium underline transition-colors"
              >
                Log in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}