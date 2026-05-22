import { useState } from "react";
import { X, ExternalLink, Heart, Code2, Zap, Shield, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import wxQrCode from "../assets/wx.jpg";
import logoImage from "../assets/logo.png";

const features = [
  { icon: BarChart3, text: "多账号使用量统计" },
  { icon: Zap, text: "实时刷新账号数据" },
  { icon: Shield, text: "安全的 Token 管理" },
  { icon: Code2, text: "简洁美观的界面" },
];

export function About() {
  const [showImageModal, setShowImageModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <div className="glass-card flex flex-col items-center gap-4 p-8 text-center">
        <div className="relative">
          <div className="h-20 w-20 overflow-hidden rounded-2xl shadow-lg ring-1 ring-border/50">
            <img src={logoImage} alt="Logo" className="h-full w-full object-cover" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Trae Account Manager</h2>
          <p className="mt-1 text-sm text-muted-foreground">版本 1.0.0</p>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Trae 账号使用量管理工具，帮助您轻松管理多个 Trae 账号的使用情况。
        </p>
      </div>

      {/* Features */}
      <div className="glass-card p-6">
        <h3 className="mb-4 text-sm font-semibold tracking-tight">功能特性</h3>
        <div className="grid grid-cols-2 gap-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.text} className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/30">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{feature.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tech stack */}
      <div className="glass-card p-6">
        <h3 className="mb-3 text-sm font-semibold tracking-tight">技术栈</h3>
        <div className="flex flex-wrap gap-2">
          {["Tauri", "React", "TypeScript", "Rust"].map((tech) => (
            <Badge key={tech} variant="secondary" className="font-mono text-xs">{tech}</Badge>
          ))}
        </div>
      </div>

      {/* Donation */}
      <div className="glass-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Heart className="h-4 w-4 text-red-500" />
          <h3 className="text-sm font-semibold tracking-tight">赞赏支持</h3>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          如果这个工具对您有帮助，欢迎请作者喝杯咖啡
        </p>
        <div className="flex flex-col items-center gap-3">
          <div className="group relative">
            <img
              src={wxQrCode}
              alt="微信赞赏码"
              className="h-44 w-44 cursor-pointer rounded-xl object-cover ring-1 ring-border/50 transition-all duration-200 hover:ring-primary/30 hover:shadow-lg"
              onClick={() => setShowImageModal(true)}
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 transition-all group-hover:bg-black/5">
              <ExternalLink className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-60" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">点击图片放大</p>
        </div>
      </div>

      {showImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-lg ring-1 ring-border transition-transform hover:scale-110"
              onClick={() => setShowImageModal(false)}
            >
              <X className="h-4 w-4" />
            </button>
            <img src={wxQrCode} alt="微信赞赏码" className="max-h-[80vh] max-w-[90vw] rounded-xl shadow-2xl" />
            <p className="mt-3 text-center text-sm text-muted-foreground">微信扫码赞赏</p>
          </div>
        </div>
      )}
    </div>
  );
}
