import React, { useState } from "react";
import { Avatar, Divider, Dropdown, Layout, Space, Typography } from "antd";
import { DownOutlined, UserOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import { useAuth } from "../context/AuthContext";
import Dashboard from "../components/Dashboard";
import ImageTable from "../components/ImageTable";

const { Header, Content } = Layout;
const { Title } = Typography;

const MainPage: React.FC = () => {
  const { t, i18n } = useTranslation("common");
  const { user, logout } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataChanged = () => {
    setRefreshKey((key) => key + 1);
  };

  const menuItems = [
    {
      key: "lang-en",
      label: t("header.language_en"),
      onClick: () => i18n.changeLanguage("en"),
    },
    {
      key: "lang-zh",
      label: t("header.language_zh"),
      onClick: () => i18n.changeLanguage("zh"),
    },
    { type: "divider" as const },
    {
      key: "logout",
      label: t("header.logout"),
      onClick: logout,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Title level={3} style={{ color: "#fff", margin: 0 }}>
          AirGo3D
        </Title>
        <Dropdown menu={{ items: menuItems }}>
          <Space
            align="center"
            style={{ cursor: "pointer" }}
            onClick={(e) => e.preventDefault()}
          >
            <Avatar size="small" icon={<UserOutlined />} />
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#fff", fontWeight: 500 }}>{user?.name}</div>
            </div>
            <DownOutlined style={{ fontSize: 10, color: "#d9d9d9" }} />
          </Space>
        </Dropdown>
      </Header>
      <Content style={{ padding: 24 }}>
        <Dashboard refreshKey={refreshKey} />
        <Divider />
        <ImageTable refreshKey={refreshKey} onDataChanged={handleDataChanged} />
      </Content>
    </Layout>
  );
};

export default MainPage;
