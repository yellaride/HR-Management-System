import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["employee", "admin"],
      default: "employee",
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const User = models.User || model("User", UserSchema);
export default User;