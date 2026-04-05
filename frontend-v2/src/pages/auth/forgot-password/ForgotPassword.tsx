import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Link,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;

    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <Box className="h-screen w-full flex bg-linear-to-br from-slate-100 to-slate-200">
      
      {/* LEFT SECTION */}
      <Box className="w-1/2 hidden md:flex flex-col items-center justify-center bg-linear-to-br from-indigo-600 to-purple-700 text-white p-10">
        <Typography variant="h4" className="font-bold mb-4">
          Forgot Your Password? 🔑
        </Typography>

        <Typography className="opacity-80 text-center max-w-md">
          No worries! Enter your email and we’ll send you a link to reset your password.
        </Typography>

        <img
          src="/forgot-password.svg" 
          alt="Forgot Password Illustration"
          className="w-3/4 mt-10"
        />
      </Box>

      {/* RIGHT SECTION */}
      <Box className="w-full md:w-1/2 flex items-center justify-center px-4">
        <Paper elevation={6} className="p-10 w-full max-w-md rounded-3xl shadow-xl">

          <Typography variant="h5" className="mb-2 font-bold text-gray-800">
            Reset Password
          </Typography>

          <Typography className="text-gray-500 text-sm mb-6">
            Enter your registered email address
          </Typography>

          <Box className="flex flex-col gap-4 mt-4">

            <TextField
              label="Work Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-xl"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>

            <Typography className="text-center text-sm text-gray-500 mt-4">
              Remember your password?{" "}
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

export default ForgotPassword;