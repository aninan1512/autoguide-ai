import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

const GuideSchema = new mongoose.Schema(
  {
    vehicle: {
      make: { type: String, required: true, trim: true },
      model: { type: String, required: true, trim: true },
      year: { type: String, required: true, trim: true },
    },
    question: { type: String, required: true, trim: true },
    aiAnswer: { type: String, required: true },

    // ✅ NEW: persistent chat history per guide
    chat: { type: [ChatMessageSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Guide", GuideSchema);

