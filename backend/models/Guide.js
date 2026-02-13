import mongoose from "mongoose";

const GuideSchema = new mongoose.Schema(
  {
    vehicle: {
      make: { type: String, required: true, trim: true },
      model: { type: String, required: true, trim: true },
      year: { type: String, required: true, trim: true },
    },
    question: { type: String, required: true, trim: true },
    aiAnswer: { type: String, required: true },
    // Optional: store chat history later (not required)
  },
  { timestamps: true }
);

export default mongoose.model("Guide", GuideSchema);
