const mongoose = require("mongoose");

const clinicService = mongoose.Schema({
  userId: {
    type: "String",
    required: true,
  },
  serviceName: {
    type: String,
    required: true,
  },
  serviceDescription: {
    type: String,
    required: true,
  },
});

const clinicServiceModel = mongoose.model("clinicService", clinicService);

module.exports = clinicServiceModel;
