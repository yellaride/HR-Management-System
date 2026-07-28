import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDepartmentHead extends Document {
  department: string;
  userId: mongoose.Types.ObjectId;
  assignedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentHeadSchema = new Schema<IDepartmentHead>(
  {
    // One head per department at a time
    department: { type: String, required: true, unique: true, trim: true },
    // One user can head at most one department
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    assignedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

export const DepartmentHead: Model<IDepartmentHead> =
  mongoose.models.DepartmentHead ||
  mongoose.model<IDepartmentHead>("DepartmentHead", DepartmentHeadSchema);
