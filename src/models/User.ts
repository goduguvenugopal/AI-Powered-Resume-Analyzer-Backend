import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  firebaseUid: string;       // Firebase UID (unique identifier)
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified: boolean;
  provider: string;          // "google.com"
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firebaseUid:   { type: String, required: true, unique: true },  // Firebase UID as primary ref
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName:   { type: String, required: true },
    photoURL:      { type: String },
    emailVerified: { type: Boolean, default: false },
    provider:      { type: String, default: "google.com" },
  },
  { timestamps: true }
);

// Index for fast lookup by firebaseUid
UserSchema.index({ firebaseUid: 1 });

export default mongoose.model<IUser>("User", UserSchema);