import React, { useEffect, useState, useRef } from "react";
import {
  Button,
  Image,
  Input,
  InputRef,
  message,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Modal,
} from "antd";
import type {
  ColumnType,
  ColumnsType,
  TablePaginationConfig,
  TableProps,
} from "antd/es/table";
import type { FilterDropdownProps } from "antd/es/table/interface";
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  SearchOutlined,
  ShareAltOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import api from "../api";
import { ImageItem } from "../types";
import { buildFileUrl, triggerBrowserDownload } from "../utils/helpers";

import ImageUpload from "./ImageUpload";
import ImageBulkActionsBar from "./ImageBulkActionsBar";
import ImageMetaModal, { ImageMeta, ImageMetaItem } from "./ImageMetaModal";
import PanoramaViewer from "./PanoramaViewer";

interface ImageTableProps {
  refreshKey: number;
  onDataChanged: () => void;
}

type SortOrder = "ascend" | "descend" | null;
type DataIndex = "title" | "description" | "tags";

interface SortState {
  field?: string;
  order?: SortOrder;
}

interface FetchParams {
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: SortOrder;
  title?: string;
  description?: string;
  tags?: string[];
  bookmarked?: string[];
}

interface PaginatedResponse {
  data: ImageItem[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SORT_FIELD = "createdAt";
const DEFAULT_SORT_ORDER: SortOrder = "descend";

const formatBytes = (bytes: number): string => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

const ImageTable: React.FC<ImageTableProps> = ({
  refreshKey,
  onDataChanged,
}) => {
  const { t } = useTranslation("common");

  const searchInput = useRef<InputRef | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ImageItem[]>([]);

  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    showSizeChanger: true,
  });
  const [sorterState, setSorterState] = useState<SortState>({
    field: DEFAULT_SORT_FIELD,
    order: DEFAULT_SORT_ORDER,
  });

  const [allTags, setAllTags] = useState<string[]>([]);

  const [titleFilter, setTitleFilter] = useState("");
  const [descFilter, setDescFilter] = useState("");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [bookmarkedFilter, setBookmarkedFilter] = useState<
    string[] | undefined
  >();

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editRows, setEditRows] = useState<ImageItem[]>([]);
  const [editMetaMap, setEditMetaMap] = useState<Record<string, ImageMeta>>({});

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<ImageItem[]>([]);
  const hasSelection = selectedRowKeys.length > 0;

  const [isPanoramaModalVisible, setIsPanoramaModalVisible] = useState(false);
  const [panoramaImageUrl, setPanoramaImageUrl] = useState<string | null>(null);

  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [sharePassword, setSharePassword] = useState<string | null>(null);
  const [currentShareImage, setCurrentShareImage] = useState<ImageItem | null>(
    null
  );

  const clearSelection = () => {
    setSelectedRowKeys([]);
    setSelectedRows([]);
  };

  const fetchImages = async (params: FetchParams = {}) => {
    setIsLoading(true);
    try {
      const effectiveTags = params.tags ?? tagFilter;
      const effectiveBookmarks = params.bookmarked ?? bookmarkedFilter;

      const query = {
        page: params.page ?? pagination.current ?? 1,
        pageSize: params.pageSize ?? pagination.pageSize ?? DEFAULT_PAGE_SIZE,
        sortField: params.sortField ?? sorterState.field,
        sortOrder: params.sortOrder ?? sorterState.order,
        title: params.title ?? (titleFilter || undefined),
        description: params.description ?? (descFilter || undefined),
        tags: effectiveTags?.length ? effectiveTags.join(",") : undefined,
        bookmarked: effectiveBookmarks?.length
          ? effectiveBookmarks.join(",")
          : undefined,
      };

      const res = await api.get<PaginatedResponse>("/images", {
        params: query,
      });

      setData(res.data.data);
      setPagination((prev) => ({
        ...prev,
        current: res.data.page,
        pageSize: res.data.pageSize,
        total: res.data.total,
      }));
    } catch (err) {
      console.error(err);
      message.error(t("imageTable.fetch_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await api.get<string[]>("/images/tags");
      setAllTags(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshData = () => {
    onDataChanged();
    fetchImages();
  };

  useEffect(() => {
    fetchImages();
    fetchTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const handleTableChange: TableProps<ImageItem>["onChange"] = (
    pag,
    filters,
    sorter
  ) => {
    const current = pag.current ?? 1;
    const pageSize = pag.pageSize ?? DEFAULT_PAGE_SIZE;

    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    const sortField = (activeSorter.field as string) || undefined;
    const sortOrder = (activeSorter.order as SortOrder) || null;

    const bookmarked = (filters.bookmarked as string[] | undefined) ?? [];

    setPagination(pag);
    setSorterState({ field: sortField, order: sortOrder });
    setBookmarkedFilter(bookmarked);

    fetchImages({
      page: current,
      pageSize,
      sortField,
      sortOrder,
      bookmarked,
    });
  };

  const handleBookmarkToggle = async (record: ImageItem) => {
    try {
      const res = await api.patch<ImageItem>(`/images/${record._id}/bookmark`, {
        bookmarked: !record.bookmarked,
      });
      const updated = res.data;
      setData((prev) =>
        prev.map((img) => (img._id === updated._id ? updated : img))
      );
      onDataChanged();
    } catch (err) {
      console.error(err);
      message.error(t("imageTable.bookmark_update_failed"));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/images/${id}`);
      message.success(t("imageTable.delete_success"));
      refreshData();
    } catch (err) {
      console.error(err);
      message.error(t("imageTable.delete_failed"));
    }
  };

  const handleDownload = async (record: ImageItem) => {
    try {
      const url = buildFileUrl(record.originalUrl);
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch file");

      const blob = await response.blob();
      const fileName = record.title || record.filename || "image";
      triggerBrowserDownload(blob, fileName);
    } catch (err) {
      console.error(err);
      message.error(t("imageTable.download_failed"));
    }
  };

  const openEditForImages = (rows: ImageItem[]) => {
    if (!rows.length) return;

    const initialMeta: Record<string, ImageMeta> = {};

    rows.forEach((row) => {
      initialMeta[row._id] = {
        title: row.title || "",
        description: row.description || "",
        tags: row.tags || [],
      };
    });

    setEditRows(rows);
    setEditMetaMap(initialMeta);
    setIsEditModalVisible(true);
  };

  const openEditForRow = (row: ImageItem) => {
    openEditForImages([row]);
  };

  const openEditForSelection = () => {
    if (!hasSelection) return;
    openEditForImages(selectedRows);
  };

  const handleImagesUploaded = (images: ImageItem[]) => {
    if (!images.length) return;

    openEditForImages(images);
    onDataChanged();
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchImages({ page: 1 });
  };

  const handleEditModalCancel = () => {
    setIsEditModalVisible(false);
    setEditRows([]);
    setEditMetaMap({});
  };

  const handleEditModalSave = async () => {
    try {
      await Promise.all(
        editRows.map((row) => {
          const meta = editMetaMap[row._id];
          if (!meta) return Promise.resolve();
          return api.patch(`/images/${row._id}/details`, {
            title: meta.title,
            description: meta.description,
            tags: meta.tags,
          });
        })
      );
      message.success(
        t("imageTable.edit_save_success", { count: editRows.length })
      );
      handleEditModalCancel();
      clearSelection();
      refreshData();
    } catch (err) {
      console.error(err);
      message.error(t("imageTable.edit_save_failed"));
    }
  };

  const handleSearch = (
    dataIndex: DataIndex,
    selectedKeys: string[],
    confirm: FilterDropdownProps["confirm"],
    setValue: (val: any) => void
  ) => {
    confirm();

    const value = dataIndex === "tags" ? selectedKeys : selectedKeys[0] || "";
    setValue(value);

    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchImages({
      page: 1,
      [dataIndex]: value,
    });
  };

  const handleSearchReset = (
    dataIndex: DataIndex,
    clearFilters: () => void,
    setValue: (val: any) => void,
    closeDropdown?: () => void
  ) => {
    clearFilters();

    const value = dataIndex === "tags" ? [] : "";
    setValue(value);

    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchImages({
      page: 1,
      [dataIndex]: value,
    });

    closeDropdown?.();
  };

  const getColumnSearchProps = (
    dataIndex: DataIndex,
    value: string | string[],
    setValue: (val: any) => void
  ): ColumnType<ImageItem> => ({
    filterDropdown: ({
      selectedKeys,
      setSelectedKeys,
      confirm,
      clearFilters,
      close,
    }) => (
      <div
        style={{
          padding: 8,
          display: "flex",
          flexDirection: "column",
        }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {dataIndex === "tags" ? (
          <Select
            mode="multiple"
            allowClear
            placeholder={t("imageTable.filter_tags_placeholder")}
            value={tagFilter}
            options={allTags.map((tVal) => ({ label: tVal, value: tVal }))}
            onChange={(val: string[]) => setTagFilter(val)}
            style={{ width: 200 }}
          />
        ) : (
          <Input
            ref={searchInput}
            placeholder={t(`imageTable.search_${dataIndex}_placeholder`)}
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() =>
              handleSearch(
                dataIndex,
                selectedKeys as string[],
                confirm,
                setValue
              )
            }
          />
        )}

        <Space style={{ marginTop: 8 }}>
          <Button
            type="primary"
            onClick={() =>
              handleSearch(
                dataIndex,
                dataIndex === "tags" ? tagFilter : (selectedKeys as string[]),
                confirm,
                setValue
              )
            }
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            {t("imageTable.search_button")}
          </Button>
          <Button
            onClick={() =>
              clearFilters &&
              handleSearchReset(dataIndex, clearFilters, setValue, () =>
                close?.()
              )
            }
            size="small"
            style={{ width: 90 }}
          >
            {t("imageTable.reset_button")}
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    filterDropdownProps: {
      onOpenChange(open) {
        if (open) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
    filteredValue: value ? (Array.isArray(value) ? value : [value]) : [],
  });

  const rowSelection: TableProps<ImageItem>["rowSelection"] = {
    selectedRowKeys,
    onChange: (keys, rows) => {
      setSelectedRowKeys(keys);
      setSelectedRows(rows as ImageItem[]);
    },
  };

  const tableColumns: ColumnsType<ImageItem> = [
    {
      title: t("imageTable.header_thumbnail"),
      dataIndex: "thumbnailUrl",
      key: "thumbnail",
      render: (_, record) => (
        <Image
          src={buildFileUrl(record.thumbnailUrl)}
          width={160}
          height={80}
          style={{ objectFit: "cover", cursor: "pointer" }}
          alt={record.title || ""}
          preview={false}
          onClick={() => openPanoramaModal(buildFileUrl(record.originalUrl))}
        />
      ),
    },
    {
      title: t("imageTable.header_title"),
      dataIndex: "title",
      key: "title",
      sorter: true,
      ...getColumnSearchProps("title", titleFilter, setTitleFilter),
    },
    {
      title: t("imageTable.header_description"),
      dataIndex: "description",
      key: "description",
      width: 250,
      ...getColumnSearchProps("description", descFilter, setDescFilter),
      render: (text?: string) => {
        if (!text) return null;
        const displayed = text.length > 80 ? `${text.slice(0, 77)}...` : text;
        return <Tooltip title={text}>{displayed}</Tooltip>;
      },
    },
    {
      title: t("imageTable.header_tags"),
      dataIndex: "tags",
      key: "tags",
      ...getColumnSearchProps("tags", tagFilter, setTagFilter),
      render: (tags?: string[]) =>
        Array.isArray(tags)
          ? tags.map((tag) => (
              <Tag
                color="blue"
                key={tag}
                style={{ marginRight: 4, marginBottom: 4 }}
              >
                {tag}
              </Tag>
            ))
          : null,
    },
    {
      title: t("imageTable.header_size"),
      dataIndex: "fileSize",
      key: "size",
      sorter: true,
      render: (size: number) => formatBytes(size),
    },
    {
      title: t("imageTable.header_resolution"),
      key: "resolution",
      render: (_, record) =>
        record.resolutionWidth && record.resolutionHeight
          ? `${record.resolutionWidth} x ${record.resolutionHeight}`
          : "-",
    },
    {
      title: t("imageTable.header_views"),
      dataIndex: "viewCount",
      key: "viewCount",
      sorter: true,
    },
    {
      title: t("imageTable.header_bookmark"),
      dataIndex: "bookmarked",
      key: "bookmarked",
      filters: [
        { text: t("imageTable.bookmark_filter_bookmarked"), value: "true" },
        { text: t("imageTable.bookmark_filter_unbookmarked"), value: "false" },
      ],
      filteredValue: bookmarkedFilter ?? [],
      render: (value: boolean, record) => (
        <Button
          type="text"
          icon={
            value ? (
              <StarFilled style={{ color: "#1677ff" }} />
            ) : (
              <StarOutlined />
            )
          }
          size="large"
          onClick={() => handleBookmarkToggle(record)}
        />
      ),
    },
    {
      title: t("imageTable.header_created_at"),
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: true,
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      title: t("imageTable.header_actions"),
      key: "actions",
      render: (_, record) => (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, auto)",
            gap: 4,
          }}
        >
          <Tooltip title={t("imageTable.tooltip_share")}>
            <Button
              icon={<ShareAltOutlined />}
              onClick={() => openShareModal(record)}
            ></Button>
          </Tooltip>

          <Tooltip title={t("imageTable.tooltip_download")}>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
            />
          </Tooltip>

          <Tooltip title={t("imageTable.tooltip_edit")}>
            <Button
              icon={<EditOutlined />}
              onClick={() => openEditForRow(record)}
            />
          </Tooltip>

          <Popconfirm
            title={t("imageTable.delete_single_title")}
            description={t("imageTable.delete_single_description")}
            okText={t("imageTable.delete_single_ok_button")}
            cancelText={t("imageTable.delete_single_cancel_button")}
            onConfirm={() => handleDelete(record._id)}
          >
            <Tooltip title={t("imageTable.tooltip_delete")}>
              <Button danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const editItems: ImageMetaItem[] = editRows.map((row) => {
    const meta =
      editMetaMap[row._id] ||
      ({
        title: "",
        description: "",
        tags: [],
      } as ImageMeta);
    return {
      id: row._id,
      imageUrl: buildFileUrl(row.thumbnailUrl),
      meta,
    };
  });

  const openPanoramaModal = (imageUrl: string) => {
    setPanoramaImageUrl(imageUrl);
    setIsPanoramaModalVisible(true);
  };

  const closePanoramaModal = () => {
    setIsPanoramaModalVisible(false);
    setPanoramaImageUrl(null);
  };

  const openShareModal = (image: ImageItem) => {
    setCurrentShareImage(image);
    setSharePassword(image.sharePassword || "");
    setIsShareModalVisible(true);
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <ImageUpload onUploaded={handleImagesUploaded} />
        <ImageBulkActionsBar
          isDisabled={!hasSelection}
          selectedRows={selectedRows}
          onBulkEdit={openEditForSelection}
          onClearSelection={clearSelection}
          refreshData={refreshData}
        />
      </div>

      <Table<ImageItem>
        rowKey="_id"
        columns={tableColumns}
        dataSource={data}
        loading={isLoading}
        pagination={pagination}
        rowSelection={rowSelection}
        scroll={{ x: "auto" }}
        locale={{
          filterConfirm: t("imageTable.search_button"),
          filterReset: t("imageTable.reset_button"),
        }}
        onChange={handleTableChange}
      />

      <ImageMetaModal
        isOpen={isEditModalVisible}
        title={
          editRows.length > 1
            ? t("imageTable.edit_modal_title_multiple", {
                count: editRows.length,
              })
            : t("imageTable.edit_modal_title_single")
        }
        items={editItems}
        allTags={allTags}
        onOk={handleEditModalSave}
        onCancel={handleEditModalCancel}
        onMetaChange={(id: string, updated: ImageMeta) =>
          setEditMetaMap((prev) => ({
            ...prev,
            [id]: updated,
          }))
        }
      />

      <Modal
        open={isPanoramaModalVisible}
        footer={null}
        onCancel={closePanoramaModal}
        width="80vw"
        height="80vh"
        bodyStyle={{ height: "80vh" }}
      >
        {panoramaImageUrl && (
          <PanoramaViewer
            imageUrl={panoramaImageUrl}
            onError={(msg) => message.error(msg)}
          />
        )}
      </Modal>

      <Modal
        open={isShareModalVisible}
        footer={null}
        title={t("imageTable.share_modal_title")}
        onCancel={() => setIsShareModalVisible(false)}
      >
        <Input.Password
          placeholder={t("imageTable.share_modal_password_placeholder")}
          value={sharePassword || ""}
          style={{ marginBottom: 16 }}
          onChange={(e) => setSharePassword(e.target.value)}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={() => setIsShareModalVisible(false)}>
            {t("modal.cancel_button")}
          </Button>
          <Button
            onClick={async () => {
              if (!currentShareImage) return;
              const shareLink = `${window.location.origin}/viewer/${currentShareImage.hash}`;
              await navigator.clipboard.writeText(shareLink);
              message.success(t("imageTable.share_modal_copy_success"));
              setIsShareModalVisible(false);
            }}
          >
            {t("imageTable.share_modal_copy_button")}
          </Button>
          <Button
            type="primary"
            onClick={async () => {
              if (!currentShareImage) return;

              try {
                await api.patch(`/images/${currentShareImage._id}/details`, {
                  sharePassword,
                });

                const shareLink = `${window.location.origin}/viewer/${currentShareImage.hash}`;
                await navigator.clipboard.writeText(shareLink);
                message.success(t("imageTable.share_modal_save_copy_success"));
                setIsShareModalVisible(false);
              } catch (err) {
                console.error(err);
                message.error(t("imageTable.share_modal_save_copy_failed"));
              }
            }}
          >
            {t("imageTable.share_modal_save_copy_button")}
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default ImageTable;
