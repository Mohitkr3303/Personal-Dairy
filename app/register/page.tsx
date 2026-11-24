"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import Swal from "sweetalert2";

interface RegisterForm {
  email: string;
  username: string;
  password: string;
  confirmpassword: string;
}

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const router = useRouter();

  const [passwordMatch, setPasswordMatch] = useState(false);
  const [loading, setLoading] = useState(false);

  // SweetAlert2 configuration
  const showAlert = Swal.mixin({
    background: "#181b23",
    color: "#ffffff",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#dc2626",
    buttonsStyling: true,
    customClass: {
      popup: "rounded-xl border border-gray-700",
      title: "text-white",
      htmlContainer: "text-gray-300",
    },
  });

  const onSubmit: SubmitHandler<RegisterForm> = async (data) => {
    // Password validation
    if (data.password !== data.confirmpassword) {
      setPasswordMatch(true);

      await showAlert.fire({
        title: "Password Mismatch!",
        text: "Password and confirm password do not match.",
        icon: "warning",
        confirmButtonText: "Try Again",
      });

      return;
    }

    setPasswordMatch(false);

    try {
      setLoading(true);

      const res = await axios.post("/api/register", {
        email: data.email,
        username: data.username,
        password: data.password,
      });

      if (res.data?.success) {
        reset();

        await showAlert.fire({
          title: "Registration Successful!",
          text: "Your account has been created successfully.",
          icon: "success",
          confirmButtonText: "Continue to Login",
        });

        router.replace("/login");
        router.refresh();
      } else {
        await showAlert.fire({
          title: "Registration Failed!",
          text: res.data?.message || "Unable to create account.",
          icon: "error",
          confirmButtonText: "Try Again",
        });
      }
    } catch (error) {
      console.error("Failed To Register User:", error);

      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Something went wrong."
        : "Something went wrong. Please try again.";

      await showAlert.fire({
        title: "Registration Failed!",
        text: message,
        icon: "error",
        confirmButtonText: "Try Again",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-[#1e293b] p-8 shadow-xl">

        <h1 className="mb-2 text-center text-3xl font-bold text-white">
          Welcome Legends
        </h1>

        <p className="mb-8 text-center text-gray-400">
          Register to your account
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          {/* Email */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address",
                },
              })}
              className="w-full rounded-lg border border-gray-600 bg-[#0f172a] px-4 py-3 text-white outline-none focus:border-blue-500"
            />

            {errors.email && (
              <p className="mt-1 text-sm text-red-400">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Username
            </label>

            <input
              type="text"
              placeholder="Enter your username"
              {...register("username", {
                required: "Username is required",
                minLength: {
                  value: 3,
                  message: "Username must be at least 3 characters",
                },
              })}
              className="w-full rounded-lg border border-gray-600 bg-[#0f172a] px-4 py-3 text-white outline-none focus:border-blue-500"
            />

            {errors.username && (
              <p className="mt-1 text-sm text-red-400">
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
              className="w-full rounded-lg border border-gray-600 bg-[#0f172a] px-4 py-3 text-white outline-none focus:border-blue-500"
            />

            {errors.password && (
              <p className="mt-1 text-sm text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Confirm Password
            </label>

            <input
              type="password"
              placeholder="Confirm your password"
              {...register("confirmpassword", {
                required: "Confirm Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
                validate: (value) =>
                  value === watch("password") ||
                  "Passwords do not match",
              })}
              className="w-full rounded-lg border border-gray-600 bg-[#0f172a] px-4 py-3 text-white outline-none focus:border-blue-500"
            />

            {errors.confirmpassword && (
              <p className="mt-1 text-sm text-red-400">
                {errors.confirmpassword.message}
              </p>
            )}

            {passwordMatch && (
              <p className="mt-1 text-sm text-red-400">
                Confirm Password Not Match
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <a
            href="/login"
            className="font-medium text-blue-400 hover:underline"
          >
            Sign in
          </a>
        </p>

      </div>
    </div>
  );
}