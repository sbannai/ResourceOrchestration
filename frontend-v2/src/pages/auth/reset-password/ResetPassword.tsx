import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  Link,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";

const ResetPassword: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.password || !form.confirmPassword) return;
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <Box className="h-screen w-full flex bg-linear-to-br from-slate-100 to-slate-200">
      
      {/* LEFT SECTION */}
      <Box className="w-1/2 hidden md:flex flex-col items-center justify-center bg-linear-to-br from-indigo-600 to-purple-700 text-white p-10">
        <Typography variant="h4" className="font-bold mb-4">
          Set a New Password 🔐
        </Typography>

        <Typography className="opacity-80 text-center max-w-md">
          Create a strong password to secure your account and continue using our platform.
        </Typography>

        <img
          src="/reset-password.svg" 
          alt="Reset Password Illustration"
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
            Enter your new password below
          </Typography>

          <Box className="flex flex-col gap-4 mt-4">

            {/* New Password */}
            <TextField
              label="New Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Confirm Password */}
            <TextField
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              fullWidth
              value={form.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Submit */}
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-xl"
            >
              {loading ? "Updating..." : "Update Password"}
            </Button>

            {/* Back to Login */}
            <Typography className="text-center text-sm text-gray-500 mt-4">
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

export default ResetPassword;