import { dbConnect } from "@/lib/db";
import { UserModel } from "@/models/User.model";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    const { email, username, password } = body;

    if (Object.values(body).some((value) => value === ""))
      NextResponse.json(
        { success: false, message: "Email is empty" },
        { status: 400 },
      );

    const existingUser = await UserModel.findOne({
      $or: [{ email: email }, { username: username }],
    });

    if (!existingUser)
      NextResponse.json(
        { success: false, message: "User Already Exist" },
        { status: 500 },
      );

    const NewUser = await UserModel.create({
      email,
      username,
      password,
    });

    if (!NewUser)
      return NextResponse.json(
        { success: false, message: "Failed to Register User" },
        { status: 500 },
      );

    return NextResponse.json(
      { success: true, message: "User Create Successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed To Register User: ", error);
    return NextResponse.json(
      { success: false, message: "Failed to Register User" },
      { status: 500 },
    );
  }
}
