import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, ClipboardEvent, KeyboardEvent } from "react";
import {
  Alert,
  Button,
  Card,
  Divider,
  Form,
  Input,
  Space,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  LockOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";

import { isAxiosError } from "axios";

import SignUpIcon from "../assets/chatLogo.png";
import { useAuth } from "../context/authContext";
import { axiosService } from "../Axios/axiosService";
import API from "../services/APIEndpoint";
import sys from "../constant/navigation.json";

const { Title, Text } = Typography;

const RESEND_SECONDS = 300;
const OTP_LENGTH = 4;
const ALERT_AUTO_CLOSE_MS = 5000;


type Step = "email" | "verify";

interface EmailFormValues {
  email: string;
}

interface VerifyFormValues {
  otp: any;
  password: string;
  confirmPassword: string;
  username: string;
}

interface OtpInputProps {
  value?: string;
  onChange?: (value: string) => void;
  length?: number;
  disabled?: boolean;
}

// Segmented OTP input. Works directly as a child of Form.Item.
function OtpInput({
  value = "",
  onChange,
  length = OTP_LENGTH,
  disabled,
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const focusBox = (i: number) => {
    const target = refs.current[Math.max(0, Math.min(i, length - 1))];
    target?.focus();
    target?.select();
  };

  const handleChange = (i: number, e: ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value.replace(/\D/g, "").slice(-1);
    if (!d) return;
    const idx = Math.min(i, value.length); // keep digits contiguous
    const next = (value.slice(0, idx) + d + value.slice(idx + 1)).slice(
      0,
      length,
    );
    onChange?.(next);
    if (idx + 1 < length) focusBox(idx + 1);
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) {
        onChange?.(value.slice(0, i) + value.slice(i + 1));
      } else if (i > 0) {
        onChange?.(value.slice(0, i - 1) + value.slice(i));
        focusBox(i - 1);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusBox(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusBox(i + 1);
    }
  };

  const handlePaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    const idx = Math.min(i, value.length);
    const next = (value.slice(0, idx) + pasted).slice(0, length);
    onChange?.(next);
    focusBox(Math.min(idx + pasted.length, length - 1));
  };

  return (
    <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
      {digits.map((digit, i) => (
        <Input
          key={i}
          ref={(el) => {
            refs.current[i] = el?.input ?? null;
          }}
          value={digit}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1} of ${length}`}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
          style={{
            width: 56,
            height: 56,
            textAlign: "center",
            fontSize: 24,
            fontWeight: 600,
            padding: 0,
          }}
        />
      ))}
    </div>
  );
}

const getStatus = (err: unknown) =>
  isAxiosError(err) ? err.response?.status : undefined;

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [verifyForm] = Form.useForm<VerifyFormValues>();

  // Auto-dismiss alerts after 5 seconds
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), ALERT_AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (!info) return;
    const timer = setTimeout(() => setInfo(""), ALERT_AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [info]);

  // Resend countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const requestOtp = async (targetEmail: string) => {
    setError("");
    setInfo("");
    setSendingOtp(true);

    try {
      await axiosService.post(API.SEND_OTP, { email: targetEmail });
      setEmail(targetEmail);
      setCooldown(RESEND_SECONDS);
      setStep("verify");
      setInfo(`We sent a verification code to ${targetEmail}.`);
    } catch (err) {
      console.error("Send OTP failed:", err);
      const status = getStatus(err);
      if (status === 409) {
        // Account already exists: stay on step 1
        setError("An account with this email already exists. Please sign in.");
      } else if (status === 429) {
        setError("Too many requests. Please wait a moment and try again.");
      } else {
        setError("Unable to send the verification code. Please try again.");
      }
    } finally {
      setSendingOtp(false);
      // setStep("verify");
    }
  };

  const onEmailFinish = async (values: EmailFormValues) => {
    await requestOtp(values.email.trim().toLowerCase());
  };

  const onResend = async () => {
    if (cooldown > 0 || sendingOtp) return;
    await requestOtp(email);
  };

  const onVerifyFinish = async (values: VerifyFormValues) => {
    setError("");
    setInfo("");
    setSubmitting(true);

    try {
      // Goes through AuthProvider: stores the access token, sets hasSession, loads user
      await signUp({
        username: values.username.trim(),
        email,
        otp: Number(values.otp.trim()),
        password: values.password,
      });
      navigate("/complete-profile", { replace: true });
    } catch (err) {
      console.error("Registration failed:", err);
      const status = getStatus(err);
      if (status === 400 || status === 401) {
        setError("Invalid or expired code. Please check it and try again.");
      } else if (status === 409) {
        setError("An account with this email already exists. Please sign in.");
      } else {
        setError("Unable to create your account. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const goBackToEmail = () => {
    setStep("email");
    setError("");
    setInfo("");
    verifyForm.resetFields();
  };

  const isEmailStep = step === "email";

  return (
    <main className="auth-page">
      <Card className="auth-card" bordered>
        <div className="auth-brand">
          <img
            src={SignUpIcon}
            alt=""
            className="auth-brand-icon"
            aria-hidden="true"
          />
          <Text className="auth-brand-name">{sys.sys.appName}</Text>
        </div>

        <div className="auth-heading">
          <Title level={2}>
            {isEmailStep ? "Verify your email" : "Secure your account"}
          </Title>
          <Text type="secondary">
            {isEmailStep
              ? "Enter your email and we'll send you a one-time code."
              : "Enter the code we sent you and choose a password."}
          </Text>
        </div>

        {error && (
          <Alert
            className="auth-alert"
            type="error"
            message={error}
            showIcon
            closable
            onClose={() => setError("")}
          />
        )}

        {info && !error && (
          <Alert
            className="auth-alert auth-alert-success"
            type="success"
            message={info}
            showIcon
            closable
            onClose={() => setInfo("")}
          />
        )}

        {isEmailStep ? (
          <Form
            key="email-form"
            layout="vertical"
            requiredMark={false}
            onFinish={onEmailFinish}
            size="large"
            initialValues={{ email }}
          >
            <Form.Item
              name="email"
              label={sys.sys.auth.email}
              rules={[
                { required: true, message: sys.sys.common.required },
                { type: "email", message: sys.sys.auth.invalidEmail },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="you@company.com"
                autoComplete="email"
                type="email"
                disabled={sendingOtp}
              />
            </Form.Item>

            <Form.Item className="auth-submit-item">
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={sendingOtp}
              >
                Send verification code
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Form
            key="verify-form"
            form={verifyForm}
            layout="vertical"
            requiredMark={false}
            onFinish={onVerifyFinish}
            size="large"
          >
            <Form.Item
              name="otp"
              label="Verification code"
              rules={[
                { required: true, message: sys.sys.common.required },
                {
                  pattern: new RegExp(`^\\d{${OTP_LENGTH}}$`),
                  message: `Enter the ${OTP_LENGTH}-digit code.`,
                },
              ]}
              extra={
                <div style={{ textAlign: "center", marginTop: 8 }}>
                  <Button
                    type="link"
                    size="small"
                    style={{ padding: 0 }}
                    onClick={onResend}
                    loading={sendingOtp}
                    disabled={cooldown > 0}
                  >
                    {cooldown > 0
                      ? `Resend code in ${cooldown}s`
                      : "Resend code"}
                  </Button>
                </div>
              }
            >
              <OtpInput disabled={submitting} />
            </Form.Item>

            <Form.Item
              name="password"
              label={sys.sys.auth.password}
              extra={sys.sys.auth.passwordHint}
              rules={[
                { required: true, message: sys.sys.common.required },
                { min: 8, message: "Use at least 8 characters." },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Create a password"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label={sys.sys.auth.confirmPassword}
              dependencies={["password"]}
              rules={[
                { required: true, message: sys.sys.common.required },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(sys.sys.auth.passwordMismatch),
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item className="auth-submit-item">
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={submitting}
              >
                {sys.sys.auth.signupButton}
              </Button>
            </Form.Item>

            <Button
              type="text"
              block
              icon={<ArrowLeftOutlined />}
              onClick={goBackToEmail}
              disabled={submitting}
            >
              Use a different email
            </Button>
          </Form>
        )}

        <div className="auth-security-note">
          <SafetyCertificateOutlined />
          <Text type="secondary">
            Your account is protected by Dev and Pranav
          </Text>
        </div>

        <Divider plain>
          <Text type="secondary" style={{ color: "rgb(255,255,255,255)" }}>
            Already registered?
          </Text>
        </Divider>

        <Space className="auth-switch" direction="vertical" size={12}>
          <Button block>
            <Link to="/signin">{sys.sys.nav.sign}</Link>
          </Button>
        </Space>
      </Card>

      <Text type="secondary" className="auth-copyright">
        Secure access to your workspace
      </Text>
    </main>
  );
}
