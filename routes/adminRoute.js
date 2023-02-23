const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userModel = require("../models/userModel.js");
const doctorModel = require("../models/doctorModel.js");
const authMiddleware = require("../middlewares/authMiddleware.js");
const patientModel = require("../models/patientModel.js");
const consultationModel = require("../models/consultationModel.js");
const doctorAccountModel = require("../models/doctorAccountModel.js");
const clinicServiceModel = require("../models/clinicServiceModel.js");

router.get("/get-all-doctors", authMiddleware, async (req, res) => {
  try {
    const doctors = await doctorModel.find({});
    res.status(200).send({
      message: "Doctors fetched successfully",
      success: true,
      data: doctors,
    });
  } catch (error) {
    console.log(error);
    res.status(404).send({ message: "ERROR", success: false, error });
  }
});

router.get("/get-all-users", authMiddleware, async (req, res) => {
  try {
    const users = await userModel.find({});
    res.status(200).send({
      message: "Users fetched successfully",
      success: true,
      data: users,
    });
  } catch (error) {
    console.log(error);
    res
      .status(404)
      .send({ message: "Error fetching users", success: false, error });
  }
});

router.post("/change-doctor-status", authMiddleware, async (req, res) => {
  try {
    const { doctorId, status, userId } = req.body;
    const doctor = await doctorModel.findByIdAndUpdate(doctorId, {
      status,
    });
    // res.status(200).send({
    //   message: "Doctor status updated successfully",
    //   success: true,
    //   data: doctor,
    // });
    const user =
      (await userModel.findOne({ _id: doctor.userId })) ||
      (await doctorAccountModel.findOne({ _id: doctor.userId }));
    console.log("???", user);

    const unseenNotification = user.unseenNotification;
    unseenNotification.push({
      type: "new-doctor-request-changed",
      message: `Your Doctor Account has been ${status}`,

      onclickPath: "/notifications",
    });

    user.isDoctor = status === "approved" ? true : false;
    await user.save();

    res.status(200).send({
      message: "Doctor status updated successfully",
      success: true,
      data: doctor,
    });
  } catch (error) {
    console.log(error);
    res
      .status(404)
      .send({ message: "Error fetching users", success: false, error });
  }
});

router.post("/update-user-permissions", authMiddleware, async (req, res) => {
  try {
    await userModel.findByIdAndUpdate(req.body._id, req.body);
    res.send({
      message: "User permissions updated successfully",
      success: true,
      data: null,
    });
  } catch {
    res.send({
      message: error.message,
      success: false,
      data: null,
    });
  }
});

router.post("/patient-record", authMiddleware, async (req, res) => {
  const patient = req.body;

  const newPatient = new patientModel({ ...patient });

  try {
    await newPatient.save();
    res.status(201).send({
      success: true,
      message: "Patient saved successfully",
      data: newPatient,
    });
  } catch (error) {
    res.status(500).send({
      message: "Error applying doctor account",
      success: false,
      error,
    });
  }
});

router.get("/get-all-patient", authMiddleware, async (req, res) => {
  try {
    const patient = await patientModel.find({ userId: req.body.userId });

    res.status(200).send({
      message: "Patient fetched Succesfully",
      success: true,
      data: patient,
    });
  } catch (error) {
    console.log(error);
    res.status(406).send({ message: "ERROR", success: false, error });
  }
});

router.delete(
  "/delete-patient-record/:id",
  authMiddleware,
  async (req, res) => {
    const id = req.params.id;
    const deletePatient = await patientModel.findByIdAndRemove(id);

    res.status(201).send({
      message: "Delete patient successfully",
      success: true,
      data: deletePatient,
    });
  }
);

router.post("/get-patient-info-by-id", authMiddleware, async (req, res) => {
  try {
    const patient = await patientModel.findOne({ _id: req.body.patientId });

    res.status(200).send({
      success: true,
      message: "Patient info Fetched successfully",
      data: patient,
    });
  } catch (error) {
    res.status(500).send({
      message: "Error getting doctor info",
      success: false,
      error,
    });
  }
});

router.post(
  "/get-patient-info-by-patient-id",
  authMiddleware,
  async (req, res) => {
    try {
      const patient = await patientModel.findOne({
        patientId: req.body.patientId,
      });
      console.log("ano kaya?", patient);

      res.status(200).send({
        success: true,
        message: "Patient info Fetched successfully",
        data: patient,
      });
    } catch (error) {
      res.status(500).send({
        message: "Error getting doctor info",
        success: false,
        error,
      });
    }
  }
);

router.patch(
  "/update-patient-profile/:id",
  authMiddleware,
  async (req, res) => {
    const id = req.params.id;
    const {
      firstName,
      lastName,
      middleName,
      birthday,
      civilStatus,
      gender,
      mobileNumber,
      address,
      birthPlace,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(404).send(`No post with id: ${id}`);

    const updatePatient = {
      firstName,
      lastName,
      middleName,
      birthday,
      civilStatus,
      gender,
      mobileNumber,
      address,
      birthPlace,
      _id: id,
    };
    try {
      const patient = await patientModel.findByIdAndUpdate(id, updatePatient);
      res.status(200).send({
        success: true,
        message: "Patient profile Updated successfully",
        data: patient,
      });
    } catch (error) {
      res.status(500).send({
        message: "Error getting doctor info",
        success: false,
        error,
      });
    }
  }
);

router.post(
  "/patient-consulation-history",
  authMiddleware,
  async (req, res) => {
    const patientConsultation = req.body; //get data from client

    const newPatientConsultation = new consultationModel({
      ...patientConsultation,
    });

    try {
      await newPatientConsultation.save();
      res.status(201).send({
        success: true,
        message: "Patient Consultation saved successfully",
        data: newPatientConsultation,
      });
    } catch (error) {
      res.status(500).send({
        message: "Error for saving Patient Consultation",
        success: false,
        error,
      });
    }
  }
);

router.post(
  "/get-patient-consultations-history",
  authMiddleware,
  async (req, res) => {
    try {
      const patientConsultation = await consultationModel.find({
        patientId: req.body.patientId,
        userId: req.body.userId,
      });

      res.status(200).send({
        message: "Patient Consultation fetched Succesfully",
        success: true,
        data: patientConsultation,
      });
    } catch (error) {
      console.log(error);
      res.status(406).send({ message: "ERROR", success: false, error });
    }
  }
);

router.post(
  "/get-patient-consultation-history-by-id",
  authMiddleware,
  async (req, res) => {
    try {
      const patient = await consultationModel.findOne({
        _id: req.body.patientId,
      });

      res.status(200).send({
        success: true,
        message: "Consultation info Fetched successfully",
        data: patient,
      });
    } catch (error) {
      res.status(500).send({
        message: "Error getting doctor info",
        success: false,
        error,
      });
    }
  }
);

router.post("/create-doctor-account", authMiddleware, async (req, res) => {
  try {
    const userExists = await doctorAccountModel.findOne({
      email: req.body.email,
    });
    if (userExists) {
      return res
        .status(200)
        .send({ message: "Doctor already exists", success: false });
    }

    const password = req.body.password;

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);
    req.body.password = hashedPassword;

    const newDoctor = new doctorAccountModel({ ...req.body });
    await newDoctor.save();
    res
      .status(200)
      .send({ message: "Doctor created successfully", success: true });
  } catch (error) {
    console.log("Register error", error);
    res
      .status(500)
      .send({ message: "Error creating doctor", success: false, error });
  }
});

router.get("/get-doctors-account", authMiddleware, async (req, res) => {
  try {
    const doctors = await doctorAccountModel.find({});
    res.status(200).send({
      message: "Doctor fetched successfully",
      success: true,
      data: doctors,
    });
  } catch (error) {
    console.log(error);
    res
      .status(404)
      .send({ message: "Error fetching users", success: false, error });
  }
});

router.post("/create-clinic-services", authMiddleware, async (req, res) => {
  const clinic = req.body;
  const clinicService = new clinicServiceModel({ ...clinic });

  try {
    await clinicService.save();
    res.status(202).send({
      message: "Clinic was successfully created",
      success: true,
      data: clinicService,
    });
  } catch (error) {
    res.status(500).send({
      message: "An error occurred",
      success: false,
      error,
    });
  }
});

//get clinic service
router.get("/get-clinic-services", authMiddleware, async (req, res) => {
  try {
    const clinicService = await clinicServiceModel.find({});
    res.status(200).send({
      message: "Clinic Services fetched Successfully",
      success: true,
      data: clinicService,
    });
  } catch (error) {
    res.status(404).send({
      message: "Clinic Services fetched Error",
      success: false,
      error,
    });
  }
});

router.delete(
  "/delete-clinic-service/:id",
  authMiddleware,
  async (req, res) => {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(404).send(`No post with id: ${id}`);

    const clinicService = await clinicServiceModel.findByIdAndRemove(id);

    res.status(201).send({
      message: "Clinic service deleted successfully",
      success: true,
      data: clinicService,
    });
  }
);

router.patch("/update-clinic-service/:id", authMiddleware, async (req, res) => {
  const id = req.params.id;
  const { serviceName, serviceDescription } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(404).send(`No post with id: ${id}`);

  const updateClinicService = {
    serviceName,
    serviceDescription,
    _id: id,
  };

  try {
    const clinic = await clinicServiceModel.findByIdAndUpdate(
      id,
      updateClinicService
    );
    res.status(200).send({
      success: true,
      message: "Clinic service updated successfully",
      data: clinic,
    });
  } catch (error) {
    res.status(500).send({
      message: "Error updating",
      success: false,
      error,
    });
  }
});

router.get("/get-clinic-service-name", authMiddleware, async (req, res) => {
  try {
    const clinicService = await clinicServiceModel.find({});
    res.status(200).send({
      message: "Clinic Services fetched Successfully",
      success: true,
      data: clinicService,
    });
  } catch (error) {
    res.status(404).send({
      message: "Clinic Services fetched Error",
      success: false,
      error,
    });
  }
});

module.exports = router;
