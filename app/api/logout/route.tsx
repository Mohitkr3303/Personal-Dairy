import { auth } from "@/lib/nextAuth";
import { UserModel } from "@/models/User.model";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const cookieStore = await cookies();

     if (!session?.user?.id) 
      NextResponse.json(
        { success: false, message: "User ID Not Found" },
        { status: 401 },
      );

    const findUser = await UserModel.findById(session?.user?.id);

    if (!findUser)
      NextResponse.json(
        { success: false, message: "User Not Found" },
        { status: 401 },
      );

    cookieStore.delete("accessToken");
    cookieStore.delete("refreshToken");

    findUser.refreshToken = null;
    const logoutUser = await findUser.save({ validateBeforeSave: false });

    if(!logoutUser) NextResponse.json(
        { success: false, message: "failed To Logout User" },
        { status: 401 },
      );


   return NextResponse.json(
        { success: true, message: "User Logout Successfully" },
        { status: 200 },
      );


  } catch (error) {
    console.error("Failed to logout user", error);
    return NextResponse.json(
      { success: false, message: "Failed To logout User" },
      { status: 500 },
    );
  }
}
