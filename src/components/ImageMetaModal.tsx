import React, { useState } from "react";
import {
  Button,
  Card,
  Col,
  Input,
  message,
  Modal,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import { LoadingOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import api from "../api";

const { Text } = Typography;

export interface ImageMeta {
  title: string;
  description: string;
  tags: string[];
}

export interface ImageMetaItem {
  id: string;
  imageUrl: string;
  meta: ImageMeta;
}

interface ImageMetaModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  title: React.ReactNode;
  items: ImageMetaItem[];
  allTags?: string[];
  onOk: () => void;
  onCancel: () => void;
  onMetaChange: (id: string, meta: ImageMeta) => void;
}

const ImageMetaModal: React.FC<ImageMetaModalProps> = ({
  isOpen,
  isLoading,
  title,
  items,
  allTags = [],
  onOk,
  onCancel,
  onMetaChange,
}) => {
  const { t, i18n } = useTranslation("common");
  const currentLang = i18n.language;

  const hasMultipleImages = items.length > 1;

  const [isAiLoading, setIsAiLoading] = useState<Record<string, boolean>>({});

  const handleAIAutofill = async (item: ImageMetaItem) => {
    try {
      setIsAiLoading((prev) => ({ ...prev, [item.id]: true }));

      const res = await api.post<{
        title?: string;
        description?: string;
        tags?: string[];
      }>(`/images/${item.id}/ai-metadata`, {
        lang: currentLang,
      });

      const { title, description, tags } = res.data;

      const current = item.meta;
      onMetaChange(item.id, {
        title: title ?? current.title,
        description: description ?? current.description,
        tags: Array.isArray(tags) ? tags : current.tags,
      });
    } catch (err: any) {
      console.error(err);
      message.error(
        err?.response?.data?.message || t("imageMetaModal.ai_metadata_failed")
      );
    } finally {
      setIsAiLoading((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  return (
    <Modal
      open={isOpen}
      title={title}
      width={hasMultipleImages ? 900 : 500}
      okText={t("modal.ok_button")}
      cancelText={t("modal.cancel_button")}
      confirmLoading={isLoading}
      onOk={onOk}
      onCancel={onCancel}
    >
      <Row gutter={[16, 16]}>
        {items.map((item) => {
          const handleChange = (patch: Partial<ImageMeta>) => {
            onMetaChange(item.id, { ...item.meta, ...patch });
          };

          const isItemLoading = !!isAiLoading[item.id];

          return (
            <Col xs={24} sm={hasMultipleImages ? 12 : 24} key={item.id}>
              <Card
                size="small"
                cover={
                  item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.meta.title || t("imageMetaModal.preview_alt")}
                      style={{
                        width: "100%",
                        height: 180,
                        objectFit: "cover",
                      }}
                    />
                  ) : undefined
                }
              >
                <Space orientation="vertical" style={{ width: "100%" }}>
                  <Text strong>{t("imageMetaModal.title_label")}</Text>
                  <Input
                    value={item.meta.title}
                    placeholder={t("imageMetaModal.title_placeholder")}
                    onChange={(e) => handleChange({ title: e.target.value })}
                  />

                  <Text strong>{t("imageMetaModal.description_label")}</Text>
                  <Input.TextArea
                    rows={3}
                    value={item.meta.description}
                    placeholder={t("imageMetaModal.description_placeholder")}
                    onChange={(e) =>
                      handleChange({ description: e.target.value })
                    }
                  />

                  <Text strong>{t("imageMetaModal.tags_label")}</Text>
                  <Select
                    mode="tags"
                    value={item.meta.tags}
                    placeholder={t("imageMetaModal.tags_placeholder")}
                    options={allTags.map((tag) => ({
                      label: tag,
                      value: tag,
                    }))}
                    style={{ width: "100%" }}
                    onChange={(val) => handleChange({ tags: val })}
                  />

                  <Button
                    type="dashed"
                    icon={
                      isItemLoading ? (
                        <LoadingOutlined />
                      ) : (
                        <ThunderboltOutlined />
                      )
                    }
                    style={{ marginTop: 8 }}
                    disabled={isItemLoading}
                    onClick={() => handleAIAutofill(item)}
                  >
                    {t("imageMetaModal.ai_metadata_button")}
                  </Button>
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Modal>
  );
};

export default ImageMetaModal;
