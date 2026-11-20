import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    themes,
    type ThemeName,
    type AppTheme,
} from "./theme";

type CustomThemeColors = Record<string, string>;

type SavedCustomColors = Partial<
    Record<ThemeName, CustomThemeColors>
>;

interface ThemeContextType {
    themeName: ThemeName;
    theme: AppTheme;
    customColors: CustomThemeColors;
    setThemeName: (name: ThemeName) => void;
    updateCustomColor: (property: string, color: string) => void;
    resetCustomColors: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(
    undefined
);

const THEME_STORAGE_KEY = "pchat_selected_theme";
const CUSTOM_COLORS_STORAGE_KEY = "pchat_custom_theme_colors";

const getSavedTheme = (): ThemeName => {
    try {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

        if (
            savedTheme &&
            Object.prototype.hasOwnProperty.call(themes, savedTheme)
        ) {
            return savedTheme as ThemeName;
        }
    } catch {
        // Use the default theme if storage is unavailable.
    }

    return "teal";
};

const getSavedCustomColors = (): SavedCustomColors => {
    try {
        const saved = localStorage.getItem(CUSTOM_COLORS_STORAGE_KEY);

        return saved ? JSON.parse(saved) : {};
    } catch {
        return {};
    }
};

export const ThemeProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [themeName, setThemeName] = useState<ThemeName>(getSavedTheme);

    const [savedCustomColors, setSavedCustomColors] =
        useState<SavedCustomColors>(getSavedCustomColors);

    const theme = themes[themeName];

    const customColors = savedCustomColors[themeName] ?? {};

    useEffect(() => {
        const root = document.documentElement;

        // Apply the selected preset first.
        root.dataset.theme = themeName;

        Object.entries(theme.colors).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });

        // Apply custom overrides after the preset.
        Object.entries(customColors).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });

        try {
            localStorage.setItem(THEME_STORAGE_KEY, themeName);
        } catch {
            // Theme remains applied for the current session.
        }
    }, [themeName, theme, customColors]);

    useEffect(() => {
        try {
            localStorage.setItem(
                CUSTOM_COLORS_STORAGE_KEY,
                JSON.stringify(savedCustomColors)
            );
        } catch {
            // Customization remains available for the current session.
        }
    }, [savedCustomColors]);

    const updateCustomColor = (
        property: string,
        color: string
    ) => {
        setSavedCustomColors((previous) => ({
            ...previous,
            [themeName]: {
                ...(previous[themeName] ?? {}),
                [property]: color,
            },
        }));
    };

    const resetCustomColors = () => {
        setSavedCustomColors((previous) => {
            const updated = { ...previous };

            delete updated[themeName];

            return updated;
        });
    };

    const value = useMemo(
        () => ({
            themeName,
            theme,
            customColors,
            setThemeName,
            updateCustomColor,
            resetCustomColors,
        }),
        [themeName, theme, customColors]
    );

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error(
            "useTheme must be used inside ThemeProvider"
        );
    }

    return context;
};