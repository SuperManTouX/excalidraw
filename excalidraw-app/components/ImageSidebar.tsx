import { Sidebar } from "@excalidraw/excalidraw";
import { useState, useEffect } from "react";
import { consola } from "consola";
import { useAtom } from "@excalidraw/excalidraw/editor-jotai";
import {
  generateImage,
  getStatus,
  TaskStatus,
  type GenerateRequest,
  type StatusResponse,
  type ApiResponse,
} from "@excalidraw/excalidraw";
import "./ImageSidebar.scss";
import {
  selectedImageAtom,
  selectedImageValueAtom,
} from "../atoms/selectedImageAtom";

export const ImageSidebar = ({
  onClose,
  importImageFromUrl,
}: {
  onClose: () => void;
  importImageFromUrl: (
    imageUrl: string,
    params?: {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      opacity?: number;
      placeholderId?: string;
    },
  ) => Promise<string | boolean>;
}) => {
  const [selectedImage] = useAtom(selectedImageAtom);

  // 存储选中的占位元素ID
  const [selectedPlaceholderId, setSelectedPlaceholderId] = useState<
    string | null
  >(null);

  // 当selectedImage变化时，检查其id是否包含placeholder字样
  useEffect(() => {
    if (
      selectedImage &&
      selectedImage.id &&
      selectedImage.id.includes("placeholder")
    ) {
      setSelectedPlaceholderId(selectedImage.id);
      consola.info("从选中元素中检测到占位符ID:", selectedImage.id);
    } else {
      setSelectedPlaceholderId(null);
      consola.debug("selectedPlaceholderId置空");
    }
  }, [selectedImage]);

  // 表单状态管理
  const [description, setDescription] = useState("");

  // 图片尺寸状态管理
  const [aspectRatio, setAspectRatio] = useState<string>("4:3");
  // 星流Start只支持
  const [width, setWidth] = useState<number>(786); // 1. width：int，512~2048
  const [height, setHeight] = useState<number>(1024); // 2. height：int，512~2048
  const [lockedAspectRatio, setLockedAspectRatio] = useState<boolean>(true);

  // 当selectedImage变化时，更新宽高状态
  useEffect(() => {
    if (selectedImage && selectedImage.width && selectedImage.height) {
      setWidth(selectedImage.width);
      setHeight(selectedImage.height);

      // 根据图片的实际宽高比，设置最接近的预设比例或设为自定义
      const actualRatio = selectedImage.width / selectedImage.height;
      let closestRatio = "自定义";
      let closestDiff = Infinity;

      aspectRatioOptions.slice(1).forEach((ratio) => {
        const [w, h] = ratio.split(":").map(Number);
        const ratioValue = w / h;
        const diff = Math.abs(actualRatio - ratioValue);

        if (diff < closestDiff) {
          closestDiff = diff;
          closestRatio = ratio;
        }
      });

      // 如果找到的最接近比例与实际比例差异很小（如5%以内），则使用该预设比例并锁定
      // 否则设为自定义并解锁
      if (closestRatio !== "自定义" && closestDiff < 0.05) {
        setAspectRatio(closestRatio);
        setLockedAspectRatio(true);
      } else {
        setAspectRatio("自定义");
        setLockedAspectRatio(false);
      }
    }
  }, [selectedImage]);

  // 预定义的宽高比例选项
  const aspectRatioOptions = [
    "自定义",
    "1:1",
    "4:3",
    "3:4",
    "3:2",
    "2:3",
    "16:9",
    "9:16",
  ];

  // 处理比例选择变化
  const handleAspectRatioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRatio = e.target.value;
    setAspectRatio(newRatio);

    // 如果选择的不是"自定义"，自动锁定比例
    if (newRatio !== "自定义") {
      setLockedAspectRatio(true);
      // 根据选择的比例和当前宽度计算高度，保持宽度不变
      const [widthRatio, heightRatio] = newRatio.split(":").map(Number);
      const calculatedHeight = Math.round((width / widthRatio) * heightRatio);

      // 检查计算后的高度是否在有效范围内
      if (calculatedHeight >= 340 && calculatedHeight <= 2560) {
        setHeight(calculatedHeight);
      } else {
        // 如果计算后的高度超出范围，切换回"自定义"
        setAspectRatio("自定义");
        setLockedAspectRatio(false);
      }
    } else {
      // 选择"自定义"时，取消比例锁定
      setLockedAspectRatio(false);
    }
  };

  // 切换比例锁定状态
  const toggleAspectRatioLock = () => {
    const newLockState = !lockedAspectRatio;
    setLockedAspectRatio(newLockState);

    if (newLockState) {
      // 当从解锁状态切换到锁定状态时，计算当前宽高比最接近的预设比例
      const currentRatio = width / height;
      let closestRatio = aspectRatioOptions[1]; // 默认选择1:1
      let closestDiff = Math.abs(currentRatio - 1);

      // 计算与每个预设比例的差值
      aspectRatioOptions.slice(1).forEach((ratio) => {
        const [w, h] = ratio.split(":").map(Number);
        const ratioValue = w / h;
        const diff = Math.abs(currentRatio - ratioValue);

        if (diff < closestDiff) {
          closestDiff = diff;
          closestRatio = ratio;
        }
      });

      // 更新为找到的最接近的预设比例
      setAspectRatio(closestRatio);

      // 按照选择的比例调整高度
      const [widthRatio, heightRatio] = closestRatio.split(":").map(Number);
      const calculatedHeight = Math.round((width / widthRatio) * heightRatio);

      // 检查计算后的高度是否在有效范围内
      if (calculatedHeight >= 340 && calculatedHeight <= 2560) {
        setHeight(calculatedHeight);
      } else {
        // 如果计算后的高度超出范围，切换回"自定义"
        setAspectRatio("自定义");
        setLockedAspectRatio(false);
      }
    } else {
      // 当从锁定状态切换到解锁状态时，设置为"自定义"
      setAspectRatio("自定义");
    }
  };

  // 处理宽度变化
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(e.target.value);
    setWidth(newWidth);

    // 确保宽度在有效范围内
    if (newWidth >= 256 && newWidth <= 1920) {
      setWidth(newWidth);

      // 只有在比例锁定状态下才计算对应的高度
      if (lockedAspectRatio && aspectRatio !== "自定义") {
        // 根据选择的比例计算对应高度
        const [widthRatio, heightRatio] = aspectRatio.split(":").map(Number);
        const calculatedHeight = Math.round(
          (newWidth / widthRatio) * heightRatio,
        );

        // 检查计算后的高度是否在有效范围内
        if (calculatedHeight >= 340 && calculatedHeight <= 2560) {
          setHeight(calculatedHeight);
        } else {
          // 如果计算后的高度超出范围，切换到自定义比例
          setAspectRatio("自定义");
          setLockedAspectRatio(false);
        }
      } else if (!lockedAspectRatio) {
        // 未锁定状态下，设置为"自定义"
        setAspectRatio("自定义");
      }
    } else {
      // 如果输入的宽度超出范围，恢复原值
      // 这里不做处理，让浏览器的min/max属性处理输入限制
    }
  };

  // 处理高度变化
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = parseInt(e.target.value);
    setHeight(newHeight);

    // 确保高度在有效范围内
    if (newHeight >= 340 && newHeight <= 2560) {
      setHeight(newHeight);

      // 只有在比例锁定状态下才计算对应的宽度
      if (lockedAspectRatio && aspectRatio !== "自定义") {
        // 根据选择的比例计算对应宽度
        const [widthRatio, heightRatio] = aspectRatio.split(":").map(Number);
        const calculatedWidth = Math.round(
          (newHeight / heightRatio) * widthRatio,
        );

        // 检查计算后的宽度是否在有效范围内
        if (calculatedWidth >= 256 && calculatedWidth <= 1920) {
          setWidth(calculatedWidth);
        } else {
          // 如果计算后的宽度超出范围，切换到自定义比例
          setAspectRatio("自定义");
          setLockedAspectRatio(false);
        }
      } else if (!lockedAspectRatio) {
        // 未锁定状态下，设置为"自定义"
        setAspectRatio("自定义");
      }
    } else {
      // 如果输入的高度超出范围，恢复原值
      // 这里不做处理，让浏览器的min/max属性处理输入限制
    }
  };

  // 开始生成
  const handleGenerate = async () => {
    consola.debug("selectedPlaceholderId:", selectedPlaceholderId);

    try {
      let placeholderId: string | boolean = selectedPlaceholderId || "";
      // 先生成空白的可操作元素
      if (importImageFromUrl && !selectedPlaceholderId) {
        placeholderId = await importImageFromUrl("", {
          width: Math.round(width),
          height: Math.round(height),
        });

        // 存储占位元素ID
        if (typeof placeholderId === "string") {
          setSelectedPlaceholderId(placeholderId);
          consola.log("接受占位元ID:", placeholderId);
        }
      }

      // 显示连接中消息
      consola.info("开始生成图片");

      // 调用健康检查接口
      const healthResponse = await fetch("http://localhost:3001/api/health");

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();

        // 计算按比例扩大后的尺寸，确保宽高都在512~2048区间内
        let scaledWidth = Math.round(width);
        let scaledHeight = Math.round(height);

        // 计算宽高比例
        const aspectRatio = scaledWidth / scaledHeight;

        // 如果当前尺寸已经都在512~2048区间内，则不需要调整
        if (scaledWidth < 512 || scaledHeight < 512) {
          // 计算需要扩大的倍数
          const widthScaleFactor = 512 / scaledWidth;
          const heightScaleFactor = 512 / scaledHeight;
          const scaleFactor = Math.max(widthScaleFactor, heightScaleFactor);

          // 按比例扩大
          scaledWidth = Math.round(scaledWidth * scaleFactor);
          scaledHeight = Math.round(scaledHeight * scaleFactor);
        }

        // 确保不超过2048
        if (scaledWidth > 2048 || scaledHeight > 2048) {
          // 计算需要缩小的倍数
          const widthScaleFactor = 2048 / scaledWidth;
          const heightScaleFactor = 2048 / scaledHeight;
          const scaleFactor = Math.min(widthScaleFactor, heightScaleFactor);

          // 按比例缩小
          scaledWidth = Math.round(scaledWidth * scaleFactor);
          scaledHeight = Math.round(scaledHeight * scaleFactor);
        }

        // TODO：避免发请求花钱
        // 使用导入的generateImage函数生成图片
        const generateParams: GenerateRequest = {
          templateUuid: "5d7e67009b344550bc1aa6ccbfa1d7f4",
          generateParams: {
            prompt:
              "1 girl,lotus leaf,masterpiece,best quality,finely detail,highres,8k,beautiful and aesthetic,no watermark,",
            // "aspectRatio": "portrait",
            //或者配置imageSize设置具体宽高
            imageSize: {
              width: scaledWidth,
              height: scaledHeight,
            },
            imgCount: 1,
            steps: 30, // 采样步数，建议30
          },
        };
        consola.debug(generateParams);

        // const generateResponse = await generateImage(generateParams);
        // const generateResponse = {
        //   "success": true,
        //   "data": {
        //     "generateUuid": "a5356b748e2f411997c1e904f8108e85"
        //   }
        // }
        //
        // console.log(generateResponse, generateResponse.data);

        // 从嵌套结构中提取generateUuid
        // const generateUuid = generateResponse?.data?.data?.generateUuid;
        const generateUuid = "d611e6d3df494011becca32ee9454ff2";

        // 检查是否有generateUuid
        if (generateUuid) {
          // 实现每秒检查状态的轮询
          const pollStatus = async () => {
            try {
              const statusResponse = await getStatus(generateUuid);
              const statusData = statusResponse.data;
              consola.log(`状态检查: ${generateUuid}`, statusData);

              // 确保statusData存在
              if (!statusData) {
                console.error("状态数据不存在");
                setTimeout(pollStatus, 1000);
                return;
              }

              // 如果生成完成
              if (statusData.images.length > 0) {
                // 遍历所有成功图片
                statusData.images.forEach((image) => {
                  // import image to excalidraw
                  if (importImageFromUrl) {
                    // 使用最新的占位符ID替换占位元素
                    importImageFromUrl(image.imageUrl, {
                      width: Math.round(width),
                      height: Math.round(height),
                      placeholderId: placeholderId as string,
                    })
                      .then((result) => {
                        if (result !== true) {
                          consola.warn("图片导入失败或未替换占位元素");
                        } else {
                          consola.success("图片已成功导入并替换占位元素");
                          // 清除占位符ID
                          setSelectedPlaceholderId(null);
                        }
                      })
                      .catch((error) => {
                        console.error("图片导入出错:", error);
                      });
                  } else {
                    consola.warn("importImageFromUrl 函数未提供，无法导入图片");
                  }
                  consola.success(`图片导入成功: ${image.imageUrl}`);
                });
              }

              // 如果仍在处理，继续轮询
              else {
                setTimeout(pollStatus, 1000); // 每秒检查一次
              }
            } catch (pollError) {
              console.error("状态检查错误:", pollError);
            }
          };

          // 开始轮询
          setTimeout(pollStatus, 1000);
        } else {
          consola.debug("没有generateUuid，直接显示结果");
        }
      } else {
      }
    } catch (error) {
      console.error("生成图片错误:", error);
    }
  };

  return (
    <div className="image-sidebar">
      <div className="image-sidebar-header">
        小图片 生成器 | {selectedImage?.id || ""}
        <button
          onClick={onClose}
          className="image-sidebar-close-btn"
          aria-label="关闭侧边栏"
        >
          X
        </button>
      </div>
      <div className="image-sidebar-container">
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="image-title">基础模型</label>
            星流&gt;
          </div>
          <div className="form-group-col">
            <label htmlFor="image-title">增强模型</label>
            <button>添加</button>
          </div>
        </div>
        <div className="form-section-noPadding">
          <textarea
            id="image-description"
            placeholder="添加图片描述"
            className="form-textarea"
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-section">
          <div className="form-group">
            <label className="checkbox-label">
              <span>图生图</span>
            </label>
            +
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <span>图生图</span>
            </label>
            +
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <span>图生图</span>
            </label>
            +
          </div>
        </div>

        <div className="form-section">
          <div className="form-group-col">
            <label className="checkbox-label">
              <span>生图尺寸</span>
            </label>
            <div className="form-size-inputs">
              <select
                value={aspectRatio}
                onChange={handleAspectRatioChange}
                className="form-select"
              >
                {aspectRatioOptions.map((ratio) => (
                  <option key={ratio} value={ratio}>
                    {ratio}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={width}
                onChange={handleWidthChange}
                min={256}
                max={2560}
                className="form-input"
              />
              <button
                onClick={toggleAspectRatioLock}
                className={`aspect-lock-btn ${
                  lockedAspectRatio ? "locked" : "unlocked"
                }`}
                title={lockedAspectRatio ? "解锁比例" : "锁定比例"}
              >
                ⩭
              </button>
              <input
                type="number"
                value={height}
                onChange={handleHeightChange}
                min={256}
                max={2560}
                className="form-input"
              />
            </div>
          </div>

          <button
            type="button"
            className="form-button"
            onClick={handleGenerate}
          >
            生图
          </button>
        </div>
        {selectedImage && (
          <div className="image-info-section">
            <h3 className="image-info-title">图片详细信息</h3>

            <div className="image-info-item">
              <span className="image-info-label">元素类型:</span>
              <span className="image-info-value">{selectedImage?.type}</span>
            </div>

            <div className="image-info-item">
              <span className="image-info-label">ID:</span>
              <span className="image-info-value">{selectedImage?.id}</span>
            </div>

            <div className="image-info-item">
              <span className="image-info-label">位置 (x,y):</span>
              <span className="image-info-value">
                ({selectedImage?.x.toFixed(2)}, {selectedImage?.y.toFixed(2)})
              </span>
            </div>

            <div className="image-info-item">
              <span className="image-info-label">尺寸 (宽×高):</span>
              <span className="image-info-value">
                {selectedImage?.width.toFixed(2)} ×{" "}
                {selectedImage?.height.toFixed(2)}
              </span>
            </div>

            <div className="image-info-item">
              <span className="image-info-label">角度:</span>
              <span className="image-info-value">
                {selectedImage?.angle.toFixed(2)}°
              </span>
            </div>

            {selectedImage?.fillStyle && (
              <div className="image-info-item">
                <span className="image-info-label">填充样式:</span>
                <span className="image-info-value">
                  {selectedImage?.fillStyle}
                </span>
              </div>
            )}

            {selectedImage?.strokeStyle && (
              <div className="image-info-item">
                <span className="image-info-label">描边样式:</span>
                <span className="image-info-value">
                  {selectedImage?.strokeStyle}
                </span>
              </div>
            )}

            {selectedImage?.strokeWidth && (
              <div className="image-info-item">
                <span className="image-info-label">描边宽度:</span>
                <span className="image-info-value">
                  {selectedImage?.strokeWidth}
                </span>
              </div>
            )}

            {selectedImage?.opacity !== undefined && (
              <div className="image-info-item">
                <span className="image-info-label">不透明度:</span>
                <span className="image-info-value">
                  {(selectedImage?.opacity * 100).toFixed(0)}%
                </span>
              </div>
            )}

            {selectedImage?.backgroundColor && (
              <div className="image-info-item">
                <span className="image-info-label">背景颜色:</span>
                <span className="image-info-value">
                  {selectedImage?.backgroundColor}
                </span>
              </div>
            )}

            {selectedImage?.roughness && (
              <div className="image-info-item">
                <span className="image-info-label">粗糙度:</span>
                <span className="image-info-value">
                  {selectedImage?.roughness.toFixed(2)}
                </span>
              </div>
            )}

            {selectedImage?.seed !== undefined && (
              <div className="image-info-item">
                <span className="image-info-label">种子值:</span>
                <span className="image-info-value">{selectedImage?.seed}</span>
              </div>
            )}

            {selectedImage?.status && (
              <div className="image-info-item">
                <span className="image-info-label">状态:</span>
                <span className="image-info-value">
                  {selectedImage?.status}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
