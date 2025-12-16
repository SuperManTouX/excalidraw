import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import { consola } from "consola";

// 导入签名工具和配置
import { getFullApiUrl, config } from "./apiSigner";

const TaskStatus = {
  CREATED: 0,
  GENERATING: 1,
  COMPLETED: 2,
  FAILED: 3,
  UNDER_REVIEW: 4,
  REVIEWED: 5,
  REVIEW_FAILED: 6,
} as const;

type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

interface GeneratedImage {
  imageUrl: string;
  seed: number;
  auditStatus: number;
}

interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
  serverTime: string;
  service: string;
  version: string;
}

interface GenerateRequest {
  prompt?: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  [key: string]: any;
}

interface GenerateResponse {
  generateUuid: string;
}

interface StatusResponse {
  generateUuid: string;
  generateStatus: TaskStatus;
  percentCompleted: number;
  generateMsg: string;
  pointsCost: number;
  accountBalance: number;
  images: GeneratedImage[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

// 环境变量类型
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: string;
    }
  }
}

const hostname: string = "127.0.0.1";
const port: number = config.server.port || 3001; // 使用配置文件中的端口或默认3001

// 支持的文件类型映射
const mimeTypes: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".woff": "application/font-woff",
  ".ttf": "application/font-ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".otf": "application/font-otf",
  ".wasm": "application/wasm",
};

const server: http.Server = http.createServer(
  async (req: http.IncomingMessage, res: http.ServerResponse) => {
    consola.log(`请求路径: ${req.url}`);

    // 设置CORS头信息，允许所有跨域请求
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );

    // 处理OPTIONS预检请求
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    // 健康检查接口 - 验证前端与服务器的连接正常
    if (req.url === "/api/health" && req.method === "GET") {
      handleHealthCheck(res);
      return;
    }

    // 路由处理
    if (req.url === "/") {
      handleRootRequest(res);
      return;
    }

    // API 路由
    if (req.url === "/api/data") {
      handleApiData(res);
      return;
    }

    // 简化的生成图片API接口
    if (req.url === "/api/generate" && req.method === "POST") {
      handleSimplifiedGenerateRequest(req, res);
      return;
    }

    // 简化的查询状态API接口
    const statusRegex: RegExp = /^\/api\/status\/(.*)$/;
    if (req.url && statusRegex.test(req.url) && req.method === "GET") {
      const match: RegExpMatchArray | null = req.url.match(statusRegex);
      if (match && match[1]) {
        await handleSimplifiedStatusRequest(match[1], res);
      }
      return;
    }

    // 静态文件服务
    serveStaticFile(req, res);
  },
);

// 处理健康检查请求
function handleHealthCheck(res: http.ServerResponse): void {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  const healthResponse: HealthResponse = {
    status: "ok",
    message: "服务器连接正常",
    timestamp: new Date().toISOString(),
    serverTime: new Date().toString(),
    service: "liblibai-backend",
    version: "1.0.0",
  };
  const apiResponse: ApiResponse<HealthResponse> = {
    success: true,
    data: healthResponse,
  };
  res.end(JSON.stringify(apiResponse));
}

// 处理根路径请求
function handleRootRequest(res: http.ServerResponse): void {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html");
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Node.js 服务器</title>
    </head>
    <body>
      <h1>欢迎使用 Node.js 服务器!</h1>
      <p>这是一个基本的 Node.js HTTP 服务器。</p>
      <p>尝试访问: <a href="/api/data">/api/data</a></p>
    </body>
    </html>
  `);
}

// 处理API数据请求
function handleApiData(res: http.ServerResponse): void {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  const apiResponse: ApiResponse<{
    message: string;
    timestamp: string;
    server: string;
  }> = {
    success: true,
    data: {
      message: "Hello from Node.js API",
      timestamp: new Date().toISOString(),
      server: "Basic Node.js Server",
    },
  };
  res.end(JSON.stringify(apiResponse));
}

// 处理简化的生成图片请求
function handleSimplifiedGenerateRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): void {
  let body: string = "";
  req.on("data", (chunk: Buffer) => {
    body += chunk.toString();
  });

  req.on("end", async () => {
    try {
      const requestData: GenerateRequest = JSON.parse(body);
      consola.log("生成图片请求Body:", requestData);

      // 实际调用LiblibAI API
      const fullApiUrl: string = getFullApiUrl(config.endpoints.text2imgUltra);
      const response = await axios.post<ApiResponse<GenerateResponse>>(
        fullApiUrl,
        requestData,
        {
          headers: { "Content-Type": "application/json" },
        },
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      const apiResponse: ApiResponse<GenerateResponse> = {
        success: true,
        data: response.data.data,
      };
      res.end(JSON.stringify(apiResponse));
    } catch (error: any) {
      console.error("请求处理错误:", error);
      res.statusCode = error.response?.status || 500;
      res.setHeader("Content-Type", "application/json");
      const errorResponse: ApiResponse<never> = {
        success: false,
        error: "生成图片失败",
        details: error.message || "未知错误",
      };
      res.end(JSON.stringify(errorResponse));
    }
  });
}

// 处理简化的状态查询请求
async function handleSimplifiedStatusRequest(
  generateUuid: string,
  res: http.ServerResponse,
): Promise<void> {
  consola.log("[简化API] 查询状态请求:", generateUuid);

  try {
    const fullApiUrl: string = getFullApiUrl(config.endpoints.status);
    const response = await axios.post<ApiResponse<StatusResponse>>(
      fullApiUrl,
      { generateUuid }, // generateUuid直接放在body中
      { headers: { "Content-Type": "application/json" } },
    );

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    const apiResponse: ApiResponse<StatusResponse> = {
      success: true,
      data: response.data.data,
    };
    res.end(JSON.stringify(apiResponse));
  } catch (error: any) {
    console.error("LiblibAI状态查询失败:", error.message);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    const errorResponse: ApiResponse<never> = {
      success: false,
      error: "状态查询失败",
      details: error.message,
    };
    res.end(JSON.stringify(errorResponse));
  }
}

// 提供静态文件服务
function serveStaticFile(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): void {
  let filePath: string = "." + req.url;
  if (filePath === "./") {
    filePath = "./index.html";
  }

  const extname: string = String(path.extname(filePath)).toLowerCase();
  const contentType: string = mimeTypes[extname] || "application/octet-stream";

  fs.readFile(
    filePath,
    (error: NodeJS.ErrnoException | null, content: Buffer) => {
      if (error) {
        if (error.code === "ENOENT") {
          // 文件不存在
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/json");
          const errorResponse: ApiResponse<never> = {
            success: false,
            error: "文件不存在",
            details: `请求的文件不存在: ${filePath}`,
          };
          res.end(JSON.stringify(errorResponse));
        } else {
          // 服务器错误
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          const errorResponse: ApiResponse<never> = {
            success: false,
            error: "服务器错误",
            details: error.code || "未知错误",
          };
          res.end(JSON.stringify(errorResponse));
        }
      } else {
        // 文件存在，返回文件内容
        res.statusCode = 200;
        res.setHeader("Content-Type", contentType);
        res.end(content, "utf-8");
      }
    },
  );
}

server.listen(port, hostname, () => {
  consola.log(`===== 服务器启动成功 =====`);
  consola.log(`服务器运行在 http://${hostname}:${port}/`);
  consola.log("\n系统接口:");
  consola.log(
    `  GET  http://${hostname}:${port}/api/health - 健康检查/连接验证`,
  );

  consola.log("========================");
});

// 错误处理
server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.syscall !== "listen") {
    throw error;
  }

  switch (error.code) {
    case "EACCES":
      console.error(`端口 ${port} 需要管理员权限`);
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(`端口 ${port} 已被占用`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// 服务器关闭处理
server.on("close", () => {
  consola.log("服务器已关闭");
});

// 捕获 SIGINT 信号（Ctrl+C）
process.on("SIGINT", () => {
  consola.log("接收到终止信号，正在关闭服务器...");
  server.close(() => {
    consola.log("服务器已成功关闭");
    process.exit(0);
  });
});
