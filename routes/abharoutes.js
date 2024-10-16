import { Router } from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const router = Router();
const { CLIENT_ID, CLIENT_SECRET, ABHA_BASE_URL } = process.env;

const generateToken = async (req, res, next) => {
  if (req.accessToken) {
    next();
    return;
  }
  console.log("Generating accessToken 1");
  //after 19.50 mins baad hi ye try wala block accessible hoga
  try {
    console.log("Generating accessToken 2");
    const response = await axios.post(
      `https://dev.abdm.gov.in/gateway/v0.5/sessions`,
      {
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
      }
    );
    req.accessToken = response.data.accessToken;
    next();
  } catch (error) {
    console.error(
      "Error during token generation:",
      error.response?.data || error.message
    );
    res
      .status(500)
      .json({ error: `Failed to generate token ,${error.message}` });
  }
};

router.post("/generate-otp", generateToken, async (req, res) => {
  const { aadhaar } = req.body;

  try {
    const response = await axios.post(
      `${ABHA_BASE_URL}/v1/registration/aadhaar/generateOtp`,
      { aadhaar },
      {
        headers: { Authorization: `Bearer ${req.accessToken}` },
      }
    );

    req.txnId = response.data.txnId;
    res.json({ success: "OTP generated", txnId: req.txnId });
  } catch (error) {
    console.error(
      "Error during OTP generation:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: `Failed to generate OTP, ${error.message}` });
  }
});

router.post("/create-health-id", generateToken, async (req, res) => {
  const { otp, txnId, username, mobile } = req.body;

  if (!req.accessToken) {
    return res.status(400).json({ error: "Missing authorization token" });
  }

  if (!txnId) {
    return res.status(400).json({ error: "Missing txnId" });
  }

  try {
    const response = await axios.post(
      `${ABHA_BASE_URL}/v1/registration/aadhaar/createHealthIdWithAadhaarOtp`,
      { otp, txnId, username, mobile },
      {
        headers: { Authorization: `Bearer ${req.accessToken}` },
      }
    );

    console.log("Response Data:", response.data);
    res.json({
      success: "OTP verified",
      txnId: req.txnId,
      healthIdData: response.data,
    });
  } catch (error) {
    console.error(
      "Error during OTP verification:",
      error.response?.data || error.message
    );
    res.status(500).json({
      error: "Failed to verify OTP",
      code: error.code || "UNKNOWN_ERROR",
      message: error.message || "An unexpected error occurred",
      details: error.response?.data?.details || [], 
    });
  }
});

export default router;
