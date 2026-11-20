import {
    ArrowLeftOutlined,
    ReloadOutlined,
} from "@ant-design/icons";

import {
    Button,
    Card,
    ColorPicker,
    Select,
    Space,
    Typography,
} from "antd";

import { useNavigate } from "react-router-dom";
import { useTheme } from "../theme/themeContext";
import { themes, type ThemeName } from "../theme/theme";

import "./ThemeSelector.css";

const { Title, Text } = Typography;

const colorOptions = [
    {
        key: "--primary",
        label: "Primary color",
        description: "Buttons, highlights and active elements",
    },
    {
        key: "--bg-main",
        label: "Background",
        description: "Main application background",
    },
    {
        key: "--surface",
        label: "Surface",
        description: "Cards, panels and containers",
    },
    {
        key: "--text-primary",
        label: "Primary text",
        description: "Headings and main content",
    },
    {
        key: "--text-secondary",
        label: "Secondary text",
        description: "Descriptions and supporting text",
    },
    {
        key: "--input-bg",
        label: "Input background",
        description: "Input fields and search boxes",
    },
    {
        key: "--bubble-mine",
        label: "My Message Bubble",
        description: "Background of your sent messages",
    },
    {
        key: "--bubble-other",
        label: "Received Message Bubble",
        description: "Background of received messages",
    },
];

const ThemeSelector = () => {
    const navigate = useNavigate();

    const {
        themeName,
        theme,
        customColors,
        setThemeName,
        updateCustomColor,
        resetCustomColors,
    } = useTheme();

    const getColor = (key: string) =>
        customColors[key] ?? theme.colors[key] ?? "#000000";

    return (
        <div className="theme-studio">
            {/* Header */}
            <div className="theme-studio-header">
                <div className="theme-header-left">
                    <Button
                        className="theme-back-button"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate(-1)}
                    >
                        Back
                    </Button>

                    <div className="theme-heading">
                        <div className="theme-heading-icon">
                            <span>✦</span>
                        </div>

                        <div>
                            <Title level={3}>Theme Studio</Title>
                            <Text>
                                Personalize your pChats appearance.
                            </Text>
                        </div>
                    </div>
                </div>
            </div>

            <div className="theme-studio-content">
                {/* Left column */}
                <div className="theme-settings-column">
                    <Card className="theme-section-card">
                        <div className="theme-section-heading">
                            <div>
                                <Title level={5}>Appearance</Title>
                                <Text>Select a predefined theme.</Text>
                            </div>
                        </div>

                        <Select
                            size="large"
                            value={themeName}
                            className="theme-preset-select"
                            onChange={(value: ThemeName) => setThemeName(value)}
                            options={Object.values(themes).map((item) => ({
                                label: item.label,
                                value: item.name,
                            }))}
                        />
                    </Card>

                    <Card className="theme-section-card">
                        <div className="theme-section-heading">
                            <div>
                                <Title level={5}>Customize colors</Title>
                                <Text>
                                    Create your own color combination.
                                </Text>
                            </div>

                            <Button
                                icon={<ReloadOutlined />}
                                onClick={resetCustomColors}
                            >
                                Reset
                            </Button>
                        </div>

                        <div className="theme-color-grid">
                            {colorOptions.map((item) => (
                                <div className="theme-color-item" key={item.key}>
                                    <div className="theme-color-info">
                                        <Text strong>{item.label}</Text>
                                        <Text type="secondary">
                                            {item.description}
                                        </Text>
                                    </div>

                                    <ColorPicker
                                        value={getColor(item.key)}
                                        format="hex"
                                        showText
                                        onChangeComplete={(color) =>
                                            updateCustomColor(
                                                item.key,
                                                color.toHexString()
                                            )
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Footer */}
            <div className="theme-studio-footer">
                <Text type="secondary">
                    Your theme preferences are saved automatically.
                </Text>

                <Space>
                    <Button onClick={() => navigate(-1)}>
                        Cancel
                    </Button>

                    <Button type="primary" onClick={() => navigate(-1)}>
                        Done
                    </Button>
                </Space>
            </div>
        </div>
    );
};

export default ThemeSelector;