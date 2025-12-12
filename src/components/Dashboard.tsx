import React, { useEffect, useState } from "react";
import { Card, Col, Row, Statistic, Typography } from "antd";
import { Pie } from "@ant-design/plots";
import { useTranslation } from "react-i18next";

import api from "../api";

const { Text } = Typography;

interface BookmarkStats {
  bookmarked: number;
  unbookmarked: number;
}

interface ImageStats {
  totalImages: number;
  totalSizeBytes: number;
  totalViews: number;
  bookmark: BookmarkStats;
}

interface DashboardProps {
  refreshKey: number;
}

interface PieItem {
  type: string;
  value: number;
}

const Dashboard: React.FC<DashboardProps> = ({ refreshKey }) => {
  const { t } = useTranslation("common");

  const [stats, setStats] = useState<ImageStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<ImageStats>("/images/stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  const totalSizeMB = stats ? stats.totalSizeBytes / (1024 * 1024) : 0;

  const bookmarkedPieData: PieItem[] = stats
    ? [
        {
          type: t("dashboard.bookmarked_tooltip"),
          value: stats.bookmark.bookmarked,
        },
        {
          type: t("dashboard.unbookmarked_tooltip"),
          value: stats.bookmark.unbookmarked,
        },
      ]
    : [];

  const bookmarkedPieConfig = {
    data: bookmarkedPieData,
    angleField: "value",
    colorField: "type",
    label: false,
    legend: false,
    tooltip: ({ type, value }: PieItem) => {
      return { type, value };
    },
    interaction: {
      tooltip: {
        render: (_e: any, { items }: { items: any[] }) => (
          <>
            {items.map(({ type, value, color }) => (
              <div
                key={type}
                style={{
                  margin: 0,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div>
                  <span
                    style={{
                      display: "inline-block",
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: color,
                      marginRight: 6,
                    }}
                  />
                  <span>{type}:</span>
                </div>
                <b>{value}</b>
              </div>
            ))}
          </>
        ),
      },
    },
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card loading={isLoading} style={{ height: 120 }}>
          <Statistic
            title={t("dashboard.total_images")}
            value={stats?.totalImages ?? 0}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card loading={isLoading} style={{ height: 120 }}>
          <Statistic
            title={t("dashboard.total_size_mb")}
            value={totalSizeMB.toFixed(2)}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card loading={isLoading} style={{ height: 120 }}>
          <Statistic
            title={t("dashboard.total_views")}
            value={stats?.totalViews ?? 0}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card loading={isLoading} style={{ height: 120 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Statistic
              title={t("dashboard.bookmarked_images")}
              value={stats?.bookmark.bookmarked ?? 0}
              suffix={
                <Text type="secondary">{` / ${stats?.totalImages ?? 0}`}</Text>
              }
            />

            <div
              style={{
                width: 100,
                height: 100,
                marginTop: -16,
              }}
            >
              <Pie {...bookmarkedPieConfig} />
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default Dashboard;
