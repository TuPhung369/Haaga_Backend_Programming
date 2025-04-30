import React from "react";
import { Avatar } from "antd";
import { UserOutlined, TeamOutlined } from "@ant-design/icons";
import { ChatContact } from "../types/ChatTypes";

interface GroupAvatarProps {
  contact: ChatContact;
  size?: number;
}

const GroupAvatar: React.FC<GroupAvatarProps> = ({ contact, size = 40 }) => {
  // If it's not a group, show default avatar
  if (!contact.isGroup) {
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

  // For groups, determine the number of members
  let memberCount = 0;

  // Check if the name contains the member count (e.g., "4 members")
  const nameMatch = contact.name.match(/^(\d+)\s+members?$/);
  if (nameMatch) {
    memberCount = parseInt(nameMatch[1], 10);
    console.log("Extracted member count from name:", memberCount);
  }
  // Fallback to checking the members array
  else if (Array.isArray(contact.members)) {
    memberCount = contact.members.length;
    console.log("Using members array length:", memberCount);
  }

  // Limit visible members to 3 if there are 5 or more members, otherwise show up to 4
  const maxVisibleMembers = memberCount >= 5 ? 3 : Math.min(4, memberCount);

  // Component for 2 members side by side
  const TwoAvatarRow = () => {
    const avatarSize = size * 0.6;
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <Avatar
          icon={<UserOutlined />}
          size={avatarSize}
          style={{
            backgroundColor: getAvatarColor(0),
            fontSize: avatarSize * 0.6,
          }}
        />
        <Avatar
          icon={<UserOutlined />}
          size={avatarSize}
          style={{
            backgroundColor: getAvatarColor(1),
            fontSize: avatarSize * 0.6,
          }}
        />
      </div>
    );
  };

  // Component for 3 members in a triangle
  const ThreeAvatarTriangle = () => {
    const avatarSize = size * 0.4;
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ marginBottom: -5 }}>
          <Avatar
            icon={<UserOutlined />}
            size={avatarSize}
            style={{
              backgroundColor: getAvatarColor(0),
              fontSize: avatarSize * 0.6,
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "4px",
          }}
        >
          <Avatar
            icon={<UserOutlined />}
            size={avatarSize}
            style={{
              backgroundColor: getAvatarColor(1),
              fontSize: avatarSize * 0.6,
            }}
          />
          <Avatar
            icon={<UserOutlined />}
            size={avatarSize}
            style={{
              backgroundColor: getAvatarColor(2),
              fontSize: avatarSize * 0.6,
            }}
          />
        </div>
      </div>
    );
  };

  // Component for 4 members in a grid
  const FourAvatarGrid = () => {
    const avatarSize = size * 0.4;
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
          alignItems: "center",
          padding: "2px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-evenly",
            width: "100%",
          }}
        >
          <Avatar
            icon={<UserOutlined />}
            size={avatarSize}
            style={{
              backgroundColor: getAvatarColor(0),
              fontSize: avatarSize * 0.6,
            }}
          />
          <Avatar
            icon={<UserOutlined />}
            size={avatarSize}
            style={{
              backgroundColor: getAvatarColor(1),
              fontSize: avatarSize * 0.6,
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-evenly",
            width: "100%",
          }}
        >
          <Avatar
            icon={<UserOutlined />}
            size={avatarSize}
            style={{
              backgroundColor: getAvatarColor(2),
              fontSize: avatarSize * 0.6,
            }}
          />
          <Avatar
            icon={<UserOutlined />}
            size={avatarSize}
            style={{
              backgroundColor: getAvatarColor(3),
              fontSize: avatarSize * 0.6,
            }}
          />
        </div>
      </div>
    );
  };

  // Component for 3 avatars and a count indicator
  const ThreeAvatarWithCount = () => {
    const avatarSize = size * 0.4;
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
          alignItems: "center",
          padding: "2px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-evenly",
            width: "100%",
          }}
        >
          <Avatar
            icon={<UserOutlined />}
            size={avatarSize}
            style={{
              backgroundColor: getAvatarColor(0),
              fontSize: avatarSize * 0.6,
            }}
          />
          <Avatar
            icon={<UserOutlined />}
            size={avatarSize}
            style={{
              backgroundColor: getAvatarColor(1),
              fontSize: avatarSize * 0.6,
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-evenly",
            width: "100%",
          }}
        >
          <Avatar
            icon={<UserOutlined />}
            size={avatarSize}
            style={{
              backgroundColor: getAvatarColor(2),
              fontSize: avatarSize * 0.6,
            }}
          />
          <div
            style={{
              width: avatarSize,
              height: avatarSize,
              backgroundColor: "#1890ff",
              color: "white",
              borderRadius: "50%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: avatarSize * 0.5,
              fontWeight: "bold",
            }}
          >
            +{memberCount - 3}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: "#f0f2f5",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {maxVisibleMembers === 0 ? (
        <TeamOutlined style={{ fontSize: size * 0.6, color: "#1890ff" }} />
      ) : maxVisibleMembers === 1 ? (
        <Avatar
          icon={<UserOutlined />}
          size={size * 0.8}
          style={{
            backgroundColor: getAvatarColor(0),
            fontSize: size * 0.48,
          }}
        />
      ) : maxVisibleMembers === 2 ? (
        <TwoAvatarRow />
      ) : maxVisibleMembers === 3 && memberCount < 5 ? (
        <ThreeAvatarTriangle />
      ) : memberCount >= 5 ? (
        <ThreeAvatarWithCount />
      ) : (
        <FourAvatarGrid />
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

