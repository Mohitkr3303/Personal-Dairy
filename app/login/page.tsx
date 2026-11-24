"use client";

import axios from "axios";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import Swal from "sweetalert2";

interface LoginForm {
  username: string;
  password: string;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginForm>();

  const router = useRouter();

  // SweetAlert2 common configuration
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

  const onSubmit: SubmitHandler<LoginForm> = async (data) => {
    try {
      setLoading(true);

      const result = await signIn("credentials", {
        username: data.username,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        await showAlert.fire({
          title: "Login Failed!",
          text: "Invalid username or password.",
          icon: "error",
          confirmButtonText: "Try Again",
        });

        return;
      }

      reset();

      await showAlert.fire({
        title: "Login Successful!",
        text: "Welcome back!",
        icon: "success",
        confirmButtonText: "Continue",
      });

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Failed To Login User:", error);

      await showAlert.fire({
        title: "Login Failed!",
        text: "Something went wrong. Please try again.",
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
          Welcome Back
        </h1>

        <p className="mb-8 text-center text-gray-400">Login to your account</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Username & Email */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Username & Email
            </label>

            <input
              type="text"
              placeholder="Enter your username or email"
              {...register("username", {
                required: "Username & Email is required",
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

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-600" />
            <span className="text-sm text-gray-400">OR CONTINUE WITH</span>
            <div className="h-px flex-1 bg-gray-600" />
          </div>

          <div className="space-y-3">

            <button
              type="button"
              onClick={() => signIn("github", { redirectTo: "/" })}
              className="w-full rounded-lg border border-gray-600 bg-[#0f172a] py-3 font-medium text-white transition hover:bg-gray-700"
            >
              Continue with GitHub
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Don't have an account?{" "}
          <a
            href="/register"
            className="font-medium text-blue-400 hover:underline"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
