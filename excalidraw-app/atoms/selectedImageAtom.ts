import { atom } from "jotai";
import type { ExcalidrawImageElement } from "@excalidraw/element/types";

// 创建存储选中图片元素的atom
export const selectedImageAtom = atom<ExcalidrawImageElement | null>(null);

// 创建一个只读atom用于获取选中的图片元素
export const selectedImageValueAtom = atom((get) => get(selectedImageAtom));
