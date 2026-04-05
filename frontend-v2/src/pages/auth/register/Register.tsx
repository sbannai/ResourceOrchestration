import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Paper,
  InputAdornment,
  IconButton,
  Divider,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";

const Register: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <Box className="h-screen w-full flex bg-linear-to-br from-slate-100 to-slate-200">
      
      {/* LEFT SECTION - Branding */}
      <Box className="w-1/2 hidden md:flex flex-col items-center justify-center bg-linear-to-br from-indigo-600 to-purple-700 text-white p-10">
        <Typography variant="h4" className="font-bold mb-4">
          Build Something Amazing 🚀
        </Typography>

        <Typography className="opacity-80 text-center max-w-md">
          Join our SaaS platform and start managing your business with powerful tools and seamless workflows.
        </Typography>

        <img
          src="/register.svg"  
          alt="Register Illustration"
          className="w-3/4 mt-10"
        />
      </Box>

      {/* RIGHT SECTION - FORM */}
      <Box className="w-full md:w-1/2 flex items-center justify-center px-4">
        <Paper elevation={6} className="p-10 w-full max-w-md rounded-3xl shadow-xl">
          
          <Typography variant="h5" className="mb-2 font-bold text-gray-800">
            Create Account
          </Typography>

          <Typography className="text-gray-500 text-sm">
            Fill in your details to get started
          </Typography>

          <Box className="flex flex-col gap-4 mt-4">

            {/* First + Last Name */}
            <Box className="flex gap-4">
              <TextField
                label="First Name"
                variant="outlined"
                fullWidth
              />
              <TextField
                label="Last Name"
                variant="outlined"
                fullWidth
              />
            </Box>

            {/* Company Name */}
            <TextField
              label="Company Name"
              variant="outlined"
              fullWidth
            />

            {/* Work Email */}
            <TextField
              label="Work Email"
              type="email"
              variant="outlined"
              fullWidth
            />

            {/* Password */}
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              fullWidth
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

            {/* Register Button */}
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleRegister}
              disabled={loading}
              className="mt-2 rounded-xl"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>

            <Divider className="my-4">OR</Divider>

            {/* Google */}
            <Button
              variant="outlined"
              fullWidth
              className="rounded-xl"
            >
              Sign up with Google
            </Button>

            {/* Login Redirect */}
            <Typography className="text-center text-sm text-gray-500 mt-4">
              Already have an account?{" "}
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

export default Register;