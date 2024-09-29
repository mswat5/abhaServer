import { Router } from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const router = Router();
const { CLIENT_ID, CLIENT_SECRET, ABHA_BASE_URL } = process.env;

let accessToken = null;
let txnId = null;

const generateToken = async (req, res, next) => {
  if (accessToken) {
    req.token = accessToken;
    next();
    return;
  }

  try {
    const response = await axios.post(
      `https://dev.abdm.gov.in/gateway/v0.5/sessions`,
      {
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
      }
    );

    accessToken = response.data.accessToken;
    req.token = accessToken;
    next();
  } catch (error) {
    console.error(
      "Error during token generation:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to generate token" });
  }
};

router.post("/generate-otp", generateToken, async (req, res) => {
  const { aadhaar } = req.body;

  try {
    const response = await axios.post(
      `${ABHA_BASE_URL}/v1/registration/aadhaar/generateOtp`,
      { aadhaar },
      {
        headers: {
          Authorization: `Bearer ${req.token}`,
          Host: "healthidsbx.abdm.gov.in",
        },
      }
    );

    txnId = response.data.txnId;
    res.json({ success: "OTP generated" });
  } catch (error) {
    console.error(
      "Error during OTP generation:",
      error.response?.data || error.message || error
    );
    res.status(500).json({
      error: "Failed to generate OTP",
      error: error.response?.data || error.message || error,
    });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { otp } = req.body;

  if (!accessToken) {
    return res.status(400).json({ error: "Missing authorization token" });
  }

  if (!txnId) {
    return res.status(400).json({ error: "Missing txnId" });
  }

  try {
    const response = await axios.post(
      `${ABHA_BASE_URL}/v1/registration/aadhaar/verifyOTP`,
      { otp, txnId },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    res.json({ success: "OTP verified", txnId });
  } catch (error) {
    console.error(
      "Error during OTP verification:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

router.post("/generate-mobile-otp", async (req, res) => {
  const { mobile } = req.body;
  if (!accessToken) {
    return res.status(400).json({ error: "Missing authorization token" });
  }

  if (!txnId) {
    return res.status(400).json({ error: "Missing txnId" });
  }

  try {
    const response = await axios.post(
      `${ABHA_BASE_URL}/v1/registration/aadhaar/generateMobileOTP`,
      { txnId, mobile },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    res.json({
      success: "Mobile OTP generated",
      txnId,
      txnid: response.data.txnId,
    });
  } catch (error) {
    console.error(
      "Error during mobile OTP generation:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to generate mobile OTP" });
  }
});

router.post("/verify-mobile-otp", async (req, res) => {
  const { otp } = req.body;

  if (!accessToken) {
    return res.status(400).json({ error: "Missing authorization token" });
  }

  if (!txnId) {
    return res.status(400).json({ error: "Missing txnId" });
  }

  try {
    const response = await axios.post(
      `${ABHA_BASE_URL}/v1/registration/aadhaar/verifyMobileOTP`,
      { otp, txnId },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    res.json({
      success: "Mobile OTP verified",
      txnId,
      txnid: response.data.txnId,
    });
  } catch (error) {
    console.error(
      "Error during mobile OTP verification:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to verify mobile OTP" });
  }
});

router.post("/create-health-id", async (req, res) => {
  if (!accessToken) {
    return res.status(400).json({ error: "Missing authorization token" });
  }

  if (!txnId) {
    return res.status(400).json({ error: "Missing txnId" });
  }

  try {
    const response = await axios.post(
      `${ABHA_BASE_URL}/v1/registration/aadhaar/createHealthIdWithPreVerified`,
      { txnId },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    res.json({
      success: "Health ID created",
      healthId: response.data.healthId,
    });
  } catch (error) {
    console.error(
      "Error during Health ID creation:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to create Health ID" });
  }
});

export default router;
