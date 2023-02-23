const express = require("express");
const userModel = require("../models/userModel.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/authMiddleware.js");
const { response } = require("express");
const doctorModel = require("../models/doctorModel.js");
const message = require("../sms/sms.js");
const appointmentModel = require("../models/appointmentModel.js");
const moment = require("moment");
const doctorAccountModel = require("../models/doctorAccountModel.js");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const userExists = await userModel.findOne({ email: req.body.email });
    if (userExists) {
      return res
        .status(200)
        .send({ message: "User already exists", success: false });
    }

    const password = req.body.password;

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);
    req.body.password = hashedPassword;

    const newUser = new userModel(req.body);
    await newUser.save();
    res.status(200).send({
      message: "User created successfully",
      success: true,
      result: newUser,
    });
  } catch (error) {
    console.log("Register error", error);
    res
      .status(500)
      .send({ message: "Error creating user", success: false, error });
  }
});

router.post("/login", async (req, res) => {
  const { email, password, usertype } = req.body;

  if (usertype === "patient") {
    try {
      const user = await userModel.findOne({ email });
      if (!user) {
        return res
          .status(200)
          .send({ message: "User not found", success: false });
      }

      if (user.isBlocked) {
        return res.send({
          message: "Your account is blocked, please contact Administrator",
          success: false,
          data: null,
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(200)
          .send({ message: "Password is incorrect", success: false });
      } else {
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
          expiresIn: "8h",
        });
        res.send({ message: "Login successful", success: true, data: token });
      }
    } catch (error) {
      console.log("login error", error);
      res
        .status(500)
        .send({ message: "Error logging In", success: false, error });
    }
  } else if (usertype === "doctor") {
    try {
      const user = await doctorAccountModel.findOne({ email });
      if (!user) {
        return res
          .status(200)
          .send({ message: "Doctor not found", success: false });
      }

      if (user.isBlocked) {
        return res.send({
          message: "Your account is blocked, please contact Administrator",
          success: false,
          data: null,
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(200)
          .send({ message: "Password is incorrect", success: false });
      } else {
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
          expiresIn: "8h",
        });
        res.send({ message: "Login successful", success: true, data: token });
      }
    } catch (error) {
      console.log("login error", error);
      res
        .status(500)
        .send({ message: "Error logging In", success: false, error });
    }
  } else if (usertype === "admin") {
    try {
      const user = await userModel.findOne({ email });
      if (!user) {
        return res
          .status(200)
          .send({ message: "User not found", success: false });
      }

      if (user.isBlocked) {
        return res.send({
          message: "Your account is blocked, please contact Administrator",
          success: false,
          data: null,
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(200)
          .send({ message: "Password is incorrect", success: false });
      } else {
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
          expiresIn: "8h",
        });
        res.send({ message: "Login successful", success: true, data: token });
      }
    } catch (error) {
      console.log("login error", error);
      res
        .status(500)
        .send({ message: "Error logging In", success: false, error });
    }
  }
});

router.post("/get-user-info-by-id", authMiddleware, async (req, res) => {
  try {
    const user =
      (await userModel.findOne({ _id: req.body.userId })) ||
      (await doctorAccountModel.findOne({ _id: req.body.userId }));
    user.password = undefined;
    if (!user) {
      return res
        .status(200)
        .send({ message: "User not found", success: false });
    } else {
      res.status(200).send({
        success: true,
        data: user,
      });
    }
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error getting user info", success: false, error });
  }
});

router.post(
  "/applyDoctor-account",
  authMiddleware,
  message,
  async (req, res) => {
    try {
      const newDoctor = new doctorModel({ ...req.body, status: "pending" });
      await newDoctor.save();
      const adminUser = await userModel.findOne({ isAdmin: true });

      const unseenNotification = adminUser.unseenNotification;
      unseenNotification.push({
        type: "new-doctor-request",
        message: `${newDoctor.firstName} ${newDoctor.lastName} has applied for a doctor account`,
        data: {
          doctorId: newDoctor._id,
          name: newDoctor.firstName + " " + newDoctor.lastName,
        },
        onclickPath: "/admin/doctorslist",
      });
      await userModel.findByIdAndUpdate(adminUser._id, { unseenNotification });
      res.status(200).send({
        success: true,
        message: "Doctors account applied successfully",
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Error applying doctor account",
        success: false,
        error,
      });
    }
  }
);

router.post(
  "/mark-all-notifications-as-seen",
  authMiddleware,
  async (req, res) => {
    try {
      const user = await userModel.findOne({ _id: req.body.userId });
      const unseenNotification = user.unseenNotification;
      const seenNotification = user.seenNotification;
      seenNotification.push(...unseenNotification);
      user.unseenNotification = [];
      user.seenNotification = seenNotification;
      const updatedUser = await user.save();
      updatedUser.password = undefined;
      res.status(200).send({
        success: true,
        message: "All notifications marked as seen",
        data: updatedUser,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Error applying doctor account",
        success: false,
        error,
      });
    }
  }
);

router.post("/delete-all-notifications", authMiddleware, async (req, res) => {
  try {
    const user = await userModel.findOne({ _id: req.body.userId });
    user.seenNotification = [];
    user.unseenNotification = [];
    const updatedUser = await user.save();
    updatedUser.password = undefined;
    res.status(200).send({
      success: true,
      message: "All notifications marked as seen",
      data: updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error applying doctor account",
      success: false,
      error,
    });
  }
});

router.get("/get-all-approved-doctors", authMiddleware, async (req, res) => {
  try {
    const doctors = await doctorModel.find({ status: "approved" });
    res.status(200).send({
      message: "Doctors fetched successfully",
      success: true,
      data: doctors,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "error fecthed approved doctors",
      success: false,
      error,
    });
  }
});

router.post("/book-appointment", authMiddleware, message, async (req, res) => {
  try {
    console.log(req.body.phoneNumber);
    console.log(req.body.date);

    req.body.status = "pending";
    req.body.date = moment(req.body.date, "DD-MM-YYYY").toISOString();
    req.body.time = moment(req.body.time, "hh:mm a").toISOString();
    const newAppointment = new appointmentModel(req.body);
    await newAppointment.save();

    //pushing notifications to doctor based on his/her userId
    const user = await userModel.findOne({ _id: req.body.doctorInfo.userId });
    user.unseenNotification.push({
      type: "new-appointment-request",
      message: `A new appointment request has been mad by ${req.body.userInfo.name} `,
      onClickPath: "/doctor/appointments",
    });
    await user.save();
    res.status(200).send({
      message: "Appointment Booked successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    res
      .status(404)
      .send({ message: "Error Booking Appointment", success: false, error });
  }
});

router.post("/check-booking-availability", authMiddleware, async (req, res) => {
  try {
    const date = moment(req.body.date, "DD-MM-YYYY").toISOString();
    const fromTime = moment(req.body.time, "hh:mm a")
      .subtract(59, "minutes")
      .toISOString();
    const toTime = moment(req.body.time, "hh:mm a")
      .add(59, "minutes")
      .toISOString();
    const doctorId = req.body.doctorId;
    const appointments = await appointmentModel.find({
      doctorId,
      date,
      time: { $gte: fromTime, $lte: toTime },
    });

    if (appointments.length > 0) {
      return res.status(200).send({
        message: "Appointment not available",
        success: false,
      });
    } else {
      return res.status(200).send({
        message: "Appointment available",
        success: true,
      });
    }
  } catch (error) {
    console.log(error);
    res
      .status(404)
      .send({ message: "Error Booking Appointment", success: false, error });
  }
});

router.get("/get-appointments-by-user-id", authMiddleware, async (req, res) => {
  try {
    const appointments = await appointmentModel.find({
      userId: req.body.userId,
    });
    res.status(200).send({
      message: "Appointments fetched successfully",
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "error fetching appointments",
      success: false,
      error,
    });
  }
});

// router.get("/", (req, res) => {
//   res.send("Welcome Allan API");
// });

// router.get("/", authMiddleware, async (req, res) => {
//   await userModel
//     .find()
//     .then((use) => {
//       res.send(use);
//     })
//     .catch((err) => {
//       res.status(600), send({ message: err.message });
//     });
// });

module.exports = router;
