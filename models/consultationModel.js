const mongoose = require("mongoose");

const consultationSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    patientId: {
      type: String,
      required: true,
    },
    consultationName: {
      type: String,
      required: true,
    },
    bloodPressure: {
      type: String,
      required: true,
    },
    weight: {
      type: String,
      required: true,
    },
    temparature: {
      type: String,
      required: true,
    },
    pulseRate: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const consultationModel = mongoose.model(
  "patientConsultation",
  consultationSchema
);

module.exports = consultationModel;
