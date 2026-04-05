import React, { useRef, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Link,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const OTP_LENGTH = 6;

const Otp: React.FC = () => {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const enteredOtp = otp.join("");
    if (enteredOtp.length !== OTP_LENGTH) return;

    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <Box className="h-screen w-full flex bg-linear-to-br from-slate-100 to-slate-200">
      
      {/* LEFT SECTION */}
      <Box className="w-1/2 hidden md:flex flex-col items-center justify-center bg-linear-to-br from-indigo-600 to-purple-700 text-white p-10">
        <Typography variant="h4" className="font-bold mb-4">
          Verify Your Email ✉️
        </Typography>

        <Typography className="opacity-80 text-center max-w-md">
          We've sent a verification code to your email. Enter it below to activate your account.
        </Typography>

        <img
          src="/otp.svg"   
          alt="OTP Illustration"
          className="w-3/4 mt-10"
        />
      </Box>

      {/* RIGHT SECTION */}
      <Box className="w-full md:w-1/2 flex items-center justify-center px-4">
        <Paper elevation={6} className="p-10 w-full max-w-md rounded-3xl shadow-xl">
          
          <Typography variant="h5" className="mb-2 font-bold text-gray-800">
            Enter OTP
          </Typography>

          <Typography className="text-gray-500 text-sm mb-6">
            Enter the 6-digit code sent to your email
          </Typography>

          {/* OTP Inputs */}
          <Box className="flex justify-between gap-2 mb-4 mt-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={digit}
                ref={(el) => {inputsRef.current[index] = el}}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleBackspace(e, index)}
                className="w-12 h-12 text-center text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ))}
          </Box>

          {/* Verify Button */}
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleVerify}
            disabled={loading}
            className="rounded-xl"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>

         <Box className="mt-4">
             {/* Resend */}
          <Typography className="text-center text-sm text-gray-500">
            Didn’t receive the code?{" "}
            <Link underline="hover" className="cursor-pointer">
              Resend
            </Link>
          </Typography>

          {/* Back to Login */}
          <Typography className="text-center text-sm text-gray-500 mt-2">
            Back to{" "}
            <Link component={RouterLink} to="/login" underline="hover">
              Sign In
            </Link>
          </Typography>
         </Box>

        </Paper>
      </Box>
    </Box>
  );
};

export default Otp;