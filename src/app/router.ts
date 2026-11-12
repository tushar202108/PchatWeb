
import React from "react";
import {
    Navigate,
    Outlet,
    Route,
    Routes,
} from "react-router-dom";
import { Spin } from "antd";

import { useAuth } from "../context/authContext";
import Register from "../pages/Register";
import SignIn from "../pages/SignIn";
import CompleteProfile from "../pages/CompleteProfile";
import ChatPage from "../pages/ChatPage";

function LoadingScreen() {
    return React.createElement(
        "div",
        { className: "loading-screen" },
        React.createElement(Spin, { size: "large" })
    );
}


function PublicRoute() {
    const { user, hasSession, isLoading } = useAuth();
    if (isLoading) {
        return React.createElement(LoadingScreen);
    }

    if (hasSession) {
        return React.createElement(
            Navigate,
            {
                to: user?.name ? "/chat" : "/complete-profile",
                replace: true,
            }
        );
    }

    return React.createElement(Outlet);
}


function ProtectedRoute() {
    const { user, isLoading } = useAuth();
    
    console.log("userSign", user)
    if (isLoading) return React.createElement(LoadingScreen);

    if (!user) {
        return React.createElement(Navigate, {
            to: "/signin",
            replace: true,
        });
    }

    if (!user.name) {
        return React.createElement(Navigate, {
            to: "/complete-profile",
            replace: true,
        });
    }

    return React.createElement(Outlet);
}


function ProfileRoute() {
    const {  hasSession, isLoading } = useAuth();

    if (isLoading) {
        return React.createElement(LoadingScreen);
    }

    // No authenticated session means the user must sign in.
    if (!hasSession) {
        return React.createElement(Navigate, {
            to: "/signin",
            replace: true,
        });
    }

    // A completed profile should go directly to chat.
    // if (user) {
    //     return React.createElement(Navigate, {
    //         to: "/chat",
    //         replace: true,
    //     });
    // }

    // New user, or authenticated user with an incomplete profile.
    return React.createElement(CompleteProfile);
}

export default function AppRouter() {
    const { isLoading } = useAuth();

    if (isLoading) return React.createElement(LoadingScreen);

    return React.createElement(
        Routes,
        null,
        React.createElement(Route, {
            path: "/",
            element: React.createElement(Navigate, {
                to: "/signin",
                replace: true,
            }),
        }),
        React.createElement(Route, {
            element: React.createElement(PublicRoute),
            children: [
                React.createElement(Route, {
                    key: "register",
                    path: "/register",
                    element: React.createElement(Register),
                }),
                React.createElement(Route, {
                    key: "signin",
                    path: "/signin",
                    element: React.createElement(SignIn),
                }),
            ],
        }),
        React.createElement(Route, {
            path: "/complete-profile",
            element: React.createElement(ProfileRoute),
        }),
        React.createElement(Route, {
            element: React.createElement(ProtectedRoute),
            children: [
                React.createElement(Route, {
                    key: "chat",
                    path: "/chat",
                    element: React.createElement(ChatPage),
                }),
            ],
        }),
        React.createElement(Route, {
            path: "*",
            element: React.createElement(Navigate, {
                to: "/",
                replace: true,
            }),
        })
    );
}
