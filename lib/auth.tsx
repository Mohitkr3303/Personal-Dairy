import { UserModel } from "@/models/User.model";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function Auth_JWT() {
  try {
    const cookieStore = await cookies();

    const accessToken = cookieStore.get("accessToken")?.value;
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!accessToken && !refreshToken) {
      throw new Error("Unauthorized Request");
    }

    const accessSecret = process.env.ACCESS_TOKEN_SECRET;
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

    if (!accessSecret || !refreshSecret) {
      throw new Error("Token secrets are missing");
    }

    // 1. Verify access token first
    if (accessToken) {
      try {
        const decodedAccess = jwt.verify(accessToken, accessSecret);

        if (
          typeof decodedAccess !== "string" &&
          typeof decodedAccess._id === "string"
        ) {
          const user = await UserModel.findById(decodedAccess._id).select(
            "-password -refreshToken",
          );

          if (user) return user;
        }
      } catch {
        // Access token expired or invalid.
        // Try refresh token below.
      }
    }

    // 2. Verify refresh token
    if (!refreshToken) {
      throw new Error("Refresh Token Not Found");
    }

    const decodedRefresh = jwt.verify(refreshToken, refreshSecret);

    if (
      typeof decodedRefresh === "string" ||
      typeof decodedRefresh._id !== "string"
    ) {
      throw new Error("Invalid Refresh Token");
    }

    // 3. Find user
    const user = await UserModel.findById(decodedRefresh._id);

    if (!user || user.refreshToken !== refreshToken) {
      throw new Error("Invalid Refresh Token");
    }

    // 4. Generate new tokens
    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    // 5. Save rotated refresh token
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    // 6. Return user
    const safeUser = await UserModel.findById(user._id).select(
      "-password -refreshToken",
    );

    cookieStore.set("accessToken", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    cookieStore.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    if (!safeUser) {
      throw new Error("User Not Found");
    }

    return safeUser
  } catch (error) {
    console.error("Authentication Failed:", error);
    return null;
  }
}
