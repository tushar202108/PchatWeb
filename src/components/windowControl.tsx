
import { Button } from "antd";
import {
  MinusOutlined,
  BorderOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import "./windowControl.css"
export default function WindowControls() {
  const controls = window.chatStorage?.windowControls;

  return (
    <div className="custom-window-bar">
      <div className="window-drag-area">
        <span>pChats</span>
      </div>

      <div className="window-actions">
        <Button
          type="text"
          icon={<MinusOutlined />}
          title="Minimize"
          onClick={() => controls?.minimize()}
        />

        <Button
          type="text"
          icon={<BorderOutlined />}
          title="Maximize / Restore"
          onClick={() => controls?.maximize()}
        />

        <Button
          type="text"
          danger
          icon={<CloseOutlined />}
          title="Close"
          onClick={() => controls?.close()}
        />
      </div>
    </div>
  );
}
