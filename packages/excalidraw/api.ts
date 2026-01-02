import axios from "axios";
import { DefaultLogger } from "@excalidraw/common";

// 定义与后端一致的类型
export const TaskStatus = {
  CREATED: 0,
  GENERATING: 1,
  COMPLETED: 2,
  FAILED: 3,
  UNDER_REVIEW: 4,
  REVIEWED: 5,
  REVIEW_FAILED: 6,
} as const;

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export interface GeneratedImage {
  imageUrl: string;
  seed: number;
  auditStatus: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

export interface GenerateRequest {
  templateUuid: string;
  generateParams?: {
    prompt: string;
    aspectRatio?: string;
    imageSize?: {
      width: number;
      height: number;
    };
    imgCount: number;
    steps: number;
    controlnet?: {
      controlType: string;
      controlImage: string;
    };
  };
  [key: string]: any;
}

export interface GenerateResponse {
  generateUuid: string;
}

export interface StatusResponse {
  generateUuid: string;
  generateStatus: TaskStatus;
  percentCompleted: number;
  generateMsg: string;
  pointsCost: number;
  accountBalance: number;
  images: GeneratedImage[];
}

// 创建axios实例
const apiClient = axios.create({
  baseURL: "http://localhost:3001/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * 生成图片接口
 * @param requestData 生成图片的请求参数
 * @returns 包含generateUuid的响应
 */
export const generateImage = async (
  requestData: GenerateRequest,
): Promise<ApiResponse<GenerateResponse>> => {
  try {
    const response = await apiClient.post<ApiResponse<GenerateResponse>>(
      "/generate",
      requestData,
    );
    // 确保返回的数据符合ApiResponse格式
    if (response.data && typeof response.data.success === "boolean") {
      return response.data;
    }
    return {
      success: false,
      error: "无效的响应格式",
      details: "服务器返回了不符合预期格式的响应",
    };
  } catch (error) {
    DefaultLogger.error(error);
    // 处理其他类型的错误
    return {
      success: false,
      error: "生成图片失败",
      details: error instanceof Error ? error.message : "未知错误",
    };
  }
};

/**
 * 查询生成状态接口
 * @param generateUuid 生成任务的UUID
 * @returns 包含任务状态信息的响应
 */
export const getStatus = async (
  generateUuid: string,
): Promise<ApiResponse<StatusResponse>> => {
  try {
    const response = await apiClient.get<ApiResponse<StatusResponse>>(
      `/status/${generateUuid}`,
    );
    // 确保返回的数据符合ApiResponse格式
    if (response.data && typeof response.data.success === "boolean") {
      return response.data;
    }
    return {
      success: false,
      error: "无效的响应格式",
      details: "服务器返回了不符合预期格式的响应",
    };
  } catch (error) {
    DefaultLogger.error(error);
    // 处理其他类型的错误
    return {
      success: false,
      error: "查询状态失败",
      details: error instanceof Error ? error.message : "未知错误",
    };
  }
};