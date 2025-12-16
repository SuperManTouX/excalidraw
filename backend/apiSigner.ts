const hmacsha1 = require("hmacsha1");
const randomString = require("string-random");
import config from "./config";

// 类型定义
interface SignatureResult {
  signature: string;
  timestamp: number;
  signatureNonce: string;
}

interface ConfigType {
  apiKeys: {
    accessKey: string;
    secretKey: string;
  };
  endpoints: {
    text2imgUltra: string;
    status: string;
  };
  liblibai: {
    baseUrl: string;
  };
  server: {
    port: number;
  };
}

// 生成签名
function urlSignature(url: string): SignatureResult {
  if (!url) {
    throw new Error('URL cannot be empty');
  }
  
  const timestamp: number = Date.now(); // 当前时间戳
  const signatureNonce: string = randomString(16); // 随机字符串
  
  // 原文 = URl地址 + "&" + 毫秒时间戳 + "&" + 随机字符串
  const str: string = `${url}&${timestamp}&${signatureNonce}`;
  const hash: string = hmacsha1(config.apiKeys.secretKey, str);
  
  // 生成安全字符串
  let signature: string = hash
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  
  return {
    signature,
    timestamp,
    signatureNonce,
  };
}

// 获取带签名的URL
export function getSignedUrl(url: string): string {
  const { signature, timestamp, signatureNonce } = urlSignature(url);
  return `${url}?AccessKey=${config.apiKeys.accessKey}&Signature=${signature}&Timestamp=${timestamp}&SignatureNonce=${signatureNonce}`;
}

// 获取完整的API URL（包含基础URL）
export function getFullApiUrl(endpoint: string): string {
  const signedUrl: string = getSignedUrl(endpoint);
  return `${config.liblibai.baseUrl}${signedUrl}`;
}

// 导出配置常量，方便其他模块使用
export { config };