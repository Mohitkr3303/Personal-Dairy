import { Auth_JWT } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { auth } from "@/lib/nextAuth";
import { NoteModel } from "@/models/Note.model";
import { NextResponse } from "next/server";


export async function GET() {
  try {
    await dbConnect();

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized Request",
        },
        { status: 401 }
      );
    }

    const notes = await NoteModel.find({
      user: session.user.id,
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      message: notes.length
        ? "Notes fetched successfully"
        : "No notes found",
      data: notes,
    });
  } catch (error) {
    console.error("Failed to get notes:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to get notes",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const session = await auth();
    const { title, content } = await request.json();
    const noteBody = await NoteModel.create({
      user: session?.user?.id,
      title,
      content,
    });

    console.log("noteBody: ", title, content);

    if (!noteBody)
      NextResponse.json(
        { success: false, message: "Failed to create note" },
        { status: 500 },
      );

    return NextResponse.json(
      { success: true, message: "Create note successfully", Data: noteBody },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create note: ", error);
    return NextResponse.json(
      { success: false, message: "Failed to create note" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { Id } = await request.json();

    console.log("Id: ", Id);
    const noteBody = await NoteModel.findByIdAndDelete(Id);

    if (!noteBody)
      NextResponse.json(
        { success: false, message: "Failed to Delete Note" },
        { status: 400 },
      );

    return NextResponse.json(
      { success: true, message: "Delete Note Successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed To Delete Note: ", error);
    return NextResponse.json(
      { success: false, message: "Failed to Delete Note" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { title, content, Id } = await request.json();
    const noteUpdate = await NoteModel.findByIdAndUpdate(Id, {
      $set: {
        title,
        content,
      },
    });

    if (!noteUpdate)
      NextResponse.json(
        { success: false, message: "Note not found" },
        { status: 400 },
      );

    return NextResponse.json(
      { success: true, message: "Update Note Successfully", Data: noteUpdate },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed To Update Note: ", error);
    return NextResponse.json(
      { success: false, message: "Failed to Update Note" },
      { status: 500 },
    );
  }
}
