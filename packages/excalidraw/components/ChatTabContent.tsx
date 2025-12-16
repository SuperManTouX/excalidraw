import React, { useState, useRef, useEffect } from "react";
import { getStatus, generateImage } from "../api";
import { consola } from "consola";
import "./ChatTabContent.scss";
// 模拟回复消息
export const MOCK_REPLY = "感谢您的消息！这是一条固定的回复内容。";

// 消息类型定义
export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

// 对话tab内容组件
export const ChatTabContent: React.FC<{
  importImageFromUrl?: (
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
  messages?: Message[];
  setMessages?: React.Dispatch<React.SetStateAction<Message[]>>;
}> = ({
  importImageFromUrl,
  messages: propMessages,
  setMessages: propSetMessages,
}) => {
  // 如果没有从props传入，使用默认的本地状态
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const messages = propMessages || localMessages;
  const setMessages = propSetMessages || setLocalMessages;

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim()) return;

    // 添加用户消息
    const newUserMessage: Message = {
      id: `msg-${Date.now()}`,
      content: inputValue.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue("");

    try {
      // 显示连接中消息
      const connectingMessage: Message = {
        id: `msg-${Date.now()}-connecting`,
        content: "正在检查服务器连接状态...",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, connectingMessage]);

      // 调用健康检查接口
      const healthResponse = await fetch("http://localhost:3001/api/health");

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();

        // 移除连接中消息并显示连接成功消息
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== connectingMessage.id),
        );

        const healthMessage: Message = {
          id: `msg-${Date.now()}-health`,
          content: `✅ 服务器连接正常\n📡 服务版本: ${
            healthData.version
          }\n⏰ 服务器时间: ${new Date(healthData.timestamp).toLocaleString()}`,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, healthMessage]);

        // 显示开始生成图片消息
        const generatingMessageId = `msg-${Date.now()}-generating`;
        const generatingMessage: Message = {
          id: generatingMessageId,
          content: "🎨 正在生成图片，请稍候...",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, generatingMessage]);
        // TODO：避免发请求花钱
        // 调用图片生成API 生成图片模板body
        // const generateResponse = await fetch('http://localhost:3001/api/generate', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify({
        //     "templateUuid": "5d7e67009b344550bc1aa6ccbfa1d7f4",
        //     "generateParams": {
        //       "prompt": "1 girl,lotus leaf,masterpiece,best quality,finely detail,highres,8k,beautiful and aesthetic,no watermark,",
        //       "aspectRatio": "portrait",
        //       //或者配置imageSize设置具体宽高
        //       "imageSize": {
        //         "width": 768,
        //         "height": 1024
        //       },
        //       "imgCount": 1,
        //       "steps": 30, // 采样步数，建议30

        //       //高级设置，可不填写
        //       "controlnet": {
        //         "controlType": "depth",
        //         "controlImage": "https://liblibai-online.liblib.cloud/img/081e9f07d9bd4c2ba090efde163518f9/7c1cc38e-522c-43fe-aca9-07d5420d743e.png",
        //       }
        //     }
        //   }),
        // });
        const generateResponse = {
          success: true,
          data: {
            generateUuid: "a5356b748e2f411997c1e904f8108e85",
          },
        };
        const generateData = await generateResponse;
        // .json()
        // console.log("generateData",generateData);
        // console.log("generateData",generateData);

        // 从嵌套结构中提取generateUuid
        const generateUuid = generateData.data?.generateUuid;

        // 检查是否有generateUuid
        if (generateUuid) {
          // 更新生成消息为轮询状态
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === generatingMessageId
                ? {
                    ...msg,
                    content: `🔄 图片生成中，正在查询状态... (ID: ${generateUuid.substring(
                      0,
                      8,
                    )})`,
                  }
                : msg,
            ),
          );

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

              // 更新状态消息
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === generatingMessageId
                    ? {
                        ...msg,
                        content: `🔄 图片生成中，当前状态: 处理中\n`,
                      }
                    : msg,
                ),
              );

              // 如果生成完成
              if (
                statusData.images.length > 0 &&
                statusData.percentCompleted === 1.0
              ) {
                // 移除生成中消息
                setMessages((prev) =>
                  prev.filter((msg) => msg.id !== generatingMessageId),
                );

                // 遍历所有成功图片
                statusData.images.forEach((image) => {
                  // import image to excalidraw
                  if (importImageFromUrl) {
                    importImageFromUrl(image.imageUrl)
                      .then((success) => {
                        if (!success) {
                          console.warn("图片导入失败");
                        }
                      })
                      .catch((error) => {
                        console.error("图片导入出错:", error);
                      });
                  } else {
                    consola.log("importImageFromUrl 函数未提供，无法导入图片");
                  }
                  // 显示生成成功消息
                  const successMessage: Message = {
                    id: `msg-${Date.now()}-success`,
                    content: `✅ 图片生成成功!\n图片URL: ${image.imageUrl}`,
                    isUser: false,
                    timestamp: new Date(),
                  };
                  setMessages((prev) => [...prev, successMessage]);
                });
              }
              // 如果生成失败
              else if (statusData.percentCompleted === 0) {
                setMessages((prev) =>
                  prev.filter((msg) => msg.id !== generatingMessageId),
                );

                const errorMessage: Message = {
                  id: `msg-${Date.now()}-error`,
                  content: `❌ 图片生成失败\n错误原因: ${false || "未知错误"}`,
                  isUser: false,
                  timestamp: new Date(),
                };
                setMessages((prev) => [...prev, errorMessage]);
              }
              // 如果仍在处理，继续轮询
              else {
                setTimeout(pollStatus, 1000); // 每秒检查一次
              }
            } catch (pollError) {
              console.error("状态检查错误:", pollError);

              setMessages((prev) =>
                prev.filter((msg) => msg.id !== generatingMessageId),
              );

              const errorMessage: Message = {
                id: `msg-${Date.now()}-error`,
                content: `❌ 状态检查失败: ${
                  pollError instanceof Error ? pollError.message : "未知错误"
                }`,
                isUser: false,
                timestamp: new Date(),
              };
              setMessages((prev) => [...prev, errorMessage]);
            }
          };

          // 开始轮询
          setTimeout(pollStatus, 1000);
        } else {
          // 没有generateUuid，直接显示结果
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== generatingMessageId),
          );

          const resultMessage: Message = {
            id: `msg-${Date.now()}-result`,
            content: `📋 生成结果: ${JSON.stringify(generateData)}`,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, resultMessage]);
        }
      } else {
        // 连接失败
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== connectingMessage.id),
        );

        const errorMessage: Message = {
          id: `msg-${Date.now()}-error`,
          content: `❌ 服务器连接失败\n状态码: ${healthResponse.status}\n请检查后端服务是否正常运行`,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      // 网络错误处理
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        content: `❌ 网络错误: ${
          error instanceof Error ? error.message : "未知错误"
        }\n请确保后端服务器已启动 (http://localhost:3001)`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 消息更新后滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="chat-tab-content">
      <h3
        style={{
          margin: "1rem",
          fontSize: "1rem",
          fontWeight: "500",
          marginTop: "1rem",
          marginBottom: "0.5rem",
        }}
      >
        对话功能
      </h3>

      {/* 消息容器 */}
      <div ref={messagesContainerRef} className="messages-container">
        {messages.length === 0 ? (
          <p className="empty-message">开始对话吧！</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message-wrapper ${
                message.isUser ? "user-message" : "system-message"
              }`}
            >
              <div className="message-bubble">{message.content}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} className="messages-end-ref" />
      </div>

      {/* 输入区域 */}
      <div className="input-area">
        <div className="input-wrapper">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
          />
          <button onClick={handleSend} disabled={!inputValue.trim()}>
            发送
          </button>
        </div>
      </div>
    </div>
  );
};
