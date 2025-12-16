import { atom } from "jotai";
import type { Message } from "@excalidraw/excalidraw/components/ChatTabContent";

// 创建消息列表的atom
export const messagesAtom = atom<Message[]>([]);

// 创建一个只读atom用于获取消息
export const messagesValueAtom = atom((get) => get(messagesAtom));
