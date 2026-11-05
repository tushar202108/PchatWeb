import { useState, useRef } from "react";
import { Alert, Avatar, Button, Card, Form, Input, Typography, Modal, Space } from "antd";
import { UserOutlined, UploadOutlined, CameraOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import sys from "../constant/navigation.json";
import "./completeProfile.css"
const { Title, Text } = Typography;

export default function CompleteProfile() {
  const { completeProfile, user } = useAuth();
  const navigate = useNavigate();

  const [photo, setPhoto] = useState<string | undefined>(user?.profileImage);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onFinish = async (values: { name: string }) => {
    setError("");

    try {
      await completeProfile({
        name: values.name.trim(),
        profileImage: photo,
        userId: user.id 
      });

      navigate("/chat", { replace: true });
    } catch {
      setError("Unable to save your profile. Please try again.");
    }
  };

  // Handle File Upload from Device
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be 2 MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhoto(reader.result);
        setError("");
        setIsModalOpen(false);
      }
    };
    reader.onerror = () => setError("Unable to read this image.");
    reader.readAsDataURL(file);
  };

  // Start Camera Stream
  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setError("Unable to access camera. Please check permissions.");
      setIsCameraActive(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsCameraActive(false);
  };

  // Capture Snapshot from Camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 300;
      canvas.height = video.videoHeight || 300;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setPhoto(dataUrl);
        setError("");
        stopCamera();
        setIsModalOpen(false);
      }
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <div className="auth-heading">
          <Title level={2}>{sys.sys.nav.profile}</Title>
          <Text type="secondary">Complete your profile to get started.</Text>
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

        {/* Clickable Avatar Container */}
        <div className="profile-avatar-container">
          <div
            className="profile-avatar-wrapper"
            onClick={() => setIsModalOpen(true)}
            title="Change profile picture"
          >
            <Avatar size={104} src={photo} icon={<UserOutlined />} className="profile-avatar" />
            <div className="profile-avatar-overlay">
              <CameraOutlined style={{ fontSize: 24, color: "#fff" }} />
              <span>Edit</span>
            </div>
          </div>
        </div>

        <Form
          layout="vertical"
          requiredMark={false}
          initialValues={{ name: user?.name || "" }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="name"
            label={sys.sys.auth.fullName}
            rules={[
              { required: true, message: sys.sys.common.required },
              { max: 80, message: "Name must be 80 characters or fewer." },
            ]}
          >
            <Input maxLength={80} placeholder="Enter your full name" />
          </Form.Item>

          <Form.Item className="auth-submit-item">
            <Button type="primary" htmlType="submit" block>
              {sys.sys.auth.completeProfile}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Hidden file input for uploading from device */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Modal Options for Uploading or Taking Picture */}
      <Modal
        title="Update Profile Picture"
        open={isModalOpen}
        onCancel={() => {
          stopCamera();
          setIsModalOpen(false);
        }}
        footer={null}
        centered
        className="profile-modal"
      >
        {!isCameraActive ? (
          <Space direction="vertical" size={12} style={{ width: "100%", padding: "10px 0" }}>
            <Button
              icon={<UploadOutlined />}
              block
              size="large"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload from Device
            </Button>
            <Button
              icon={<CameraOutlined />}
              block
              size="large"
              type="dashed"
              onClick={startCamera}
            >
              Take a Picture
            </Button>
          </Space>
        ) : (
          <div style={{ textAlign: "center" }}>
            <video ref={autoVideoRefCleanup} autoPlay playsInline style={{ width: "100%", borderRadius: 10, background: "#000" }} />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            <Space style={{ marginTop: 12 }}>
              <Button type="primary" onClick={capturePhoto}>
                Capture
              </Button>
              <Button onClick={stopCamera}>Cancel</Button>
            </Space>
          </div>
        )}
      </Modal>

      <Text type="secondary" className="auth-copyright">
        Secure access to your workspace
      </Text>
    </div>
  );

  function autoVideoRefCleanup(node: HTMLVideoElement | null) {
    videoRef.current = node;
  }
}