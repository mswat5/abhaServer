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

  try {
    const response = await axios.post(
      `https://dev.abdm.gov.in/gateway/v0.5/sessions`,
      {
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
      }
    );

    req.accessToken = response.data.accessToken;
    console.log("Generated accessToken:", req.accessToken);
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
    res.status(500).json({ error: "Failed to generate OTP" });
  }
});

router.post("/verify-otp", generateToken, async (req, res) => {
  const { otp, txnId } = req.body;

  if (!req.accessToken) {
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
        headers: { Authorization: `Bearer ${req.accessToken}` },
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

router.post("/generate-mobile-otp", generateToken, async (req, res) => {
  const { mobile, txnId } = req.body;

  if (!txnId) {
    return res.status(400).json({ error: "Missing txnId" });
  }

  try {
    const response = await axios.post(
      `${ABHA_BASE_URL}/v1/registration/aadhaar/generateMobileOTP`,
      { txnId, mobile },
      {
        headers: { Authorization: `Bearer ${req.accessToken}` },
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

router.post("/verify-mobile-otp", generateToken, async (req, res) => {
  const { otp, txnId } = req.body;

  if (!txnId) {
    return res.status(400).json({ error: "Missing txnId" });
  }

  try {
    const response = await axios.post(
      `${ABHA_BASE_URL}/v1/registration/aadhaar/verifyMobileOTP`,
      { otp, txnId },
      {
        headers: { Authorization: `Bearer ${req.accessToken}` },
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

router.post("/create-health-id", generateToken, async (req, res) => {
  const { txnId } = req.body;

  if (!txnId) {
    return res.status(400).json({ error: "Missing txnId" });
  }

  try {
    const response = await axios.post(
      `${ABHA_BASE_URL}/v1/registration/aadhaar/createHealthIdWithPreVerified`,
      { txnId },
      {
        headers: { Authorization: `Bearer ${req.accessToken}` },
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
