import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const GuideSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    vehicle: {
      make: { type: String, required: true },
      model: { type: String, required: true },
      year: { type: Number, required: true },
      trim: { type: String, default: "" },
    },

    question: { type: String, required: true },
    aiAnswer: { type: String, required: true },

    // optional: store agent plan later if you want
    agentPlan: { type: Object, default: null },

    chat: { type: [ChatMessageSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Guide", GuideSchema);