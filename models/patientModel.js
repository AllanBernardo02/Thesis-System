const mongoose = require("mongoose");

const patientSchema = mongoose.Schema(
  {
    userId: {
      type: "String",
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    middleName: {
      type: String,
      required: true,
    },
    birthday: {
      type: String,
      required: true,
    },
    civilStatus: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: Number,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    birthPlace: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const patientModel = mongoose.model("patients", patientSchema);

module.exports = patientModel;
