// src/pages/Login.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaLock,
  FaArrowLeft,
  FaChevronRight,
  FaEnvelope,
  FaUserShield,
  FaFlask,
  FaInfoCircle,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaPhone
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import "../styles/Login.css";
import "../styles/ManageEmployee.me.css";
import Logo1 from "../Assets/Images/ICAR_logo.png";
import Logo2 from "../Assets/Images/Logo2.png";

/* ================= VALIDATION RULES ================= */
const emailRegex = /^\S+@\S+\.\S+$/;
// 8–20 chars, 1 uppercase, 1 digit, 1 special char, no spaces
const passwordRegex =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
// name: only letters and spaces
const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
// Indian-style mobile: 10 digits, starting with 6–9 [web:17][web:20]
const phoneRegex = /^[6-9]\d{9}$/;

const Login = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [loginType, setLoginType] = useState(""); // admin | scientist
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    name: "",
    phone: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // track focus for icon color
  const [focusedField, setFocusedField] = useState(null); // "name" | "email" | "password" | "phone" | null

  const [modal, setModal] = useState({
    open: false,
    type: "success",
    message: "",
    onConfirm: null
  });

  useEffect(() => {
    // no-op
  }, []);

  const saveEmail = (value) => {
    let emails = JSON.parse(localStorage.getItem("kvk_emails")) || [];
    if (!emails.includes(value)) {
      emails.push(value);
      localStorage.setItem("kvk_emails", JSON.stringify(emails));
    }
  };

  /* =============== FIELD VALIDATORS =============== */
  const validateEmail = (value) => {
    if (!value.trim()) return "Email is required";
    if (!emailRegex.test(value)) return "Please enter a valid email address";
    return "";
  };

  const validatePassword = (value) => {
    if (!value.trim()) return "Password is required";
    if (!passwordRegex.test(value)) {
      return "Password must be 8–20 characters and include at least 1 uppercase letter, 1 digit, and 1 special symbol";
    }
    return "";
  };

  const validateName = (value) => {
    if (isRegister && loginType === "scientist") {
      const trimmed = value.trim();
      if (!trimmed) return "Full name is required";
      if (!nameRegex.test(trimmed)) {
        return "Name should contain only letters and spaces";
      }
      const parts = trimmed.split(" ").filter(Boolean);
      if (parts.length < 2) {
        return "Please enter at least first and last name";
      }
    }
    return "";
  };

  const validatePhone = (value) => {
    // Phone required only during registration for scientist/staff
    if (isRegister && loginType === "scientist") {
      const trimmed = value.trim();
      if (!trimmed) return "Phone number is required";
      if (!phoneRegex.test(trimmed)) {
        return "Please enter a valid 10-digit mobile number (starting with 6–9)";
      }
    }
    return "";
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setErrors((prev) => ({
      ...prev,
      email: validateEmail(value)
    }));
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setErrors((prev) => ({
      ...prev,
      password: validatePassword(value)
    }));
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    setErrors((prev) => ({
      ...prev,
      name: validateName(value)
    }));
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Optional: restrict non-digits from being typed
    if (value === "" || /^[0-9\b]+$/.test(value)) {
      setPhone(value);
      setErrors((prev) => ({
        ...prev,
        phone: validatePhone(value)
      }));
    }
  };

  const isFormValid = () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const nameError = validateName(name);
    const phoneError = validatePhone(phone);

    setErrors({
      email: emailError,
      password: passwordError,
      name: nameError,
      phone: phoneError
    });

    return !emailError && !passwordError && !nameError && !phoneError;
  };

  const showErrorToast = (message) => {
    setModal({
      open: true,
      type: "error",
      message,
      onConfirm: null
    });
  };

  const showSuccessToast = (message, onConfirm = null) => {
    setModal({
      open: true,
      type: "success",
      message,
      onConfirm
    });
  };

  /* ================= FORM SUBMIT ================= */
  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid()) {
      showErrorToast("Please fix the highlighted fields before continuing");
      return;
    }

    setIsLoading(true);

    try {
      // Register (Scientist/Staff only)
      if (isRegister && loginType === "scientist") {
        // Make sure your register() in AuthContext accepts phone
        const res = await register(name, email, phone, password);
        showSuccessToast(
          res?.message ||
            "Registration request submitted. Waiting for admin approval"
        );
        setName("");
        setEmail("");
        setPhone("");
        setPassword("");
        setErrors({ email: "", password: "", name: "", phone: "" });
        setIsRegister(false);
        return;
      }

      // Login
      const role =
        loginType === "admin" ? "Program Coordinator" : "Staff";

      // If your backend expects phone also for login, pass it here
      await login(email, password, role);
      saveEmail(email);
      showSuccessToast("Login successful", () => navigate("/dashboard"));
    } catch (err) {
      const raw = err?.message || "Authentication failed";
      let msg = raw;
      if (loginType === "scientist") {
        if (/rejected/i.test(raw)) {
          msg = "Your request has been rejected by the admin. Please register again.";
          setIsRegister(true);
          setPassword("");
          setShowPassword(false);
        }
      }
      showErrorToast(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const resetFormState = () => {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setErrors({ email: "", password: "", name: "", phone: "" });
    setShowPassword(false);
    setFocusedField(null);
  };

  return (
    <div className="login-container">
      {modal.open && (
        <div className="me-modal-overlay" style={{ top: 0, left: 0 }} onClick={() => setModal((m) => ({ ...m, open: false }))}>
          <div className="me-modal me-modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="me-modal-header">
              <div className="me-modal-title">
                {modal.type === "error" ? (
                  <FaInfoCircle />
                ) : (
                  <FaCheckCircle />
                )}
                {modal.type === "error" ? "Error" : "Success"}
              </div>
              <button
                className="me-icon-btn"
                onClick={() => setModal((m) => ({ ...m, open: false }))}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="me-modal-body">
              <p className="me-modal-message">{modal.message}</p>
            </div>
            <div className="me-modal-footer">
              <button
                className="me-btn me-btn-light"
                onClick={() => setModal((m) => ({ ...m, open: false }))}
              >
                Close
              </button>
              {modal.type === "success" && (
                <button
                  className="me-btn me-btn-success"
                  onClick={() => {
                    const cb = modal.onConfirm;
                    setModal((m) => ({ ...m, open: false }));
                    if (cb) cb();
                  }}
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="logo-row">
            <div className="logo1">
              <img src={Logo1} alt="ICAR Logo" className="logo-image" />
            </div>
            <div className="logo-placeholder">
              <img src={Logo2} alt="KVK Logo" className="logo-image" />
            </div>
          </div>

          <div className="header-content">
            <h1 className="main-title">Krishi Vigyan Kendra, Dhule</h1>
            <p className="subtitle">Extension Activity Data Logger</p>
            <div className="accent-line"></div>
          </div>
        </div>

        {/* Role Selection */}
        {!loginType ? (
          <div className="role-section">
            <div className="section-header">
              <h3>Select Your Role</h3>
              <p>Choose your role to continue to the portal</p>
            </div>

            <div className="role-grid">
              <div
                className="role-card admin-card"
                onClick={() => {
                  setLoginType("admin");
                  resetFormState();
                }}
              >
                <div className="role-icon admin">
                  <FaUserShield />
                </div>
                <div className="role-content">
                  <h4>Program Coordinator</h4>
                  <p>Administrator access</p>
                </div>
                <FaChevronRight className="role-arrow" />
              </div>

              <div
                className="role-card scientist-card"
                onClick={() => {
                  setLoginType("scientist");
                  resetFormState();
                }}
              >
                <div className="role-icon scientist">
                  <FaFlask />
                </div>
                <div className="role-content">
                  <h4>Scientist / Staff</h4>
                  <p>Subject Matter Specialist</p>
                </div>
                <FaChevronRight className="role-arrow" />
              </div>
            </div>
          </div>
        ) : (
          /* Login / Register Form */
          <div className="form-section">
            <div className="form-header">
              <div className="role-indicator">
                <span
                  className={`role-badge ${
                    loginType === "admin"
                      ? "admin-badge"
                      : "scientist-badge"
                  }`}
                >
                  {loginType === "admin"
                    ? "Program Coordinator"
                    : "Scientist / Staff"}
                </span>
              </div>
              <h3>{isRegister ? "Create Account" : "Welcome Back"}</h3>
              <p>
                {loginType === "admin"
                  ? "Enter your admin credentials"
                  : isRegister
                  ? "Register to request access"
                  : "Enter your credentials to access"}
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} noValidate>
              {/* Name (only for scientist register) */}
              {isRegister && loginType === "scientist" && (
                <div
                  className={`input-group ${
                    errors.name
                      ? "has-error"
                      : name
                      ? "valid"
                      : ""
                  }`}
                >
                  <div
                    className={`input-inner ${
                      focusedField === "name" ? "field-focused" : ""
                    }`}
                  >
                    <FaUser
                      className={`input-icon ${
                        focusedField === "name" ? "icon-active" : ""
                      }`}
                    />
                    <input
                      type="text"
                      autoComplete="name"
                      className={`input-field ${
                        name ? "has-value" : ""
                      }`}
                      value={name}
                      onChange={handleNameChange}
                      onFocus={() => setFocusedField("name")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Full Name"
                    />
                    <label className="floating-label">Full Name</label>
                  </div>
                  {errors.name && (
                    <div className="error-row">
                      <FaInfoCircle className="error-icon" />
                      <span className="error-text">{errors.name}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Phone (only for scientist register) */}
              {isRegister && loginType === "scientist" && (
                <div
                  className={`input-group ${
                    errors.phone
                      ? "has-error"
                      : phone
                      ? "valid"
                      : ""
                  }`}
                >
                  <div
                    className={`input-inner ${
                      focusedField === "phone" ? "field-focused" : ""
                    }`}
                  >
                    <FaPhone
                      className={`input-icon ${
                        focusedField === "phone" ? "icon-active" : ""
                      }`}
                    />
                    <input
                      type="tel"
                      autoComplete="tel"
                      className={`input-field ${
                        phone ? "has-value" : ""
                      }`}
                      value={phone}
                      onChange={handlePhoneChange}
                      onFocus={() => setFocusedField("phone")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Mobile Number"
                      maxLength={10}
                    />
                    <label className="floating-label">Mobile Number</label>
                  </div>
                  {errors.phone && (
                    <div className="error-row">
                      <FaInfoCircle className="error-icon" />
                      <span className="error-text">{errors.phone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Email */}
              <div
                className={`input-group ${
                  errors.email
                    ? "has-error"
                    : email
                    ? "valid"
                    : ""
                }`}
              >
                <div
                  className={`input-inner ${
                    focusedField === "email" ? "field-focused" : ""
                  }`}
                >
                  <FaEnvelope
                    className={`input-icon ${
                      focusedField === "email" ? "icon-active" : ""
                    }`}
                  />
                  <input
                    type="email"
                    autoComplete="email"
                    className={`input-field ${
                      email ? "has-value" : ""
                    }`}
                    value={email}
                    onChange={handleEmailChange}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Email Address"
                  />
                  <label className="floating-label">Email Address</label>
                </div>
                {errors.email && (
                  <div className="error-row">
                    <FaInfoCircle className="error-icon" />
                    <span className="error-text">{errors.email}</span>
                  </div>
                )}
              </div>

              {/* Password with eye icon */}
              <div
                className={`input-group ${
                  errors.password
                    ? "has-error"
                    : password
                    ? "valid"
                    : ""
                }`}
              >
                <div
                  className={`input-inner ${
                    focusedField === "password" ? "field-focused" : ""
                  }`}
                >
                  <FaLock
                    className={`input-icon ${
                      focusedField === "password" ? "icon-active" : ""
                    }`}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className={`input-field ${
                      password ? "has-value" : ""
                    }`}
                    value={password}
                    onChange={handlePasswordChange}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Password"
                  />
                  <label className="floating-label">Password</label>
                  <span
                    className={`eye-icon ${
                      focusedField === "password" ? "icon-active" : ""
                    }`}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                {errors.password && (
                  <div className="error-row">
                    <FaInfoCircle className="error-icon" />
                    <span className="error-text">{errors.password}</span>
                  </div>
                )}
              </div>

              <button
                className={`login-btn ${isLoading ? "loading" : ""}`}
                type="submit"
                disabled={isLoading}
              >
                {isLoading
                  ? "Processing..."
                  : isRegister
                  ? "Submit Registration Request"
                  : "Login"}
              </button>

              {loginType === "scientist" && (
                <div className="auth-toggle">
                  <span>
                    {isRegister
                      ? "Already have an account?"
                      : "Don't have an account?"}
                  </span>
                  <button
                    type="button"
                    className="toggle-btn"
                    onClick={() => {
                      setIsRegister(!isRegister);
                      setErrors({
                        email: "",
                        password: "",
                        name: "",
                        phone: ""
                      });
                    }}
                  >
                    {isRegister ? "Login" : "Register"}
                  </button>
                </div>
              )}

              <button
                className="back-btn"
                onClick={() => {
                  setLoginType("");
                  setIsRegister(false);
                  resetFormState();
                }}
                type="button"
              >
                <FaArrowLeft />
                Change Role
              </button>
            </form>
          </div>
        )}

        <div className="login-footer">
          <p>© 2026 KVK Extension Activity Data Logger. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
