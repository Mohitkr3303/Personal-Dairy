import { dbConnect } from "@/lib/db";
import { auth } from "@/lib/nextAuth";
import { NoteModel } from "@/models/Note.model";
import { NextResponse } from "next/server";
import { connectRedis } from "@/lib/redis";

const cacheKeyFor = (userId: string) => `notes:${userId}`;

// Cache helpers: Redis failures should never break the API
async function getCache(key: string) {
  try {
    const redis = await connectRedis();
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.error("Redis get failed:", err);
    return null;
  }
}

async function setCache(key: string, value: unknown) {
  try {
    const redis = await connectRedis();
    await redis.set(key, JSON.stringify(value));
  } catch (err) {
    console.error("Redis set failed:", err);
  }
}

async function invalidateCache(key: string) {
  try {
    const redis = await connectRedis();
    await redis.del(key);
  } catch (err) {
    console.error("Redis del failed:", err);
  }
}

const unauthorized = () =>
  NextResponse.json(
    { success: false, message: "Unauthorized Request" },
    { status: 401 },
  );

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const userId = session.user.id;
    const cacheKey = cacheKeyFor(userId);

    const cachedNotes = await getCache(cacheKey);
    if (cachedNotes) {
      return NextResponse.json({
        success: true,
        message: "Notes fetched from Redis",
        Data: cachedNotes,
      });
    }

    await dbConnect();
    const notes = await NoteModel.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    await setCache(cacheKey, notes);

    return NextResponse.json({
      success: true,
      message: "Notes fetched from MongoDB",
      Data: notes,
    });
  } catch (error) {
    console.error("Failed to fetch notes:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch notes" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    await dbConnect();
    const { title, content } = await request.json();
    const userId = session.user.id;

    const noteBody = await NoteModel.create({ user: userId, title, content });

    if (!noteBody) {
      return NextResponse.json(
        { success: false, message: "Failed to create note" },
        { status: 500 },
      );
    }

    await invalidateCache(cacheKeyFor(userId));

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
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    await dbConnect();
    const { Id } = await request.json();
    const userId = session.user.id;

    // Scoped to the owner
    const noteBody = await NoteModel.findOneAndDelete({ _id: Id, user: userId });

    if (!noteBody) {
      return NextResponse.json(
        { success: false, message: "Note not found" },
        { status: 404 },
      );
    }

    await invalidateCache(cacheKeyFor(userId));

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
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    await dbConnect();
    const { title, content, Id } = await request.json();
    const userId = session.user.id;

    const noteUpdate = await NoteModel.findOneAndUpdate(
      { _id: Id, user: userId },
      { $set: { title, content } },
      { new: true },
    );

    if (!noteUpdate) {
      return NextResponse.json(
        { success: false, message: "Note not found" },
        { status: 404 },
      );
    }

    await invalidateCache(cacheKeyFor(userId));

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