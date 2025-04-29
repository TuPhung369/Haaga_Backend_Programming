import React from "react";
import { Avatar } from "antd";
import { UserOutlined, TeamOutlined } from "@ant-design/icons";
import { ChatContact } from "../types/ChatTypes";

interface GroupAvatarProps {
  contact: ChatContact;
  size?: number;
}

const GroupAvatar: React.FC<GroupAvatarProps> = ({ contact, size = 40 }) => {
  // If it's not a group or no members, show default avatar
  if (!contact.isGroup || !contact.members || contact.members.length === 0) {
    return (
      <Avatar
        icon={<UserOutlined />}
        size={size}
        style={{
          backgroundColor: "#1890ff",
        }}
      />
    );
  }

  // For groups with members, show multiple small avatars
  // We'll show up to 4 members in a grid layout
  const maxVisibleMembers = Math.min(4, contact.members.length);
  const smallAvatarSize = size * 0.6; // Small avatars are 60% of the main size

  // Calculate grid layout
  const gridSize = maxVisibleMembers <= 1 ? 1 : 2; // 1x1 or 2x2 grid
  const gridGap = 2; // Gap between avatars in pixels

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: "#f0f2f5",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* If no members are available, show a team icon */}
      {maxVisibleMembers === 0 ? (
        <TeamOutlined style={{ fontSize: size * 0.6, color: "#1890ff" }} />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize}, 1fr)`,
            gap: `${gridGap}px`,
            width: "100%",
            height: "100%",
            padding: "2px",
          }}
        >
          {/* Render small avatars for each member */}
          {Array.from({ length: maxVisibleMembers }).map((_, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Avatar
                icon={<UserOutlined />}
                size={smallAvatarSize}
                style={{
                  backgroundColor: getAvatarColor(index),
                  fontSize: smallAvatarSize * 0.6,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Show count indicator if there are more members than we're displaying */}
      {contact.members.length > maxVisibleMembers && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            backgroundColor: "#1890ff",
            color: "white",
            borderRadius: "50%",
            width: size * 0.4,
            height: size * 0.4,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: size * 0.2,
            fontWeight: "bold",
            border: "1px solid white",
          }}
        >
          +{contact.members.length - maxVisibleMembers}
        </div>
      )}
    </div>
  );
};

// Helper function to get different colors for avatars
const getAvatarColor = (index: number): string => {
  const colors = [
    "#1890ff", // Blue
    "#52c41a", // Green
    "#fa8c16", // Orange
    "#722ed1", // Purple
    "#eb2f96", // Pink
    "#faad14", // Yellow
    "#13c2c2", // Cyan
    "#f5222d", // Red
  ];

  return colors[index % colors.length];
};

export default GroupAvatar;
