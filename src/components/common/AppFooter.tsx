import { Typography } from "antd";
import { latestVersion , copyRight } from "../../constant/index";

const { Text } = Typography;

export default function AppFooter() {
  return (
    <div className="app-footer">
      <Text type="secondary">{copyRight}</Text>
      <Text type="secondary">{latestVersion}</Text>
    </div>
  );
}