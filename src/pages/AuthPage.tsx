import React, { useEffect, useState } from "react";
import { Button, Card, Form, Input, message, Tabs, Typography } from "antd";
import { LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const AuthPage: React.FC = () => {
  const navigate = useNavigate();

  const { user, login, register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const onLoginFinish = async (values: any) => {
    setIsLoading(true);
    try {
      await login(values.email, values.password);
      message.success("Logged in successfully");
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error(err);
      message.error(
        err?.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterFinish = async (values: any) => {
    setIsLoading(true);
    try {
      await register(values.name, values.email, values.password);
      message.success("Registered successfully");
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error(err);
      message.error(
        err?.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <Card
        style={{
          width: 420,
          boxShadow:
            "0 10px 30px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)",
          borderRadius: 12,
        }}
      >
        <Title level={3} style={{ margin: 0, textAlign: "center" }}>
          AirGo3D
        </Title>

        <Tabs
          defaultActiveKey="login"
          items={[
            {
              key: "login",
              label: "Login",
              children: (
                <Form layout="vertical" onFinish={onLoginFinish}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      {
                        type: "email",
                        message: "Please enter a valid email address.",
                      },
                      {
                        required: true,
                        message: "Email is required.",
                      },
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined />}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="Password"
                    rules={[
                      {
                        required: true,
                        message: "Password is required.",
                      },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="Your password"
                      autoComplete="current-password"
                    />
                  </Form.Item>

                  <Form.Item style={{ marginTop: 16 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      loading={isLoading}
                    >
                      Login
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: "register",
              label: "Register",
              children: (
                <Form layout="vertical" onFinish={onRegisterFinish}>
                  <Form.Item
                    name="name"
                    label="Name"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your name.",
                      },
                      {
                        min: 2,
                        message: "Name must be at least 2 characters.",
                      },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="Your name"
                      autoComplete="name"
                    />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      {
                        type: "email",
                        message: "Please enter a valid email address.",
                      },
                      {
                        required: true,
                        message: "Email is required.",
                      },
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined />}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="Password"
                    rules={[
                      {
                        required: true,
                        message: "Password is required.",
                      },
                      {
                        pattern: passwordPattern,
                        message:
                          "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.",
                      },
                    ]}
                    extra={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Example: P@ssw0rd!
                      </Text>
                    }
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="Create a strong password"
                      autoComplete="password"
                    />
                  </Form.Item>

                  <Form.Item style={{ marginTop: 16 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      loading={isLoading}
                    >
                      Create Account
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default AuthPage;
