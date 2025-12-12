import React, { useState } from "react";
import { Button, message, Modal, Upload } from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import api from "../api";
import { ImageItem } from "../types";

const { Dragger } = Upload;

interface ImageUploadProps {
  onUploaded: (newImages: ImageItem[]) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onUploaded }) => {
  const { t } = useTranslation("common");

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const openModal = () => setIsModalVisible(true);

  const closeModal = () => {
    setIsModalVisible(false);
    setFiles([]);
  };

  const handleUploadFiles = async () => {
    if (!files.length) {
      message.error(t("upload.no_files_selected"));
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    setIsUploading(true);
    try {
      const res = await api.post<ImageItem[]>(
        "/images/upload-multiple",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      message.success(t("upload.upload_success", { count: res.data?.length }));
      onUploaded(res.data);
      closeModal();
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.message || t("upload.upload_failed"));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Button type="primary" icon={<PlusOutlined />} onClick={openModal}>
        {t("upload.add_images_button")}
      </Button>

      <Modal
        open={isModalVisible}
        title={t("upload.title")}
        okText={t("modal.ok_button")}
        cancelText={t("modal.cancel_button")}
        confirmLoading={isUploading}
        onOk={handleUploadFiles}
        onCancel={closeModal}
      >
        <Dragger
          multiple
          showUploadList
          fileList={files.map((file: any) => ({
            uid: file.uid || file.name + file.lastModified,
            name: file.name,
            status: "done",
          }))}
          beforeUpload={(file) => {
            setFiles((prev) => [...prev, file]);
            return false;
          }}
          onRemove={(file) => {
            setFiles((prev) =>
              prev.filter(
                (existingFile) =>
                  existingFile.name !== file.name ||
                  (existingFile as any).lastModified !==
                    (file as any).lastModified
              )
            );
          }}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">{t("upload.dragger_help")}</p>
        </Dragger>
      </Modal>
    </>
  );
};

export default ImageUpload;
