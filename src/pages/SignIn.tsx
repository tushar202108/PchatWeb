import { useState } from "react";
import { Alert, Button, Card, Divider, Form, Input, Space, Typography } from "antd";
import { LockOutlined, MailOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";

import SignUpIcon from "../assets/chatLogo.png";
import { useAuth } from "../context/authContext";
import sys from "../constant/navigation.json";

const { Title, Text } = Typography;

export default function SignIn() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: {
    email: string;
    password: string;
  }) => {
    setError("");
    setSubmitting(true);
    console.log("Value of the user",values)
    try {
      await signIn({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });

      navigate("/chat", { replace: true });
    } catch {
      setError("Sign-in failed. Check your email and password.");
    } finally {
      setSubmitting(false);
    }
  };

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
          <Title level={2}>{sys.sys.auth.welcome}</Title>
          <Text type="secondary">
            Sign in to your account to access your workspace.
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

        <Form
          layout="vertical"
          requiredMark={false}
          onFinish={onFinish}
          size="large"
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
              type="email"
            //   autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={sys.sys.auth.password}
            rules={[{ required: true, message: sys.sys.common.required }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your password"
            //   autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item className="auth-submit-item">
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={submitting}
            >
              {sys.sys.auth.signButton}
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-security-note">
          <SafetyCertificateOutlined />
          <Text type="secondary">
            Your connection is encrypted and secured.
          </Text>
        </div>

        <Divider plain>
          <Text type="secondary"
           style={{color:"rgb(255,255,255,255)"}}
           >
            New to our platform?
            </Text>
        </Divider>

        <Space className="auth-switch" direction="vertical" size={10}>
          <Text type="secondary">{sys.sys.auth.noAccount}</Text>
          <Button block>
            <Link to="/register">{sys.sys.nav.signup}</Link>
          </Button>
        </Space>
      </Card>

      <Text type="secondary" className="auth-copyright">
        Secure access to your workspace
      </Text>
    </main>
  );
}