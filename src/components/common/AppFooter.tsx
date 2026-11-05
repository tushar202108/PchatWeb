
import { Typography } from "antd";
import { APP_COPYRIGHT, APP_VERSION } from "../../constant/changeLog";

const { Text } = Typography;

export default function AppFooter() {
  return (
    <div className="app-footer">
      <Text type="secondary">{APP_COPYRIGHT}</Text>
      <Text type="secondary">Version {APP_VERSION}</Text>
    </div>
  );
}
