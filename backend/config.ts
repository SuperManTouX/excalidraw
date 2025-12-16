// API配置文件 - 集中管理密钥和配置
interface ConfigType {
  // API密钥配置
  apiKeys: {
    accessKey: string;
    secretKey: string;
  };
  
  // API端点配置
  endpoints: {
    text2imgUltra: string;
    status: string;
  };
  
  // 第三方API配置
  liblibai: {
    baseUrl: string;
  };
  
  // 服务器配置
  server: {
    port: number;
  };
}

const config: ConfigType = {
  // API密钥配置
  apiKeys: {
    accessKey: "SJfqzVl7Ik7pcmodPu5w-A", // Access Key
    secretKey: "njxyr_CTnqsdhZDWsGgR-DUc7RpH_JpO" // Secret Key
  },
  
  // API端点配置
  endpoints: {
    text2imgUltra: "/api/generate/webui/text2img/ultra",
    status: "/api/generate/webui/status"
  },
  
  // 第三方API配置
  liblibai: {
    baseUrl: "https://openapi.liblibai.cloud"
  },
  
  // 服务器配置
  server: {
    port: 3001
  }
};

export default config;