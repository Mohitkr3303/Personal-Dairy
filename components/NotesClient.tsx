"use client";

import axios from "axios";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";

interface FormValue {
  title: string;
  content: string;
}

interface Note {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
interface User {
  _id: string;
  username: string;
  email: string;
}

interface NotesResponse {
  Data: Note[];
  success: boolean;
  user: User;
}

function NotesClient() {
  const [getNotes, setgetNotes] = useState<Note[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshNotes, setRefreshNotes] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValue>();

  const route = useRouter();

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

  // Fetch Notes
  useEffect(() => {
    fetchNotes();
  }, [refreshNotes]);

  async function logoutUser() {
    const result = await showAlert.fire({
      title: "Are you sure?",
      text: "Do you want to logout from your account?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Logout!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await signOut({
      redirectTo: "/login",
    });
    } catch (error) {
      console.error("Failed to Logout User", error);

      await showAlert.fire({
        title: "Error!",
        text: "Failed to logout user.",
        icon: "error",
      });
    }
  }

  async function cancelEditHandler() {
    const result = await showAlert.fire({
      title: "Discard Changes?",
      text: "Your unsaved changes will be lost.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Discard!",
      cancelButtonText: "Continue Editing",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setEditingNote(null);

    reset({
      title: "",
      content: "",
    });
  }

  async function fetchNotes() {
    setLoading(true);

    try {
      const res = await axios.get<NotesResponse>("/api/notes");

      if (res.data?.success) {
        setgetNotes(res.data.Data);
      }
    } catch (error) {
      console.error("Failed to Get Notes", error);

      await showAlert.fire({
        title: "Error!",
        text: "Failed to fetch notes.",
        icon: "error",
      });
      route.push("/login");
    } finally {
      setLoading(false);
    }
  }

  // Create And Update Note
  const onSubmit = async (data: FormValue) => {
    const isEditing = editingNote !== null;

    const result = await showAlert.fire({
      title: isEditing ? "Update Note?" : "Create Note?",
      text: isEditing
        ? "Do you want to save these changes?"
        : "Do you want to create this note?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: isEditing ? "Yes, Update!" : "Yes, Create!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);

      let res;

      if (editingNote) {
        // UPDATE NOTE
        res = await axios.patch("/api/notes", {
          Id: editingNote._id,
          ...data,
        });
      } else {
        // CREATE NOTE
        res = await axios.post("/api/notes", data);
      }

      if (res.data?.success) {
        await showAlert.fire({
          title: isEditing ? "Updated Successfully!" : "Created Successfully!",
          text: isEditing
            ? "Your note has been updated."
            : "Your note has been created.",
          icon: "success",
        });

        reset({
          title: "",
          content: "",
        });
        setEditingNote(null);
        setRefreshNotes((prev) => !prev);
      } else {
        await showAlert.fire({
          title: "Failed!",
          text: res.data?.message || "Something went wrong.",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Failed to Save Note:", error);

      await showAlert.fire({
        title: "Error!",
        text: isEditing
          ? "Failed to update your note."
          : "Failed to create your note.",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete Note
  async function NoteDeleteHandler(id: string) {
    const result = await showAlert.fire({
      title: "Are you sure?",
      text: "You won't be able to recover this note!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete!",
      cancelButtonText: "No, Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);

      const res = await axios.delete("/api/notes", {
        data: {
          Id: id,
        },
      });

      if (res.data?.success) {
        await showAlert.fire({
          title: "Deleted!",
          text: "Your note has been deleted.",
          icon: "success",
        });

        setRefreshNotes((prev) => !prev);
      } else {
        await showAlert.fire({
          title: "Failed!",
          text: res.data?.message || "Unable to delete note.",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Failed to Delete Notes", error);

      await showAlert.fire({
        title: "Error!",
        text: "Failed to delete your note.",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function NoteUpdateHandler(note: Note) {
    setEditingNote(note);
    reset({
      title: note.title,
      content: note.content,
    });
  }

  return (
    <div className="min-h-screen bg-[#0f1117] p-6 md:p-10 text-white">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">My Own Dairy</h1>

            <p className="text-gray-400 mt-2">
              Capture your thoughts, ideas and reminders.
            </p>
          </div>
          <div>
            <div className="flex justify-center items-center gap-3">
              <span>
                <Image src="/hacker.png" alt="Hacker" width={50} height={50} />
              </span>
              <span className="font-bold">{user?.username}</span>
            </div>
            <button
              onClick={() => logoutUser()}
              className="bg-red-500/80 px-4 py-2 rounded"
              type="submit"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Create Note */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-[#181b23] p-6 rounded-xl border border-gray-800 space-y-4"
        >
          <h2 className="text-xl font-semibold text-gray-200">
            {editingNote ? "Update Thoughts" : "Create New Thoughts"}
          </h2>

          {/* Title */}
          <input
            {...register("title", {
              required: "Title is Required",
            })}
            type="text"
            placeholder="Thoughts title..."
            aria-invalid={!!errors.title}
            className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
          />

          {errors.title && (
            <p className="text-red-400 text-sm" role="alert">
              {errors.title.message}
            </p>
          )}

          {/* Content */}
          <textarea
            {...register("content", {
              required: "Content is Required",
            })}
            placeholder="Write your thoughts here..."
            rows={5}
            aria-invalid={!!errors.content}
            className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 resize-none outline-none focus:ring-2 focus:ring-blue-500"
          />

          {errors.content && (
            <p className="text-red-400 text-sm" role="alert">
              {errors.content.message}
            </p>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-2.5">
            {editingNote && (
              <button
                type="button"
                onClick={cancelEditHandler}
                className="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : editingNote
                  ? "Update thoughts"
                  : "Save thoughts"}
            </button>
          </div>
        </form>

        {/* Notes List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-200">Your Thoughts</h2>

          {loading && getNotes?.length === 0 ? (
            <p className="text-gray-400">Loading thoughts...</p>
          ) : getNotes?.length === 0 ? (
            <p className="text-gray-400">
              No thoughts found. Create your first thoughts!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getNotes?.map((note) => {
                const date = new Date(note.updatedAt);

                const formattedDate = date.toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                  timeZone: "Asia/Kolkata",
                });

                return (
                  <div
                    key={note._id}
                    className="bg-[#181b23] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition"
                  >
                    <h3 className="font-semibold text-gray-100 text-lg">
                      {note.title}
                    </h3>

                    <p className="text-gray-400 mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>

                    <div className="flex justify-between items-center mt-5">
                      <span className="text-xs text-gray-500">
                        {formattedDate}
                      </span>

                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => NoteUpdateHandler(note)}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium disabled:opacity-50"
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => NoteDeleteHandler(note._id)}
                        className="text-red-400 hover:text-red-300 text-sm font-medium disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotesClient;
