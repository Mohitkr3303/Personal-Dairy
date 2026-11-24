import { dbConnect } from "@/lib/db";
import { UserModel } from "@/models/User.model";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    if (Object.values(body).some((value) => value === ""))
      NextResponse.json(
        { success: false, message: "Value is Empty" },
        { status: 400 },
      );

    const { username, password } = body;

    console.log("username, password :",username, password );

    const user = await UserModel.findOne({
      $or: [{ username: username }, { email: username }],
    });

    if (!user)
      NextResponse.json(
        {
          success: false,
          message: "User Not Found",
        },
        { status: 404 },
      );

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid)
      NextResponse.json(
        {
          success: false,
          message: "Invalid password",
        },
        { status: 401 },
      );

    // const accessToken = await user.generateAccessToken();
    // const refreshToken = await user.generateRefreshToken();

    // user.refreshToken = refreshToken;

    // await user.save({ validateBeforeSave: false });

    const getLoginUser = await UserModel.findById(user._id).select(
      "-password -refreshToken",
    );

    // const cookieStore = await cookies();
    // cookieStore.set("accessToken", accessToken, {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: "none",
    // });
    // cookieStore.set("refreshToken", refreshToken, {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: "none",
    // });

    return NextResponse.json(
      { success: true, message: "User Login Successfully", Data: getLoginUser },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to login user", error);
    return NextResponse.json(
      { success: false, message: "Failed To Login User" },
      { status: 500 },
    );
  }
}