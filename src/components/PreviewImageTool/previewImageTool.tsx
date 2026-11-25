import React, { useEffect, useRef, useState } from "react";
import { Modal, Button, Space, Segmented } from "antd";
import {
  RotateLeftOutlined,
  RotateRightOutlined,
  ScissorOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import "./previewImageTool.css";

type CropBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const PreviewImageTool: React.FC<{
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onApply: (newBase64: string) => void;
}> = ({ open, imageSrc, onClose, onApply }) => {
  const [rotation, setRotation] = useState<number>(0);
  const [cropMode, setCropMode] = useState<boolean>(false);
  const [aspect, setAspect] = useState<"free" | "1:1">("1:1");
  const [cropBox, setCropBox] = useState<CropBox>({
    x: 0.12,
    y: 0.12,
    width: 0.76,
    height: 0.76,
  });

  const stageRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragStateRef = useRef<{
    type: "move" | "resize";
    startX: number;
    startY: number;
    startBox: CropBox;
  } | null>(null);

  useEffect(() => {
    if (open) {
      setRotation(0);
      setCropMode(false);
      setAspect("1:1");
      setCropBox({ x: 0.12, y: 0.12, width: 0.76, height: 0.76 });
    }
  }, [open, imageSrc]);

  const rotateBy = (delta: number) => {
    setRotation((prev) => (prev + delta + 360) % 360);
  };

  const applyAspectToBox = (mode: "free" | "1:1", base: CropBox): CropBox => {
    if (mode === "free" || !imgRef.current) return base;
    const rect = imgRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return base;

    const sidePx = Math.min(rect.width * base.width, rect.height * base.height);
    const w = Math.min(sidePx / rect.width, 1);
    const h = Math.min(sidePx / rect.height, 1);
    const x = Math.max(0, Math.min(base.x, 1 - w));
    const y = Math.max(0, Math.min(base.y, 1 - h));
    return { x, y, width: w, height: h };
  };

  const handleAspectChange = (val: "free" | "1:1") => {
    setAspect(val);
    setCropBox((prev) => applyAspectToBox(val, prev));
  };

  const onPointerDownBox = (
    e: React.PointerEvent,
    type: "move" | "resize"
  ) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStateRef.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      startBox: { ...cropBox },
    };
  };

  const onPointerMoveBox = (e: React.PointerEvent) => {
    const drag = dragStateRef.current;
    const imgEl = imgRef.current;
    if (!drag || !imgEl) return;

    const rect = imgEl.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dx = (e.clientX - drag.startX) / rect.width;
    const dy = (e.clientY - drag.startY) / rect.height;
    const b = drag.startBox;

    if (drag.type === "move") {
      const x = Math.max(0, Math.min(1 - b.width, b.x + dx));
      const y = Math.max(0, Math.min(1 - b.height, b.y + dy));
      setCropBox({ ...b, x, y });
    } else {
      const minSize = 0.15;
      let width = Math.max(minSize, Math.min(1 - b.x, b.width + dx));
      let height = Math.max(minSize, Math.min(1 - b.y, b.height + dy));

      if (aspect === "1:1") {
        const sidePx = Math.max(
          40,
          Math.min(
            rect.width * (1 - b.x),
            rect.height * (1 - b.y),
            rect.width * b.width + e.clientX - drag.startX,
            rect.height * b.height + e.clientY - drag.startY
          )
        );
        width = sidePx / rect.width;
        height = sidePx / rect.height;
      }

      setCropBox({ ...b, width, height });
    }
  };

  const onPointerUpBox = () => {
    dragStateRef.current = null;
  };

  const handleSaveEditedImage = () => {
    const img = imgRef.current;
    if (!img) return;

    const rotCanvas = document.createElement("canvas");
    const rotCtx = rotCanvas.getContext("2d");
    if (!rotCtx) return;

    const rad = (rotation * Math.PI) / 180;
    const swapDims = rotation === 90 || rotation === 270;
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;

    rotCanvas.width = swapDims ? natH : natW;
    rotCanvas.height = swapDims ? natW : natH;

    rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
    rotCtx.rotate(rad);
    rotCtx.drawImage(img, -natW / 2, -natH / 2);

    const activeBox = cropMode
      ? cropBox
      : { x: 0, y: 0, width: 1, height: 1 };

    const sx = Math.round(activeBox.x * rotCanvas.width);
    const sy = Math.round(activeBox.y * rotCanvas.height);
    const sw = Math.max(1, Math.round(activeBox.width * rotCanvas.width));
    const sh = Math.max(1, Math.round(activeBox.height * rotCanvas.height));

    const outCanvas = document.createElement("canvas");
    outCanvas.width = sw;
    outCanvas.height = sh;
    const outCtx = outCanvas.getContext("2d");
    if (!outCtx) return;

    outCtx.drawImage(rotCanvas, sx, sy, sw, sh, 0, 0, sw, sh);

    const editedBase64 = outCanvas.toDataURL("image/jpeg", 0.92);
    onApply(editedBase64);
    onClose();
  };

  return (
    <Modal
      open={open}
      title={null}
      closable={false}
      footer={null}
      centered
      width={520}
      onCancel={onClose}
      rootClassName="create-group-modal wa-preview-modal"
    >
      <div className="wa-preview-top">
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
          className="wa-icon-btn"
        />

        <Space size={8}>
          <Button
            type="text"
            icon={<RotateLeftOutlined />}
            onClick={() => rotateBy(-90)}
            className="wa-icon-btn"
            title="Rotate Left"
          />
          <Button
            type="text"
            icon={<RotateRightOutlined />}
            onClick={() => rotateBy(90)}
            className="wa-icon-btn"
            title="Rotate Right"
          />
          <Button
            type={cropMode ? "primary" : "text"}
            icon={<ScissorOutlined />}
            onClick={() => setCropMode((prev) => !prev)}
            className="wa-icon-btn"
          >
            Crop
          </Button>
        </Space>

        <Button
          type="primary"
          icon={<CheckOutlined />}
          onClick={handleSaveEditedImage}
          className="wa-done-btn"
        >
          Done
        </Button>
      </div>

      {cropMode && (
        <div className="wa-crop-toolbar">
          <Segmented
            size="small"
            value={aspect}
            onChange={(v) => handleAspectChange(v as "free" | "1:1")}
            options={[
              { label: "Square (1:1)", value: "1:1" },
              { label: "Free", value: "free" },
            ]}
          />
        </div>
      )}

      <div className="wa-preview-stage" ref={stageRef}>
        <div className="wa-image-frame">
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Preview"
            draggable={false}
            style={{
              transform: `rotate(${rotation}deg)`,
            }}
            className="wa-preview-img"
          />

          {cropMode && (
            <div
              className="wa-crop-box"
              style={{
                left: `${cropBox.x * 100}%`,
                top: `${cropBox.y * 100}%`,
                width: `${cropBox.width * 100}%`,
                height: `${cropBox.height * 100}%`,
              }}
              onPointerDown={(e) => onPointerDownBox(e, "move")}
              onPointerMove={onPointerMoveBox}
              onPointerUp={onPointerUpBox}
            >
              <span className="wa-grid-h wa-grid-h--1" />
              <span className="wa-grid-h wa-grid-h--2" />
              <span className="wa-grid-v wa-grid-v--1" />
              <span className="wa-grid-v wa-grid-v--2" />

              <div
                className="wa-crop-handle"
                onPointerDown={(e) => onPointerDownBox(e, "resize")}
                onPointerMove={onPointerMoveBox}
                onPointerUp={onPointerUpBox}
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};