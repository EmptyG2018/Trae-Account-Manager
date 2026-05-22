import { useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import wxQrCode from "../assets/wx.jpg";
import logoImage from "../assets/logo.png";

export function About() {
  const [showImageModal, setShowImageModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center">
        <div className="h-16 w-16 overflow-hidden rounded-xl">
          <img src={logoImage} alt="Logo" className="h-full w-full object-cover" />
        </div>
        <h3 className="text-lg font-semibold tracking-tight">Trae Account Manager</h3>
        <p className="text-sm text-muted-foreground">版本 1.0.0</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Trae 账号使用量管理工具，帮助您轻松管理多个 Trae 账号的使用情况。
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-3 text-base font-semibold tracking-tight">功能特性</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>多账号使用量统计</li>
          <li>实时刷新账号数据</li>
          <li>一键复制账号信息</li>
          <li>简洁美观的界面</li>
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-3 text-base font-semibold tracking-tight">技术栈</h3>
        <div className="flex flex-wrap gap-2">
          {["Tauri", "React", "TypeScript", "Rust"].map((tech) => (
            <Badge key={tech} variant="secondary">{tech}</Badge>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-2 text-base font-semibold tracking-tight">赞赏支持</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          如果这个工具对您有帮助，欢迎请作者喝杯咖啡
        </p>
        <div className="flex flex-col items-center gap-2">
          <img
            src={wxQrCode}
            alt="微信赞赏码"
            className="h-40 w-40 cursor-pointer rounded-lg object-cover transition-transform hover:scale-105"
            onClick={() => setShowImageModal(true)}
          />
          <p className="text-xs text-muted-foreground">点击图片放大</p>
        </div>
      </div>

      {showImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute -right-2 -top-2 rounded-full bg-background p-1"
              onClick={() => setShowImageModal(false)}
            >
              <X className="h-4 w-4" />
            </button>
            <img src={wxQrCode} alt="微信赞赏码" className="max-h-[80vh] max-w-[90vw] rounded-lg" />
            <p className="mt-2 text-center text-sm text-muted-foreground">微信扫码赞赏</p>
          </div>
        </div>
      )}
    </div>
  );
}
