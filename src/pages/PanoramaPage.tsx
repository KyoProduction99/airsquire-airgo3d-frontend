import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, Button, Form, Input, Typography } from "antd";

import api from "../api";
import PanoramaViewer from "../components/PanoramaViewer";

interface HashResponse {
  imageUrl: string;
}

const { Title } = Typography;

const PanoramaPage: React.FC = () => {
  const { hash } = useParams<{ hash: string }>();
  const hasFetchedRef = useRef(false);

  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [sharePassword, setSharePassword] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPasswordRequired, setIsPasswordRequired] = useState(true);

  const handlePasswordSubmit = () => {
    if (!sharePassword) {
      setErrorMessage("Password is required");
      return;
    }
    setIsPasswordRequired(false);
  };

  useEffect(() => {
    if (isPasswordRequired) return;

    const fetchImage = async () => {
      if (!hash) {
        setErrorMessage("No hash provided");
        setIsLoading(false);
        return;
      }

      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;

      try {
        const res = await api.post<HashResponse>(`/images/hash/${hash}`, {
          sharePassword,
        });
        setImageUrl(res.data.imageUrl);
      } catch (err: any) {
        console.error(err);
        setErrorMessage(
          err?.response?.data?.message || "Failed to load image from server"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchImage();
  }, [hash, sharePassword, isPasswordRequired]);

  if (isPasswordRequired) {
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
          <Title
            level={3}
            style={{ margin: "0 0 16px 0", textAlign: "center" }}
          >
            AirGo3D Image
          </Title>

          <Form layout="vertical" onFinish={handlePasswordSubmit}>
            <Input.Password
              placeholder="Enter password"
              value={sharePassword || ""}
              onChange={(e) => setSharePassword(e.target.value)}
              style={{ marginBottom: 16 }}
            />
            <Button type="primary" htmlType="submit" block loading={isLoading}>
              Submit
            </Button>
          </Form>
        </Card>
      </div>
    );
  }

  if (isLoading || errorMessage) {
    return (
      <div
        style={{
          background: "#000",
          color: "#fff",
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: 16,
        }}
      >
        {isLoading ? "Loading panorama view..." : errorMessage}
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      <PanoramaViewer imageUrl={imageUrl!} onError={setErrorMessage} />
    </div>
  );
};

export default PanoramaPage;
