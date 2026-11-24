
import bcrypt from "bcryptjs";
import {
  models,
  model,
  Schema,
  HydratedDocument,
} from "mongoose";

interface OAuthAccount {
  provider: "google" | "github";
  providerAccountId: string;
}

interface User {
  email: string;
  username: string;
  password?: string;
  accounts: OAuthAccount[];
}

interface UserMethods {
  isPasswordCorrect(password: string): Promise<boolean>;
}

export type UserDocument = HydratedDocument<User, UserMethods>;

const UserSchema = new Schema<User, any, UserMethods>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [50, "Email cannot exceed 50 characters"],
    },

    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: [50, "Username cannot exceed 50 characters"],
    },

    password: {
      type: String,
      required: false,
      minlength: [6, "Password must be at least 6 characters"]
    },

    accounts: [
      {
        provider: {
          type: String,
          enum: ["github"],
          required: true,
        },
        providerAccountId: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

// Hash password only when provided or modified
UserSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;

  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password
UserSchema.methods.isPasswordCorrect = async function (
  password: string
): Promise<boolean> {
  if (!this.password) return false;

  return bcrypt.compare(password, this.password);
};

UserSchema.index(
  { "accounts.provider": 1, "accounts.providerAccountId": 1 },
  { unique: true, sparse: true }
);

export const UserModel =
  models.UserModel || model<User>("UserModel", UserSchema);
