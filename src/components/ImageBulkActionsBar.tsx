import React from "react";
import { Button, message, Modal, Space } from "antd";
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import JSZip from "jszip";

import api from "../api";
import { ImageItem } from "../types";
import { buildFileUrl, triggerBrowserDownload } from "../utils/helpers";

interface ImageBulkActionsBarProps {
  isDisabled: boolean;
  selectedRows: ImageItem[];
  onBulkEdit: () => void;
  onClearSelection: () => void;
  refreshData: () => void;
}

const ImageBulkActionsBar: React.FC<ImageBulkActionsBarProps> = ({
  isDisabled,
  selectedRows,
  onBulkEdit,
  onClearSelection,
  refreshData,
}) => {
  const { t } = useTranslation("common");

  const handleBulkDownload = async () => {
    if (isDisabled) return;

    try {
      const zip = new JSZip();

      await Promise.all(
        selectedRows.map(async (record) => {
          const url = buildFileUrl(record.originalUrl);
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${record._id}`);
          }
          const blob = await response.blob();

          const ext = record.mimeType?.split("/")[1]?.split(";")[0] || "jpg";
          const base =
            (record.title || record.filename || "image")
              .replace(/[^\w.-]+/g, "_")
              .slice(0, 50) || "image";
          const filename = `${base}_${record._id}.${ext}`;

          zip.file(filename, blob);
        })
      );

      const content = await zip.generateAsync({ type: "blob" });
      triggerBrowserDownload(content, `Images-${Date.now()}.zip`);

      onClearSelection();
    } catch (err) {
      console.error(err);
      message.error(t("imageBulkActionsBar.download_failed"));
    }
  };

  const handleBulkBookmark = async () => {
    if (isDisabled) return;
    try {
      await Promise.all(
        selectedRows.map((record) =>
          api.patch(`/images/${record._id}/bookmark`, {
            bookmarked: true,
          })
        )
      );
      message.success(
        t("imageBulkActionsBar.bookmark_success", {
          count: selectedRows.length,
        })
      );
      onClearSelection();
      refreshData();
    } catch (err) {
      console.error(err);
      message.error(t("imageBulkActionsBar.bookmark_failed"));
    }
  };

  const handleBulkUnbookmark = async () => {
    if (isDisabled) return;
    try {
      await Promise.all(
        selectedRows.map((record) =>
          api.patch(`/images/${record._id}/bookmark`, {
            bookmarked: false,
          })
        )
      );
      message.success(
        t("imageBulkActionsBar.unbookmark_success", {
          count: selectedRows.length,
        })
      );
      onClearSelection();
      refreshData();
    } catch (err) {
      console.error(err);
      message.error(t("imageBulkActionsBar.unbookmark_failed"));
    }
  };

  const handleBulkDelete = () => {
    if (isDisabled) return;

    Modal.confirm({
      title: t("imageBulkActionsBar.delete_modal_title"),
      content: t("imageBulkActionsBar.delete_modal_content", {
        count: selectedRows.length,
      }),
      okButtonProps: { danger: true },
      okText: t("modal.ok_button"),
      cancelText: t("modal.cancel_button"),
      onOk: async () => {
        try {
          await Promise.all(
            selectedRows.map((record) => api.delete(`/images/${record._id}`))
          );
          message.success(t("imageBulkActionsBar.delete_success"));
          onClearSelection();
          refreshData();
        } catch (err) {
          console.error(err);
          message.error(t("imageBulkActionsBar.delete_failed"));
        }
      },
    });
  };

  return (
    <Space wrap>
      <Button
        icon={<DownloadOutlined />}
        disabled={isDisabled}
        onClick={handleBulkDownload}
      >
        {t("imageBulkActionsBar.download_button")}
      </Button>
      <Button
        icon={<StarFilled />}
        disabled={isDisabled}
        onClick={handleBulkBookmark}
      >
        {t("imageBulkActionsBar.bookmark_button")}
      </Button>
      <Button
        icon={<StarOutlined />}
        disabled={isDisabled}
        onClick={handleBulkUnbookmark}
      >
        {t("imageBulkActionsBar.unbookmark_button")}
      </Button>
      <Button
        icon={<EditOutlined />}
        disabled={isDisabled}
        onClick={onBulkEdit}
      >
        {t("imageBulkActionsBar.edit_button")}
      </Button>
      <Button
        danger
        icon={<DeleteOutlined />}
        disabled={isDisabled}
        onClick={handleBulkDelete}
      >
        {t("imageBulkActionsBar.delete_button")}
      </Button>
    </Space>
  );
};

export default ImageBulkActionsBar;
